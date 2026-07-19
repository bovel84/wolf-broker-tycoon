/*
 * player-life.js
 * Persistent broker condition, personal consequences and game-over system.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var installed = false;
  var originalAdvance = null;
  var originalNewGame = null;
  var originalLoadSlot = null;
  var originalLoadAuto = null;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function round(v, digits) { var p = Math.pow(10, digits || 0); return Math.round((Number(v) || 0) * p) / p; }
  function safe(v, max) { return String(v || '').replace(/[<>]/g, '').substring(0, max || 240); }
  function game() { try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; } }
  function worth() { try { return typeof computeNetWorth === 'function' ? computeNetWorth() : ((game() && game().cash) || 0); } catch (e) { return 0; } }
  function company(ticker) { var g = game(); return g && g.companies ? g.companies.filter(function (c) { return c.ticker === ticker; })[0] : null; }
  function story() { return global.BrokerStory && global.BrokerStory.getContext ? global.BrokerStory.getContext() : null; }
  function money(v) { try { return typeof formatEur === 'function' ? formatEur(v) : '€' + Math.round(v); } catch (e) { return '€' + Math.round(v); } }

  function baseState(g) {
    return {
      version: VERSION,
      status: 'active',
      stress: 22,
      health: 100,
      credibility: 50,
      legalPressure: 5,
      insolvencyWeeks: 0,
      legalCriticalWeeks: 0,
      reputationCrisisWeeks: 0,
      marginCalls: 0,
      secondChanceUsed: false,
      peakNetWorth: Math.max((g && g.startingCash) || 10000, worth()),
      lastNetWorth: worth(),
      lastRealizedPnL: (g && g.realizedPnL) || 0,
      lastTrades: g && g.stats ? g.stats.totalTrades || 0 : 0,
      weeklyExpenses: 0,
      leverage: 0,
      equityRatio: 1,
      lastWarning: null,
      incidents: [],
      gameOver: null
    };
  }

  function ensureState() {
    var g = game();
    if (!g) return null;
    if (!g.playerLife || typeof g.playerLife !== 'object') g.playerLife = baseState(g);
    var s = g.playerLife;
    var defaults = baseState(g);
    for (var k in defaults) if (Object.prototype.hasOwnProperty.call(defaults, k) && s[k] === undefined) s[k] = defaults[k];
    if (!(s.incidents instanceof Array)) s.incidents = [];
    return s;
  }

  function addIncident(type, title, text) {
    var g = game();
    var s = ensureState();
    if (!g || !s) return;
    s.incidents.unshift({ week: g.week, type: type, title: safe(title, 90), text: safe(text, 260) });
    s.incidents = s.incidents.slice(0, 30);
  }

  function addNews(title, description, type) {
    var g = game();
    if (!g) return;
    if (!(g.news instanceof Array)) g.news = [];
    g.news.unshift({ week: g.week, title: safe(title, 110), desc: safe(description, 260), type: type || 'negative', scope: 'player' });
    g.news = g.news.slice(0, 120);
  }

  function notify(kind, message) {
    try { if (typeof toast === 'function') toast(kind, message); } catch (e) {}
  }

  function exposure() {
    var g = game();
    var gross = 0;
    if (!g) return 0;
    for (var t in g.positions) {
      if (!Object.prototype.hasOwnProperty.call(g.positions, t)) continue;
      var c = company(t);
      if (c) gross += Math.abs(g.positions[t].shares * c.price);
    }
    for (var i = 0; i < g.shorts.length; i++) {
      var sc = company(g.shorts[i].ticker);
      if (sc) gross += Math.abs(g.shorts[i].shares * sc.price);
    }
    return gross;
  }

  function concentration() {
    var g = game();
    var gross = exposure();
    var biggest = 0;
    if (!g || gross <= 0) return 0;
    for (var t in g.positions) {
      var c = company(t);
      if (c) biggest = Math.max(biggest, Math.abs(g.positions[t].shares * c.price));
    }
    return biggest / gross;
  }

  function calculateExpenses(g, s, nw) {
    var levelCost = (g.level || 0) * 38;
    var wealthCost = Math.max(0, nw) * 0.00012;
    var crisisDiscount = s.insolvencyWeeks > 0 ? 0.65 : 1;
    return round(clamp((85 + levelCost + wealthCost) * crisisDiscount, 60, 2500), 2);
  }

  function updatePersonalMetrics() {
    var g = game();
    var s = ensureState();
    if (!g || !s || s.status !== 'active') return;
    var nwBeforeCosts = worth();
    var previousWorth = Number(s.lastNetWorth) || nwBeforeCosts;
    var weeklyReturn = previousWorth > 0 ? (nwBeforeCosts - previousWorth) / previousWorth : -1;
    var gross = exposure();
    s.leverage = round(gross / Math.max(1, nwBeforeCosts), 2);
    s.equityRatio = gross > 0 ? round(nwBeforeCosts / gross, 3) : 1;
    s.weeklyExpenses = calculateExpenses(g, s, nwBeforeCosts);
    g.cash -= s.weeklyExpenses;

    var stressDelta = 0;
    if (weeklyReturn < -0.12) stressDelta += 14;
    else if (weeklyReturn < -0.04) stressDelta += 7;
    else if (weeklyReturn > 0.06) stressDelta -= 4;
    if (s.leverage > 4) stressDelta += 12;
    else if (s.leverage > 2.5) stressDelta += 6;
    if (concentration() > 0.65) stressDelta += 4;
    if (g.shorts && g.shorts.length > 2) stressDelta += 3;

    var narrative = story();
    if (narrative) {
      var targetLegal = clamp((narrative.relationships.inspector || 0) * 0.72 + (100 - narrative.ethics) * 0.38, 0, 100);
      s.legalPressure = round(clamp(s.legalPressure + (targetLegal - s.legalPressure) * 0.16, 0, 100), 1);
      if (narrative.nerve > 65) stressDelta -= 2;
      if (narrative.relationships.elena < 20) stressDelta += 3;
    }
    if (s.legalPressure > 70) stressDelta += 5;
    if (nwBeforeCosts > (g.startingCash || 10000) * 1.2 && s.leverage < 1.8) stressDelta -= 3;
    s.stress = round(clamp(s.stress + stressDelta, 0, 100), 1);

    if (s.stress >= 90) s.health = round(clamp(s.health - 6, 0, 100), 1);
    else if (s.stress >= 75) s.health = round(clamp(s.health - 2.5, 0, 100), 1);
    else if (s.stress < 45) s.health = round(clamp(s.health + 1.5, 0, 100), 1);

    var trades = g.stats ? g.stats.totalTrades || 0 : 0;
    var realized = Number(g.realizedPnL) || 0;
    if (trades > s.lastTrades) {
      if (realized > s.lastRealizedPnL) s.credibility = clamp(s.credibility + 1.5, 0, 100);
      if (realized < s.lastRealizedPnL) s.credibility = clamp(s.credibility - 2.5, 0, 100);
    }
    if (s.legalPressure > 75) s.credibility = clamp(s.credibility - 1.5, 0, 100);
    if (nwBeforeCosts > s.peakNetWorth) s.credibility = clamp(s.credibility + 0.4, 0, 100);
    s.peakNetWorth = Math.max(s.peakNetWorth, nwBeforeCosts);
    s.lastNetWorth = worth();
    s.lastRealizedPnL = realized;
    s.lastTrades = trades;
  }

  function forceMarginCall() {
    var g = game();
    var s = ensureState();
    if (!g || !s) return false;
    var gross = exposure();
    var equity = worth();
    if (gross <= 0 || g.cash >= 0 || equity / gross >= 0.22) return false;
    var recovered = 0;
    for (var t in g.positions) {
      if (!Object.prototype.hasOwnProperty.call(g.positions, t)) continue;
      var c = company(t);
      var p = g.positions[t];
      if (!c || !p) continue;
      var proceeds = p.shares * c.price;
      recovered += proceeds;
      g.cash += proceeds;
      if (typeof g.realizedPnL === 'number') g.realizedPnL += (c.price - p.avgCost) * p.shares;
      try { if (typeof addTransaction === 'function') addTransaction('sell', t, p.shares, c.price, proceeds, 0); } catch (e) {}
    }
    g.positions = {};
    for (var i = 0; i < g.shorts.length; i++) {
      var sh = g.shorts[i];
      var sc = company(sh.ticker);
      if (!sc) continue;
      var pnl = (sh.entryPrice - sc.price) * sh.shares;
      g.cash += pnl;
      if (typeof g.realizedPnL === 'number') g.realizedPnL += pnl;
      try { if (typeof addTransaction === 'function') addTransaction('cover', sh.ticker, sh.shares, sc.price, sh.shares * sc.price, 0); } catch (e2) {}
    }
    g.shorts = [];
    s.marginCalls += 1;
    s.stress = clamp(s.stress + 18, 0, 100);
    s.credibility = clamp(s.credibility - 12, 0, 100);
    addIncident('margin_call', 'Margin call', 'Il broker liquida tutte le posizioni dopo il crollo del rapporto tra capitale ed esposizione.');
    addNews('Margin call sul conto di ' + brokerName(), 'Le posizioni vengono liquidate per coprire il debito. Recuperati ' + money(recovered) + ', ma reputazione e nervi subiscono il colpo.', 'negative');
    notify('error', 'MARGIN CALL: il portafoglio è stato liquidato');
    return true;
  }

  function brokerName() {
    var narrative = story();
    return narrative && narrative.name ? narrative.name : ((game() && game().brokerName) || 'il broker');
  }

  function endingData(reason) {
    var labels = {
      bankrupt: ['Bancarotta definitiva', 'Il credito si chiude, i telefoni smettono di squillare e il mercato presenta il conto finale.'],
      prison: ['La porta si chiude', 'L’indagine diventa condanna. Il patrimonio non può comprare il tempo che hai perso.'],
      breakdown: ['Il corpo dice basta', 'Settimane senza sonno e rischio continuo fermano la carriera prima del mercato.'],
      disgraced: ['Nessuno risponde più', 'Clienti, soci e colleghi ritirano la fiducia. A Wall Street il silenzio è una sentenza.']
    };
    return labels[reason] || ['Game Over', 'La carriera è terminata.'];
  }

  function triggerGameOver(reason) {
    var g = game();
    var s = ensureState();
    if (!g || !s || s.status === 'game_over') return s && s.gameOver;
    var data = endingData(reason);
    var nw = worth();
    var narrative = story() || {};
    s.status = 'game_over';
    s.gameOver = {
      reason: reason,
      title: data[0],
      text: data[1],
      week: g.week,
      netWorth: round(nw, 0),
      peakNetWorth: round(s.peakNetWorth, 0),
      trades: g.stats ? g.stats.totalTrades || 0 : 0,
      winRate: g.stats && g.stats.totalTrades ? round((g.stats.wins || 0) / g.stats.totalTrades * 100, 1) : 0,
      ethics: narrative.ethics === undefined ? 50 : narrative.ethics,
      score: Math.max(0, Math.round(s.peakNetWorth + g.week * 350 + s.credibility * 200 - s.legalPressure * 150))
    };
    addIncident('game_over', data[0], data[1]);
    addNews(data[0] + ': finisce la carriera di ' + brokerName(), data[1], 'negative');
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
    showGameOver();
    enrichEnding();
    return s.gameOver;
  }

  function checkEndConditions() {
    var g = game();
    var s = ensureState();
    if (!g || !s || s.status !== 'active') return;
    forceMarginCall();
    var nw = worth();
    var threshold = Math.max(500, (g.startingCash || 10000) * 0.05);
    if (nw <= threshold) s.insolvencyWeeks += 1; else s.insolvencyWeeks = Math.max(0, s.insolvencyWeeks - 1);
    if (s.legalPressure >= 96) s.legalCriticalWeeks += 1; else s.legalCriticalWeeks = 0;
    if (s.credibility <= 5 && nw < (g.startingCash || 10000) * 0.5) s.reputationCrisisWeeks += 1; else s.reputationCrisisWeeks = 0;

    if (s.insolvencyWeeks === 1) warn('insolvency', 'Liquidità critica', 'Hai una settimana per riportare il patrimonio sopra ' + money(threshold) + '.');
    if (s.legalCriticalWeeks === 1) warn('legal', 'La procura prepara il caso', 'Riduci la pressione legale o la prossima settimana può arrivare la condanna.');
    if (s.health <= 18 && s.health > 0) warn('health', 'Salute al limite', 'Lo stress sta compromettendo la capacità del broker di continuare.');

    if (s.insolvencyWeeks >= 2) triggerGameOver('bankrupt');
    else if (s.legalCriticalWeeks >= 2) triggerGameOver('prison');
    else if (s.health <= 0) triggerGameOver('breakdown');
    else if (s.reputationCrisisWeeks >= 3) triggerGameOver('disgraced');
  }

  function warn(code, title, text) {
    var s = ensureState();
    var g = game();
    var key = code + '_' + (g ? g.week : 0);
    if (!s || s.lastWarning === key) return;
    s.lastWarning = key;
    addIncident('warning', title, text);
    notify('warning', title + ': ' + text);
  }

  function processWeek() {
    var s = ensureState();
    if (!s || s.status !== 'active') return;
    updatePersonalMetrics();
    checkEndConditions();
    render();
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
  }

  function canAct() {
    var s = ensureState();
    return !s || s.status !== 'game_over';
  }

  function rescue() {
    var g = game();
    var s = ensureState();
    if (!g || !s || !s.gameOver || s.secondChanceUsed || s.gameOver.reason === 'prison') return false;
    g.positions = {};
    g.shorts = [];
    g.cash = 5000;
    g.level = Math.max(0, (g.level || 0) - 2);
    s.status = 'active';
    s.secondChanceUsed = true;
    s.insolvencyWeeks = 0;
    s.reputationCrisisWeeks = 0;
    s.stress = 58;
    s.health = Math.max(48, s.health);
    s.credibility = Math.max(25, s.credibility);
    s.gameOver = null;
    s.lastNetWorth = worth();
    addIncident('rescue', 'Seconda possibilità', 'Hai ceduto ogni posizione, ridimensionato la carriera e ottenuto cinquemila euro per ricominciare. Non ci sarà un altro salvataggio.');
    addNews(brokerName() + ' torna sul mercato', 'Dopo la caduta, il broker riparte con una struttura più piccola e l’ultima linea di credito disponibile.', 'neutral');
    hideGameOver();
    try { if (typeof updateUnlocks === 'function') updateUnlocks(); } catch (e) {}
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e2) {}
    try { if (typeof renderAll === 'function') renderAll(); } catch (e3) {}
    render();
    return true;
  }

  function newCareer() {
    hideGameOver();
    if (global.BrokerStory && global.BrokerStory.reset) global.BrokerStory.reset();
    if (typeof newGame === 'function') newGame();
    if (global.BrokerStory && global.BrokerStory.showPrologue) global.BrokerStory.showPrologue();
  }

  function loadCareer() {
    hideGameOver();
    try { if (typeof switchView === 'function') switchView('save'); } catch (e) {}
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('player-life-style')) {
      var style = document.createElement('style');
      style.id = 'player-life-style';
      style.textContent = '#player-game-over{position:fixed;inset:0;z-index:12000;background:radial-gradient(circle at 50% 15%,rgba(64,12,18,.97),rgba(3,5,9,.99) 68%);display:none;align-items:center;justify-content:center;padding:18px}.player-ending-shell{width:min(780px,100%);max-height:94vh;overflow:auto;background:#0d121d;border:1px solid rgba(255,83,113,.55);border-radius:14px;padding:clamp(22px,5vw,48px);box-shadow:0 30px 90px rgba(0,0,0,.8)}.player-ending-shell h1{font-size:clamp(32px,7vw,62px);line-height:1;color:#fff;margin:8px 0 18px}.player-life-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.player-life-meter{height:6px;background:var(--bg4);border-radius:8px;overflow:hidden}.player-life-meter span{display:block;height:100%}@media(max-width:640px){.player-life-grid{grid-template-columns:1fr 1fr}.player-ending-shell{height:100%;max-height:100vh;border-radius:0}}';
      document.head.appendChild(style);
    }
    var dashboard = document.getElementById('view-dashboard');
    if (dashboard && !document.getElementById('player-life-card')) {
      var card = document.createElement('div');
      card.id = 'player-life-card';
      card.className = 'card';
      card.innerHTML = '<h3>🐺 Il Broker</h3><div id="player-life-content"></div>';
      dashboard.insertBefore(card, dashboard.firstChild);
    }
    var career = document.getElementById('view-career');
    if (career && !document.getElementById('player-career-card')) {
      var ccard = document.createElement('div');
      ccard.id = 'player-career-card';
      ccard.className = 'card';
      ccard.innerHTML = '<h3>⚖️ Condizione personale e rischio</h3><div id="player-career-content"></div>';
      career.appendChild(ccard);
    }
    if (!document.getElementById('player-game-over')) {
      var over = document.createElement('div');
      over.id = 'player-game-over';
      over.innerHTML = '<div class="player-ending-shell" id="player-game-over-body"></div>';
      document.body.appendChild(over);
    }
  }

  function meter(label, value, inverse) {
    var color = inverse ? (value >= 75 ? 'var(--red)' : (value >= 45 ? 'var(--yellow)' : 'var(--green)')) : (value <= 25 ? 'var(--red)' : (value <= 55 ? 'var(--yellow)' : 'var(--green)'));
    return '<div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2)"><span>' + label + '</span><span>' + Math.round(value) + '</span></div><div class="player-life-meter"><span style="width:' + clamp(value, 0, 100) + '%;background:' + color + '"></span></div></div>';
  }

  function render() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var s = ensureState();
    var g = game();
    if (!s || !g) return;
    var main = document.getElementById('player-life-content');
    if (main) {
      var html = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:9px"><div><strong>' + safe(brokerName(), 50) + '</strong><div class="gray" style="font-size:10px">Picco ' + money(s.peakNetWorth) + ' · Spese settimanali ' + money(s.weeklyExpenses) + '</div></div><span class="pill ' + (s.status === 'active' ? 'g' : 'r') + '">' + (s.status === 'active' ? 'OPERATIVO' : 'CARRIERA TERMINATA') + '</span></div>';
      html += '<div class="player-life-grid">' + meter('Salute', s.health, false) + meter('Stress', s.stress, true) + meter('Credibilità', s.credibility, false) + meter('Pressione legale', s.legalPressure, true) + '<div style="font-size:10px;color:var(--text2)">Leva<div style="font-size:15px;color:var(--text);font-weight:700">' + round(s.leverage, 2) + 'x</div></div><div style="font-size:10px;color:var(--text2)">Margin call<div style="font-size:15px;color:var(--text);font-weight:700">' + s.marginCalls + '</div></div></div>';
      if (s.insolvencyWeeks > 0) html += '<div style="margin-top:9px;color:var(--red);font-size:11px">⚠ Crisi di solvibilità: ' + s.insolvencyWeeks + '/2 settimane</div>';
      main.innerHTML = html;
    }
    var career = document.getElementById('player-career-content');
    if (career) {
      var chtml = '<div class="player-life-grid">' + meter('Salute', s.health, false) + meter('Stress', s.stress, true) + meter('Credibilità', s.credibility, false) + meter('Pressione legale', s.legalPressure, true) + '</div>';
      chtml += '<div style="margin-top:12px;font-size:11px"><strong>Regole della caduta</strong><div class="gray" style="line-height:1.6;margin-top:4px">La bancarotta arriva dopo due settimane sotto la soglia minima. Una leva insostenibile provoca prima una margin call. Condanna, salute e fiducia possono terminare la carriera indipendentemente dal patrimonio.</div></div>';
      if (s.incidents.length) chtml += '<div style="margin-top:10px"><strong style="font-size:11px">Ultimo evento personale</strong><div class="gray" style="font-size:10px;margin-top:3px">Sett. ' + s.incidents[0].week + ' · ' + safe(s.incidents[0].title, 80) + ' — ' + safe(s.incidents[0].text, 180) + '</div></div>';
      career.innerHTML = chtml;
    }
    if (s.status === 'game_over') showGameOver();
  }

  function showGameOver() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var s = ensureState();
    if (!s || !s.gameOver) return;
    var e = s.gameOver;
    var rescueAllowed = !s.secondChanceUsed && e.reason !== 'prison';
    var body = document.getElementById('player-game-over-body');
    var overlay = document.getElementById('player-game-over');
    if (!body || !overlay) return;
    body.innerHTML = '<div style="font-size:11px;letter-spacing:3px;color:var(--red);font-weight:800">GAME OVER · SETTIMANA ' + e.week + '</div><h1>' + safe(e.title, 100) + '</h1><p id="player-ending-text" style="font-size:15px;line-height:1.7;color:var(--text2)">' + safe(e.text, 400) + '</p><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:20px 0"><div class="kpi"><div class="label">Patrimonio finale</div><div class="val">' + money(e.netWorth) + '</div></div><div class="kpi"><div class="label">Picco raggiunto</div><div class="val">' + money(e.peakNetWorth) + '</div></div><div class="kpi"><div class="label">Trade / Win rate</div><div class="val">' + e.trades + ' / ' + e.winRate + '%</div></div><div class="kpi"><div class="label">Punteggio eredità</div><div class="val">' + e.score + '</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap">' + (rescueAllowed ? '<button class="btn btn-green" onclick="PlayerLife.rescue()">Usa l’unica seconda possibilità</button>' : '') + '<button class="btn btn-blue" onclick="PlayerLife.loadCareer()">Carica un salvataggio</button><button class="btn btn-red" onclick="PlayerLife.newCareer()">Nuova carriera</button></div>';
    overlay.style.display = 'flex';
  }

  function hideGameOver() {
    if (typeof document === 'undefined') return;
    var overlay = document.getElementById('player-game-over');
    if (overlay) overlay.style.display = 'none';
  }

  function enrichEnding() {
    var s = ensureState();
    if (!s || !s.gameOver || !global.LLMGameMaster || !global.LLMGameMaster.generateDialogue || !global.LLMGameMaster.isAvailable || !global.LLMGameMaster.isAvailable()) return;
    global.LLMGameMaster.generateDialogue({ name: 'La Campana', role: 'Narratore della caduta' }, 'Scrivi un epilogo sobrio e personale per ' + brokerName() + '. Causa: ' + s.gameOver.title + '. Stato: ' + JSON.stringify(getContext()) + '. Non cambiare i fatti.', { week: game().week, year: game().year || 1987, level: game().level || 0, reputation: s.credibility, netWorth: worth() }).then(function (result) {
      var el = typeof document !== 'undefined' ? document.getElementById('player-ending-text') : null;
      if (el && result && result.text) el.textContent = safe(result.text, 550);
    }).catch(function () {});
  }

  function getContext() {
    var s = ensureState();
    if (!s) return null;
    return { status: s.status, stress: s.stress, health: s.health, credibility: s.credibility, legalPressure: s.legalPressure, leverage: s.leverage, insolvencyWeeks: s.insolvencyWeeks, marginCalls: s.marginCalls, secondChanceUsed: s.secondChanceUsed, peakNetWorth: s.peakNetWorth, gameOver: s.gameOver };
  }

  function install() {
    if (installed) return;
    installed = true;
    ensureState();
    ensureUI();
    if (typeof advanceTurn === 'function') {
      originalAdvance = advanceTurn;
      global.advanceTurn = function () {
        if (!canAct()) { showGameOver(); return; }
        originalAdvance();
        global.setTimeout(processWeek, 80);
      };
    }
    if (typeof newGame === 'function') {
      originalNewGame = newGame;
      global.newGame = function () {
        originalNewGame();
        var g = game();
        if (g) g.playerLife = baseState(g);
        hideGameOver();
        render();
      };
    }
    if (typeof loadSlot === 'function') {
      originalLoadSlot = loadSlot;
      global.loadSlot = function (n) {
        originalLoadSlot(n);
        ensureState();
        hideGameOver();
        render();
        if (!canAct()) showGameOver();
      };
    }
    if (typeof loadAuto === 'function') {
      originalLoadAuto = loadAuto;
      global.loadAuto = function () {
        var ok = originalLoadAuto();
        ensureState();
        return ok;
      };
    }
    render();
    if (!canAct()) showGameOver();
  }

  global.PlayerLife = {
    install: install,
    processWeek: processWeek,
    canAct: canAct,
    rescue: rescue,
    newCareer: newCareer,
    loadCareer: loadCareer,
    showGameOver: showGameOver,
    triggerGameOver: triggerGameOver,
    getContext: getContext,
    render: render,
    version: VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.PlayerLife;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
