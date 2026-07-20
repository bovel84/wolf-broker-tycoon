/*
 * brokerage-career.js
 * Employment, brokerage firms, internal AI rivals and player-owned company.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var installed = false;
  var originalAdvance = null;
  var originalNewGame = null;
  var originalLoadSlot = null;

  var FIRMS = [
    { id: 'meridian', name: 'Meridian Capital Markets', style: 'Istituzionale', culture: 'Disciplina, grandi clienti e controllo del rischio.', salary: 720, commission: 0.08, feeRate: 0.0016, targetRevenue: 7200, targetTrades: 7, riskLimit: 2.4, ethics: 78, entryBonus: 800, color: '#3b82f6' },
    { id: 'apex', name: 'Apex Stratton Securities', style: 'Vendita aggressiva', culture: 'Telefono, volumi, bonus e una linea etica deliberatamente sfocata.', salary: 480, commission: 0.22, feeRate: 0.0032, targetRevenue: 11000, targetTrades: 15, riskLimit: 4.2, ethics: 28, entryBonus: 1800, color: '#ff5371' },
    { id: 'northstar', name: 'Northstar Wealth Advisory', style: 'Gestione patrimoniale', culture: 'Clienti facoltosi, stabilità, fiducia e rendimenti difendibili.', salary: 800, commission: 0.07, feeRate: 0.0013, targetRevenue: 6200, targetTrades: 5, riskLimit: 1.9, ethics: 86, entryBonus: 600, color: '#00d68f' },
    { id: 'ironclad', name: 'Ironclad Commodities', style: 'Macro e materie prime', culture: 'Posizioni concentrate, nervi saldi e risultati misurati senza pietà.', salary: 620, commission: 0.16, feeRate: 0.0022, targetRevenue: 9000, targetTrades: 9, riskLimit: 3.6, ethics: 52, entryBonus: 1200, color: '#f5a623' },
    { id: 'blueharbor', name: 'Blue Harbor Partners', style: 'Brokeraggio responsabile', culture: 'Trasparenza, compliance e crescita lenta della clientela.', salary: 760, commission: 0.06, feeRate: 0.0014, targetRevenue: 5600, targetTrades: 6, riskLimit: 2.1, ethics: 94, entryBonus: 500, color: '#06b6d4' },
    { id: 'vortex', name: 'Vortex Quant Brokerage', style: 'Quantitativo', culture: 'Dati, velocità, algoritmi e tolleranza minima per l’intuizione non misurata.', salary: 880, commission: 0.11, feeRate: 0.0018, targetRevenue: 8400, targetTrades: 11, riskLimit: 3.0, ethics: 67, entryBonus: 1000, color: '#a855f7' }
  ];

  var FIRST_NAMES = ['Maya', 'Luca', 'Nora', 'Dario', 'Claire', 'Samir', 'Eva', 'Marcus', 'Tessa', 'Julian', 'Iris', 'Leon'];
  var LAST_NAMES = ['Voss', 'Rinaldi', 'Chen', 'Mercer', 'De Luca', 'Klein', 'Navarro', 'Costa', 'Reed', 'Ferri', 'Stone', 'Marin'];
  var ROLES = ['Junior Broker', 'Broker', 'Senior Broker', 'Desk Leader', 'Managing Director'];

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function round(v, digits) { var p = Math.pow(10, digits || 0); return Math.round((Number(v) || 0) * p) / p; }
  function safe(v, max) { return String(v || '').replace(/[<>]/g, '').substring(0, max || 240); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function getGame() { try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; } }
  function worth() { try { return typeof computeNetWorth === 'function' ? computeNetWorth() : ((getGame() && getGame().cash) || 0); } catch (e) { return 0; } }
  function money(v) { try { return typeof formatEur === 'function' ? formatEur(v) : '€' + Math.round(v); } catch (e) { return '€' + Math.round(v); } }
  function firm(id) { for (var i = 0; i < FIRMS.length; i++) if (FIRMS[i].id === id) return FIRMS[i]; return null; }
  function playerLife() { return global.PlayerLife && global.PlayerLife.getContext ? global.PlayerLife.getContext() : null; }
  function brokerStory() { return global.BrokerStory && global.BrokerStory.getContext ? global.BrokerStory.getContext() : null; }
  function notify(kind, text) { try { if (typeof toast === 'function') toast(kind, text); } catch (e) {} }

  function createCycle(f) {
    return { startWeek: (getGame() && getGame().week) || 1, revenue: 0, trades: 0, volume: 0, profit: 0, weeks: 0, score: 0, rank: 0, targetRevenue: f ? f.targetRevenue : 7000, targetTrades: f ? f.targetTrades : 7 };
  }

  function createLeague() {
    var rows = [];
    for (var i = 0; i < FIRMS.length; i++) rows.push({ firmId: FIRMS[i].id, name: FIRMS[i].name, weeklyRevenue: 0, totalRevenue: 0, reputation: 45 + i * 6, rank: i + 1 });
    return rows;
  }

  function createState() {
    return {
      version: VERSION,
      status: 'unemployed',
      employerId: null,
      roleLevel: 0,
      contract: null,
      weeksUnemployed: 0,
      careerWeeks: 0,
      careerReputation: 15,
      employerTrust: 0,
      goodCycles: 0,
      missedCycles: 0,
      lastTxCount: 0,
      lastRealizedPnL: 0,
      colleagues: [],
      cycle: createCycle(null),
      offers: [],
      applications: {},
      incidents: [],
      pendingDilemma: null,
      misconduct: { insider: 0, falsified: 0, blackmail: 0, evidence: 0 },
      ownFirm: null,
      marketLeague: createLeague(),
      history: [],
      messages: [],
      employerMood: 'neutrale',
      employerAgenda: ''
    };
  }

  function ensureState() {
    var g = getGame();
    if (!g) return null;
    if (!g.brokerCareer || typeof g.brokerCareer !== 'object' || g.brokerCareer.status === 'unemployed') {
      g.brokerCareer = createState();
      g.brokerCareer.status = 'employed';
      g.brokerCareer.employerId = 'meridian';
      g.brokerCareer.contract = { firmId: 'meridian', role: 'Junior Broker', salary: FIRMS[0].salary, commission: FIRMS[0].commission, reviewEvery: 4, startWeek: (g.week || 1) };
      g.brokerCareer.cycle = createCycle(firm('meridian'));
    }
    var s = g.brokerCareer;
    var d = createState();
    for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k) && s[k] === undefined) s[k] = d[k];
    if (!(s.colleagues instanceof Array)) s.colleagues = [];
    if (!(s.offers instanceof Array)) s.offers = [];
    if (!(s.incidents instanceof Array)) s.incidents = [];
    if (!(s.history instanceof Array)) s.history = [];
    if (!(s.messages instanceof Array)) s.messages = [];
    if (!(s.marketLeague instanceof Array)) s.marketLeague = createLeague();
    if (!s.misconduct) s.misconduct = d.misconduct;
    if (!s.cycle) s.cycle = createCycle(firm(s.employerId));
    return s;
  }

  function addIncident(type, title, text) {
    var s = ensureState();
    var g = getGame();
    if (!s || !g) return;
    s.incidents.unshift({ week: g.week, type: type, title: safe(title, 100), text: safe(text, 300) });
    s.incidents = s.incidents.slice(0, 40);
  }

  function addNews(title, text, type) {
    var g = getGame();
    if (!g) return;
    if (!(g.news instanceof Array)) g.news = [];
    g.news.unshift({ week: g.week, title: safe(title, 110), desc: safe(text, 280), type: type || 'neutral', scope: 'career' });
    g.news = g.news.slice(0, 120);
  }

  function pushEmployerMessage(title, text, mood, asksMeeting) {
    var s = ensureState();
    var g = getGame();
    if (!s || !g) return;
    s.messages.unshift({
      week: g.week,
      title: safe(title, 110),
      text: safe(text, 420),
      mood: safe(mood || 'neutrale', 30),
      asksMeeting: !!asksMeeting
    });
    s.messages = s.messages.slice(0, 20);
    s.employerMood = safe(mood || 'neutrale', 30);
  }

  function fallbackEmployerMessage(kind) {
    var s = ensureState();
    var ctx = getContext();
    if (!s || !ctx) return;
    var firmName = ctx.employer || (ctx.ownFirm ? ctx.ownFirm.name : 'La società');
    if (kind === 'join') pushEmployerMessage('Benvenuto nel desk', firmName + ' ti osserva: risultati, disciplina e sangue freddo conteranno più delle promesse.', 'vigile', false);
    else if (kind === 'review_good') pushEmployerMessage('La direzione approva', 'Il desk riconosce il tuo ciclo positivo. Ora però si aspetta continuità, non un colpo isolato.', 'fiducioso', false);
    else if (kind === 'review_bad') pushEmployerMessage('Richiamo informale', 'I numeri non bastano. La direzione pretende un recupero immediato e guarda ogni tua mossa.', 'freddo', true);
    else if (kind === 'promotion') pushEmployerMessage('Nuova responsabilità', 'La promozione porta visibilità, pressione e meno margine per sbagliare.', 'ambizioso', true);
    else if (kind === 'audit') pushEmployerMessage('Compliance in allerta', 'Le anomalie emerse hanno acceso il desk legale. Da ora sei sotto osservazione.', 'teso', true);
    else if (kind === 'owner') pushEmployerMessage('La tua società respira', 'Il marchio che hai creato sta assorbendo ogni tua decisione: reputazione, clienti e rischio hanno memoria.', 'vigile', false);
  }

  function adjustLife(delta, reason) {
    if (global.PlayerLife && global.PlayerLife.adjust) global.PlayerLife.adjust(delta, reason);
  }

  function adjustStory(delta, reason) {
    if (global.BrokerStory && global.BrokerStory.adjustTraits) global.BrokerStory.adjustTraits(delta, reason);
  }

  function makeColleagues(f, count) {
    var list = [];
    for (var i = 0; i < count; i++) {
      var seed = (FIRMS.indexOf(f) + 1) * 17 + i * 11;
      list.push({
        id: f.id + '_ai_' + i,
        name: FIRST_NAMES[(seed + i) % FIRST_NAMES.length] + ' ' + LAST_NAMES[(seed * 2 + i) % LAST_NAMES.length],
        skill: 48 + (seed * 7) % 45,
        ambition: 42 + (seed * 5) % 55,
        ethics: clamp(f.ethics + ((seed % 25) - 12), 8, 98),
        politics: 30 + (seed * 9) % 65,
        revenue: 0,
        cycleRevenue: 0,
        score: 0,
        rank: 0,
        relationship: 45 + (seed % 16),
        status: 'active',
        lastMove: 'Studia il nuovo arrivato.'
      });
    }
    return list;
  }

  function contractFor(f, transfer) {
    var s = ensureState();
    var seniority = transfer ? Math.max(0, Math.floor(s.careerReputation / 28)) : 0;
    var level = clamp(seniority, 0, 3);
    return {
      firmId: f.id,
      roleLevel: level,
      role: ROLES[level],
      salary: Math.round(f.salary * (1 + level * 0.32)),
      commission: round(f.commission + level * 0.018, 3),
      signingBonus: Math.round(f.entryBonus * (transfer ? 1.8 : 1)),
      startWeek: (getGame() && getGame().week) || 1,
      reviewEvery: 4,
      noticeCost: Math.round(f.salary * 2)
    };
  }

  function joinFirm(id, transfer) {
    var g = getGame();
    var s = ensureState();
    var f = firm(id);
    if (!g || !s || !f || s.status === 'owner') return false;
    if (global.PlayerLife && global.PlayerLife.canAct && !global.PlayerLife.canAct()) return false;
    var old = firm(s.employerId);
    var contract = contractFor(f, !!transfer);
    if (old && old.id !== f.id && s.contract) {
      if (g.cash < s.contract.noticeCost) { notify('error', 'Servono ' + money(s.contract.noticeCost) + ' per rispettare il preavviso'); return false; }
      g.cash -= s.contract.noticeCost;
    }
    s.status = 'employed';
    s.employerId = f.id;
    s.contract = contract;
    s.roleLevel = contract.roleLevel;
    s.employerTrust = transfer ? 48 : 42;
    s.colleagues = makeColleagues(f, 5);
    s.cycle = createCycle(f);
    s.goodCycles = 0;
    s.missedCycles = 0;
    s.offers = s.offers.filter(function (o) { return o.firmId !== id; });
    g.cash += contract.signingBonus;
    s.history.unshift({ week: g.week, action: 'Assunzione', firm: f.name, role: contract.role });
    addIncident('employment', 'Assunto da ' + f.name, contract.role + ', stipendio ' + money(contract.salary) + ' a settimana e bonus sui ricavi del ' + Math.round(contract.commission * 100) + '%.');
    addNews(f.name + ' assume un nuovo broker', safe((brokerStory() && brokerStory().name) || 'Il nuovo broker', 50) + ' entra nel desk come ' + contract.role + '.', 'positive');
    notify('success', 'Contratto firmato con ' + f.name);
    fallbackEmployerMessage('join');
    hideJobModal();
    render();
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
    return true;
  }

  function acceptOffer(id) {
    var s = ensureState();
    var found = false;
    for (var i = 0; s && i < s.offers.length; i++) if (s.offers[i].firmId === id) found = true;
    if (!found && s && s.status === 'employed') return false;
    return joinFirm(id, true);
  }

  function resign() {
    var s = ensureState();
    var g = getGame();
    if (!s || !g || s.status !== 'employed') return false;
    var f = firm(s.employerId);
    var cost = s.contract ? s.contract.noticeCost : 0;
    if (g.cash < cost) { notify('error', 'Servono ' + money(cost) + ' per chiudere il contratto'); return false; }
    g.cash -= cost;
    s.history.unshift({ week: g.week, action: 'Dimissioni', firm: f ? f.name : '', role: s.contract ? s.contract.role : '' });
    s.status = 'unemployed'; s.employerId = null; s.contract = null; s.colleagues = []; s.weeksUnemployed = 0;
    s.careerReputation = clamp(s.careerReputation - 4, 0, 100);
    addIncident('employment', 'Dimissioni', 'Hai lasciato il desk pagando il preavviso di ' + money(cost) + '.');
    render();
    return true;
  }

  function currentTradeDeltas() {
    var g = getGame();
    var s = ensureState();
    var txs = g.transactions || [];
    var tradeWeek = Math.max(1, g.week - 1);
    var relevant = txs.filter(function (tx) { return tx.week === tradeWeek && /buy|sell|short|cover/.test(tx.type || ''); });
    var newCount = relevant.length;
    var volume = 0;
    for (var i = 0; i < relevant.length; i++) volume += Math.abs(Number(relevant[i].total) || 0);
    var realized = (Number(g.realizedPnL) || 0) - s.lastRealizedPnL;
    s.lastTxCount = txs.length;
    s.lastRealizedPnL = Number(g.realizedPnL) || 0;
    return { trades: newCount, volume: volume, profit: realized };
  }

  function simulateColleagues(s, f) {
    var marketFactor = 0.78 + Math.random() * 0.55;
    for (var i = 0; i < s.colleagues.length; i++) {
      var c = s.colleagues[i];
      if (c.status !== 'active') continue;
      var politicalEdge = c.politics > 75 ? 1.08 : 1;
      var weekly = (f.targetRevenue / 4) * (0.55 + c.skill / 105) * marketFactor * politicalEdge * (0.75 + Math.random() * 0.5);
      if (c.ethics < 35 && Math.random() < 0.14) {
        weekly *= 1.5;
        c.lastMove = 'Spinge un affare opaco e scala la classifica.';
      } else if (c.politics > 70 && Math.random() < 0.12) {
        c.lastMove = 'Si attribuisce parte del lavoro del desk.';
      } else {
        c.lastMove = 'Cerca nuovi clienti e difende il proprio book.';
      }
      c.cycleRevenue += weekly;
      c.revenue += weekly;
      c.score = round(c.cycleRevenue / f.targetRevenue * 100, 1);
    }
  }

  function rankDesk(s) {
    var rows = [{ id: 'player', name: (brokerStory() && brokerStory().name) || 'Tu', score: s.cycle.score, player: true }];
    for (var i = 0; i < s.colleagues.length; i++) rows.push({ id: s.colleagues[i].id, name: s.colleagues[i].name, score: s.colleagues[i].score, player: false, ref: s.colleagues[i] });
    rows.sort(function (a, b) { return b.score - a.score; });
    for (var j = 0; j < rows.length; j++) {
      rows[j].rank = j + 1;
      if (rows[j].player) s.cycle.rank = j + 1;
      if (rows[j].ref) rows[j].ref.rank = j + 1;
    }
    return rows;
  }

  function calculateScore(s, f) {
    var life = playerLife() || {};
    var revenueScore = clamp(s.cycle.revenue / Math.max(1, s.cycle.targetRevenue) * 55, 0, 70);
    var tradeScore = clamp(s.cycle.trades / Math.max(1, s.cycle.targetTrades) * 18, 0, 22);
    var riskScore = (life.leverage || 0) <= f.riskLimit ? 15 : Math.max(0, 15 - ((life.leverage || 0) - f.riskLimit) * 8);
    var complianceScore = clamp(12 - (life.legalPressure || 0) * (f.ethics / 100) * 0.12, -10, 12);
    s.cycle.score = round(clamp(revenueScore + tradeScore + riskScore + complianceScore, 0, 120), 1);
    return s.cycle.score;
  }

  function weeklyEmployment(s) {
    var g = getGame();
    var f = firm(s.employerId);
    if (!g || !f || !s.contract) return;
    var delta = currentTradeDeltas();
    var revenue = delta.volume * f.feeRate + Math.max(0, delta.profit) * 0.12;
    s.cycle.revenue += revenue;
    s.cycle.trades += delta.trades;
    s.cycle.volume += delta.volume;
    s.cycle.profit += delta.profit;
    s.cycle.weeks += 1;
    var bonus = revenue * s.contract.commission;
    g.cash += s.contract.salary + bonus;
    calculateScore(s, f);
    simulateColleagues(s, f);
    rankDesk(s);
    maybeOfficePolitics(s, f);
    if (s.cycle.weeks >= s.contract.reviewEvery) reviewCycle(s, f);
  }

  function maybeOfficePolitics(s, f) {
    if (s.pendingDilemma) return;
    var dangerous = s.colleagues.filter(function (c) { return c.politics > 70 || c.ethics < 35; });
    if (s.misconduct.evidence > 0 && dangerous.length && Math.random() < 0.08 + s.misconduct.evidence * 0.025) {
      var rival = pick(dangerous);
      s.pendingDilemma = { type: 'blackmail', rivalId: rival.id, rivalName: rival.name, amount: 1200 + s.misconduct.evidence * 650, text: rival.name + ' ha trovato prove delle tue operazioni irregolari e pretende denaro per restare in silenzio.' };
      addIncident('blackmail', 'Ricatto nel desk', s.pendingDilemma.text);
      adjustLife({ stress: 12, legalPressure: 3 }, 'Un collega possiede prove compromettenti');
      enrichDilemma(s.pendingDilemma);
      notify('warning', 'Ricatto: apri la schermata Società');
    } else if (dangerous.length && Math.random() < 0.055) {
      var saboteur = pick(dangerous);
      var damage = s.cycle.revenue * 0.08;
      s.cycle.revenue = Math.max(0, s.cycle.revenue - damage);
      saboteur.cycleRevenue += damage;
      saboteur.lastMove = 'Ti sottrae un cliente e rivendica il ricavo.';
      addIncident('competition', saboteur.name + ' ti sottrae un cliente', 'Il rivale sposta ' + money(damage) + ' di ricavi sul proprio book.');
    }
  }

  function reviewCycle(s, f) {
    var g = getGame();
    calculateScore(s, f);
    var rows = rankDesk(s);
    var score = s.cycle.score;
    var passed = score >= 68;
    if (passed) {
      s.goodCycles += 1; s.missedCycles = 0;
      s.employerTrust = clamp(s.employerTrust + (score >= 95 ? 12 : 6), 0, 100);
      s.careerReputation = clamp(s.careerReputation + (s.cycle.rank <= 2 ? 7 : 3), 0, 100);
      addIncident('review', 'Obiettivo raggiunto', 'Valutazione ' + score + '/100, posizione ' + s.cycle.rank + ' su ' + rows.length + '.');
      fallbackEmployerMessage('review_good');
      if (s.goodCycles >= 2 && s.roleLevel < 4) promote(s, f);
      maybeGenerateOffers(s, f);
    } else {
      s.missedCycles += 1; s.goodCycles = 0;
      s.employerTrust = clamp(s.employerTrust - 14, 0, 100);
      s.careerReputation = clamp(s.careerReputation - 5, 0, 100);
      addIncident('review', 'Obiettivo mancato', 'Valutazione ' + score + '/100. La direzione pretende risultati nel prossimo ciclo.');
      fallbackEmployerMessage('review_bad');
      adjustLife({ stress: 10, credibility: -4 }, 'Valutazione negativa del datore di lavoro');
      if (s.missedCycles >= 2 || s.employerTrust <= 8) firePlayer(s, f, 'Due valutazioni insufficienti');
    }
    s.history.unshift({ week: g.week, action: passed ? 'Valutazione positiva' : 'Valutazione negativa', firm: f.name, score: score, rank: s.cycle.rank });
    s.cycle = createCycle(f);
    for (var i = 0; i < s.colleagues.length; i++) { s.colleagues[i].cycleRevenue = 0; s.colleagues[i].score = 0; }
  }

  function promote(s, f) {
    s.roleLevel += 1;
    s.contract.roleLevel = s.roleLevel;
    s.contract.role = ROLES[s.roleLevel];
    s.contract.salary = Math.round(s.contract.salary * 1.28);
    s.contract.commission = round(s.contract.commission + 0.018, 3);
    s.goodCycles = 0;
    s.employerTrust = clamp(s.employerTrust + 10, 0, 100);
    addIncident('promotion', 'Promozione a ' + s.contract.role, 'Nuovo stipendio: ' + money(s.contract.salary) + ' a settimana.');
    addNews(f.name + ' promuove ' + ((brokerStory() && brokerStory().name) || 'il broker'), 'La crescita interna aumenta influenza, stipendio e aspettative.', 'positive');
    fallbackEmployerMessage('promotion');
    notify('success', 'PROMOZIONE: ' + s.contract.role);
  }

  function firePlayer(s, f, reason) {
    s.history.unshift({ week: getGame().week, action: 'Licenziamento', firm: f.name, role: s.contract ? s.contract.role : '' });
    s.status = 'unemployed'; s.employerId = null; s.contract = null; s.colleagues = []; s.weeksUnemployed = 0;
    s.employerTrust = 0; s.missedCycles = 0;
    addIncident('fired', 'Licenziato da ' + f.name, reason + '. Il badge viene disattivato prima della chiusura dei mercati.');
    addNews(f.name + ' licenzia un broker', reason + '. La notizia circola tra i recruiter del distretto.', 'negative');
    adjustLife({ stress: 18, credibility: -10 }, 'Licenziamento');
    notify('error', 'LICENZIATO da ' + f.name);
  }

  function maybeGenerateOffers(s, current) {
    if (s.careerReputation < 30 || s.cycle.rank > 3) return;
    for (var i = 0; i < FIRMS.length; i++) {
      var f = FIRMS[i];
      if (f.id === current.id) continue;
      if (Math.random() < 0.16 + s.careerReputation / 500) {
        var c = contractFor(f, true);
        s.offers.unshift({ firmId: f.id, week: getGame().week, expires: getGame().week + 6, role: c.role, salary: c.salary, commission: c.commission, signingBonus: c.signingBonus });
        s.offers = s.offers.filter(function (o, idx, arr) { return arr.findIndex(function (x) { return x.firmId === o.firmId; }) === idx; }).slice(0, 5);
        addIncident('offer', 'Offerta da ' + f.name, c.role + ', stipendio ' + money(c.salary) + '.');
        break;
      }
    }
  }

  function weeklyUnemployed(s) {
    s.weeksUnemployed += 1;
    if (s.weeksUnemployed > 3) adjustLife({ stress: 3, credibility: -0.8 }, 'Disoccupazione prolungata');
    s.offers = s.offers.filter(function (o) { return o.expires >= getGame().week; });
  }

  function simulateFirmLeague(s) {
    if (!(s.marketLeague instanceof Array)) s.marketLeague = createLeague();
    for (var i = 0; i < s.marketLeague.length; i++) {
      var row = s.marketLeague[i];
      var f = firm(row.firmId);
      if (!f) continue;
      var momentum = 0.72 + Math.random() * 0.7 + row.reputation / 260;
      row.weeklyRevenue = round((f.targetRevenue / 4) * momentum * 5, 0);
      row.totalRevenue += row.weeklyRevenue;
      row.reputation = round(clamp(row.reputation + (Math.random() - 0.47) * 1.5, 10, 100), 1);
    }
    var rows = s.marketLeague.slice();
    if (s.status === 'owner' && s.ownFirm) rows.push({ firmId: 'player_firm', name: s.ownFirm.name, weeklyRevenue: s.ownFirm.weeklyRevenue, totalRevenue: s.ownFirm.totalProfit, reputation: s.ownFirm.reputation, player: true, rank: 0 });
    rows.sort(function (a, b) { return b.weeklyRevenue - a.weeklyRevenue; });
    for (var j = 0; j < rows.length; j++) rows[j].rank = j + 1;
    s.leagueSnapshot = rows;
    if (s.status === 'owner' && s.ownFirm) {
      for (var k = 0; k < rows.length; k++) if (rows[k].player) s.ownFirm.marketRank = rows[k].rank;
    }
  }

  function foundOwnFirm() {
    var g = getGame();
    var s = ensureState();
    var cost = 75000;
    var exitCost = s.status === 'employed' && s.contract ? s.contract.noticeCost : 0;
    if (!g || !s || s.status === 'owner') return false;
    if (s.careerReputation < 65 || s.careerWeeks < 20 || g.cash < cost + exitCost) {
      notify('error', 'Servono reputazione 65, 20 settimane di esperienza e ' + money(cost + exitCost) + ' inclusa l’uscita dal contratto');
      return false;
    }
    g.cash -= cost + exitCost;
    var name = ((brokerStory() && brokerStory().name) || 'Wolf').split(' ')[0] + ' Securities';
    s.status = 'owner'; s.employerId = null; s.contract = null; s.colleagues = [];
    s.ownFirm = { name: name, cash: cost, clients: 4, clientAssets: 500000, reputation: 35, compliance: 55, staff: [], weeklyRevenue: 0, weeklyCosts: 0, totalProfit: 0, insolvencyWeeks: 0, foundedWeek: g.week };
    s.history.unshift({ week: g.week, action: 'Fondazione', firm: name, role: 'Fondatore' });
    addIncident('founder', 'Nasce ' + name, 'Capitale iniziale ' + money(cost) + (exitCost ? ' e preavviso ' + money(exitCost) : '') + '. Ora ogni stipendio, costo, cliente e multa ricade su di te.');
    addNews('Apre ' + name, 'Un nuovo intermediario entra nel mercato con quattro clienti e mezzo milione di masse.', 'positive');
    fallbackEmployerMessage('owner');
    notify('success', 'Hai fondato ' + name);
    render();
    return true;
  }

  function weeklyOwnFirm(s) {
    var g = getGame();
    var o = s.ownFirm;
    if (!g || !o) return;
    var delta = currentTradeDeltas();
    var tradingFees = delta.volume * 0.0024;
    var managementFees = o.clientAssets * 0.00055;
    var performanceFees = Math.max(0, delta.profit) * 0.1;
    var staffRevenue = 0;
    var payroll = 0;
    for (var i = 0; i < o.staff.length; i++) {
      var emp = o.staff[i];
      var production = emp.skill * (18 + Math.random() * 14) * (0.7 + o.reputation / 180);
      emp.lastRevenue = production;
      staffRevenue += production;
      payroll += emp.salary;
    }
    var fixed = 1750 + 480 + 320 + o.clients * 45;
    if (o.compliance < 35) fixed *= 0.82;
    var revenue = tradingFees + managementFees + performanceFees + staffRevenue;
    var costs = fixed + payroll;
    var profit = revenue - costs;
    o.weeklyRevenue = round(revenue, 2); o.weeklyCosts = round(costs, 2); o.cash += profit; o.totalProfit += profit;
    var life = playerLife() || {};
    var clientChange = (o.reputation + s.careerReputation + (life.credibility || 50) - (life.legalPressure || 0)) / 240;
    if (Math.random() < clientChange * 0.12) { o.clients += 1; o.clientAssets += 70000 + Math.random() * 180000; addIncident('client', 'Nuovo cliente', 'Le masse gestite crescono grazie alla reputazione della società.'); }
    if ((life.legalPressure || 0) > 75 && Math.random() < 0.12) { o.clients = Math.max(0, o.clients - 1); o.clientAssets *= 0.9; addIncident('client', 'Un cliente ritira i fondi', 'La pressione legale rende il marchio troppo rischioso.'); }
    if (o.cash > 20000) { var salary = Math.min(900 + s.roleLevel * 150, o.cash * 0.04); o.cash -= salary; g.cash += salary; }
    if (o.cash < 0) o.insolvencyWeeks += 1; else o.insolvencyWeeks = 0;
    if (o.insolvencyWeeks >= 2) closeOwnFirm(s);
    maybeRegulatoryAudit(s);
  }

  function closeOwnFirm(s) {
    var o = s.ownFirm;
    s.history.unshift({ week: getGame().week, action: 'Chiusura', firm: o.name, role: 'Fondatore' });
    addIncident('collapse', o.name + ' chiude', 'Due settimane senza liquidità costringono la società alla cessazione.');
    addNews(o.name + ' cessa l’attività', 'Clienti e dipendenti cercano una nuova casa. Il fondatore torna sul mercato del lavoro.', 'negative');
    s.status = 'unemployed'; s.ownFirm = null; s.careerReputation = clamp(s.careerReputation - 18, 0, 100); s.weeksUnemployed = 0;
    adjustLife({ stress: 20, credibility: -18, legalPressure: 3 }, 'Fallimento della propria società');
  }

  function hireBroker() {
    var s = ensureState(); var o = s && s.ownFirm; if (!o) return false;
    if (o.cash < 3500) { notify('error', 'Liquidità societaria insufficiente'); return false; }
    var idx = o.staff.length + 3;
    var emp = { id: 'staff_' + getGame().week + '_' + idx, name: FIRST_NAMES[idx % FIRST_NAMES.length] + ' ' + LAST_NAMES[(idx * 3) % LAST_NAMES.length], skill: 48 + Math.floor(Math.random() * 38), ethics: 35 + Math.floor(Math.random() * 60), salary: 620 + Math.floor(Math.random() * 480), lastRevenue: 0 };
    o.cash -= 2500; o.staff.push(emp);
    addIncident('staff', 'Assunto ' + emp.name, 'Stipendio ' + money(emp.salary) + ' a settimana.');
    render(); return true;
  }

  function investFirm(type) {
    var s = ensureState(); var o = s && s.ownFirm; if (!o) return false;
    var cost = type === 'compliance' ? 6000 : 5000;
    if (o.cash < cost) { notify('error', 'Liquidità societaria insufficiente'); return false; }
    o.cash -= cost;
    if (type === 'compliance') { o.compliance = clamp(o.compliance + 16, 0, 100); adjustLife({ legalPressure: -5 }, 'Investimento in compliance'); addIncident('investment', 'Compliance rafforzata', 'Procedure, controlli e consulenti riducono il rischio normativo.'); }
    else { o.reputation = clamp(o.reputation + 10, 0, 100); addIncident('investment', 'Campagna commerciale', 'Il marchio cerca nuovi clienti con una campagna da ' + money(cost) + '.'); }
    render(); return true;
  }

  function injectCapital() {
    var g = getGame(); var s = ensureState(); var o = s && s.ownFirm; if (!g || !o || g.cash < 10000) return false;
    g.cash -= 10000; o.cash += 10000; addIncident('capital', 'Aumento di capitale', 'Hai trasferito ' + money(10000) + ' personali alla società.'); render(); return true;
  }

  function withdrawDividend() {
    var g = getGame(); var s = ensureState(); var o = s && s.ownFirm; if (!g || !o || o.cash < 30000) return false;
    o.cash -= 5000; g.cash += 5000; addIncident('capital', 'Dividendo del fondatore', 'Hai prelevato ' + money(5000) + ' mantenendo la riserva minima.'); render(); return true;
  }

  function dirtyAction(type) {
    var g = getGame(); var s = ensureState(); if (!g || !s || (s.status !== 'employed' && s.status !== 'owner')) return false;
    var revenueTarget = s.status === 'owner' && s.ownFirm ? s.ownFirm : s.cycle;
    if (type === 'insider') {
      if (g.cash < 1500) return false;
      g.cash -= 1500; revenueTarget.revenue = (revenueTarget.revenue || 0) + 8000; if (s.ownFirm) s.ownFirm.cash += 8000;
      s.misconduct.insider += 1; s.misconduct.evidence += 1;
      adjustLife({ stress: 5, legalPressure: 13, credibility: 2 }, 'Soffiata riservata acquistata');
      adjustStory({ ethics: -9, ambition: 5, nerve: 3, inspector: 5 }, 'Hai comprato informazioni privilegiate per battere il desk.');
      addIncident('misconduct', 'Soffiata privilegiata', 'Costo ' + money(1500) + ', ricavo occulto ' + money(8000) + '. Le prove aumentano.');
    } else if (type === 'falsify') {
      revenueTarget.revenue = (revenueTarget.revenue || 0) + 12000; if (s.ownFirm) s.ownFirm.cash += 6000;
      s.misconduct.falsified += 1; s.misconduct.evidence += 2;
      adjustLife({ stress: 9, legalPressure: 18, credibility: 3 }, 'Ricavi falsificati');
      adjustStory({ ethics: -14, nerve: 5, inspector: 8 }, 'Hai spostato ricavi e date nei report del desk.');
      addIncident('misconduct', 'Report falsificato', 'Il risultato trimestrale migliora, ma revisori e rivali possono ricostruire le date.');
    } else if (type === 'blackmail') {
      if (!s.colleagues.length || g.cash < 1000) return false;
      var rival = s.colleagues.slice().sort(function (a, b) { return a.rank - b.rank; })[0];
      g.cash -= 1000; rival.cycleRevenue *= 0.72; rival.relationship -= 25;
      s.misconduct.blackmail += 1; s.misconduct.evidence += 2;
      adjustLife({ stress: 7, legalPressure: 20, credibility: -2 }, 'Ricatto contro un collega');
      adjustStory({ ethics: -18, ambition: 8, victor: 5, inspector: 8 }, 'Hai costretto un rivale a cedere clienti e restare in silenzio.');
      addIncident('misconduct', 'Rivale ricattato', rival.name + ' perde parte del book, ma ora ha un motivo personale per distruggerti.');
    }
    maybeRegulatoryAudit(s);
    render(); return true;
  }

  function maybeRegulatoryAudit(s) {
    if (!s || s.misconduct.evidence <= 0) return;
    var o = s.ownFirm;
    var complianceProtection = o ? o.compliance / 500 : 0;
    var chance = 0.025 + s.misconduct.evidence * 0.018 - complianceProtection;
    if (Math.random() >= clamp(chance, 0.01, 0.38)) return;
    var fine = 3500 + s.misconduct.evidence * 1800;
    var g = getGame();
    if (o) o.cash -= fine; else g.cash -= fine;
    s.employerTrust = clamp(s.employerTrust - 30, 0, 100);
    s.careerReputation = clamp(s.careerReputation - 12, 0, 100);
    adjustLife({ legalPressure: 18, credibility: -14, stress: 14 }, 'Audit per operazioni irregolari');
    addIncident('audit', 'Audit e multa', 'Le anomalie producono una sanzione di ' + money(fine) + '. Parte delle prove entra nel fascicolo.');
    fallbackEmployerMessage('audit');
    addNews('Controlli sul desk di ' + ((brokerStory() && brokerStory().name) || 'un broker'), 'Revisori e autorità contestano ordini, date e ricavi. Multa: ' + money(fine) + '.', 'negative');
    if (s.status === 'employed' && s.employerTrust <= 10) firePlayer(s, firm(s.employerId), 'Violazione delle regole interne');
  }

  function resolveDilemma(choice) {
    var g = getGame(); var s = ensureState(); var d = s && s.pendingDilemma; if (!g || !d) return false;
    var rival = null; for (var i = 0; i < s.colleagues.length; i++) if (s.colleagues[i].id === d.rivalId) rival = s.colleagues[i];
    if (choice === 'pay') {
      if (g.cash < d.amount) { notify('error', 'Non hai abbastanza liquidità'); return false; }
      g.cash -= d.amount; if (rival) rival.relationship += 4;
      adjustLife({ stress: -4, legalPressure: 2 }, 'Pagamento di un ricatto');
      adjustStory({ ethics: -5, nerve: -3 }, 'Hai pagato un collega perché tacesse.');
      addIncident('blackmail', 'Ricatto pagato', 'Hai consegnato ' + money(d.amount) + '. Il silenzio non è una garanzia.');
    } else if (choice === 'refuse') {
      if (rival) rival.relationship -= 30;
      s.misconduct.evidence += 1;
      adjustLife({ stress: 8, legalPressure: 9, credibility: -3 }, 'Ricatto rifiutato');
      adjustStory({ nerve: 8, ethics: 2, inspector: 5 }, 'Hai rifiutato di pagare, accettando il rischio che le prove escano.');
      addIncident('blackmail', 'Ricatto rifiutato', 'Il rivale conserva le prove e prepara la prossima mossa.');
    } else if (choice === 'expose') {
      s.misconduct.evidence = Math.max(0, s.misconduct.evidence - 1);
      if (rival) rival.status = 'fired';
      adjustLife({ stress: 4, legalPressure: 6, credibility: 8 }, 'Denuncia interna');
      adjustStory({ ethics: 12, loyalty: -5, inspector: 8 }, 'Hai denunciato il ricatto consegnando anche parte della verità su di te.');
      addIncident('blackmail', 'Ricattatore denunciato', 'Il collega viene sospeso. L’indagine interna ora conosce una parte dei fatti.');
    }
    s.pendingDilemma = null; render(); return true;
  }

  function enrichDilemma(d) {
    if (!global.LLMGameMaster || !global.LLMGameMaster.generateDialogue || !global.LLMGameMaster.isAvailable || !global.LLMGameMaster.isAvailable()) return;
    global.LLMGameMaster.generateDialogue({ name: d.rivalName, role: 'Broker rivale' }, d.text + ' Profilo carriera: ' + JSON.stringify(getContext()) + '. Scrivi una minaccia breve, senza cambiare importi o fatti.', { week: getGame().week, year: getGame().year || 1987, level: getGame().level || 0, reputation: ensureState().careerReputation, netWorth: worth() }).then(function (result) { if (ensureState().pendingDilemma === d && result && result.text) { d.flavor = safe(result.text, 350); render(); } }).catch(function () {});
  }

  function processWeek() {
    var s = ensureState();
    if (!s || (global.PlayerLife && global.PlayerLife.canAct && !global.PlayerLife.canAct())) return;
    s.careerWeeks += 1;
    if (s.status === 'unemployed') weeklyUnemployed(s);
    else if (s.status === 'employed') weeklyEmployment(s);
    else if (s.status === 'owner') weeklyOwnFirm(s);
    simulateFirmLeague(s);
    s.offers = s.offers.filter(function (o) { return o.expires >= getGame().week; });
    render();
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
  }

  function canTrade() {
    var s = ensureState();
    if (!s) return true; // se lo stato carriera non esiste, permetti
    return !!(s.status === 'employed' || s.status === 'owner');
  }

  function getContext() {
    var s = ensureState(); if (!s) return null;
    var f = firm(s.employerId);
    return {
      status: s.status,
      employer: f ? f.name : null,
      role: s.contract ? s.contract.role : (s.status === 'owner' ? 'Fondatore' : 'Disoccupato'),
      careerReputation: s.careerReputation,
      employerTrust: s.employerTrust,
      currentScore: s.cycle ? s.cycle.score : 0,
      currentRank: s.cycle ? s.cycle.rank : 0,
      offers: s.offers,
      misconduct: s.misconduct,
      employerMood: s.employerMood || 'neutrale',
      employerAgenda: s.employerAgenda || '',
      messages: s.messages ? s.messages.slice(0, 5) : [],
      recentIncidents: s.incidents ? s.incidents.slice(0, 5) : [],
      employerProfile: f ? { id: f.id, name: f.name, style: f.style, culture: f.culture, ethics: f.ethics, targetRevenue: f.targetRevenue, targetTrades: f.targetTrades, riskLimit: f.riskLimit } : null,
      pendingDilemma: s.pendingDilemma ? { type: s.pendingDilemma.type, rivalName: s.pendingDilemma.rivalName } : null,
      ownFirm: s.ownFirm ? { name: s.ownFirm.name, cash: round(s.ownFirm.cash, 0), clients: s.ownFirm.clients, clientAssets: round(s.ownFirm.clientAssets, 0), reputation: s.ownFirm.reputation, compliance: s.ownFirm.compliance, staff: s.ownFirm.staff.length, weeklyRevenue: round(s.ownFirm.weeklyRevenue, 0), weeklyCosts: round(s.ownFirm.weeklyCosts, 0) } : null
    };
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('brokerage-career-style')) {
      var style = document.createElement('style');
      style.id = 'brokerage-career-style';
      style.textContent = '.brokerage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}.brokerage-firm{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:11px}.brokerage-rank{display:grid;grid-template-columns:32px 1fr 75px;gap:7px;padding:6px;border-bottom:1px solid var(--border);font-size:11px}.brokerage-rank.player{background:rgba(212,175,55,.12);color:#f4d889}.career-progress{height:7px;background:var(--bg4);border-radius:8px;overflow:hidden}.career-progress span{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--green))}#brokerage-job-modal{position:fixed;inset:0;z-index:11000;background:rgba(2,4,8,.96);display:none;align-items:center;justify-content:center;padding:16px}.brokerage-job-shell{width:min(1050px,100%);max-height:94vh;overflow:auto;background:var(--bg2);border:1px solid rgba(212,175,55,.5);border-radius:14px;padding:clamp(18px,4vw,36px)}@media(max-width:640px){.brokerage-grid{grid-template-columns:1fr}.brokerage-job-shell{height:100%;max-height:100vh;border-radius:0}}';
      document.head.appendChild(style);
    }
    if (!document.getElementById('view-brokerage')) {
      var main = document.querySelector('.main');
      if (main) {
        var view = document.createElement('div');
        view.className = 'view'; view.id = 'view-brokerage';
        view.innerHTML = '<div class="card"><h2>Società di Brokeraggio</h2><div id="brokerage-career-content"></div></div><div class="card"><h3>Competizione interna</h3><div id="brokerage-ranking"></div></div><div class="card"><h3>Offerte, politica e operazioni</h3><div id="brokerage-actions"></div></div>';
        main.appendChild(view);
      }
    }
    var nav = document.querySelector('.nav');
    if (nav && !nav.querySelector('[data-view="brokerage"]')) {
      var btn = document.createElement('button'); btn.setAttribute('data-view', 'brokerage'); btn.textContent = 'Società'; btn.onclick = function () { if (typeof switchView === 'function') switchView('brokerage'); }; nav.insertBefore(btn, nav.querySelector('[data-view="career"]'));
    }
    var dashboard = document.getElementById('view-dashboard');
    if (dashboard && !document.getElementById('brokerage-status-card')) {
      var card = document.createElement('div'); card.id = 'brokerage-status-card'; card.className = 'card'; card.innerHTML = '<h3>🏦 Carriera nel brokeraggio</h3><div id="brokerage-status-content"></div>'; dashboard.insertBefore(card, dashboard.firstChild);
    }
    if (!document.getElementById('brokerage-job-modal')) {
      var modal = document.createElement('div'); modal.id = 'brokerage-job-modal'; modal.innerHTML = '<div class="brokerage-job-shell" id="brokerage-job-body"></div>'; document.body.appendChild(modal);
    }
  }

  function firmCards() {
    var html = '<div class="brokerage-grid">';
    for (var i = 0; i < FIRMS.length; i++) {
      var f = FIRMS[i];
      html += '<div class="brokerage-firm" style="border-top:3px solid ' + f.color + '"><div style="font-weight:800">' + f.name + '</div><div style="font-size:10px;color:' + f.color + ';margin:3px 0">' + f.style + '</div><div class="gray" style="font-size:10px;line-height:1.45">' + f.culture + '</div><div style="font-size:10px;margin-top:7px">Stipendio ' + money(f.salary) + '/sett. · Commissione ' + Math.round(f.commission * 100) + '%<br>Target 4 settimane: ' + money(f.targetRevenue) + ' e ' + f.targetTrades + ' operazioni</div><button class="btn btn-sm btn-blue" style="margin-top:8px" onclick="BrokerageCareer.join(\'' + f.id + '\')">Firma il contratto</button></div>';
    }
    return html + '</div>';
  }

  function showJobModal() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var s = ensureState(); if (!s || s.status !== 'unemployed') return;
    var body = document.getElementById('brokerage-job-body'); var modal = document.getElementById('brokerage-job-modal');
    if (body) body.innerHTML = '<div style="font-size:11px;letter-spacing:3px;color:#d4af37;font-weight:800">DISOCCUPATO · PRIMO GIORNO</div><h1 style="font-size:clamp(28px,5vw,48px);margin:8px 0">Nessuna scrivania porta ancora il tuo nome</h1><p class="gray" style="line-height:1.6;margin-bottom:16px">Sei fuori dal mercato professionale. Scegli una delle sei società: ognuna paga, pretende e perdona in modo diverso. I broker del desk non saranno comparse; lotteranno per bonus, clienti e promozioni.</p>' + firmCards();
    if (modal) modal.style.display = 'flex';
  }
  function hideJobModal() { if (typeof document === 'undefined') return; var m = document.getElementById('brokerage-job-modal'); if (m) m.style.display = 'none'; }

  function renderRanking(s) {
    var el = document.getElementById('brokerage-ranking'); if (!el) return;
    if (s.status === 'owner') {
      var league = s.leagueSnapshot || s.marketLeague || [];
      var lhtml = '<div class="gray" style="font-size:10px;margin-bottom:6px">Classifica settimanale delle società per ricavi prodotti</div>';
      for (var li = 0; li < league.length; li++) lhtml += '<div class="brokerage-rank' + (league[li].player ? ' player' : '') + '"><span>#' + (league[li].rank || li + 1) + '</span><strong>' + safe(league[li].name, 70) + '</strong><span style="text-align:right">' + money(league[li].weeklyRevenue) + '</span></div>';
      el.innerHTML = lhtml; return;
    }
    if (s.status !== 'employed') { el.innerHTML = '<div class="gray" style="font-size:11px">La classifica interna appare dopo l’assunzione.</div>'; return; }
    var rows = rankDesk(s); var html = '';
    for (var i = 0; i < rows.length; i++) html += '<div class="brokerage-rank' + (rows[i].player ? ' player' : '') + '"><span>#' + rows[i].rank + '</span><strong>' + safe(rows[i].name, 60) + '</strong><span style="text-align:right">' + round(rows[i].score, 1) + ' pt</span></div>';
    el.innerHTML = html;
  }

  function renderActions(s) {
    var el = document.getElementById('brokerage-actions'); if (!el) return;
    var html = '';
    if (s.messages && s.messages.length) {
      var msg = s.messages[0];
      var speakerName = s.status === 'owner' && s.ownFirm ? s.ownFirm.name : (firm(s.employerId) ? firm(s.employerId).name : 'Direzione');
      var speakerId = 'firm:' + speakerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      html += '<div style="padding:10px;border-left:3px solid var(--blue);background:rgba(59,130,246,.08);margin-bottom:10px"><strong>Voce della società</strong><div class="gray" style="font-size:11px;margin:5px 0"><strong>' + safe(msg.title, 90) + '</strong> · mood ' + safe(msg.mood, 20) + '</div><div style="font-size:11px;line-height:1.5">' + safe(msg.text, 420) + '</div><div style="margin-top:6px"><button class="btn btn-sm btn-blue" onclick="openCharacterModal(\'' + speakerId + '\')">Apri nel Diario</button>' + (msg.asksMeeting ? ' <span class="pill y">Vuole parlarti</span>' : '') + '</div></div>';
    }
    if (s.pendingDilemma) {
      var d = s.pendingDilemma;
      html += '<div style="padding:10px;border-left:3px solid var(--red);background:rgba(255,83,113,.08);margin-bottom:10px"><strong>Ricatto di ' + safe(d.rivalName, 70) + '</strong><div class="gray" style="font-size:11px;margin:5px 0">' + safe(d.flavor || d.text, 350) + '</div><button class="btn btn-sm" onclick="BrokerageCareer.resolveDilemma(\'pay\')">Paga ' + money(d.amount) + '</button> <button class="btn btn-sm btn-red" onclick="BrokerageCareer.resolveDilemma(\'refuse\')">Rifiuta</button> <button class="btn btn-sm btn-blue" onclick="BrokerageCareer.resolveDilemma(\'expose\')">Denuncia tutto</button></div>';
    }
    if (s.offers.length) {
      html += '<strong style="font-size:11px">Offerte ricevute</strong><div class="brokerage-grid" style="margin-top:6px">';
      for (var i = 0; i < s.offers.length; i++) { var o = s.offers[i]; var f = firm(o.firmId); html += '<div class="brokerage-firm"><strong>' + f.name + '</strong><div class="gray" style="font-size:10px">' + o.role + ' · ' + money(o.salary) + '/sett. · bonus ' + Math.round(o.commission * 100) + '%</div><button class="btn btn-sm btn-blue" style="margin-top:6px" onclick="BrokerageCareer.acceptOffer(\'' + f.id + '\')">Accetta</button></div>'; }
      html += '</div>';
    }
    if (s.status === 'employed' || s.status === 'owner') {
      html += '<div style="margin-top:12px"><strong style="font-size:11px">Scorciatoie illegali</strong><div class="gray" style="font-size:10px;margin:3px 0 6px">Aumentano ricavi o posizione, ma lasciano prove, alimentano ricatti, audit e pressione legale.</div><button class="btn btn-sm" onclick="BrokerageCareer.dirtyAction(\'insider\')">Compra soffiata (' + money(1500) + ')</button> <button class="btn btn-sm" onclick="BrokerageCareer.dirtyAction(\'falsify\')">Falsifica report</button>' + (s.status === 'employed' ? ' <button class="btn btn-sm btn-red" onclick="BrokerageCareer.dirtyAction(\'blackmail\')">Ricatta il primo</button>' : '') + '</div>';
    }
    if (s.status === 'employed') html += '<div style="margin-top:12px"><button class="btn btn-sm" onclick="BrokerageCareer.resign()">Dimettiti</button></div>';
    if (s.status !== 'owner') html += '<div style="margin-top:12px;padding:9px;background:var(--bg3);border-radius:6px"><strong>Apri la tua società</strong><div class="gray" style="font-size:10px;margin:3px 0 7px">Richiede reputazione 65, 20 settimane di esperienza e ' + money(75000) + '.</div><button class="btn btn-sm btn-green" onclick="BrokerageCareer.foundFirm()">Fonda la società</button></div>';
    el.innerHTML = html || '<div class="gray" style="font-size:11px">Nessuna offerta o decisione disponibile.</div>';
  }

  function renderOwner(s) {
    var o = s.ownFirm;
    var html = '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><strong style="font-size:17px">' + safe(o.name, 80) + '</strong><div class="gray" style="font-size:10px">Fondata nella settimana ' + o.foundedWeek + ' · ' + o.staff.length + ' broker · ' + o.clients + ' clienti</div></div><span class="pill y">FONDATORE</span></div>';
    html += '<div class="brokerage-grid" style="margin-top:10px"><div class="brokerage-firm"><div class="gray" style="font-size:10px">Cassa società</div><strong>' + money(o.cash) + '</strong></div><div class="brokerage-firm"><div class="gray" style="font-size:10px">Masse clienti</div><strong>' + money(o.clientAssets) + '</strong></div><div class="brokerage-firm"><div class="gray" style="font-size:10px">Ricavi / costi settimana</div><strong class="green">' + money(o.weeklyRevenue) + '</strong> / <strong class="red">' + money(o.weeklyCosts) + '</strong></div><div class="brokerage-firm"><div class="gray" style="font-size:10px">Reputazione / compliance</div><strong>' + Math.round(o.reputation) + ' / ' + Math.round(o.compliance) + '</strong></div></div>';
    html += '<div style="margin-top:10px"><button class="btn btn-sm btn-green" onclick="BrokerageCareer.hireBroker()">Assumi broker</button> <button class="btn btn-sm" onclick="BrokerageCareer.investFirm(\'marketing\')">Marketing ' + money(5000) + '</button> <button class="btn btn-sm btn-blue" onclick="BrokerageCareer.investFirm(\'compliance\')">Compliance ' + money(6000) + '</button> <button class="btn btn-sm" onclick="BrokerageCareer.injectCapital()">Versa ' + money(10000) + '</button> <button class="btn btn-sm" onclick="BrokerageCareer.withdrawDividend()">Preleva ' + money(5000) + '</button></div>';
    return html;
  }

  function render() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var s = ensureState(); if (!s) return;
    var f = firm(s.employerId);
    var content = document.getElementById('brokerage-career-content');
    if (content) {
      if (s.status === 'unemployed') content.innerHTML = '<div style="padding:10px;border-left:3px solid var(--yellow)"><strong>Disoccupato</strong><div class="gray" style="font-size:11px;margin:4px 0">Senza un intermediario non puoi operare. Ogni settimana senza lavoro aumenta pressione personale e riduce credibilità.</div><button class="btn btn-sm btn-blue" onclick="BrokerageCareer.showJobs()">Apri le candidature</button></div>';
      else if (s.status === 'owner') content.innerHTML = renderOwner(s);
      else content.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><strong style="font-size:17px">' + f.name + '</strong><div class="gray" style="font-size:10px">' + s.contract.role + ' · ' + money(s.contract.salary) + '/sett. · commissione ' + Math.round(s.contract.commission * 100) + '%</div></div><span class="pill b">Fiducia ' + Math.round(s.employerTrust) + '</span></div><div style="margin-top:11px"><div style="display:flex;justify-content:space-between;font-size:10px"><span>Valutazione ciclo</span><span>' + round(s.cycle.score, 1) + '/100 · rank #' + (s.cycle.rank || '-') + '</span></div><div class="career-progress"><span style="width:' + clamp(s.cycle.score, 0, 100) + '%"></span></div><div class="gray" style="font-size:10px;margin-top:5px">Ricavi ' + money(s.cycle.revenue) + '/' + money(s.cycle.targetRevenue) + ' · Operazioni ' + s.cycle.trades + '/' + s.cycle.targetTrades + ' · Revisione tra ' + Math.max(0, s.contract.reviewEvery - s.cycle.weeks) + ' settimane</div></div>';
    }
    renderRanking(s); renderActions(s);
    var status = document.getElementById('brokerage-status-content');
    if (status) status.innerHTML = s.status === 'unemployed' ? '<div><strong>Disoccupato</strong><span class="pill y" style="margin-left:6px">' + s.weeksUnemployed + ' settimane</span><div class="gray" style="font-size:10px;margin-top:4px">Trova un datore per accedere al mercato professionale.</div></div>' : (s.status === 'owner' ? '<div><strong>' + safe(s.ownFirm.name, 70) + '</strong><span class="pill y" style="margin-left:6px">PROPRIETARIO</span><div class="gray" style="font-size:10px;margin-top:4px">Cassa ' + money(s.ownFirm.cash) + ' · ' + s.ownFirm.clients + ' clienti · ' + s.ownFirm.staff.length + ' broker</div></div>' : '<div><strong>' + f.name + '</strong><span class="pill b" style="margin-left:6px">' + safe(s.contract.role, 40) + '</span><div class="gray" style="font-size:10px;margin-top:4px">Rank #' + (s.cycle.rank || '-') + ' · score ' + round(s.cycle.score, 1) + ' · reputazione carriera ' + Math.round(s.careerReputation) + '</div></div>');
  }

  function install() {
    if (installed) return;
    installed = true;
    ensureState(); ensureUI();
    if (typeof advanceTurn === 'function') {
      originalAdvance = advanceTurn;
      global.advanceTurn = function () { originalAdvance(); global.setTimeout(processWeek, 130); };
    }
    if (typeof newGame === 'function') {
      originalNewGame = newGame;
      global.newGame = function () { originalNewGame(); var g = getGame(); if (g) g.brokerCareer = createState(); render(); /* non aprire modale di lavoro all'avvio */ };
    }
    if (typeof loadSlot === 'function') {
      originalLoadSlot = loadSlot;
      global.loadSlot = function (n) { originalLoadSlot(n); ensureState(); hideJobModal(); render(); };
    }
    render();
  }

  global.BrokerageCareer = {
    install: install,
    join: function (id) { return joinFirm(id, false); },
    acceptOffer: acceptOffer,
    resign: resign,
    processWeek: processWeek,
    canTrade: canTrade,
    showJobs: showJobModal,
    foundFirm: foundOwnFirm,
    hireBroker: hireBroker,
    investFirm: investFirm,
    injectCapital: injectCapital,
    withdrawDividend: withdrawDividend,
    dirtyAction: dirtyAction,
    resolveDilemma: resolveDilemma,
    getContext: getContext,
    render: render,
    firms: FIRMS,
    version: VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.BrokerageCareer;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
