/*
 * stakeholder-interactions.js
 * Stake ownership, block market, assemblies and workplace relationships.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var installed = false;
  var originalAdvance = null;
  var originalNewGame = null;
  var BOSS_NAMES = {
    meridian: 'Catherine Hale', apex: 'Vincent Rourke', northstar: 'Amelia Grant',
    ironclad: 'Rafael Knox', blueharbor: 'Sofia Bellini', vortex: 'Elias Vector'
  };
  var REQUEST_TYPES = ['revenue', 'risk', 'trades', 'assembly', 'client', 'hide_loss'];

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function round(v, digits) { var p = Math.pow(10, digits || 0); return Math.round((Number(v) || 0) * p) / p; }
  function safe(v, max) { return String(v || '').replace(/[<>]/g, '').substring(0, max || 260); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function game() { try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; } }
  function career() { var g = game(); return g && g.brokerCareer ? g.brokerCareer : null; }
  function company(ticker) { var g = game(); if (!g || !g.companies) return null; for (var i = 0; i < g.companies.length; i++) if (g.companies[i].ticker === ticker) return g.companies[i]; return null; }
  function profile(ticker) { return global.WorldEngine && global.WorldEngine.getCompanyProfile ? global.WorldEngine.getCompanyProfile(ticker) : null; }
  function world() { return global.WorldEngine && global.WorldEngine.getState ? global.WorldEngine.getState() : null; }
  function story() { return global.BrokerStory && global.BrokerStory.getContext ? global.BrokerStory.getContext() : null; }
  function money(v) { try { return typeof formatEur === 'function' ? formatEur(v) : '€' + Math.round(v); } catch (e) { return '€' + Math.round(v); } }
  function notify(kind, text) { try { if (typeof toast === 'function') toast(kind, text); } catch (e) {} }
  function sharesOutstanding(c) { try { return typeof companySharesOutstanding === 'function' ? companySharesOutstanding(c) : Math.max(1, Math.round(c.cap / c.price)); } catch (e) { return Math.max(1, Math.round(c.cap / c.price)); } }
  function owned(ticker) { var g = game(); return g && g.positions[ticker] ? g.positions[ticker].shares : 0; }
  function brokerName() { var s = story(); return s && s.name ? s.name : 'Il broker'; }

  function createState() {
    return {
      version: VERSION,
      nextId: 1,
      saleOrders: [],
      marketOffers: [],
      ownershipHistory: [],
      assemblyRelations: {},
      workplaceLog: [],
      lastInteractionWeek: {},
      employerIdSeen: null,
      lastProcessedWeek: 0
    };
  }

  function ensureState() {
    var g = game(); if (!g) return null;
    if (!g.stakeholderInteractions || typeof g.stakeholderInteractions !== 'object') g.stakeholderInteractions = createState();
    var s = g.stakeholderInteractions; var d = createState();
    for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k) && s[k] === undefined) s[k] = d[k];
    if (!(s.saleOrders instanceof Array)) s.saleOrders = [];
    if (!(s.marketOffers instanceof Array)) s.marketOffers = [];
    if (!(s.ownershipHistory instanceof Array)) s.ownershipHistory = [];
    if (!(s.workplaceLog instanceof Array)) s.workplaceLog = [];
    ensureWorkplace();
    return s;
  }

  function addNews(title, text, type, ticker) {
    var g = game(); if (!g) return;
    if (!(g.news instanceof Array)) g.news = [];
    g.news.unshift({ week: g.week, title: safe(title, 110), desc: safe(text, 280), type: type || 'neutral', scope: ticker ? 'ticker' : 'career', ticker: ticker || null });
    g.news = g.news.slice(0, 120);
  }

  function addLog(type, title, text, actor) {
    var s = ensureState(); var g = game(); if (!s || !g) return;
    s.workplaceLog.unshift({ week: g.week, type: type, title: safe(title, 90), text: safe(text, 260), actor: safe(actor || '', 70) });
    s.workplaceLog = s.workplaceLog.slice(0, 50);
  }

  function nextId(prefix) { var s = ensureState(); var id = prefix + '_' + game().week + '_' + s.nextId; s.nextId += 1; return id; }

  function lockedPct(p) {
    if (!p || !(p.shareholderBlocks instanceof Array)) return 55;
    var sum = 0;
    for (var i = 0; i < p.shareholderBlocks.length; i++) sum += Number(p.shareholderBlocks[i].stake) || 0;
    return clamp(sum, 20, 92);
  }

  function reservedShares(ticker) {
    var s = ensureState(); var total = 0;
    for (var i = 0; s && i < s.saleOrders.length; i++) if (s.saleOrders[i].ticker === ticker && s.saleOrders[i].status === 'open') total += s.saleOrders[i].shares;
    return total;
  }

  function availableShares(ticker) { return Math.max(0, owned(ticker) - reservedShares(ticker)); }

  function seedOffers() {
    var g = game(); var s = ensureState(); if (!g || !s) return;
    s.marketOffers = s.marketOffers.filter(function (o) { return o.status === 'open' && o.expires >= g.week && company(o.ticker) && company(o.ticker).listed !== false; });
    var attempts = 0;
    while (s.marketOffers.length < 10 && attempts < 40) {
      attempts += 1;
      var listed = g.companies.filter(function (c) { return c.listed !== false && !c.tradingHalted; });
      if (!listed.length) break;
      var c = pick(listed); var p = profile(c.ticker); var sellers = p && p.shareholderBlocks ? p.shareholderBlocks : [];
      var seller = sellers.length ? pick(sellers) : { id: 'market', name: 'Azionisti diffusi', stake: 25, objective: 'Liquidità' };
      var outstanding = sharesOutstanding(c);
      var maxShares = Math.max(2, Math.floor(outstanding * clamp((seller.stake || 10) / 100 * 0.22, 0.006, 0.035)));
      var shares = Math.max(1, Math.floor(maxShares * (0.45 + Math.random() * 0.55)));
      var premium = round(-3 + Math.random() * 10, 1);
      s.marketOffers.push({ id: nextId('offer'), ticker: c.ticker, sellerId: seller.id, sellerName: seller.name, sellerObjective: seller.objective || '', shares: shares, price: round(c.price * (1 + premium / 100), 2), premium: premium, createdWeek: g.week, expires: g.week + 3 + Math.floor(Math.random() * 4), status: 'open' });
    }
  }

  function buyOffer(id) {
    var g = game(); var s = ensureState(); if (!g || !s) return false;
    if (global.BrokerageCareer && global.BrokerageCareer.canTrade && !global.BrokerageCareer.canTrade()) { notify('error', 'Serve un intermediario autorizzato'); return false; }
    var offer = null;
    for (var i = 0; i < s.marketOffers.length; i++) if (s.marketOffers[i].id === id && s.marketOffers[i].status === 'open') offer = s.marketOffers[i];
    if (!offer) return false;
    var c = company(offer.ticker); if (!c || c.listed === false) return false;
    var total = offer.shares * offer.price; var fee = total * 0.0025;
    if (g.cash < total + fee) { notify('error', 'Liquidità insufficiente per il blocco'); return false; }
    g.cash -= total + fee;
    if (!g.positions[offer.ticker]) g.positions[offer.ticker] = { shares: 0, avgCost: 0 };
    var pos = g.positions[offer.ticker]; var oldValue = pos.shares * pos.avgCost;
    pos.shares += offer.shares; pos.avgCost = (oldValue + total) / pos.shares;
    offer.status = 'filled';
    var companyProfile = profile(offer.ticker);
    if (companyProfile && companyProfile.shareholderBlocks) {
      for (var bi = 0; bi < companyProfile.shareholderBlocks.length; bi++) {
        if (companyProfile.shareholderBlocks[bi].id === offer.sellerId) {
          companyProfile.shareholderBlocks[bi].stake = round(Math.max(0, companyProfile.shareholderBlocks[bi].stake - offer.shares / sharesOutstanding(c) * 100), 2);
          companyProfile.shareholderBlocks[bi].confidence = clamp((companyProfile.shareholderBlocks[bi].confidence || 50) - 2, 0, 100);
        }
      }
    }
    try { if (typeof addTransaction === 'function') addTransaction('buy', offer.ticker, offer.shares, offer.price, total, fee); } catch (e) {}
    s.ownershipHistory.unshift({ week: g.week, ticker: offer.ticker, action: 'Acquisto blocco', shares: offer.shares, price: offer.price, counterparty: offer.sellerName });
    addNews(brokerName() + ' aumenta la quota in ' + c.name, 'Acquistato un blocco di ' + offer.shares + ' azioni da ' + offer.sellerName + ' al prezzo di ' + money(offer.price) + '.', 'neutral', offer.ticker);
    notify('success', 'Blocco acquistato: ' + offer.shares + ' ' + offer.ticker);
    saveAndRender(); return true;
  }

  function listShares(ticker, fraction, premium) {
    var g = game(); var s = ensureState(); var c = company(ticker); if (!g || !s || !c) return false;
    var free = availableShares(ticker); var shares = Math.max(1, Math.floor(free * clamp(fraction, 0.05, 1)));
    if (free <= 0 || shares > free) { notify('error', 'Non hai azioni libere da mettere in vendita'); return false; }
    var order = { id: nextId('sale'), ticker: ticker, shares: shares, price: round(c.price * (1 + clamp(premium, -10, 25) / 100), 2), premium: clamp(premium, -10, 25), createdWeek: g.week, expires: g.week + 6, status: 'open', avgCost: g.positions[ticker].avgCost };
    s.saleOrders.unshift(order);
    s.ownershipHistory.unshift({ week: g.week, ticker: ticker, action: 'Quota in vendita', shares: shares, price: order.price, counterparty: 'Mercato dei blocchi' });
    addLog('stake', 'Quota di ' + ticker + ' messa in vendita', shares + ' azioni a ' + money(order.price) + '.', 'Mercato dei blocchi');
    saveAndRender(); return true;
  }

  function cancelSale(id) {
    var s = ensureState(); if (!s) return false;
    for (var i = 0; i < s.saleOrders.length; i++) if (s.saleOrders[i].id === id && s.saleOrders[i].status === 'open') { s.saleOrders[i].status = 'cancelled'; addLog('stake', 'Ordine annullato', s.saleOrders[i].ticker + ': ' + s.saleOrders[i].shares + ' azioni tornano disponibili.', 'Mercato dei blocchi'); saveAndRender(); return true; }
    return false;
  }

  function processSaleOrders() {
    var g = game(); var s = ensureState(); if (!g || !s) return;
    for (var i = 0; i < s.saleOrders.length; i++) {
      var o = s.saleOrders[i]; if (o.status !== 'open') continue;
      var c = company(o.ticker); var pos = g.positions[o.ticker];
      if (!c || !pos || pos.shares < o.shares) { o.status = 'cancelled'; continue; }
      if (o.expires < g.week) { o.status = 'expired'; addLog('stake', 'Ordine scaduto', o.ticker + ': nessun compratore al prezzo richiesto.', 'Mercato dei blocchi'); continue; }
      var attractiveness = 0.38 - Math.max(0, o.premium) / 45 + Math.max(0, -o.premium) / 25 + Math.max(0, c.change || 0) / 80;
      if (Math.random() < clamp(attractiveness, 0.05, 0.82)) {
        var total = o.shares * o.price; var fee = total * 0.0025; g.cash += total - fee;
        if (typeof g.realizedPnL === 'number') g.realizedPnL += (o.price - pos.avgCost) * o.shares - fee;
        pos.shares -= o.shares; if (pos.shares <= 0) delete g.positions[o.ticker];
        o.status = 'filled'; o.filledWeek = g.week;
        try { if (typeof addTransaction === 'function') addTransaction('sell', o.ticker, o.shares, o.price, total, fee); } catch (e) {}
        addNews('Eseguita vendita di una quota ' + o.ticker, brokerName() + ' cede ' + o.shares + ' azioni nel mercato dei blocchi a ' + money(o.price) + '.', 'neutral', o.ticker);
      }
    }
    s.saleOrders = s.saleOrders.slice(0, 30);
  }

  function ownershipRows() {
    var g = game(); var rows = []; if (!g) return rows;
    for (var t in g.positions) {
      if (!Object.prototype.hasOwnProperty.call(g.positions, t)) continue;
      var c = company(t); if (!c) continue;
      var p = profile(t); var outstanding = sharesOutstanding(c); var own = g.positions[t].shares;
      rows.push({ ticker: t, name: c.name, shares: own, available: availableShares(t), listed: reservedShares(t), ownership: own / outstanding * 100, votingPower: own / outstanding * 100, freeFloat: 100 - lockedPct(p), value: own * c.price, avgCost: g.positions[t].avgCost, price: c.price });
    }
    rows.sort(function (a, b) { return b.ownership - a.ownership; });
    return rows;
  }

  function findPendingAssembly(ticker) {
    var g = game(); if (!g || !g.pendingAssemblies) return null;
    for (var i = 0; i < g.pendingAssemblies.length; i++) if (g.pendingAssemblies[i].ticker === ticker && !g.pendingAssemblies[i].resolved) return g.pendingAssemblies[i];
    return null;
  }

  function lobbyAssembly(ticker, direction, method) {
    var g = game(); var a = findPendingAssembly(ticker); if (!g || !a) return false;
    var costs = { meeting: 850, proxy: 3500, roadshow: 7000 }; var impacts = { meeting: 0.035, proxy: 0.075, roadshow: 0.12 };
    var cost = costs[method] || costs.meeting; var impact = impacts[method] || impacts.meeting;
    if (g.cash < cost) { notify('error', 'Liquidità insufficiente per la campagna'); return false; }
    g.cash -= cost; if (direction === 'no') impact *= -1;
    a.lobbyFavor = clamp((a.lobbyFavor || 0) + impact, -0.28, 0.28);
    a.lobbySpent = (a.lobbySpent || 0) + cost;
    addLog('assembly', 'Campagna assembleare ' + ticker, (direction === 'yes' ? 'A favore' : 'Contro') + ' con metodo ' + method + '. Influenza stimata ' + round(Math.abs(impact) * 100, 1) + ' punti.', 'Proxy advisor');
    notify('success', 'Influenza assembleare aggiornata'); saveAndRender(); return true;
  }

  function meetShareholder(ticker, blockId, direction) {
    var g = game(); var a = findPendingAssembly(ticker); var p = profile(ticker); if (!g || !a || !p) return false;
    var block = null; for (var i = 0; i < p.shareholderBlocks.length; i++) if (p.shareholderBlocks[i].id === blockId) block = p.shareholderBlocks[i];
    if (!block || g.cash < 1200) return false;
    var key = ticker + '_' + blockId; var s = ensureState(); var relation = s.assemblyRelations[key] || 35;
    var narrative = story() || {}; var persuasion = 0.025 + relation / 1800 + (narrative.nerve || 50) / 5000;
    g.cash -= 1200; s.assemblyRelations[key] = clamp(relation + 8, 0, 100);
    a.lobbyFavor = clamp((a.lobbyFavor || 0) + (direction === 'yes' ? persuasion : -persuasion), -0.28, 0.28);
    block.confidence = clamp((block.confidence || 50) + 2, 0, 100);
    addLog('assembly', 'Incontro con ' + block.name, 'Hai discusso ' + (direction === 'yes' ? 'il sostegno' : 'l’opposizione') + ' alla proposta di ' + ticker + '.', block.name);
    saveAndRender(); return true;
  }

  function addCounterProposal(ticker) {
    var g = game(); var a = findPendingAssembly(ticker); if (!g || !a || availableShares(ticker) <= 0) return false;
    if (g.cash < 2500) { notify('error', 'Servono ' + money(2500) + ' per consulenti e deposito'); return false; }
    if (a.playerCounterProposal) return false;
    g.cash -= 2500;
    a.playerCounterProposal = true;
    a.proposals.push({ id: 'shareholder_transparency', title: 'Trasparenza e limite ai conflitti', desc: 'Il socio chiede informativa trimestrale, voto sui conflitti e responsabilità degli amministratori.', effect: function (c) { c.vol *= 0.96; c.price *= 1.025; return 'Governance rafforzata, prezzo +2,5%'; }, vote: 'positive', votesFor: 0, votesAgainst: 0, playerVoted: false, playerVote: null });
    addLog('assembly', 'Controproposta depositata', 'Hai usato i tuoi diritti di socio per aggiungere una delibera sulla trasparenza.', ticker);
    saveAndRender(); return true;
  }

  function applyVoteInfluence(ticker, baseFavor) {
    var a = findPendingAssembly(ticker); return clamp(baseFavor + (a ? a.lobbyFavor || 0 : 0), 0.05, 0.95);
  }

  function ensureWorkplace() {
    var c = career(); if (!c) return;
    if (!(c.requests instanceof Array)) c.requests = [];
    if (!(c.requestHistory instanceof Array)) c.requestHistory = [];
    if (!c.boss || c.boss.firmId !== c.employerId) {
      c.boss = c.status === 'employed' ? { firmId: c.employerId, name: BOSS_NAMES[c.employerId] || 'Direttore del desk', role: 'Responsabile del desk', trust: clamp(c.employerTrust || 40, 0, 100), pressure: 45, lastMessage: 'Voglio numeri, ma voglio sapere anche come li hai ottenuti.' } : null;
    }
    for (var i = 0; i < c.colleagues.length; i++) {
      if (!(c.colleagues[i].memories instanceof Array)) c.colleagues[i].memories = [];
      if (typeof c.colleagues[i].favorBalance !== 'number') c.colleagues[i].favorBalance = 0;
      if (typeof c.colleagues[i].rivalry !== 'number') c.colleagues[i].rivalry = 25;
    }
  }

  function requestText(type, c) {
    var a = game() && game().pendingAssemblies && game().pendingAssemblies.length ? game().pendingAssemblies[0] : null;
    if (type === 'revenue') return { title: 'Alza i ricavi del desk', text: 'Il capo pretende almeno ' + money((c.cycle.targetRevenue || 7000) * 0.45) + ' di ricavi aggiuntivi entro due settimane.', target: (c.cycle.revenue || 0) + (c.cycle.targetRevenue || 7000) * 0.45, metric: 'revenue', ethical: true };
    if (type === 'risk') return { title: 'Riduci la leva', text: 'La direzione vuole la leva sotto 2,2x entro la prossima verifica.', target: 2.2, metric: 'risk', ethical: true };
    if (type === 'trades') return { title: 'Muovi il book', text: 'Servono almeno quattro nuove operazioni per mostrare attività ai clienti.', target: (c.cycle.trades || 0) + 4, metric: 'trades', ethical: true };
    if (type === 'assembly' && a) return { title: 'Vota con la società', text: 'Il capo ti chiede di sostenere la linea del desk nell’assemblea ' + a.ticker + '.', target: a.ticker, metric: 'assembly', ethical: true };
    if (type === 'hide_loss') return { title: 'Sposta la perdita', text: 'Il capo suggerisce di rinviare una perdita al prossimo periodo. Migliora il report, ma lascia una traccia.', target: 1, metric: 'misconduct', ethical: false };
    return { title: 'Proteggi un cliente chiave', text: 'Un cliente importante vuole attenzione: mantieni credibilità sopra 50 fino alla scadenza.', target: 50, metric: 'client', ethical: true };
  }

  function maybeBossRequest() {
    var c = career(); var g = game(); if (!c || !g || c.status !== 'employed' || !c.boss) return;
    var active = c.requests.filter(function (r) { return r.status === 'pending' || r.status === 'accepted'; });
    if (active.length || g.week % 2 !== 0 || Math.random() > 0.58) return;
    var type = pick(REQUEST_TYPES); if (type === 'assembly' && (!g.pendingAssemblies || !g.pendingAssemblies.length)) type = 'client';
    var data = requestText(type, c);
    c.requests.unshift({ id: nextId('request'), type: type, title: data.title, text: data.text, metric: data.metric, target: data.target, createdWeek: g.week, deadline: g.week + 2, status: 'pending', ethical: data.ethical, reward: Math.round((c.contract ? c.contract.salary : 600) * 1.5), baselineAssemblies: g.stats ? g.stats.assembliesVoted || 0 : 0, baselineFalsified: c.misconduct ? c.misconduct.falsified || 0 : 0 });
    c.boss.lastMessage = data.text; c.boss.pressure = clamp(c.boss.pressure + 4, 0, 100);
    addLog('boss', data.title, data.text, c.boss.name); notify('info', 'Nuova richiesta del capo');
  }

  function requestSucceeded(r, c) {
    var life = global.PlayerLife && global.PlayerLife.getContext ? global.PlayerLife.getContext() : {};
    if (r.metric === 'revenue') return c.cycle.revenue >= r.target;
    if (r.metric === 'risk') return (life.leverage || 0) <= r.target;
    if (r.metric === 'trades') return c.cycle.trades >= r.target;
    if (r.metric === 'assembly') return !!(game().stats && (game().stats.assembliesVoted || 0) > (r.baselineAssemblies || 0));
    if (r.metric === 'misconduct') return c.misconduct && c.misconduct.falsified > (r.baselineFalsified || 0);
    if (r.metric === 'client') return (life.credibility || 0) >= r.target;
    return false;
  }

  function resolveBossRequests() {
    var c = career(); var g = game(); if (!c || !g || c.status !== 'employed') return;
    for (var i = 0; i < c.requests.length; i++) {
      var r = c.requests[i]; if (r.status !== 'accepted' || r.deadline > g.week) continue;
      if (requestSucceeded(r, c)) {
        r.status = 'completed'; game().cash += r.reward; c.employerTrust = clamp(c.employerTrust + 8, 0, 100); c.careerReputation = clamp(c.careerReputation + 3, 0, 100); c.boss.trust = clamp(c.boss.trust + 8, 0, 100);
        addLog('boss', 'Richiesta completata', r.title + ': bonus ' + money(r.reward) + '.', c.boss.name);
      } else {
        r.status = 'failed'; c.employerTrust = clamp(c.employerTrust - 10, 0, 100); c.boss.trust = clamp(c.boss.trust - 12, 0, 100);
        if (global.PlayerLife && global.PlayerLife.adjust) global.PlayerLife.adjust({ stress: 7, credibility: -3 }, 'Richiesta del capo fallita');
        addLog('boss', 'Richiesta fallita', r.title + ': il capo registra il mancato risultato.', c.boss.name);
      }
      c.requestHistory.unshift(r);
    }
  }

  function respondRequest(id, choice) {
    var c = career(); if (!c) return false; var r = null;
    for (var i = 0; i < c.requests.length; i++) if (c.requests[i].id === id && c.requests[i].status === 'pending') r = c.requests[i];
    if (!r) return false;
    if (choice === 'accept') { r.status = 'accepted'; c.boss.trust = clamp(c.boss.trust + 2, 0, 100); if (!r.ethical && global.BrokerStory && global.BrokerStory.adjustTraits) global.BrokerStory.adjustTraits({ ethics: -6, ambition: 4 }, 'Hai accettato un ordine discutibile del capo.'); }
    else if (choice === 'refuse') { r.status = 'refused'; c.boss.trust = clamp(c.boss.trust - (r.ethical ? 10 : 3), 0, 100); c.employerTrust = clamp(c.employerTrust - (r.ethical ? 6 : 1), 0, 100); if (!r.ethical && global.BrokerStory && global.BrokerStory.adjustTraits) global.BrokerStory.adjustTraits({ ethics: 8, nerve: 5 }, 'Hai rifiutato di alterare i risultati.'); }
    else {
      var nerve = story() ? story().nerve || 50 : 50; var success = Math.random() * 100 < nerve;
      r.status = success ? 'accepted' : 'refused'; if (success) { r.reward = Math.round(r.reward * 1.25); r.deadline += 1; c.boss.trust += 3; } else c.boss.trust -= 5;
    }
    addLog('boss', 'Risposta: ' + r.title, choice === 'accept' ? 'Hai accettato.' : (choice === 'refuse' ? 'Hai rifiutato.' : 'Hai negoziato condizioni e scadenza.'), c.boss.name);
    saveAndRender(); return true;
  }

  function bossAction(action) {
    var c = career(); if (!c || !c.boss) return false;
    if (action === 'raise') {
      if (c.boss.trust >= 68 && c.careerReputation >= 45) { c.contract.salary = Math.round(c.contract.salary * 1.08); c.boss.trust -= 8; addLog('boss', 'Aumento concesso', 'Nuovo stipendio ' + money(c.contract.salary) + ' a settimana.', c.boss.name); notify('success', 'Aumento ottenuto'); }
      else { c.boss.trust -= 4; addLog('boss', 'Aumento rifiutato', 'Il capo vuole prima risultati e fiducia più solidi.', c.boss.name); }
    } else if (action === 'feedback') {
      c.boss.trust += 2; c.boss.lastMessage = c.cycle.rank <= 2 ? 'Sei davanti. Ora dimostra di saperci restare.' : 'Il desk non paga il potenziale: paga i risultati.'; addLog('boss', 'Colloquio individuale', c.boss.lastMessage, c.boss.name);
    } else if (action === 'challenge') {
      c.boss.trust -= 6; c.employerTrust -= 3; if (global.BrokerStory && global.BrokerStory.adjustTraits) global.BrokerStory.adjustTraits({ nerve: 6, loyalty: -3 }, 'Hai contestato pubblicamente il capo.'); addLog('boss', 'Ordine contestato', 'Hai chiesto motivazioni davanti al desk.', c.boss.name);
    }
    saveAndRender(); return true;
  }

  function colleagueAction(id, action) {
    var c = career(); var s = ensureState(); var g = game(); if (!c || !s || !g) return false; var peer = null;
    for (var i = 0; i < c.colleagues.length; i++) if (c.colleagues[i].id === id) peer = c.colleagues[i];
    if (!peer || peer.status !== 'active') return false;
    var key = id + '_' + action; if (s.lastInteractionWeek[key] === g.week) { notify('warning', 'Hai già usato questa interazione questa settimana'); return false; }
    s.lastInteractionWeek[key] = g.week;
    if (action === 'talk') { peer.relationship = clamp(peer.relationship + 4, 0, 100); peer.memories.unshift('Conversazione franca nella settimana ' + g.week); peer.lastMove = 'Condivide un dettaglio sul proprio book.'; }
    else if (action === 'help') { var help = Math.min(c.cycle.revenue * 0.04, 1000); c.cycle.revenue -= help; peer.cycleRevenue += help; peer.relationship = clamp(peer.relationship + 10, 0, 100); peer.favorBalance += 1; peer.memories.unshift('Hai ceduto un cliente da ' + money(help)); }
    else if (action === 'favor') {
      if (peer.relationship < 55 || peer.favorBalance < 0) { peer.relationship -= 3; notify('warning', 'Il collega non si fida abbastanza'); }
      else { var favor = 500 + peer.skill * 12; c.cycle.revenue += favor; peer.cycleRevenue = Math.max(0, peer.cycleRevenue - favor); peer.relationship -= 5; peer.favorBalance -= 1; peer.memories.unshift('Ti ha ceduto un cliente da ' + money(favor)); }
    } else if (action === 'challenge') { peer.rivalry = clamp(peer.rivalry + 15, 0, 100); peer.ambition += 3; c.cycle.score += 3; if (global.PlayerLife && global.PlayerLife.adjust) global.PlayerLife.adjust({ stress: 4 }, 'Sfida diretta con un collega'); peer.memories.unshift('Sfida pubblica sulla classifica'); }
    else if (action === 'report') {
      if (peer.ethics < 45) { peer.status = Math.random() < 0.45 ? 'suspended' : 'active'; c.employerTrust += 5; peer.relationship = 0; addLog('colleague', 'Segnalazione interna', 'Hai consegnato al capo anomalie sul book di ' + peer.name + '.', peer.name); }
      else { c.employerTrust -= 6; peer.relationship -= 18; addLog('colleague', 'Accusa non provata', peer.name + ' reagisce e il capo dubita del tuo giudizio.', peer.name); }
    }
    peer.memories = peer.memories.slice(0, 8); addLog('colleague', 'Interazione con ' + peer.name, action, peer.name); enrichColleague(peer, action); saveAndRender(); return true;
  }

  function enrichColleague(peer, action) {
    if (!global.LLMGameMaster || !global.LLMGameMaster.generateDialogue || !global.LLMGameMaster.isAvailable || !global.LLMGameMaster.isAvailable()) return;
    global.LLMGameMaster.generateDialogue({ name: peer.name, role: 'Collega e rivale' }, 'Interazione: ' + action + '. Rapporto ' + peer.relationship + ', rivalità ' + peer.rivalry + ', etica ' + peer.ethics + '. Rispondi in una frase coerente senza inventare conseguenze.', { week: game().week, year: game().year || 1987, level: game().level || 0, reputation: career().careerReputation, netWorth: game().cash }).then(function (r) { if (r && r.text) { peer.lastDialogue = safe(r.text, 260); render(); } }).catch(function () {});
  }

  function processWeek() {
    var g = game(); var s = ensureState(); if (!g || !s || s.lastProcessedWeek === g.week) return;
    s.lastProcessedWeek = g.week; seedOffers(); processSaleOrders(); ensureWorkplace(); resolveBossRequests(); maybeBossRequest(); render();
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
  }

  function renderPortfolioPower() {
    var el = typeof document !== 'undefined' ? document.getElementById('stakeholder-portfolio-content') : null; if (!el) return;
    var rows = ownershipRows(); var html = '';
    if (!rows.length) html = '<div class="gray" style="font-size:11px">Nessuna quota posseduta. Le offerte dei soci restano visibili nel mercato dei blocchi.</div>';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; html += '<div class="stake-row"><div><strong>' + r.ticker + '</strong><div class="gray">' + safe(r.name, 60) + '</div></div><div><span class="gray">Possedute</span><strong>' + r.shares + '</strong></div><div><span class="gray">Disponibili</span><strong>' + r.available + '</strong></div><div><span class="gray">In vendita</span><strong class="yellow">' + r.listed + '</strong></div><div><span class="gray">Quota / voto</span><strong>' + round(r.ownership, 2) + '%</strong></div><div><span class="gray">Flottante</span><strong>' + round(r.freeFloat, 1) + '%</strong></div><div><span class="gray">Valore</span><strong>' + money(r.value) + '</strong></div><div><button class="btn btn-sm" onclick="StakeholderInteractions.listShares(\'' + r.ticker + '\',.25,0)">Vendi 25%</button> <button class="btn btn-sm" onclick="StakeholderInteractions.listShares(\'' + r.ticker + '\',.5,5)">50% a +5%</button></div></div>';
    }
    el.innerHTML = html;
  }

  function renderBlockMarket() {
    var s = ensureState(); var el = document.getElementById('stakeholder-market-content'); if (!s || !el) return;
    var html = '<div class="stake-market-grid"><div><strong style="font-size:11px">Offerte dei soci</strong>';
    var offers = s.marketOffers.filter(function (o) { return o.status === 'open'; }).slice(0, 10);
    for (var i = 0; i < offers.length; i++) { var o = offers[i]; html += '<div class="stake-offer"><div><strong>' + o.ticker + ' · ' + o.shares + ' azioni</strong><div class="gray">' + safe(o.sellerName, 60) + ' · ' + (o.premium >= 0 ? '+' : '') + o.premium + '% · scade S' + o.expires + '</div></div><div style="text-align:right"><strong>' + money(o.price) + '</strong><br><button class="btn btn-sm btn-blue" onclick="StakeholderInteractions.buyOffer(\'' + o.id + '\')">Compra blocco</button></div></div>'; }
    if (!offers.length) html += '<div class="gray" style="font-size:10px;margin-top:6px">Nessuna offerta attiva.</div>';
    html += '</div><div><strong style="font-size:11px">Le tue quote in vendita</strong>';
    var sales = s.saleOrders.filter(function (o) { return o.status === 'open'; });
    for (var j = 0; j < sales.length; j++) { var so = sales[j]; html += '<div class="stake-offer"><div><strong>' + so.ticker + ' · ' + so.shares + ' azioni</strong><div class="gray">' + money(so.price) + ' · scade S' + so.expires + '</div></div><button class="btn btn-sm btn-red" onclick="StakeholderInteractions.cancelSale(\'' + so.id + '\')">Annulla</button></div>'; }
    if (!sales.length) html += '<div class="gray" style="font-size:10px;margin-top:6px">Nessun blocco offerto.</div>';
    html += '</div></div>'; el.innerHTML = html;
  }

  function assemblyTools(ticker) {
    var a = findPendingAssembly(ticker); if (!a) return '';
    var p = profile(ticker); var html = '<div class="stake-assembly-tools"><strong>Costruisci il voto</strong><div class="gray" style="font-size:10px;margin:3px 0 7px">Influenza accumulata: ' + round((a.lobbyFavor || 0) * 100, 1) + ' punti · spesa ' + money(a.lobbySpent || 0) + '</div><button class="btn btn-sm btn-green" onclick="StakeholderInteractions.lobby(\'' + ticker + '\',\'yes\',\'meeting\');openAssemblyModal(\'' + ticker + '\')">Incontri a favore</button> <button class="btn btn-sm btn-red" onclick="StakeholderInteractions.lobby(\'' + ticker + '\',\'no\',\'meeting\');openAssemblyModal(\'' + ticker + '\')">Incontri contro</button> <button class="btn btn-sm btn-blue" onclick="StakeholderInteractions.lobby(\'' + ticker + '\',\'yes\',\'proxy\');openAssemblyModal(\'' + ticker + '\')">Campagna proxy</button> <button class="btn btn-sm" onclick="StakeholderInteractions.counterProposal(\'' + ticker + '\');openAssemblyModal(\'' + ticker + '\')">Deposita controproposta</button>';
    if (p && p.shareholderBlocks) { html += '<div class="stake-blocks">'; for (var i = 0; i < p.shareholderBlocks.length; i++) { var b = p.shareholderBlocks[i]; html += '<div class="stake-block"><div><strong>' + safe(b.name, 60) + '</strong><div class="gray">' + b.stake + '% · ' + safe(b.stance, 35) + '</div></div><div><button class="btn btn-sm" onclick="StakeholderInteractions.meet(\'' + ticker + '\',\'' + b.id + '\',\'yes\');openAssemblyModal(\'' + ticker + '\')">Convincili SÌ</button> <button class="btn btn-sm" onclick="StakeholderInteractions.meet(\'' + ticker + '\',\'' + b.id + '\',\'no\');openAssemblyModal(\'' + ticker + '\')">NO</button></div></div>'; } html += '</div>'; }
    return html + '</div>';
  }

  function renderWorkplace() {
    var c = career(); var el = document.getElementById('stakeholder-workplace-content'); if (!el) return;
    if (!c || c.status !== 'employed') { el.innerHTML = '<div class="gray" style="font-size:11px">Capo e colleghi diventano interattivi quando lavori in una società.</div>'; return; }
    ensureWorkplace(); var html = '<div class="stake-boss"><div><strong>' + safe(c.boss.name, 60) + '</strong><div class="gray">' + c.boss.role + ' · fiducia ' + Math.round(c.boss.trust) + ' · pressione ' + Math.round(c.boss.pressure) + '</div><div style="font-size:11px;margin-top:4px">“' + safe(c.boss.lastMessage, 180) + '”</div></div><div><button class="btn btn-sm" onclick="StakeholderInteractions.bossAction(\'feedback\')">Chiedi feedback</button> <button class="btn btn-sm btn-green" onclick="StakeholderInteractions.bossAction(\'raise\')">Chiedi aumento</button> <button class="btn btn-sm btn-red" onclick="StakeholderInteractions.bossAction(\'challenge\')">Contesta</button></div></div>';
    var requests = c.requests.filter(function (r) { return r.status === 'pending' || r.status === 'accepted'; });
    for (var i = 0; i < requests.length; i++) { var r = requests[i]; html += '<div class="stake-request"><div><strong>' + safe(r.title, 80) + '</strong><div class="gray">' + safe(r.text, 220) + ' · scadenza S' + r.deadline + ' · premio ' + money(r.reward) + '</div></div>' + (r.status === 'pending' ? '<div><button class="btn btn-sm btn-green" onclick="StakeholderInteractions.respondRequest(\'' + r.id + '\',\'accept\')">Accetta</button> <button class="btn btn-sm" onclick="StakeholderInteractions.respondRequest(\'' + r.id + '\',\'negotiate\')">Negozia</button> <button class="btn btn-sm btn-red" onclick="StakeholderInteractions.respondRequest(\'' + r.id + '\',\'refuse\')">Rifiuta</button></div>' : '<span class="pill b">ACCETTATA</span>') + '</div>'; }
    html += '<div class="stake-colleague-grid">';
    for (var j = 0; j < c.colleagues.length; j++) { var p = c.colleagues[j]; html += '<div class="stake-colleague"><div><strong>' + safe(p.name, 60) + '</strong><div class="gray">Rapporto ' + Math.round(p.relationship) + ' · rivalità ' + Math.round(p.rivalry) + ' · favori ' + p.favorBalance + '</div><div style="font-size:10px;margin-top:3px">' + safe(p.lastDialogue || p.lastMove, 150) + '</div></div><div class="stake-actions"><button onclick="StakeholderInteractions.colleagueAction(\'' + p.id + '\',\'talk\')">Parla</button><button onclick="StakeholderInteractions.colleagueAction(\'' + p.id + '\',\'help\')">Aiuta</button><button onclick="StakeholderInteractions.colleagueAction(\'' + p.id + '\',\'favor\')">Chiedi favore</button><button onclick="StakeholderInteractions.colleagueAction(\'' + p.id + '\',\'challenge\')">Sfida</button><button onclick="StakeholderInteractions.colleagueAction(\'' + p.id + '\',\'report\')">Segnala</button></div></div>'; }
    html += '</div>'; el.innerHTML = html;
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('stakeholder-style')) { var st = document.createElement('style'); st.id = 'stakeholder-style'; st.textContent = '.stake-row{display:grid;grid-template-columns:minmax(120px,1.2fr) repeat(6,minmax(75px,.65fr)) minmax(180px,1fr);gap:8px;align-items:center;padding:9px;border-bottom:1px solid var(--border);font-size:10px}.stake-row>div>span{display:block;font-size:9px}.stake-market-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.stake-offer,.stake-boss,.stake-request,.stake-block{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px;background:var(--bg3);border-radius:6px;margin-top:6px;font-size:10px}.stake-assembly-tools{margin-top:12px;padding:10px;background:var(--bg3);border-radius:7px}.stake-blocks{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.stake-colleague-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:7px;margin-top:9px}.stake-colleague{padding:9px;background:var(--bg3);border-radius:7px}.stake-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.stake-actions button{background:var(--bg4);border:1px solid var(--border);color:var(--text);font-size:9px;padding:4px 6px;border-radius:4px;cursor:pointer}@media(max-width:850px){.stake-row{grid-template-columns:1fr 1fr}.stake-market-grid,.stake-blocks{grid-template-columns:1fr}}'; document.head.appendChild(st); }
    var pv = document.getElementById('view-portfolio');
    if (pv && !document.getElementById('stakeholder-portfolio-card')) { var pc = document.createElement('div'); pc.id = 'stakeholder-portfolio-card'; pc.className = 'card'; pc.innerHTML = '<h3>📊 Quote, voto e flottante</h3><div id="stakeholder-portfolio-content"></div>'; pv.insertBefore(pc, pv.firstChild); var mc = document.createElement('div'); mc.id = 'stakeholder-market-card'; mc.className = 'card'; mc.innerHTML = '<h3>🤝 Mercato dei blocchi azionari</h3><div id="stakeholder-market-content"></div>'; pv.appendChild(mc); }
    var av = document.getElementById('view-assembly');
    if (av && !document.getElementById('stakeholder-assembly-note')) { var note = document.createElement('div'); note.id = 'stakeholder-assembly-note'; note.className = 'card'; note.innerHTML = '<h3>🗳️ Potere assembleare</h3><div class="gray" style="font-size:11px">Ogni azione dà diritto di voto. Incontra i blocchi, costruisci deleghe, finanzia campagne proxy o deposita una controproposta direttamente nella finestra dell’assemblea.</div>'; av.insertBefore(note, av.firstChild); }
    var bv = document.getElementById('view-brokerage');
    if (bv && !document.getElementById('stakeholder-workplace-card')) { var wc = document.createElement('div'); wc.id = 'stakeholder-workplace-card'; wc.className = 'card'; wc.innerHTML = '<h3>💬 Capo, richieste e colleghi</h3><div id="stakeholder-workplace-content"></div>'; bv.insertBefore(wc, bv.firstChild); }
  }

  function render() {
    if (typeof document === 'undefined') return; ensureUI(); seedOffers(); renderPortfolioPower(); renderBlockMarket(); renderWorkplace();
  }
  function saveAndRender() { try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {} render(); try { if (typeof renderPortfolio === 'function') renderPortfolio(); if (typeof renderAssembly === 'function') renderAssembly(); } catch (e2) {} }

  function getContext() {
    var s = ensureState(); var c = career(); if (!s) return null;
    return { saleOrders: s.saleOrders.filter(function (o) { return o.status === 'open'; }).length, blockOffers: s.marketOffers.filter(function (o) { return o.status === 'open'; }).length, largestStakes: ownershipRows().slice(0, 4), boss: c && c.boss ? { name: c.boss.name, trust: c.boss.trust, pressure: c.boss.pressure } : null, activeRequests: c && c.requests ? c.requests.filter(function (r) { return r.status === 'pending' || r.status === 'accepted'; }).map(function (r) { return { title: r.title, deadline: r.deadline, status: r.status, ethical: r.ethical }; }) : [], workplaceLog: s.workplaceLog.slice(0, 4) };
  }

  function install() {
    if (installed) return; installed = true; ensureState(); ensureUI();
    if (typeof advanceTurn === 'function') { originalAdvance = advanceTurn; global.advanceTurn = function () { originalAdvance(); global.setTimeout(processWeek, 180); }; }
    if (typeof newGame === 'function') { originalNewGame = newGame; global.newGame = function () { originalNewGame(); var g = game(); if (g) g.stakeholderInteractions = createState(); render(); }; }
    render();
  }

  global.StakeholderInteractions = {
    install: install, processWeek: processWeek, render: render, getContext: getContext,
    availableShares: availableShares, buyOffer: buyOffer, listShares: listShares, cancelSale: cancelSale,
    lobby: lobbyAssembly, meet: meetShareholder, counterProposal: addCounterProposal, applyVoteInfluence: applyVoteInfluence,
    assemblyTools: assemblyTools, respondRequest: respondRequest, bossAction: bossAction, colleagueAction: colleagueAction,
    version: VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.StakeholderInteractions;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
