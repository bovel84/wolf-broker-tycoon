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
  var linkedState = null;
  var installed = false;

  function link(target, name, source, key, read, write) {
    Object.defineProperty(target, name, {
      enumerable: true, configurable: true,
      get: function () { return read ? read(source[key]) : source[key]; },
      set: function (value) { source[key] = write ? write(value) : value; }
    });
  }

  var sectorNames = { TECH: 'tech', ENERGY: 'energy', FIN: 'finance', HEAL: 'health', CONS: 'consumer', INDU: 'industrial', MATR: 'materials', UTIL: 'utilities', RE: 'realestate', COMM: 'communications' };
  function canonicalCompany(lc) {
    var sector = lc.sector;
    for (var code in sectorNames) if (sectorNames[code] === sector) sector = code;
    var shares = lc.sharesOutstanding || Math.max(1, lc.cap * 1000000 / lc.price);
    return { id: lc.ticker, ticker: lc.ticker, name: lc.name, sector: sector, price: lc.price, prevClose: lc.prevPrice || lc.price,
      marketCap: lc.cap * 1000000, sharesOutstanding: shares, float: shares, volatility: lc.vol || 0.025, dividendYield: (lc.div || 0) / 100,
      sentiment: 50, momentum: 0, avgVolume: 1000000, volume: 1000000, high: lc.price, low: lc.price,
      isPenny: lc.price < 5, listed: lc.listed !== false, tradingHalted: !!lc.tradingHalted, events: [], earnings: { revenue: 0, netIncome: 0, eps: 0, quarter: 1 },
      weekHistory: lc.weekHistory || [lc.price], assemblyScheduled: false, assemblyVotes: {} };
  }

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
    var view = {
      ticker: c.ticker,
      name: c.name,
      sector: sectorNames[c.sector] || c.sector.toLowerCase(),
      price: c.price,
      cap: c.marketCap / 1000000,
      vol: c.volatility || 0.025,
      div: c.dividendYield,
      prevPrice: c.prevClose,
      change: ((c.price - c.prevClose) / c.prevClose * 100) || 0,
      weekHistory: (c.weekHistory && c.weekHistory.length) ? c.weekHistory : [c.price],
      listed: c.listed !== false,
      tradingHalted: !!c.tradingHalted,
      sharesOutstanding: c.sharesOutstanding,
      isPenny: c.isPenny,
      isIPO: c.isIPO,
      description: c.description || '',
      peRatio: c.peRatio
    };
    ['price', 'name', 'listed', 'tradingHalted', 'sharesOutstanding', 'weekHistory'].forEach(function (key) { link(view, key, c, key); });
    link(view, 'cap', c, 'marketCap', function (v) { return v / 1000000; }, function (v) { return v * 1000000; });
    link(view, 'div', c, 'dividendYield', function (v) { return (v || 0) * 100; }, function (v) { return v / 100; });
    link(view, 'vol', c, 'volatility');
    link(view, 'prevPrice', c, 'prevClose');
    return view;
  }

  function positionToLegacy(key, pos) {
    var view = {
      shares: pos.shares,
      avgCost: pos.avgPrice,
      currentPrice: pos.currentPrice,
      totalCost: pos.totalCost,
      pnl: pos.unrealizedPnL || 0
    };
    link(view, 'shares', pos, 'shares');
    link(view, 'avgCost', pos, 'avgPrice');
    link(view, 'totalCost', pos, 'totalCost');
    return view;
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
      week: n.week || n.time || 1,
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
    legacy.agents = s.agents || [];
    legacy.pendingAssemblies = market.companies.filter(function (c) { return c.assemblyScheduled; }).map(function (c) {
      return { ticker: c.ticker, week: c.assemblyWeek || player.week, resolved: false, proposals: (c.assemblyProposals || []).map(function (prop) {
        return { id: prop.id, title: prop.name, desc: prop.desc, votesFor: prop.aiFor || 0, votesAgainst: prop.aiAgainst || 0,
          playerVoted: prop.playerVoted, playerVote: prop.playerVote === 'for' ? 1 : prop.playerVote === 'against' ? 0 : null, resolved: prop.resolved };
      }) };
    });
    legacy.activeSectorBoosts = {};
    legacy.netWorthHistory = s.netWorthHistory || [{ week: 0, value: 10000 }];
    legacy.stats = player.stats;
    ['wins', 'losses', 'bestTrade', 'worstTrade', 'bestWinStreak', 'currentStreak', 'dividendsReceived'].forEach(function (key) {
      if (typeof player.stats[key] !== 'number') player.stats[key] = 0;
    });

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
    var extraNews = s.legacyData && s.legacyData.news || [];
    legacy.news = legacy.news.concat(extraNews).sort(function (a, b) { return b.week - a.week; }).filter(function (note, index, all) {
      for (var j = 0; j < index; j++) if (all[j].title === note.title && all[j].week === note.week) return false;
      return true;
    }).slice(0, 120);

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
    legacy.maxMargin = e.hasUnlock('margin5x') ? 5 : e.hasUnlock('margin3x') ? 3 : e.hasUnlock('margin2x') ? 2 : 1;

    // Narrative state for UI
    legacy.narrative = s.narrative || null;

    _legacyG = legacy;
    return legacy;
  }

  function syncEngineToLegacy() {
    if (!isBrowser()) return;
    var legacy = legacyStateFromEngine();
    if (legacy) {
      var s = getEngine().getState();
      if (!s.legacyData) s.legacyData = {};
      if (linkedState !== s || !root.G) { root.G = {}; linkedState = s; }
      for (var k in legacy) {
        var descriptor = Object.getOwnPropertyDescriptor(root.G, k);
        if (!descriptor || !descriptor.get) root.G[k] = legacy[k];
      }
      ['cash', 'week', 'year', 'xp', 'ethics'].forEach(function (key) { link(root.G, key, s.player, key); });
      link(root.G, 'level', s.player, 'level', function (v) { return Math.max(0, v - 1); }, function (v) { return v + 1; });
      link(root.G, 'realizedPnL', s.portfolio, 'realizedPnL');
      link(root.G, 'sentiment', s.market, 'sentiment');
      link(root.G, 'rep', s.player.reputation, 'wallStreet');
      link(root.G, 'netWorthHistory', s, 'netWorthHistory');
      if (!s.netWorthHistory) s.netWorthHistory = legacy.netWorthHistory;
      ['brokerCareer', 'playerLife', 'brokerStory', 'stakeholderInteractions', 'brokerName', 'storyEthics', 'storyAct', 'worldState'].forEach(function (key) {
        link(root.G, key, s.legacyData, key);
      });
    }
  }

  // Legacy management modules share cash/company objects; reconcile structural
  // portfolio changes (deletions, block trades, mergers) before save or tick.
  function commitLegacyChanges() {
    var e = getEngine();
    var s = e.getState();
    var g = root.G;
    if (!g || s !== linkedState) return;
    var next = {};
    var companies = s.market.companies;
    for (var ci = 0; ci < g.companies.length; ci++) {
      var lc = g.companies[ci];
      if (!e.getCompany(lc.ticker)) {
        companies.push(canonicalCompany(lc));
      }
    }
    function addPosition(ticker, lp, type) {
      var c = e.getCompany(ticker);
      if (!c || !(lp.shares > 0)) return;
      var key = c.id + (type === 'short' ? '_short' : '');
      var pos = s.portfolio.positions[key] || {};
      pos.companyId = c.id; pos.ticker = ticker; pos.name = c.name; pos.type = type;
      pos.shares = lp.shares; pos.avgPrice = type === 'short' ? lp.entryPrice : lp.avgCost;
      pos.currentPrice = c.price; pos.totalCost = lp.totalCost || pos.avgPrice * pos.shares;
      pos.isPenny = c.isPenny; pos.openedWeek = pos.openedWeek || s.player.week;
      next[key] = pos;
    }
    for (var ticker in g.positions) addPosition(ticker, g.positions[ticker], 'long');
    for (var sh = 0; sh < g.shorts.length; sh++) addPosition(g.shorts[sh].ticker, g.shorts[sh], 'short');
    s.portfolio.positions = next;
    s.legacyData.news = (g.news || []).slice(0, 120);
    // Transactions created by management features use the same canonical ledger.
    if (g.transactions.length > s.portfolio.history.length) {
      for (var ti = s.portfolio.history.length; ti < g.transactions.length; ti++) {
        var tx = g.transactions[ti];
        s.portfolio.history.push({ type: tx.type, ticker: tx.ticker, shares: tx.shares, price: tx.price, value: tx.total, week: tx.week, year: s.player.year });
      }
    }
    e._updateUnrealizedPnL();
    if (e._competitorEngine && e._competitorEngine.getFullState) s.competitorState = e._competitorEngine.getFullState().competitors;
  }

  function install() {
    if (!isBrowser()) return;
    if (installed) return;
    installed = true;
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

    syncEngineToLegacy();
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

    s.player.cash = typeof legacy.cash === 'number' ? legacy.cash : s.player.cash;
    s.player.week = legacy.week || s.player.week;
    s.player.year = legacy.year || s.player.year;
    s.player.level = (legacy.level || 0) + 1;
    if (legacy.companies && legacy.companies.length) s.market.companies = legacy.companies.map(canonicalCompany);
    if (legacy.narrative) s.narrative = legacy.narrative;
    s.netWorthHistory = legacy.netWorthHistory || [{ week: 0, value: 10000 }];
    s.legacyData = { news: legacy.news || [] };
    ['brokerCareer', 'playerLife', 'brokerStory', 'stakeholderInteractions', 'brokerName', 'storyEthics', 'storyAct', 'worldState'].forEach(function (key) {
      if (legacy[key] !== undefined) s.legacyData[key] = legacy[key];
    });

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

    for (var sh = 0; sh < (legacy.shorts || []).length; sh++) {
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

    for (var tx = 0; tx < (legacy.transactions || []).length; tx++) {
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
    e._updateUnrealizedPnL();
  }

  function readTradeModal() {
    if (!tradeModalState) return null;
    var c = getCompany(tradeModalState.ticker);
    if (!c) return null;
    var sharesEl = document.getElementById('trade-shares');
    var shares = sharesEl ? Number(sharesEl.value) : 0;
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
      commit: commitLegacyChanges,
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
      if (root.DeskDirector && DeskDirector.isBusy()) return { success: false, error: 'Settimana in elaborazione' };
      var result = engine.resolveAssembly(ticker);
      if (result.success) { engine._updateUnrealizedPnL(); syncEngineToLegacy(); root.saveAuto(); }
      return result;
    };
    wolfBridge.voteAssembly = function (ticker, proposalIndex, vote) {
      if (root.DeskDirector && DeskDirector.isBusy()) return { success: false, error: 'Settimana in elaborazione' };
      var result = engine.voteAssembly(ticker, proposalIndex, vote);
      if (result.success) syncEngineToLegacy();
      return result;
    };


    // Sovrascrivi newGame
    root.newGame = function () {
      var e = getEngine();
      e.createInitialState('Trader', 'normal');
      syncEngineToLegacy();
      if (root.WorldEngine && WorldEngine.bindGame) WorldEngine.bindGame(root.G, true);
      if (root.DeskDirector && DeskDirector.reset) DeskDirector.reset();
      if (typeof saveAuto === 'function') saveAuto();
      if (typeof renderAll === 'function') renderAll();
      if (typeof updateTicker === 'function') updateTicker();
    };

    // Sovrascrivi advanceTurn per passare dal GameEngine
    root.advanceTurn = function () {
      var e = getEngine();
      var s = e.getState();
      if (!s) { e.createInitialState('Trader', 'normal'); }
      if (root.DeskDirector && DeskDirector.isBusy()) return DeskDirector.currentTurn();
      if (root.PlayerLife && !PlayerLife.canAct()) { PlayerLife.showGameOver(); return null; }
      commitLegacyChanges();
      var before = e.getState().player.netWorth;
      var result = e.advanceWeek();
      syncEngineToLegacy();
      if (result && result.ending) {
        toast('danger', result.ending.title + ': ' + result.ending.text);
      }
      renderAll();
      if (typeof updateTicker === 'function') updateTicker();
      if (typeof saveAuto === 'function') saveAuto();
      if (root.DeskDirector && result && !result.ending) result.completion = DeskDirector.finishTurn(result, before);
      return result;
    };

    // Sovrascrivi saveAuto/loadAuto per usare GameEngine
    root.saveAuto = function () {
      var e = getEngine();
      commitLegacyChanges();
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
        if (root.WorldEngine && WorldEngine.bindGame) WorldEngine.bindGame(root.G);
        if (root.DeskDirector && DeskDirector.reset) DeskDirector.reset();
        return true;
      } catch (err) { return false; }
    };

    root.saveSlot = function (n) {
      var e = getEngine();
      commitLegacyChanges();
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
        if (root.WorldEngine && WorldEngine.bindGame) WorldEngine.bindGame(root.G);
        if (root.DeskDirector && DeskDirector.reset) DeskDirector.reset();
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
      if (root.DeskDirector && DeskDirector.isBusy()) return;
      commitLegacyChanges();
      var result = null;
      var realized = 0;
      var mode = tradeModalState.mode;
      if (tradeModalState.mode === 'buy') {
        var options = {};
        if (d.shares * d.c.price > e.getState().player.cash && root.G.maxMargin > 1) options.margin = root.G.maxMargin;
        if (tradeModalState.orderType === 'limit') { options.limit = true; options.limitPrice = d.price; }
        result = e.buy(d.c.ticker, d.shares, options);
      } else if (tradeModalState.mode === 'sell') {
        var sellOptions = tradeModalState.orderType === 'limit' ? { limit: true, limitPrice: d.price } : {};
        result = e.sell(d.c.ticker, d.shares, sellOptions);
        realized = result.success ? (result.profit || 0) : 0;
      } else if (tradeModalState.mode === 'cover') {
        return root.coverShort();
      }
      if (!result || !result.success) {
        toast('error', result ? result.error : 'Operazione fallita');
        return;
      }
      syncEngineToLegacy();
      if (mode === 'sell' && realized !== 0 && typeof updateTradeStats === 'function') updateTradeStats(realized);
      saveAuto();
      closeTradeModal();
      toast((mode === 'sell' && realized < 0) ? 'warning' : 'success', result.message);
      renderAll();
    };

    root.executeShort = function () {
      var d = readTradeModal();
      if (!d) { closeTradeModal(); return; }
      if (!canTradeAtBrokerage()) { closeTradeModal(); return; }
      var e = getEngine();
      if (root.DeskDirector && DeskDirector.isBusy()) return;
      commitLegacyChanges();
      var options = { short: true };
      if (tradeModalState.orderType === 'limit') { options.limit = true; options.limitPrice = d.price; }
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
      if (root.DeskDirector && DeskDirector.isBusy()) return;
      commitLegacyChanges();
      var result = e.sell(d.c.ticker, d.shares, { cover: true });
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
    root.exportSave = function () {
      commitLegacyChanges();
      var blob = new Blob([JSON.stringify(e._serializeState())], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'wolf-save.json'; a.click(); URL.revokeObjectURL(url);
    };
    root.importSave = function (event) {
      var file = event.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (data.player && data.market && data.portfolio) e.setState(e._deserializeState(data));
          else if (data.positions && data.companies) { e.createInitialState('Trader', 'normal'); syncLegacyToEngine(data); }
          else throw new Error('Formato non valido');
          syncEngineToLegacy();
          if (root.WorldEngine && WorldEngine.bindGame) WorldEngine.bindGame(root.G);
          if (root.DeskDirector) DeskDirector.reset();
          saveAuto(); renderAll(); toast('success', 'Partita importata');
        } catch (err) { toast('error', 'File non valido'); }
      };
      reader.readAsText(file);
    };
    root.addTransaction = function (type, ticker, shares, price, total) {
      var company = e.getCompany(ticker);
      if (!company) return;
      e._recordTrade(type, company, shares, price, total);
      e.getState().player.stats.totalTrades++;
      root.G.transactions.push(txToLegacy(e.getState().portfolio.history[e.getState().portfolio.history.length - 1]));
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
    module.exports = { install: install, getEngine: getEngine, legacyStateFromEngine: legacyStateFromEngine, syncLegacyToEngine: syncLegacyToEngine, commit: commitLegacyChanges };
  }

})(typeof window !== 'undefined' ? window : this);
