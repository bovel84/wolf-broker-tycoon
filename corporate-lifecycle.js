/*
 * corporate-lifecycle.js
 * Realistic company births, distress, restructuring, failures and M&A.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var installed = false;
  var processing = false;
  var VALID_SECTORS = ['tech', 'energy', 'finance', 'health', 'consumer', 'industrial', 'materials', 'utilities', 'realestate', 'communications'];
  var EVENT_LABELS = {
    bankruptcy: 'Fallimento',
    restructuring: 'Ristrutturazione',
    acquisition: 'Acquisizione',
    merger: 'Fusione',
    ipo: 'Nuova quotazione',
    spinoff: 'Scissione'
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function round(v, digits) {
    var p = Math.pow(10, digits || 0);
    return Math.round((Number(v) || 0) * p) / p;
  }
  function safe(value, max) { return String(value || '').replace(/[<>]/g, '').substring(0, max || 200); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function getGame() {
    try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; }
  }
  function getWorld() {
    return global.WorldEngine && global.WorldEngine.getState ? global.WorldEngine.getState() : null;
  }
  function profile(ticker) {
    return global.WorldEngine && global.WorldEngine.getCompanyProfile ? global.WorldEngine.getCompanyProfile(ticker) : null;
  }
  function company(game, ticker) {
    var list = game && game.companies ? game.companies : [];
    for (var i = 0; i < list.length; i++) if (list[i].ticker === ticker) return list[i];
    return null;
  }
  function activeCompanies(game) {
    return (game.companies || []).filter(function (c) {
      var p = profile(c.ticker);
      return c.listed !== false && (!p || !/bankrupt|acquired|merged|liquidated/.test(p.status || ''));
    });
  }
  function validSector(sector) {
    return VALID_SECTORS.indexOf(sector) >= 0 ? sector : 'industrial';
  }
  function addNews(game, title, description, type, ticker) {
    if (!game.news) game.news = [];
    game.news.unshift({
      week: game.week,
      title: safe(title, 110),
      desc: safe(description, 260),
      type: type || 'neutral',
      scope: ticker ? 'ticker' : 'macro',
      ticker: ticker || null
    });
    game.news = game.news.slice(0, 120);
  }
  function addTransactionSafe(type, ticker, shares, price, total) {
    try {
      if (typeof addTransaction === 'function') addTransaction(type, ticker, shares, price, total, 0);
    } catch (e) {}
  }

  function ensureFields(game) {
    var world = getWorld();
    if (!world) return;
    if (!(world.corporateEvents instanceof Array)) world.corporateEvents = [];
    for (var i = 0; i < game.companies.length; i++) {
      var c = game.companies[i];
      var p = profile(c.ticker);
      if (typeof c.listed !== 'boolean') c.listed = true;
      if (typeof c.tradingHalted !== 'boolean') c.tradingHalted = false;
      if (p) {
        if (!p.status) p.status = c.listed ? 'active' : 'delisted';
        if (typeof p.distressWeeks !== 'number') p.distressWeeks = 0;
        if (!(p.lifecycleHistory instanceof Array)) p.lifecycleHistory = [];
        if (typeof p.financialHealth !== 'number') p.financialHealth = 60;
      }
    }
  }

  function financialHealth(p) {
    if (!p) return 50;
    var marginScore = clamp((p.margin + 5) / 40 * 25, 0, 25);
    var debtScore = clamp((130 - p.debt) / 130 * 25, 0, 25);
    var growthScore = clamp((p.revenueGrowth + 15) / 45 * 20, 0, 20);
    var governanceScore = clamp(p.governance / 100 * 15, 0, 15);
    var cashScore = clamp(p.cash / 70 * 10, 0, 10);
    var confidenceScore = clamp((p.shareholderConfidence || 55) / 100 * 5, 0, 5);
    return round(marginScore + debtScore + growthScore + governanceScore + cashScore + confidenceScore, 1);
  }

  function evaluateHealth(game) {
    var candidates = [];
    var list = activeCompanies(game);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var p = profile(c.ticker);
      if (!p) continue;
      var health = financialHealth(p);
      p.financialHealth = health;
      if (health < 30) {
        p.distressWeeks += 1;
        if (p.distressWeeks >= 2 && p.status === 'active') {
          p.status = 'distressed';
          c.tradingHalted = false;
          addNews(game, c.name + ' entra in crisi', 'Debito, margini e fiducia degli azionisti segnalano tensioni crescenti. Il consiglio valuta misure straordinarie.', 'negative', c.ticker);
        }
      } else if (health >= 45) {
        if (p.status === 'distressed' || p.status === 'restructuring') p.status = 'active';
        p.distressWeeks = Math.max(0, p.distressWeeks - 1);
      }
      if (health < 18 && p.distressWeeks >= 3) candidates.push({ ticker: c.ticker, health: health });
    }
    candidates.sort(function (a, b) { return a.health - b.health; });
    return candidates;
  }

  function sectorImpact(game, sector, pct, excludeTickers) {
    var excluded = excludeTickers || [];
    var list = activeCompanies(game);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.sector !== sector || excluded.indexOf(c.ticker) >= 0) continue;
      var factor = pct * (0.55 + Math.random() * 0.75);
      c.price = Math.max(0.05, c.price * (1 + factor / 100));
      c.change = c.prevPrice ? (c.price - c.prevPrice) / c.prevPrice * 100 : factor;
    }
  }

  function settleShorts(game, ticker, settlementPrice) {
    var remaining = [];
    for (var i = 0; i < game.shorts.length; i++) {
      var s = game.shorts[i];
      if (s.ticker !== ticker) {
        remaining.push(s);
        continue;
      }
      var profit = (s.entryPrice - settlementPrice) * s.shares;
      game.cash = Math.max(0, game.cash + profit);
      if (typeof game.realizedPnL === 'number') game.realizedPnL += profit;
      addTransactionSafe('cover', ticker, s.shares, settlementPrice, s.shares * settlementPrice);
    }
    game.shorts = remaining;
  }

  function settleCashPosition(game, ticker, settlementPrice, reason) {
    var pos = game.positions && game.positions[ticker];
    if (!pos) return;
    var proceeds = pos.shares * settlementPrice;
    game.cash += proceeds;
    if (typeof game.realizedPnL === 'number') game.realizedPnL += (settlementPrice - pos.avgCost) * pos.shares;
    addTransactionSafe('sell', ticker, pos.shares, settlementPrice, proceeds);
    delete game.positions[ticker];
  }

  function convertPosition(game, fromTicker, toTicker, ratio, toPrice) {
    var pos = game.positions && game.positions[fromTicker];
    if (!pos || ratio <= 0) return;
    var newShares = Math.max(1, Math.floor(pos.shares * ratio));
    var oldValue = pos.shares * pos.avgCost;
    if (!game.positions[toTicker]) game.positions[toTicker] = { shares: 0, avgCost: 0 };
    var target = game.positions[toTicker];
    var targetOldValue = target.shares * target.avgCost;
    target.shares += newShares;
    target.avgCost = (targetOldValue + oldValue) / target.shares;
    addTransactionSafe('sell', fromTicker, pos.shares, toPrice * ratio, oldValue);
    addTransactionSafe('buy', toTicker, newShares, toPrice, newShares * toPrice);
    delete game.positions[fromTicker];
  }

  function recordEvent(game, evt) {
    var world = getWorld();
    if (!world) return;
    evt.week = game.week;
    evt.year = game.year || 1987;
    world.corporateEvents.unshift(evt);
    world.corporateEvents = world.corporateEvents.slice(0, 50);
    addNews(game, evt.title, evt.description, evt.marketImpact >= 0 ? 'positive' : 'negative', evt.primaryTicker || null);
    render();
  }

  function markStatus(ticker, status, reason) {
    if (global.WorldEngine && global.WorldEngine.setCompanyStatus) global.WorldEngine.setCompanyStatus(ticker, status, reason);
  }

  function applyBankruptcy(game, event) {
    var target = company(game, event.target);
    var p = target ? profile(target.ticker) : null;
    if (!target || !p || target.listed === false) return null;
    var oldPrice = target.price;
    var recovery = clamp(event.recoveryPct, 0, 20);
    var settlement = Math.max(0.05, oldPrice * recovery / 100);
    target.prevPrice = oldPrice;
    target.price = settlement;
    target.change = (settlement - oldPrice) / oldPrice * 100;
    target.cap = Math.max(1, target.cap * recovery / 100);
    target.div = 0;
    target.listed = false;
    target.tradingHalted = true;
    p.status = 'bankrupt';
    p.phase = 'liquidazione';
    p.employees = Math.round(p.employees * clamp(recovery / 100, 0.05, 0.25));
    p.objective.status = 'fallito';
    p.boardSupport = 0;
    p.governanceEvents.unshift({ week: game.week, actor: 'Tribunale commerciale', role: 'Procedura concorsuale', action: 'Apre la liquidazione', motive: safe(event.reason || 'Insolvenza non risolta', 180), type: 'bankruptcy' });
    markStatus(target.ticker, 'bankrupt', event.reason || 'Insolvenza e apertura della liquidazione');
    settleShorts(game, target.ticker, settlement);
    sectorImpact(game, target.sector, -2.5 - Math.min(3, target.cap / 100000), [target.ticker]);
    var evt = {
      type: 'bankruptcy',
      title: target.name + ' dichiara fallimento',
      description: 'Le contrattazioni sono sospese. Recupero stimato per gli azionisti: ' + recovery + '%. Il fallimento contagia fiducia e valutazioni nel settore ' + target.sector + '.',
      primaryTicker: target.ticker,
      affectedTickers: [target.ticker],
      marketImpact: -8,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function applyRestructuring(game, event) {
    var target = company(game, event.target);
    var p = target ? profile(target.ticker) : null;
    if (!target || !p || target.listed === false) return null;
    var injection = clamp(event.capitalInjection, 2, 35);
    p.status = 'restructuring';
    p.debt = round(clamp(p.debt - injection, 0, 150), 1);
    p.cash = round(clamp(p.cash + injection * 0.6, 0, 100), 1);
    p.margin = round(clamp(p.margin + 2, -10, 55), 1);
    p.employees = Math.round(p.employees * clamp(1 - injection / 180, 0.72, 0.98));
    p.distressWeeks = Math.max(0, p.distressWeeks - 2);
    target.price = Math.max(0.05, target.price * (1 - clamp(event.dilutionPct, 5, 45) / 100));
    target.cap = target.cap * (1 + injection / 100);
    target.tradingHalted = false;
    markStatus(target.ticker, 'restructuring', event.reason || 'Accordo con creditori e aumento di capitale');
    if (p.shareholderBlocks) {
      for (var i = 0; i < p.shareholderBlocks.length; i++) p.shareholderBlocks[i].confidence = Math.round(clamp(p.shareholderBlocks[i].confidence - 4, 0, 100));
    }
    var evt = {
      type: 'restructuring',
      title: target.name + ' evita il fallimento',
      description: 'Creditori e soci approvano una ristrutturazione: debito ridotto, nuova liquidita, diluizione degli azionisti e ridimensionamento operativo.',
      primaryTicker: target.ticker,
      affectedTickers: [target.ticker],
      marketImpact: -3,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function applyAcquisition(game, event) {
    var acquirer = company(game, event.acquirer);
    var target = company(game, event.target);
    var ap = acquirer ? profile(acquirer.ticker) : null;
    var tp = target ? profile(target.ticker) : null;
    if (!acquirer || !target || acquirer === target || !ap || !tp || acquirer.listed === false || target.listed === false) return null;
    var premium = clamp(event.premiumPct, 10, 60);
    var offer = target.price * (1 + premium / 100);
    var method = event.method === 'stock' ? 'stock' : 'cash';
    if (method === 'stock') {
      var ratio = offer / Math.max(0.05, acquirer.price);
      convertPosition(game, target.ticker, acquirer.ticker, ratio, acquirer.price);
    } else {
      settleCashPosition(game, target.ticker, offer, 'Acquisizione');
    }
    settleShorts(game, target.ticker, offer);
    target.prevPrice = target.price;
    target.price = offer;
    target.change = premium;
    target.listed = false;
    target.tradingHalted = true;
    tp.status = 'acquired';
    tp.objective.status = 'assorbito';
    ap.capitalIntegration = (ap.capitalIntegration || 0) + target.cap;
    ap.employees += Math.round(tp.employees * 0.82);
    ap.debt = round(clamp(ap.debt + clamp(event.debtImpact, 2, 15), 0, 150), 1);
    acquirer.cap += target.cap * 0.85;
    acquirer.price *= 1 + clamp(event.synergyPct, -5, 12) / 100;
    ap.milestones.unshift({ year: game.year || 1987, text: 'Acquisizione di ' + target.name });
    ap.governanceEvents.unshift({ week: game.week, actor: ap.board[1].name, role: ap.board[1].role, action: 'Completa l acquisizione di ' + target.name, motive: safe(event.reason || 'Crescita strategica', 160), type: 'acquisition' });
    markStatus(target.ticker, 'acquired', 'Acquisita da ' + acquirer.name);
    sectorImpact(game, target.sector, 1.2, [target.ticker, acquirer.ticker]);
    var evt = {
      type: 'acquisition',
      title: acquirer.name + ' acquisisce ' + target.name,
      description: 'Offerta con premio del ' + premium + '% pagata in ' + (method === 'stock' ? 'azioni' : 'contanti') + '. Il titolo acquisito viene ritirato dal mercato.',
      primaryTicker: target.ticker,
      affectedTickers: [acquirer.ticker, target.ticker],
      marketImpact: premium,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function uniqueTicker(game, preferred, sector) {
    var base = safe(preferred, 5).toUpperCase().replace(/[^A-Z]/g, '');
    if (base.length < 2) {
      var prefixes = { tech: 'NXT', energy: 'NRG', finance: 'FIN', health: 'MED', consumer: 'CNS', industrial: 'IND', materials: 'MAT', utilities: 'UTL', realestate: 'REA', communications: 'COM' };
      base = prefixes[validSector(sector)] || 'NEW';
    }
    var candidate = base;
    var n = 1;
    while (company(game, candidate)) {
      candidate = (base.substring(0, 4) + n).substring(0, 5);
      n++;
    }
    return candidate;
  }

  function createListedCompany(game, data, parents) {
    var sector = validSector(data.sector);
    var ticker = uniqueTicker(game, data.ticker, sector);
    var price = round(clamp(data.price, 8, 250), 2);
    var cap = Math.round(clamp(data.cap, 8000, 500000));
    var created = {
      ticker: ticker,
      name: safe(data.name || ('Nuova ' + sector + ' Holdings'), 70),
      sector: sector,
      price: price,
      prevPrice: price,
      cap: cap,
      vol: clamp(data.vol || 0.032, 0.01, 0.08),
      div: clamp(data.div || 0, 0, 0.08),
      change: 0,
      weekHistory: [price],
      listed: true,
      tradingHalted: false,
      bornWeek: game.week
    };
    game.companies.push(created);
    var p = global.WorldEngine.registerCompany(created, {
      originStory: safe(data.originStory || ('Nata sul mercato nella settimana ' + game.week + ' da capitale, tecnologia e persone provenienti da societa precedenti.'), 480),
      mission: safe(data.mission || 'Costruire una posizione sostenibile nel proprio settore.', 220),
      objectiveLabel: safe(data.objective || 'Raggiungere scala e redditivita entro due anni.', 220),
      headquarters: safe(data.headquarters || 'Nova City', 70),
      foundedYear: game.year || 1987,
      parentTickers: parents || [],
      reason: safe(data.reason || 'Nuova quotazione', 180)
    });
    return { company: created, profile: p };
  }

  function applyIPO(game, event) {
    var result = createListedCompany(game, {
      ticker: event.ticker,
      name: event.name,
      sector: event.sector,
      price: event.price || 35 + Math.random() * 65,
      cap: event.cap || 18000 + Math.random() * 90000,
      vol: event.volatility || 0.04,
      div: event.dividend || 0,
      originStory: event.originStory,
      mission: event.mission,
      objective: event.objective,
      headquarters: event.headquarters,
      reason: event.reason
    }, []);
    sectorImpact(game, result.company.sector, 0.8, [result.company.ticker]);
    var evt = {
      type: 'ipo',
      title: result.company.name + ' debutta in borsa',
      description: 'La nuova societa ' + result.company.ticker + ' raccoglie capitale per ' + safe(result.profile.objective.label, 160) + '. Il debutto aumenta interesse e volatilita nel settore.',
      primaryTicker: result.company.ticker,
      affectedTickers: [result.company.ticker],
      marketImpact: 4,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function applyMerger(game, event) {
    var a = company(game, event.companyA);
    var b = company(game, event.companyB);
    var ap = a ? profile(a.ticker) : null;
    var bp = b ? profile(b.ticker) : null;
    if (!a || !b || a === b || !ap || !bp || a.listed === false || b.listed === false) return null;
    var sector = event.sector || (a.sector === b.sector ? a.sector : a.sector);
    var totalCap = a.cap + b.cap;
    var result = createListedCompany(game, {
      ticker: event.newTicker,
      name: event.newName || (a.name.split(' ')[0] + ' ' + b.name.split(' ')[0] + ' Group'),
      sector: sector,
      price: event.newPrice || round((a.price + b.price) / 2, 2),
      cap: totalCap * clamp(event.retainedValuePct || 92, 65, 115) / 100,
      vol: (a.vol + b.vol) / 2 * 1.25,
      div: (a.div + b.div) / 2,
      originStory: 'Nata dalla fusione tra ' + a.name + ' e ' + b.name + ' dopo una trattativa tra consigli, creditori e grandi azionisti.',
      mission: event.mission || ap.mission,
      objective: event.objective || 'Integrare le due organizzazioni e realizzare le sinergie promesse.',
      headquarters: event.headquarters || ap.headquarters,
      reason: event.reason
    }, [a.ticker, b.ticker]);
    var merged = result.company;
    convertPosition(game, a.ticker, merged.ticker, a.price / merged.price, merged.price);
    convertPosition(game, b.ticker, merged.ticker, b.price / merged.price, merged.price);
    settleShorts(game, a.ticker, a.price);
    settleShorts(game, b.ticker, b.price);
    a.listed = false; a.tradingHalted = true;
    b.listed = false; b.tradingHalted = true;
    ap.status = 'merged'; bp.status = 'merged';
    ap.objective.status = 'confluito'; bp.objective.status = 'confluito';
    markStatus(a.ticker, 'merged', 'Confluita in ' + merged.name);
    markStatus(b.ticker, 'merged', 'Confluita in ' + merged.name);
    sectorImpact(game, merged.sector, 1.5, [a.ticker, b.ticker, merged.ticker]);
    var evt = {
      type: 'merger',
      title: a.name + ' e ' + b.name + ' si fondono',
      description: 'Nasce ' + merged.name + ' (' + merged.ticker + ') con capitalizzazione combinata e un nuovo consiglio. I vecchi titoli vengono convertiti.',
      primaryTicker: merged.ticker,
      affectedTickers: [a.ticker, b.ticker, merged.ticker],
      marketImpact: 6,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function applySpinoff(game, event) {
    var parent = company(game, event.parent);
    var pp = parent ? profile(parent.ticker) : null;
    if (!parent || !pp || parent.listed === false) return null;
    var share = clamp(event.capSharePct, 10, 40) / 100;
    var result = createListedCompany(game, {
      ticker: event.newTicker,
      name: event.newName || (parent.name + ' Ventures'),
      sector: event.sector || parent.sector,
      price: event.newPrice || Math.max(8, parent.price * share),
      cap: parent.cap * share,
      vol: parent.vol * 1.35,
      div: 0,
      originStory: 'Separata da ' + parent.name + ' per liberare una divisione con strategia, management e capitale autonomi.',
      mission: event.mission || 'Sviluppare il ramo separato con maggiore autonomia.',
      objective: event.objective || 'Dimostrare redditivita come societa indipendente.',
      headquarters: event.headquarters || pp.headquarters,
      reason: event.reason
    }, [parent.ticker]);
    parent.cap *= (1 - share);
    parent.price *= (1 - share * 0.7);
    var parentPos = game.positions[parent.ticker];
    if (parentPos) {
      var granted = Math.floor(parentPos.shares * share);
      if (granted > 0) game.positions[result.company.ticker] = { shares: granted, avgCost: result.company.price };
    }
    pp.milestones.unshift({ year: game.year || 1987, text: 'Scissione di ' + result.company.name });
    var evt = {
      type: 'spinoff',
      title: parent.name + ' separa ' + result.company.name,
      description: 'La divisione diventa autonoma e viene quotata come ' + result.company.ticker + '. Gli azionisti della capogruppo ricevono nuove azioni.',
      primaryTicker: result.company.ticker,
      affectedTickers: [parent.ticker, result.company.ticker],
      marketImpact: 3,
      reason: safe(event.reason, 180)
    };
    recordEvent(game, evt);
    return evt;
  }

  function normalizeEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var type = String(raw.type || '').toLowerCase();
    if (!EVENT_LABELS[type]) return null;
    var out = {};
    for (var k in raw) if (Object.prototype.hasOwnProperty.call(raw, k)) out[k] = raw[k];
    out.type = type;
    return out;
  }

  function applyEvent(game, raw) {
    var event = normalizeEvent(raw);
    if (!event) return null;
    if (event.type === 'bankruptcy') return applyBankruptcy(game, event);
    if (event.type === 'restructuring') return applyRestructuring(game, event);
    if (event.type === 'acquisition') return applyAcquisition(game, event);
    if (event.type === 'merger') return applyMerger(game, event);
    if (event.type === 'ipo') return applyIPO(game, event);
    if (event.type === 'spinoff') return applySpinoff(game, event);
    return null;
  }

  function automaticEvent(game, distressCandidates) {
    if (distressCandidates.length) {
      var worst = distressCandidates[0];
      if (worst.health < 10 || Math.random() < 0.35) {
        return { type: 'bankruptcy', target: worst.ticker, recoveryPct: 2 + Math.random() * 10, reason: 'Liquidita esaurita, creditori non concordi e piano di salvataggio fallito.' };
      }
      return { type: 'restructuring', target: worst.ticker, capitalInjection: 12 + Math.random() * 15, dilutionPct: 15 + Math.random() * 25, reason: 'Accordo urgente con banche, obbligazionisti e soci di riferimento.' };
    }
    var active = activeCompanies(game);
    if (game.week >= 12 && active.length >= 2 && Math.random() < 0.025) {
      var a = pick(active);
      var peers = active.filter(function (c) { return c.ticker !== a.ticker && c.sector === a.sector; });
      if (peers.length) {
        var b = pick(peers);
        return { type: 'merger', companyA: a.ticker, companyB: b.ticker, reason: 'Pressione competitiva e ricerca di scala industriale.' };
      }
    }
    if (game.week >= 8 && game.week % 8 === 0 && Math.random() < 0.22) {
      var sector = pick(VALID_SECTORS);
      return { type: 'ipo', sector: sector, ticker: '', name: 'Nova ' + sector + ' Corporation', reason: 'Nuovi investitori finanziano un progetto industriale ad alta crescita.' };
    }
    if (game.week >= 16 && active.length && Math.random() < 0.015) {
      var parent = pick(active);
      return { type: 'spinoff', parent: parent.ticker, sector: parent.sector, reason: 'Il consiglio separa una divisione per renderne trasparente il valore.' };
    }
    return null;
  }

  function processTurn(events, game) {
    if (processing || !game) return [];
    processing = true;
    ensureFields(game);
    var applied = [];
    var input = events instanceof Array ? events.slice(0, 2) : [];
    for (var i = 0; i < input.length; i++) {
      var result = applyEvent(game, input[i]);
      if (result) applied.push(result);
    }
    var distress = evaluateHealth(game);
    if (!applied.length) {
      var automatic = automaticEvent(game, distress);
      if (automatic) {
        var autoResult = applyEvent(game, automatic);
        if (autoResult) applied.push(autoResult);
      }
    }
    processing = false;
    render();
    try { if (typeof saveAuto === 'function') saveAuto(); } catch (e) {}
    return applied;
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    var dashboard = document.getElementById('view-dashboard');
    if (dashboard && !document.getElementById('corporate-lifecycle-card')) {
      var card = document.createElement('div');
      card.id = 'corporate-lifecycle-card';
      card.className = 'card';
      card.innerHTML = '<h3>🏗️ Ciclo di vita delle società</h3><div id="corporate-lifecycle-content"></div>';
      dashboard.appendChild(card);
    }
  }

  function render() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var el = document.getElementById('corporate-lifecycle-content');
    var game = getGame();
    var world = getWorld();
    if (!el || !game || !world) return;
    var active = activeCompanies(game);
    var distressed = 0;
    var failed = 0;
    for (var k in world.companies) {
      if (!Object.prototype.hasOwnProperty.call(world.companies, k)) continue;
      var status = world.companies[k].status || 'active';
      if (status === 'distressed' || status === 'restructuring') distressed++;
      if (status === 'bankrupt' || status === 'liquidated') failed++;
    }
    var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill g">Quotate ' + active.length + '</span><span class="pill y">In crisi ' + distressed + '</span><span class="pill r">Fallite ' + failed + '</span></div>';
    var events = world.corporateEvents || [];
    if (!events.length) html += '<div class="gray" style="font-size:11px">Nessuna operazione straordinaria registrata.</div>';
    for (var i = 0; i < events.length && i < 5; i++) {
      var e = events[i];
      html += '<div style="padding:7px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;gap:6px"><strong style="font-size:11px">' + safe(e.title, 100) + '</strong><span class="gray" style="font-size:9px">Sett. ' + e.week + '</span></div><div class="gray" style="font-size:10px;margin-top:2px">' + safe(e.description, 220) + '</div></div>';
    }
    el.innerHTML = html;
  }

  function install() {
    if (installed) return;
    installed = true;
    var game = getGame();
    if (game) ensureFields(game);
    ensureUI();
    render();
  }

  global.CorporateLifecycle = {
    install: install,
    processTurn: processTurn,
    applyEvent: function (event) { return applyEvent(getGame(), event); },
    financialHealth: function (ticker) { return financialHealth(profile(ticker)); },
    render: render,
    version: VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.CorporateLifecycle;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
