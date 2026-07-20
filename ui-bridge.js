/**
 * UI Bridge per Wolf Broker Tycoon.
 *
 * Obiettivo: mantenere l'HTML esistente funzionante ma con GameEngine come
 * unica fonte di verita'. Traduce lo stato di GameEngine nel formato
 * legacy atteso dalla UI inline (G).
 *
 * Vanilla JS, ES5-safe.
 */
(function (root) {
  'use strict';

  var BRIDGE_VERSION = '1.0.0';
  var engine = null;
  var _legacyG = null;

  function isBrowser() { return typeof window !== 'undefined' && typeof document !== 'undefined'; }

  function getEngine() {
    if (engine) return engine;
    if (typeof GameEngine !== 'undefined') engine = new GameEngine();
    else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      try { engine = new (require('./game-engine.js'))(); } catch (e) { engine = null; }
    }
    return engine;
  }

  function tickerToLegacy(c) {
    return {
      ticker: c.ticker,
      name: c.name,
      sector: c.sector.toLowerCase(),
      price: c.price,
      cap: c.marketCap / 1000000,
      vol: c.volatility || 0.025,
      div: c.dividendYield,
      prevPrice: c.prevClose,
      change: ((c.price - c.prevClose) / c.prevClose * 100) || 0,
      weekHistory: (c.weekHistory && c.weekHistory.length) ? c.weekHistory : [c.price],
      listed: true,
      tradingHalted: false
    };
  }

  function positionToLegacy(key, pos) {
    return {
      shares: pos.shares,
      avgCost: pos.avgPrice,
      currentPrice: pos.currentPrice,
      totalCost: pos.totalCost,
      pnl: pos.unrealizedPnL || 0
    };
  }

  function shortToLegacy(pos) {
    return {
      ticker: pos.ticker,
      shares: pos.shares,
      entryPrice: pos.avgPrice
    };
  }

  function txToLegacy(tx) {
    return {
      type: tx.type,
      ticker: tx.ticker,
      shares: tx.shares,
      price: tx.price,
      total: tx.value || (tx.shares * tx.price),
      fee: 0,
      week: tx.week
    };
  }

  function newsToLegacy(n) {
    return {
      week: n.week || 1,
      title: n.title,
      desc: n.message || n.desc || '',
      type: n.type || 'neutral',
      scope: n.scope || 'macro'
    };
  }

  function legacyStateFromEngine() {
    var e = getEngine();
    var s = e.getState();
    if (!s) return null;

    var legacy = {};
    var player = s.player;
    var portfolio = s.portfolio;
    var market = s.market;

    legacy.week = player.week;
    legacy.year = player.year;
    legacy.level = Math.max(0, player.level - 1); // GameEngine livello 1 = UI livello 0
    legacy.cash = player.cash;
    legacy.startingCash = 10000;
    legacy.realizedPnL = portfolio.realizedPnL;
    legacy.positions = {};
    legacy.shorts = [];
    legacy.transactions = [];
    legacy.news = [];
    legacy.companies = [];
    legacy.pendingAssemblies = market.assembliesThisWeek || [];
    legacy.activeSectorBoosts = {};
    legacy.netWorthHistory = [{ week: 0, value: 10000 }];
    legacy.stats = {
      totalTrades: player.stats.totalTrades || 0,
      wins: 0,
      losses: 0,
      bestTrade: 0,
      worstTrade: 0,
      bestWinStreak: 0,
      currentStreak: 0,
      dividendsReceived: 0,
      assembliesVoted: player.stats.assembliesVoted || 0
    };

    // Copia companies
    for (var i = 0; i < market.companies.length; i++) {
      legacy.companies.push(tickerToLegacy(market.companies[i]));
    }

    // Copia posizioni
    var posKeys = Object.keys(portfolio.positions);
    for (var p = 0; p < posKeys.length; p++) {
      var k = posKeys[p];
      var pos = portfolio.positions[k];
      if (pos.type === 'short') {
        legacy.shorts.push(shortToLegacy(pos));
      } else {
        legacy.positions[pos.ticker] = positionToLegacy(k, pos);
      }
    }

    // Transazioni
    for (var t = 0; t < portfolio.history.length; t++) {
      legacy.transactions.push(txToLegacy(portfolio.history[t]));
    }

    // Notizie/notifiche
    if (s.notifications) {
      for (var n = 0; n < s.notifications.length; n++) {
        var note = s.notifications[n];
        if (note.title && note.message) {
          legacy.news.push(newsToLegacy(note));
        }
      }
    }

    // Sblocchi
    legacy.unlocked = {
      limitOrders: player.level >= 2,
      shortSelling: player.level >= 3,
      margin2x: player.level >= 4,
      multiSlot: player.level >= 5,
      margin3x: player.level >= 5,
      shortMulti: player.level >= 6,
      sectorAnalysis: player.level >= 6,
      margin5x: player.level >= 7
    };
    legacy.maxMargin = player.level >= 7 ? 5 : (player.level >= 5 ? 3 : (player.level >= 4 ? 2 : 1));

    _legacyG = legacy;
    return legacy;
  }

  function syncEngineToLegacy() {
    if (!isBrowser()) return;
    var legacy = legacyStateFromEngine();
    if (legacy) {
      if (typeof G === 'undefined' || G === null) {
        try { G = {}; } catch (e) {}
      }
      if (typeof G !== 'undefined' && G !== null) {
        for (var k in legacy) G[k] = legacy[k];
      }
    }
  }

  function install() {
    if (!isBrowser()) return;
    var e = getEngine();
    var saved = null;
    try { saved = localStorage.getItem('sbt_autosave'); } catch (err) {}

    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        // Se e' uno stato legacy (ha positions ma non player), convertiamo
        if (parsed.positions && !parsed.player) {
          e.createInitialState('Trader', 'normal');
          syncLegacyToEngine(parsed);
        } else if (parsed.player) {
          e.setState(e._deserializeState(parsed));
        } else {
          e.createInitialState('Trader', 'normal');
        }
      } catch (err) {
        e.createInitialState('Trader', 'normal');
      }
    } else {
      e.createInitialState('Trader', 'normal');
    }

    legacyStateFromEngine();
    exposeLegacyGlobals();
    installEventListeners();

    // Installa anche gli altri motori
    var state = e.getState();
    if (typeof WorldEngine !== 'undefined' && WorldEngine.install) WorldEngine.install(state);
    if (typeof CompetitorEngine !== 'undefined') {
      try {
        var ce = new CompetitorEngine();
        var stocks = [];
        for (var i = 0; i < state.market.companies.length; i++) {
          var c = state.market.companies[i];
          stocks.push({ symbol: c.ticker, price: c.price, sector: c.sector, volume: c.volume || 0, avgVolume: c.avgVolume || 1000000, change: c.change || 0 });
        }
        ce.init({ stocks: stocks, currentWeek: state.player.week });
        e.installCompetitorEngine(ce);
      } catch (err) {}
    }
    if (typeof CorporateLifecycle !== 'undefined' && CorporateLifecycle.install) CorporateLifecycle.install();
    if (typeof BrokerStory !== 'undefined' && BrokerStory.install) BrokerStory.install();
    if (typeof PlayerLife !== 'undefined' && PlayerLife.install) PlayerLife.install();
    if (typeof BrokerageCareer !== 'undefined' && BrokerageCareer.install) BrokerageCareer.install();
    if (typeof StakeholderInteractions !== 'undefined' && StakeholderInteractions.install) StakeholderInteractions.install();
  }

  function syncLegacyToEngine(legacy) {
    var e = getEngine();
    var s = e.getState();
    if (!s || !legacy) return;

    s.player.cash = legacy.cash || s.player.cash;
    s.player.week = legacy.week || s.player.week;
    s.player.year = legacy.year || s.player.year;
    s.player.level = legacy.level + 1;

    // Azzera e ricostruisce posizioni
    s.portfolio.positions = {};
    s.portfolio.history = [];
    s.portfolio.realizedPnL = legacy.realizedPnL || 0;

    var tickerMap = {};
    for (var i = 0; i < s.market.companies.length; i++) {
      tickerMap[s.market.companies[i].ticker] = s.market.companies[i];
    }

    for (var t in legacy.positions) {
      var lp = legacy.positions[t];
      var c = tickerMap[t];
      if (!c) continue;
      s.portfolio.positions[c.id] = {
        companyId: c.id,
        ticker: t,
        name: c.name,
        shares: lp.shares,
        avgPrice: lp.avgCost,
        currentPrice: c.price,
        totalCost: lp.totalCost || (lp.avgCost * lp.shares),
        type: 'long',
        isPenny: c.isPenny,
        openedWeek: s.player.week
      };
    }

    for (var sh = 0; sh < legacy.shorts.length; sh++) {
      var sht = legacy.shorts[sh];
      var c2 = tickerMap[sht.ticker];
      if (!c2) continue;
      s.portfolio.positions[c2.id + '_short'] = {
        companyId: c2.id,
        ticker: sht.ticker,
        name: c2.name,
        shares: sht.shares,
        avgPrice: sht.entryPrice,
        currentPrice: c2.price,
        totalCost: sht.entryPrice * sht.shares,
        type: 'short',
        isPenny: c2.isPenny,
        openedWeek: s.player.week
      };
    }

    for (var tx = 0; tx < legacy.transactions.length; tx++) {
      var ltx = legacy.transactions[tx];
      s.portfolio.history.push({
        type: ltx.type,
        ticker: ltx.ticker,
        shares: ltx.shares,
        price: ltx.price,
        value: ltx.total,
        week: ltx.week || s.player.week,
        year: s.player.year
      });
    }
  }

  function readTradeModal() {
    if (!tradeModalState) return null;
    var c = getCompany(tradeModalState.ticker);
    if (!c) return null;
    var sharesEl = document.getElementById('trade-shares');
    var shares = sharesEl ? (parseInt(sharesEl.value) || 0) : 0;
    var price = c.price;
    if (tradeModalState.orderType === 'limit') {
      var lpEl = document.getElementById('trade-limit-price');
      price = lpEl ? (parseFloat(lpEl.value) || c.price) : c.price;
    }
    return { c: c, shares: shares, price: price };
  }

  function canTradeAtBrokerage() {
    if (typeof BrokerageCareer !== 'undefined' && BrokerageCareer.canTrade && !BrokerageCareer.canTrade()) {
      toast('error', 'Non hai un intermediario autorizzato');
      return false;
    }
    return true;
  }

  function exposeLegacyGlobals() {
    if (!isBrowser()) return;
    // Esponi funzioni legacy come wrapper intorno al bridge/engine
    root.wolfBridge = {
      version: BRIDGE_VERSION,
      getEngine: getEngine,
      sync: syncEngineToLegacy,
      getLegacyState: legacyStateFromEngine,
      wrappers: {
        newGame: root.newGame,
        advanceTurn: root.advanceTurn,
        executeTrade: root.executeTrade,
        executeShort: root.executeShort,
        coverShort: root.coverShort,
        saveAuto: root.saveAuto,
        loadAuto: root.loadAuto
      }
    };


    wolfBridge.resolveAssembly = function (ticker) {
      var result = engine.resolveAssembly(ticker);
      if (result.success) syncEngineToLegacy();
      return result;
    };
    wolfBridge.voteAssembly = function (ticker, proposalIndex, vote) {
      var result = engine.voteAssembly(ticker, proposalIndex, vote);
      if (result.success) syncEngineToLegacy();
      return result;
    };


    // Sovrascrivi newGame
    root.newGame = function () {
      var e = getEngine();
      e.createInitialState('Trader', 'normal');
      syncEngineToLegacy();
      if (typeof saveAuto === 'function') saveAuto();
      if (typeof renderAll === 'function') renderAll();
      if (typeof updateTicker === 'function') updateTicker();
    };

    // Sovrascrivi advanceTurn per passare dal GameEngine
    root.advanceTurn = function () {
      var e = getEngine();
      var s = e.getState();
      if (!s) { e.createInitialState('Trader', 'normal'); }
      var result = e.advanceWeek();
      syncEngineToLegacy();
      if (result && result.ending) {
        toast('danger', result.ending.title + ': ' + result.ending.text);
      }
      renderAll();
      if (typeof updateTicker === 'function') updateTicker();
      if (typeof saveAuto === 'function') saveAuto();
      return result;
    };

    // Sovrascrivi saveAuto/loadAuto per usare GameEngine
    root.saveAuto = function () {
      var e = getEngine();
      try {
        localStorage.setItem('sbt_autosave', JSON.stringify(e._serializeState()));
      } catch (err) {}
    };

    root.loadAuto = function () {
      try {
        var raw = localStorage.getItem('sbt_autosave');
        if (!raw) return false;
        var data = JSON.parse(raw);
        var e = getEngine();
        if (data.player) {
          e.setState(e._deserializeState(data));
        } else if (data.positions || data.cash) {
          e.createInitialState('Trader', 'normal');
          syncLegacyToEngine(data);
        } else {
          return false;
        }
        syncEngineToLegacy();
        return true;
      } catch (err) { return false; }
    };

    root.saveSlot = function (n) {
      var e = getEngine();
      try {
        var data = e._serializeState();
        localStorage.setItem('sbt_save_' + n, JSON.stringify(data));
        localStorage.setItem('sbt_save_' + n + '_meta', JSON.stringify({
          week: data.player.week,
          level: Math.max(0, data.player.level - 1),
          nw: data.player.netWorth,
          date: new Date().toISOString()
        }));
        toast('success', 'Salvato nello slot ' + n);
        renderSaveSlots();
      } catch (err) { toast('error', 'Errore salvataggio'); }
    };

    root.loadSlot = function (n) {
      try {
        var raw = localStorage.getItem('sbt_save_' + n);
        if (!raw) { toast('error', 'Slot vuoto'); return; }
        var data = JSON.parse(raw);
        var e = getEngine();
        if (data.player) {
          e.setState(e._deserializeState(data));
        } else if (data.positions || data.cash) {
          e.createInitialState('Trader', 'normal');
          syncLegacyToEngine(data);
        }
        syncEngineToLegacy();
        if (typeof updateUnlocks === 'function') updateUnlocks();
        renderAll();
        toast('success', 'Caricato slot ' + n);
      } catch (err) { toast('error', 'Errore caricamento'); }
    };

    // Sovrascrivi trading per passare dal GameEngine
    root.executeTrade = function () {
      var d = readTradeModal();
      if (!d) { closeTradeModal(); return; }
      if (!canTradeAtBrokerage()) { closeTradeModal(); return; }
      var e = getEngine();
      var result = null;
      var realized = 0;
      if (tradeModalState.mode === 'buy') {
        var options = {};
        if (tradeModalState.orderType === 'limit') options.limitPrice = d.price;
        result = e.buy(d.c.ticker, d.shares, options);
      } else if (tradeModalState.mode === 'sell') {
        result = e.sell(d.c.ticker, d.shares, {});
        realized = result.success ? (result.profit || 0) : 0;
      } else if (tradeModalState.mode === 'cover') {
        return root.coverShort();
      }
      if (!result || !result.success) {
        toast('error', result ? result.error : 'Operazione fallita');
        return;
      }
      syncEngineToLegacy();
      if (realized !== 0 && typeof updateTradeStats === 'function') updateTradeStats(realized);
      saveAuto();
      closeTradeModal();
      toast((tradeModalState.mode === 'sell' && realized < 0) ? 'warning' : 'success', result.message);
      renderAll();
    };

    root.executeShort = function () {
      var d = readTradeModal();
      if (!d) { closeTradeModal(); return; }
      if (!canTradeAtBrokerage()) { closeTradeModal(); return; }
      var e = getEngine();
      var options = { short: true };
      if (tradeModalState.orderType === 'limit') options.limitPrice = d.price;
      var result = e.buy(d.c.ticker, d.shares, options);
      if (!result || !result.success) {
        toast('error', result ? result.error : 'Short fallito');
        return;
      }
      syncEngineToLegacy();
      saveAuto();
      closeTradeModal();
      toast('success', result.message);
      renderAll();
    };

    root.coverShort = function () {
      var d = readTradeModal();
      if (!d) { closeTradeModal(); return; }
      if (!canTradeAtBrokerage()) { closeTradeModal(); return; }
      var e = getEngine();
      var result = e.sell(d.c.ticker, d.shares, {});
      if (!result || !result.success) {
        toast('error', result ? result.error : 'Cover fallito');
        return;
      }
      syncEngineToLegacy();
      if (typeof updateTradeStats === 'function' && result.profit) updateTradeStats(result.profit);
      saveAuto();
      closeTradeModal();
      toast((result.profit >= 0) ? 'success' : 'warning', result.message);
      renderAll();
    };
  }

  function installEventListeners() {
    var e = getEngine();
    e.on('trade', function (data) {
      syncEngineToLegacy();
    });
    e.on('weekAdvanced', function () {
      syncEngineToLegacy();
    });
  }

  root.wolfBridgeInstall = install;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { install: install, getEngine: getEngine, legacyStateFromEngine: legacyStateFromEngine, syncLegacyToEngine: syncLegacyToEngine };
  }

})(typeof window !== 'undefined' ? window : this);
