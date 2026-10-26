/* One weekly transaction: simulation -> world -> career -> story -> valuation. */
(function (global) {
  'use strict';
  var engine = null;
  var busy = false;
  var current = null;
  var session = 0;
  var installed = false;
  function key(state) { return state.player.year + ':' + state.player.week; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function text(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function money(value) { return global.formatEur ? global.formatEur(value) : '€' + Math.round(value); }
  function state() { return engine && engine.getState(); }
  function ensure(s) {
    if (!s.desk) s.desk = { decisions: [], contracts: [], watchlist: [], lastDecision: '', recap: null, opportunity: null };
    return s.desk;
  }
  function career() { return global.G && global.G.brokerCareer; }
  function trust(delta) { var c = career(); if (c) c.employerTrust = clamp(c.employerTrust + delta, 0, 100); }
  function refresh() {
    if (global.wolfBridge) global.wolfBridge.sync();
    if (global.renderAll) global.renderAll();
    render();
  }
  function save() { if (global.saveAuto) global.saveAuto(); }
  function opportunity(s) {
    var desk = ensure(s);
    if (desk.opportunity && desk.opportunity.turn === key(s)) return desk.opportunity;
    var choices = s.market.companies.filter(function (c) { return !c.isPenny && c.listed !== false && !c.tradingHalted && c.price < s.player.cash * 0.2; });
    if (!choices.length) choices = s.market.companies.filter(function (c) { return c.listed !== false && !c.tradingHalted; });
    var company = choices[(s.player.stats.weeksPlayed * 11) % choices.length];
    if (!company) return null;
    var themes = [
      ['La tua prima firma', 'Un cliente vuole capire se sai costruire una posizione senza mettere tutto su un solo titolo. Il capo ti affida il dossier'],
      ['Il cliente che non vuole sorprese', 'Dopo una settimana nervosa, una cliente chiede un piano che possa difendere anche se il mercato scende. Sul tavolo arriva'],
      ['La sfida del desk', 'Un collega sostiene che stai lasciando opportunità agli altri. La direzione vuole una scelta motivata sul dossier'],
      ['Prima dei risultati', 'Il cliente accetta volatilità, ma pretende un limite scritto prima della prossima seduta. La società da valutare è'],
      ['La fiducia si misura', 'Un investitore sta confrontando il tuo lavoro con quello dei rivali. Questa settimana giudicherà come gestisci'],
      ['Una voce in sala operativa', 'Il desk discute una possibile rotazione. Un cliente ti chiede una posizione chiara, senza promesse di guadagno, su']
    ];
    var theme = themes[s.player.stats.weeksPlayed % themes.length];
    desk.opportunity = { turn: key(s), ticker: company.ticker, title: theme[0], body: theme[1] + ' ' + company.name + ' (' + company.ticker + ').', selected: null };
    return desk.opportunity;
  }
  function choose(id) {
    var s = state(); if (!s || busy) return false;
    var desk = ensure(s); var item = opportunity(s);
    if (!item || item.selected || ['balanced', 'conviction', 'decline'].indexOf(id) < 0) return false;
    item.selected = id;
    var description;
    if (id === 'decline') {
      trust(-1);
      if (global.PlayerLife && PlayerLife.adjust) PlayerLife.adjust({ stress: -4 }, 'Hai lasciato passare un mandato per proteggere il tuo tempo.');
      engine.addXP(10);
      description = 'Hai rifiutato il mandato su ' + item.ticker + ': meno pressione, fiducia del capo -1.';
    } else {
      var bold = id === 'conviction';
      var contract = {
        id: 'mandate_' + key(s), turn: key(s), ticker: item.ticker, style: id, status: 'active',
        capitalBase: Math.max(1, s.player.netWorth), minWeight: bold ? 0.20 : 0.05, maxWeight: bold ? 0.45 : 0.25,
        reward: bold ? 380 : 220, xp: bold ? 50 : 40, trust: bold ? 6 : 4
      };
      desk.contracts.unshift(contract); desk.contracts = desk.contracts.slice(0, 24);
      description = 'Mandato ' + (bold ? 'convinto' : 'prudente') + ' su ' + item.ticker + ': esposizione tra ' + (contract.minWeight * 100) + '% e ' + (contract.maxWeight * 100) + '% prima di avanzare.';
    }
    desk.lastDecision = description;
    desk.decisions.unshift({ turn: key(s), text: description }); desk.decisions = desk.decisions.slice(0, 30);
    engine.addNarrativeMemory('player:broker', description, 'neutral', 7);
    save(); refresh();
    return true;
  }
  function inspect(ticker) {
    if (busy || !global.openTradeModal) return;
    var s = state(); var company = engine.getCompany(ticker);
    if (!company) return;
    global.openTradeModal(ticker);
    var active = ensure(s).contracts.filter(function (c) { return c.status === 'active' && c.ticker === ticker; })[0];
    if (active && global.setShares) {
      var target = active.capitalBase * (active.style === 'conviction' ? 0.30 : 0.10);
      var held = s.portfolio.positions[company.id];
      var count = Math.max(1, Math.floor(target / company.price) - (held ? held.shares : 0));
      global.setShares(count);
    }
  }
  function watch(ticker) {
    var s = state(); if (!s || !engine.getCompany(ticker) || busy) return;
    var list = ensure(s).watchlist; var index = list.indexOf(ticker);
    if (index >= 0) list.splice(index, 1); else if (list.length < 8) list.push(ticker);
    save(); render();
  }
  function settleContracts(s) {
    var desk = ensure(s);
    desk.contracts.forEach(function (contract) {
      if (contract.status !== 'active') return;
      var company = engine.getCompany(contract.ticker);
      var position = company && s.portfolio.positions[company.id];
      var weight = position ? position.shares * position.avgPrice / contract.capitalBase : 0;
      var passed = weight >= contract.minWeight && weight <= contract.maxWeight;
      contract.status = passed ? 'completed' : 'missed';
      contract.closedTurn = key(s);
      contract.result = passed ? 'Limiti rispettati: compenso ' + money(contract.reward) + ', fiducia +' + contract.trust + '.' : 'Mandato non rispettato: nessun compenso, fiducia -3.';
      if (passed) { s.player.cash += contract.reward; engine.addXP(contract.xp); trust(contract.trust); }
      else trust(-3);
      engine.notify(passed ? 'success' : 'warning', 'Mandato ' + contract.ticker, contract.result);
      engine.addNarrativeMemory('player:broker', 'Esito del mandato ' + contract.ticker + ': ' + contract.result, passed ? 'positive' : 'negative', 7);
      desk.lastDecision = contract.ticker + ': ' + contract.result;
    });
  }
  function setBusy(value) {
    busy = value;
    if (!global.document) return;
    var button = document.querySelector('.btn-advance');
    if (button) { button.disabled = value; button.textContent = value ? 'La settimana prende forma…' : '▶ Chiudi la settimana'; }
    var region = document.getElementById('desk-session');
    if (region) region.setAttribute('aria-busy', value ? 'true' : 'false');
    render();
  }
  function finishTurn(result, before) {
    var s = state(); var token = session;
    current = result; setBusy(true);
    if (global.WolfLLM) WolfLLM.beginTurn();
    var world;
    try { world = global.WorldEngine && WorldEngine.processWorldTurn ? WorldEngine.processWorldTurn() : Promise.resolve(null); }
    catch (error) { world = Promise.reject(error); }
    function active() { return token === session && s === state(); }
    var promise = Promise.resolve(world).catch(function () { return null; }).then(function () {
      if (!active()) return null;
      if (global.wolfBridge) wolfBridge.commit();
      if (global.BrokerageCareer) BrokerageCareer.processWeek();
      if (global.StakeholderInteractions) StakeholderInteractions.processWeek();
      if (global.BrokerageManagement) BrokerageManagement.processWeek();
      settleContracts(s);
      if (global.PlayerLife) PlayerLife.processWeek();
      if (global.wolfBridge) wolfBridge.commit();
      return global.ImmersiveEngine ? ImmersiveEngine.processWeek(s) : null;
    }).catch(function (error) {
      if (active()) ensure(s).lastError = String(error.message || error).substring(0, 160);
    }).then(function () {
      if (!active()) return null;
      if (global.wolfBridge) wolfBridge.commit();
      finalize(s, before);
      setBusy(false);
      save(); refresh();
      return result;
    }).catch(function (error) {
      if (active()) {
        ensure(s).lastError = String(error.message || error).substring(0, 160);
        setBusy(false); save(); refresh();
      }
      return result;
    });
    return promise;
  }
  function finalize(s, before) {
    var companies = s.market.companies;
    companies.forEach(function (c) {
      c.marketCap = c.price * c.sharesOutstanding;
      c.change = c.prevClose ? (c.price / c.prevClose - 1) * 100 : 0;
      if (!c.weekHistory) c.weekHistory = [];
      c.weekHistory.push(c.price); c.weekHistory = c.weekHistory.slice(-104);
    });
    engine._updateUnrealizedPnL(); engine._checkMissions(); engine._checkLevelUp(); engine._updateUnrealizedPnL();
    if (global.BrokerStory && BrokerStory.evaluate) { BrokerStory.evaluate(); BrokerStory.render(); }
    var holdings = engine.getPortfolio().map(function (p) {
      var c = engine.getCompany(p.ticker);
      return { ticker: p.ticker, delta: c ? (c.price - c.prevClose) * p.shares * (p.type === 'short' ? -1 : 1) : 0 };
    }).sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
    var marketReturn = engine._computeMarketReturn();
    var desk = ensure(s);
    var causes = s.notifications.filter(function (n) { return (n.week || n.time) === s.player.week; }).slice(0, 3).map(function (n) { return n.title; });
    desk.recap = { turn: key(s), netWorth: s.player.netWorth, delta: s.player.netWorth - before, marketReturn: marketReturn * 100,
      holdings: holdings.slice(0, 3), causes: causes, decision: desk.lastDecision };
    var history = s.netWorthHistory || [{ week: 0, value: 10000 }];
    history.push({ week: s.player.stats.weeksPlayed, value: s.player.netWorth }); s.netWorthHistory = history.slice(-104);
    resultUpdate(s);
    opportunity(s);
  }
  function resultUpdate(s) { if (current) { current.netWorth = s.player.netWorth; current.level = s.player.level; } }
  function reset() {
    session++; if (global.WolfLLM) WolfLLM.cancel(); current = null; setBusy(false);
    if (global.LLMGameMaster && LLMGameMaster.clearCache) LLMGameMaster.clearCache();
    var s = state(); if (!s) return;
    ensure(s); opportunity(s);
    if (global.BrokerageCareer) BrokerageCareer.render();
    if (global.PlayerLife && PlayerLife.bindGame) PlayerLife.bindGame();
    if (global.StakeholderInteractions) StakeholderInteractions.render();
    if (global.BrokerStory && BrokerStory.bindGame) BrokerStory.bindGame(global.G);
    if (global.LLMNarrativeEngine) { LLMNarrativeEngine.ensureNarrativeState(s); LLMNarrativeEngine.ensureKeyCharacters(s); }
    if (global.ImmersiveEngine) ImmersiveEngine.install(engine);
    if (global.WorldEngine && global.G && WorldEngine.bindGame) WorldEngine.bindGame(global.G);
    if (engine._competitorEngine) {
      var ce = engine._competitorEngine;
      if (ce.reset) ce.reset();
      ce.init({ stocks: s.market.companies.map(function (c) { return { symbol: c.ticker, price: c.price, sector: c.sector }; }), currentWeek: s.player.week });
      if (s.competitorState && s.competitorState.length === ce.competitors.length) {
        for (var i = 0; i < ce.competitors.length; i++) {
          var saved = s.competitorState[i];
          ['capital', 'initialCapital', 'portfolio', 'active', 'relationship', 'relationshipScore', 'secRep', 'wallStreetRep'].forEach(function (field) {
            if (saved[field] !== undefined) ce.competitors[i][field] = saved[field];
          });
        }
      }
      global._competitorEngine = ce;
    }
    if (global.wolfBridge) wolfBridge.sync();
    render();
  }
  function render() {
    if (!engine || !state() || !global.document) return;
    var root = document.getElementById('desk-session'); if (!root) return;
    var s = state(); var desk = ensure(s); var item = opportunity(s); var c = career();
    if (global.renderCompetitorActivity) renderCompetitorActivity({ trades: s.competitors && s.competitors.activity || [] });
    var llm = global.WolfLLM ? WolfLLM.status() : { enabled: false };
    var label = busy ? 'Il mondo reagisce alle tue scelte' : llm.error ? 'Storia procedurale · AI non disponibile' : llm.enabled && llm.successes ? 'Storia AI collegata al mercato' : 'Mercato e storia procedurali';
    var html = '<div class="desk-heading"><div><div class="desk-eyebrow">IL TUO DESK · ANNO ' + s.player.year + ' / SETTIMANA ' + s.player.week + '</div><h2>Ogni posizione racconta chi sei.</h2><p>Leggi il dossier. Scegli il rischio. Porta il risultato al desk.</p></div><span class="desk-status" role="status">' + text(label) + '</span></div>';
    var trustValue = c ? c.employerTrust : 0;
    html += '<div class="desk-metrics"><span>Fiducia del capo <strong>' + Math.round(trustValue) + '/100</strong></span><span>Etica <strong>' + Math.round(s.player.ethics) + '/100</strong></span><span>Operazioni <strong>' + s.player.stats.totalTrades + '</strong></span><span>Missioni <strong>' + engine.getCompletedMissions().length + '</strong></span></div>';
    if (desk.recap) {
      var recap = desk.recap;
      html += '<div class="desk-recap"><strong>La settimana appena chiusa</strong><span class="' + (recap.delta >= 0 ? 'green' : 'red') + '">Patrimonio ' + (recap.delta >= 0 ? '+' : '') + money(recap.delta) + '</span><p>Mercato ' + recap.marketReturn.toFixed(2) + '%.';
      recap.holdings.forEach(function (held) { html += ' ' + text(held.ticker) + ' ha inciso per ' + money(held.delta) + '.'; });
      html += ' Il totale comprende stipendi, costi, compensi e operazioni.</p>';
      if (recap.decision) html += '<p>' + text(recap.decision) + '</p>';
      if (recap.causes.length) html += '<p class="desk-muted">Dal mercato: ' + text(recap.causes.join(' · ')) + '</p>';
      html += '</div>';
    }
    if (item) {
      html += '<div class="desk-dossier"><div class="desk-eyebrow">DOSSIER DELLA SETTIMANA · ' + text(item.ticker) + '</div><h3>' + text(item.title) + '</h3><p>' + text(item.body) + '</p>';
      if (!item.selected) {
        html += '<div class="desk-choices">';
        html += choiceCard('balanced', 'Costruisci fiducia', 'Mantieni il 5–25% del patrimonio di partenza in ' + item.ticker + '. Compenso €220, +40 XP, fiducia +4.', 'Un impegno misurabile');
        html += choiceCard('conviction', 'Prendi posizione', 'Mantieni il 20–45% in ' + item.ticker + '. Compenso €380, +50 XP, fiducia +6. Maggiore concentrazione e rischio.', 'Il desk ti guarda');
        html += choiceCard('decline', 'Lascia passare', 'Nessun acquisto richiesto. Stress -4, +10 XP, fiducia -1. Proteggi tempo e liquidità.', 'Anche aspettare è una scelta');
        html += '</div>';
      } else {
        html += '<p class="desk-feedback">' + text(desk.lastDecision) + '</p>';
        if (item.selected !== 'decline') html += '<button class="btn btn-green" data-desk-action="inspect" data-ticker="' + text(item.ticker) + '"' + (busy ? ' disabled' : '') + '>Prepara ordine ' + text(item.ticker) + '</button> <span class="desk-muted">Verifica e conferma nella finestra di trading. Nessun acquisto automatico.</span>';
      }
      html += '</div>';
    }
    var list = desk.watchlist.slice();
    if (item && list.indexOf(item.ticker) < 0) list.unshift(item.ticker);
    if (list.length < 3) s.market.companies.filter(function (company) { return !company.isPenny && company.listed !== false; }).slice(10, 13).forEach(function (company) { if (list.indexOf(company.ticker) < 0) list.push(company.ticker); });
    html += '<div class="desk-bottom"><div><h3>Il mercato sul tuo tavolo</h3><div class="desk-stocks">';
    list.slice(0, 5).forEach(function (ticker) {
      var company = engine.getCompany(ticker); if (!company) return;
      var change = company.prevClose ? (company.price / company.prevClose - 1) * 100 : 0;
      html += '<div class="desk-stock"><div><strong>' + text(ticker) + '</strong><span>' + text(company.name) + '</span></div><div><strong>' + money(company.price) + '</strong><span class="' + (change >= 0 ? 'green' : 'red') + '">' + (change >= 0 ? '+' : '') + change.toFixed(2) + '%</span></div><button class="btn btn-sm" data-desk-action="inspect" data-ticker="' + text(ticker) + '"' + (busy ? ' disabled' : '') + '>Negozia</button><button class="desk-star" aria-label="Segui ' + text(ticker) + '" data-desk-action="watch" data-ticker="' + text(ticker) + '">' + (desk.watchlist.indexOf(ticker) >= 0 ? '★' : '☆') + '</button></div>';
    });
    html += '</div></div><div><h3>La tua prossima conquista</h3>';
    engine.getActiveMissions().slice(0, 3).forEach(function (m) { html += '<div class="desk-goal"><strong>' + text(m.name) + '</strong><p>' + text(m.desc) + '</p><span>' + money(m.cash) + ' · ' + m.xp + ' XP</span></div>'; });
    html += '</div></div><div class="desk-footer">Il mandato si verifica alla chiusura della settimana sul costo delle posizioni rimaste in portafoglio. Se non rispetti i limiti: nessun compenso e fiducia -3. I rendimenti di mercato restano incerti.</div>';
    root.innerHTML = html;
  }
  function choiceCard(id, title, body, eyebrow) {
    return '<button class="desk-choice" data-desk-action="choose" data-choice="' + id + '"' + (busy ? ' disabled' : '') + '><small>' + text(eyebrow) + '</small><strong>' + text(title) + '</strong><span>' + text(body) + '</span></button>';
  }
  function install(e) {
    engine = e; if (installed) return; installed = true;
    var root = document.createElement('section'); root.id = 'desk-session'; root.setAttribute('aria-label', 'Desk del broker');
    var dashboard = document.getElementById('view-dashboard'); dashboard.insertBefore(root, dashboard.firstChild);
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-desk-action]'); if (!button) return;
      var action = button.getAttribute('data-desk-action');
      if (action === 'choose') choose(button.getAttribute('data-choice'));
      if (action === 'inspect') inspect(button.getAttribute('data-ticker'));
      if (action === 'watch') watch(button.getAttribute('data-ticker'));
    });
    var originalRender = global.renderAll;
    global.renderAll = function () { originalRender(); render(); };
    engine.on('trade', render);
    if (global.WolfLLM) WolfLLM.saveSettings(WolfLLM.getSettings());
    reset();
  }
  global.DeskDirector = { install: install, reset: reset, finishTurn: finishTurn, isBusy: function () { return busy; }, currentTurn: function () { return current; }, choose: choose, inspect: inspect, watch: watch, render: render };
}(typeof window !== 'undefined' ? window : this));
