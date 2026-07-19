/*
 * world-engine.js
 * Persistent global simulation for Wolf Broker Tycoon.
 * Companies, regions, competitors and shareholder assemblies evolve every week.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'wbt_world_state_v1';
  var ENGINE_VERSION = '4.0.0';
  var installed = false;
  var processing = false;
  var state = null;
  var selectedCompanyTicker = null;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function round(v, digits) {
    var p = Math.pow(10, digits || 0);
    return Math.round((Number(v) || 0) * p) / p;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function getGame() {
    try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; }
  }
  function getCompetitors() {
    return global._competitorEngine && global._competitorEngine.competitors ?
      global._competitorEngine.competitors : [];
  }
  function safeText(value, max) {
    var text = String(value || '').replace(/[<>]/g, '');
    return text.substring(0, max || 180);
  }
  function findCompany(game, ticker) {
    var companies = game && game.companies ? game.companies : [];
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].ticker === ticker) return companies[i];
    }
    return null;
  }

  var DIRECTOR_FIRST_NAMES = ['Elena', 'Marcus', 'Leila', 'David', 'Sofia', 'Adrian', 'Marta', 'Victor', 'Nadia', 'Samuel', 'Iris', 'Thomas'];
  var DIRECTOR_LAST_NAMES = ['Valli', 'Kane', 'Okafor', 'Weiss', 'Marin', 'Rossi', 'Chen', 'Novak', 'Moreau', 'Silva', 'Cole', 'Bauer'];
  var CITY_NAMES = ['Northbridge', 'Port Azure', 'Grand Harbor', 'Nova City', 'Silver Bay', 'Eastgate', 'Iron Valley', 'San Aurelio'];
  var SECTOR_LORE = {
    tech: { origin: 'nata in un laboratorio universitario durante la corsa ai personal computer', mission: 'rendere la tecnologia accessibile senza rinunciare al controllo dei dati', objective: 'guidare la prossima piattaforma digitale globale' },
    energy: { origin: 'fondata da ingegneri che trasformarono una centrale in perdita in un polo energetico', mission: 'garantire energia stabile durante la transizione industriale', objective: 'raddoppiare la capacita produttiva riducendo il rischio ambientale' },
    finance: { origin: 'cresciuta da una piccola casa di credito per commercianti e famiglie', mission: 'finanziare crescita reale mantenendo la fiducia dei depositanti', objective: 'diventare il riferimento finanziario della propria regione' },
    health: { origin: 'creata dopo una ricerca medica che nessun grande investitore voleva finanziare', mission: 'portare cure efficaci dal laboratorio ai pazienti', objective: 'ottenere una scoperta clinica capace di cambiare il settore' },
    consumer: { origin: 'partita da un singolo negozio e costruita sul rapporto diretto con i clienti', mission: 'offrire prodotti affidabili a prezzi sostenibili', objective: 'espandersi in tre nuovi mercati senza perdere identita' },
    industrial: { origin: 'nata dalla fusione di officine sopravvissute a una lunga recessione', mission: 'costruire infrastrutture che durino oltre un ciclo economico', objective: 'modernizzare gli impianti e conquistare grandi commesse internazionali' },
    materials: { origin: 'fondata vicino a un distretto minerario dimenticato dagli investitori', mission: 'fornire materie prime strategiche con una filiera trasparente', objective: 'assicurarsi riserve per venti anni riducendo il debito' },
    utilities: { origin: 'costruita per collegare comunita che il mercato considerava poco redditizie', mission: 'garantire servizi essenziali affidabili e universali', objective: 'rinnovare la rete mantenendo dividendi stabili' },
    realestate: { origin: 'nata dalla ricostruzione di un quartiere industriale abbandonato', mission: 'trasformare capitale immobiliare in comunita vive', objective: 'sviluppare un portafoglio globale a reddito stabile' },
    communications: { origin: 'fondata da tecnici che collegarono le prime reti regionali', mission: 'rendere ogni distanza economicamente irrilevante', objective: 'controllare la nuova generazione di infrastrutture di comunicazione' }
  };

  function directorName(seed) {
    return DIRECTOR_FIRST_NAMES[seed % DIRECTOR_FIRST_NAMES.length] + ' ' + DIRECTOR_LAST_NAMES[(seed * 3 + 2) % DIRECTOR_LAST_NAMES.length];
  }

  function makeBoard(index) {
    var roles = ['Presidente', 'Amministratore Delegato', 'Direttore Finanziario', 'Consigliere Indipendente'];
    var agendas = ['stabilita e dividendi', 'crescita e acquisizioni', 'riduzione del debito', 'trasparenza e tutela dei soci'];
    var board = [];
    for (var i = 0; i < roles.length; i++) {
      board.push({
        id: 'dir_' + index + '_' + i,
        name: directorName(index * 4 + i),
        role: roles[i],
        competence: 55 + ((index * 11 + i * 7) % 41),
        ethics: 40 + ((index * 13 + i * 9) % 56),
        influence: i === 0 ? 82 : (i === 1 ? 88 : 55 + ((index + i * 5) % 30)),
        loyalty: pick(['societa', 'soci', 'management', 'personale']),
        agenda: agendas[(index + i) % agendas.length],
        status: 'attivo',
        lastMove: 'Sostiene il piano industriale.'
      });
    }
    return board;
  }

  function makeShareholders(index) {
    var founder = 12 + (index % 12);
    var institutional = 18 + (index % 9);
    var activist = 5 + (index % 7);
    var employees = 4 + (index % 5);
    var retail = 100 - founder - institutional - activist - employees;
    return [
      { id: 'founders', name: 'Fondatori e famiglie', stake: founder, stance: 'strategica', objective: 'proteggere identita e controllo', confidence: 65 },
      { id: 'institutional', name: 'Investitori istituzionali', stake: institutional, stance: 'prudente', objective: 'rendimento stabile e governance', confidence: 62 },
      { id: 'activist', name: 'Fondo attivista', stake: activist, stance: 'aggressiva', objective: 'sbloccare valore rapidamente', confidence: 45 },
      { id: 'employees', name: 'Dipendenti e management', stake: employees, stance: 'difensiva', objective: 'occupazione e investimenti', confidence: 70 },
      { id: 'retail', name: 'Azionisti diffusi', stake: retail, stance: 'variabile', objective: 'prezzo e dividendi', confidence: 55 }
    ];
  }

  function makeCompanyLore(c, index) {
    var lore = SECTOR_LORE[c.sector] || SECTOR_LORE.industrial;
    var founded = 1948 + ((index * 7) % 58);
    var city = CITY_NAMES[index % CITY_NAMES.length];
    return {
      foundedYear: founded,
      headquarters: city,
      originStory: c.name + ' e stata ' + lore.origin + '. Dal ' + founded + ' la societa ha attraversato crisi, cambi di controllo e una generazione di nuovi dirigenti.',
      mission: lore.mission,
      objective: {
        id: 'obj_' + c.ticker,
        label: lore.objective,
        target: 100,
        progress: 18 + ((index * 9) % 55),
        deadlineWeek: 26 + (index % 27),
        status: 'in corso'
      },
      milestones: [
        { year: founded, text: 'Fondazione a ' + city },
        { year: founded + 12 + (index % 8), text: 'Prima espansione fuori dalla regione' },
        { year: founded + 27 + (index % 14), text: 'Riorganizzazione societaria e ingresso di nuovi soci' }
      ],
      board: makeBoard(index),
      shareholderBlocks: makeShareholders(index),
      governanceEvents: []
    };
  }

  function ensureCompanyGovernance(profile, company, index) {
    var lore = makeCompanyLore(company, index);
    if (!profile.foundedYear) profile.foundedYear = lore.foundedYear;
    if (!profile.headquarters) profile.headquarters = lore.headquarters;
    if (!profile.originStory) profile.originStory = lore.originStory;
    if (!profile.mission) profile.mission = lore.mission;
    if (!profile.objective) profile.objective = lore.objective;
    if (!(profile.milestones instanceof Array)) profile.milestones = lore.milestones;
    if (!(profile.board instanceof Array) || !profile.board.length) profile.board = lore.board;
    if (!(profile.shareholderBlocks instanceof Array) || !profile.shareholderBlocks.length) profile.shareholderBlocks = lore.shareholderBlocks;
    if (!(profile.governanceEvents instanceof Array)) profile.governanceEvents = [];
    return profile;
  }

  function defaultRegions() {
    return [
      { id: 'north_america', name: 'Nord America', growth: 2.4, inflation: 3.1, rates: 5.0, stability: 78, trend: 'espansione' },
      { id: 'europe', name: 'Europa', growth: 1.3, inflation: 2.7, rates: 4.0, stability: 73, trend: 'rallentamento' },
      { id: 'asia', name: 'Asia-Pacifico', growth: 4.8, inflation: 2.2, rates: 3.2, stability: 70, trend: 'espansione' },
      { id: 'emerging', name: 'Mercati Emergenti', growth: 3.7, inflation: 6.4, rates: 7.8, stability: 52, trend: 'volatile' }
    ];
  }

  function hydrateCompany(c, index) {
    var profile = {
      ticker: c.ticker,
      name: c.name,
      region: ['north_america', 'europe', 'asia', 'emerging'][index % 4],
      revenueGrowth: round(1 + Math.random() * 8, 1),
      margin: round(8 + Math.random() * 22, 1),
      debt: round(20 + Math.random() * 55, 1),
      cash: round(15 + Math.random() * 55, 1),
      governance: Math.round(45 + Math.random() * 45),
      innovation: Math.round(35 + Math.random() * 55),
      employees: Math.round(8000 + Math.random() * 92000),
      strategy: pick(['crescita', 'efficienza', 'innovazione', 'consolidamento']),
      phase: 'stabile',
      history: [],
      lastDecision: 'Piano industriale confermato.',
      boardSupport: Math.round(45 + Math.random() * 35)
    };
    return ensureCompanyGovernance(profile, c, index);
  }

  function hydrateRival(c, index) {
    return {
      nickname: c.nickname,
      goal: pick(['controllo societario', 'rendimento assoluto', 'crescita globale', 'attivismo', 'difesa del capitale']),
      horizon: pick(['breve', 'medio', 'lungo']),
      conviction: Math.round(35 + Math.random() * 60),
      influence: Math.round(20 + Math.random() * 65),
      alliances: [],
      grudges: [],
      memory: [],
      preferredRegion: defaultRegions()[index % 4].id,
      lastPlan: 'Osserva il mercato.'
    };
  }

  function createState(game, competitors) {
    var companies = {};
    var rivals = {};
    var list = game && game.companies ? game.companies : [];
    for (var i = 0; i < list.length; i++) companies[list[i].ticker] = hydrateCompany(list[i], i);
    for (var j = 0; j < competitors.length; j++) rivals[competitors[j].nickname] = hydrateRival(competitors[j], j);
    return {
      version: ENGINE_VERSION,
      week: game && game.week ? game.week : 1,
      regions: defaultRegions(),
      companies: companies,
      rivals: rivals,
      globalEvents: [],
      assemblyLog: [],
      openAssembly: null,
      lastBriefing: 'Il mondo finanziario entra in una nuova fase.',
      lastTurn: null
    };
  }

  function loadState(game, competitors) {
    var loaded = null;
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) loaded = JSON.parse(raw);
    } catch (e) { loaded = null; }
    state = loaded && loaded.companies && loaded.rivals ? loaded : createState(game, competitors);
    var list = game && game.companies ? game.companies : [];
    for (var i = 0; i < list.length; i++) {
      if (!state.companies[list[i].ticker]) state.companies[list[i].ticker] = hydrateCompany(list[i], i);
      else ensureCompanyGovernance(state.companies[list[i].ticker], list[i], i);
    }
    for (var j = 0; j < competitors.length; j++) {
      if (!state.rivals[competitors[j].nickname]) state.rivals[competitors[j].nickname] = hydrateRival(competitors[j], j);
    }
    saveState();
    return state;
  }

  function saveState() {
    try {
      if (global.localStorage && state) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function buildContext(game, competitors) {
    var companies = [];
    var allCompanies = game.companies || [];
    var list = [];
    var rotationSize = Math.min(8, allCompanies.length);
    var rotationStart = allCompanies.length ? (((game.week || 1) - 1) * rotationSize) % allCompanies.length : 0;
    for (var ri = 0; ri < rotationSize; ri++) list.push(allCompanies[(rotationStart + ri) % allCompanies.length]);
    for (var i = 0; i < list.length; i++) {
      var profile = state.companies[list[i].ticker];
      companies.push({
        ticker: list[i].ticker,
        name: list[i].name,
        sector: list[i].sector,
        price: round(list[i].price, 2),
        change: round(list[i].change || 0, 2),
        revenueGrowth: profile.revenueGrowth,
        margin: profile.margin,
        debt: profile.debt,
        governance: profile.governance,
        innovation: profile.innovation,
        strategy: profile.strategy,
        phase: profile.phase,
        foundedYear: profile.foundedYear,
        originStory: profile.originStory,
        mission: profile.mission,
        objective: profile.objective,
        board: profile.board,
        shareholderBlocks: profile.shareholderBlocks,
        recentGovernance: profile.governanceEvents.slice(0, 3),
        lastDecision: profile.lastDecision
      });
    }
    var rivals = [];
    for (var j = 0; j < competitors.length; j++) {
      var memory = state.rivals[competitors[j].nickname];
      rivals.push({
        nickname: competitors[j].nickname,
        strategy: competitors[j].strategy,
        capital: round(competitors[j].capital, 0),
        relationship: competitors[j].relationship || 'neutral',
        goal: memory.goal,
        conviction: memory.conviction,
        influence: memory.influence,
        alliances: memory.alliances,
        lastPlan: memory.lastPlan
      });
    }
    return {
      week: game.week,
      year: game.year || 1987,
      sentiment: game.sentiment || 50,
      player: {
        netWorth: typeof computeNetWorth === 'function' ? round(computeNetWorth(), 0) : round(game.cash || 0, 0),
        reputation: game.rep || 50
      },
      regions: state.regions,
      companies: companies,
      competitors: rivals,
      recentEvents: state.globalEvents.slice(0, 4),
      recentAssemblies: state.assemblyLog.slice(0, 3),
      brokerStory: global.BrokerStory && global.BrokerStory.getContext ? global.BrokerStory.getContext() : null
    };
  }

  function fallbackTurn(context) {
    var company = pick(context.companies);
    var region = pick(context.regions);
    var actions = ['expansion', 'innovation', 'buyback', 'deleveraging', 'cost_cutting'];
    var action = pick(actions);
    var direction = Math.random() > 0.42 ? 1 : -1;
    var rivals = [];
    for (var i = 0; i < context.competitors.length; i++) {
      var r = context.competitors[i];
      rivals.push({
        nickname: r.nickname,
        goal: r.goal,
        plan: pick(['accumula una quota strategica', 'difende la liquidita', 'cerca alleati', 'prepara una posizione short']),
        target: pick(context.companies).ticker,
        stance: pick(['bullish', 'bearish', 'neutral']),
        conviction: Math.round(35 + Math.random() * 60)
      });
    }
    return {
      briefing: 'I mercati mondiali reagiscono a una nuova rotazione del capitale mentre consigli di amministrazione e grandi investitori preparano le prossime mosse.',
      macro: {
        region: region.id,
        title: 'Cambio di ciclo in ' + region.name,
        description: 'Crescita, inflazione e costo del capitale stanno cambiando le priorita delle imprese.',
        growthDelta: round((Math.random() - 0.5) * 0.8, 1),
        inflationDelta: round((Math.random() - 0.5) * 0.6, 1),
        ratesDelta: round((Math.random() - 0.5) * 0.5, 1),
        sentimentImpact: direction * Math.round(2 + Math.random() * 5)
      },
      companies: [{
        ticker: company.ticker,
        action: action,
        title: company.name + ': nuova strategia',
        description: 'Il consiglio modifica il piano industriale per reagire al nuovo scenario globale.',
        revenueGrowthDelta: direction * round(0.5 + Math.random() * 2.5, 1),
        marginDelta: direction * round(0.3 + Math.random() * 1.5, 1),
        debtDelta: action === 'deleveraging' ? -5 : (action === 'expansion' ? 4 : 0),
        governanceDelta: direction * Math.round(1 + Math.random() * 4),
        innovationDelta: action === 'innovation' ? 8 : Math.round((Math.random() - 0.5) * 4),
        priceImpactPct: direction * round(1 + Math.random() * 5, 1),
        boardDecision: { directorRole: 'Amministratore Delegato', action: 'Aggiorna il piano industriale', motive: 'Reagire al ciclo economico e avanzare verso l obiettivo societario.', supportDelta: direction * 3, objectiveProgress: direction * 4 },
        shareholderMoves: [{ blockId: 'institutional', action: direction > 0 ? 'sostegno' : 'richiesta di prudenza', motive: 'Proteggere rendimento e governance.', confidenceDelta: direction * 4, stance: direction > 0 ? 'favorevole' : 'prudente' }]
      }],
      competitors: rivals,
      assembly: null
    };
  }

  function normalizeTurn(raw, fallback, context) {
    var result = raw && typeof raw === 'object' ? raw : fallback;
    if (!result.briefing) result.briefing = fallback.briefing;
    if (!result.macro || typeof result.macro !== 'object') result.macro = fallback.macro;
    if (!(result.companies instanceof Array)) result.companies = fallback.companies;
    if (!(result.competitors instanceof Array)) result.competitors = fallback.competitors;
    result.companies = result.companies.slice(0, 4);
    result.competitors = result.competitors.slice(0, context.competitors.length);
    return result;
  }

  function applyMacro(macro, game) {
    var region = null;
    for (var i = 0; i < state.regions.length; i++) {
      if (state.regions[i].id === macro.region) region = state.regions[i];
    }
    if (!region) region = state.regions[0];
    region.growth = round(clamp(region.growth + clamp(macro.growthDelta, -2, 2), -8, 12), 1);
    region.inflation = round(clamp(region.inflation + clamp(macro.inflationDelta, -2, 2), -2, 20), 1);
    region.rates = round(clamp(region.rates + clamp(macro.ratesDelta, -1.5, 1.5), 0, 20), 1);
    region.stability = Math.round(clamp(region.stability + clamp(macro.sentimentImpact, -10, 10), 5, 100));
    region.trend = region.growth > 3 ? 'espansione' : (region.growth < 0 ? 'recessione' : 'rallentamento');
    var event = {
      week: game.week,
      region: region.id,
      title: safeText(macro.title, 90),
      description: safeText(macro.description, 220),
      impact: clamp(macro.sentimentImpact, -10, 10)
    };
    state.globalEvents.unshift(event);
    state.globalEvents = state.globalEvents.slice(0, 20);
    if (typeof game.sentiment === 'number') game.sentiment = Math.round(clamp(game.sentiment + event.impact, 0, 100));
    if (game.news && event.title) {
      game.news.unshift({ week: game.week, title: event.title, desc: event.description, type: event.impact >= 0 ? 'positive' : 'negative', scope: 'macro' });
    }
  }

  function applyBoardDecision(profile, decision, game) {
    if (!decision || typeof decision !== 'object') return;
    var director = null;
    for (var i = 0; i < profile.board.length; i++) {
      if (profile.board[i].role === decision.directorRole || profile.board[i].name === decision.directorName) director = profile.board[i];
    }
    if (!director) director = profile.board[1] || profile.board[0];
    director.lastMove = safeText(decision.action || decision.motive, 150);
    director.influence = Math.round(clamp(director.influence + clamp(decision.influenceDelta, -8, 8), 10, 100));
    director.competence = Math.round(clamp(director.competence + clamp(decision.competenceDelta, -6, 6), 10, 100));
    director.ethics = Math.round(clamp(director.ethics + clamp(decision.ethicsDelta, -8, 8), 0, 100));
    if (/^(attivo|dimissionario|rimosso|sospeso)$/.test(decision.status || '')) director.status = decision.status;
    profile.boardSupport = Math.round(clamp(profile.boardSupport + clamp(decision.supportDelta, -12, 12), 0, 100));
    if (profile.objective) {
      profile.objective.progress = round(clamp(profile.objective.progress + clamp(decision.objectiveProgress, -12, 12), 0, 100), 1);
      if (profile.objective.progress >= 100) profile.objective.status = 'raggiunto';
      else if (profile.objective.progress < 20) profile.objective.status = 'a rischio';
      else profile.objective.status = 'in corso';
    }
    profile.governanceEvents.unshift({
      week: game.week,
      actor: director.name,
      role: director.role,
      action: safeText(decision.action, 120),
      motive: safeText(decision.motive, 180),
      type: 'board'
    });
  }

  function applyShareholderMoves(profile, moves, game) {
    if (!(moves instanceof Array)) return;
    for (var i = 0; i < moves.length && i < 4; i++) {
      var move = moves[i] || {};
      var block = null;
      for (var j = 0; j < profile.shareholderBlocks.length; j++) {
        if (profile.shareholderBlocks[j].id === move.blockId || profile.shareholderBlocks[j].name === move.blockName) block = profile.shareholderBlocks[j];
      }
      if (!block) continue;
      block.confidence = Math.round(clamp(block.confidence + clamp(move.confidenceDelta, -15, 15), 0, 100));
      if (move.stance) block.stance = safeText(move.stance, 30);
      profile.governanceEvents.unshift({
        week: game.week,
        actor: block.name,
        role: 'Socio ' + block.stake + '%',
        action: safeText(move.action, 120),
        motive: safeText(move.motive, 180),
        type: 'shareholder'
      });
    }
    var confidence = 0;
    for (var k = 0; k < profile.shareholderBlocks.length; k++) confidence += profile.shareholderBlocks[k].confidence * profile.shareholderBlocks[k].stake / 100;
    profile.shareholderConfidence = Math.round(clamp(confidence, 0, 100));
    profile.governanceEvents = profile.governanceEvents.slice(0, 20);
  }

  function applyCompanyActions(actions, game) {
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i] || {};
      var company = findCompany(game, action.ticker);
      var profile = state.companies[action.ticker];
      if (!company || !profile) continue;
      profile.revenueGrowth = round(clamp(profile.revenueGrowth + clamp(action.revenueGrowthDelta, -8, 8), -25, 40), 1);
      profile.margin = round(clamp(profile.margin + clamp(action.marginDelta, -5, 5), -10, 55), 1);
      profile.debt = round(clamp(profile.debt + clamp(action.debtDelta, -12, 12), 0, 150), 1);
      profile.governance = Math.round(clamp(profile.governance + clamp(action.governanceDelta, -12, 12), 0, 100));
      profile.innovation = Math.round(clamp(profile.innovation + clamp(action.innovationDelta, -12, 12), 0, 100));
      applyBoardDecision(profile, action.boardDecision, game);
      applyShareholderMoves(profile, action.shareholderMoves, game);
      profile.lastDecision = safeText(action.title || action.description, 150);
      profile.phase = profile.revenueGrowth > 10 ? 'crescita' : (profile.revenueGrowth < 0 ? 'crisi' : 'stabile');
      profile.history.unshift({ week: game.week, action: safeText(action.action, 40), title: safeText(action.title, 100) });
      profile.history = profile.history.slice(0, 12);
      var impact = clamp(action.priceImpactPct, -12, 12);
      company.price = Math.max(1, company.price * (1 + impact / 100));
      company.change = round((company.price - company.prevPrice) / company.prevPrice * 100, 2);
      if (game.news) game.news.unshift({ week: game.week, title: safeText(action.title, 100), desc: safeText(action.description, 220), type: impact >= 0 ? 'positive' : 'negative', scope: 'ticker' });
    }
  }

  function applyRivalPlans(plans, competitors, game) {
    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i] || {};
      var memory = state.rivals[plan.nickname];
      if (!memory) continue;
      memory.goal = safeText(plan.goal || memory.goal, 80);
      memory.lastPlan = safeText(plan.plan, 150);
      memory.conviction = Math.round(clamp(plan.conviction, 1, 100));
      memory.memory.unshift({ week: game.week, target: safeText(plan.target, 12), stance: safeText(plan.stance, 16), plan: memory.lastPlan });
      memory.memory = memory.memory.slice(0, 10);
      for (var j = 0; j < competitors.length; j++) {
        if (competitors[j].nickname === plan.nickname) {
          competitors[j].worldPlan = memory.lastPlan;
          competitors[j].worldTarget = plan.target;
          competitors[j].conviction = memory.conviction;
        }
      }
    }
  }

  function ownershipPct(game, ticker) {
    if (typeof getOwnershipPct === 'function') return clamp(getOwnershipPct(ticker), 0, 100);
    return 0;
  }

  function competitorVotingBlocks(ticker, competitors) {
    var blocks = [];
    var total = 0;
    for (var i = 0; i < competitors.length; i++) {
      var c = competitors[i];
      var shares = 0;
      if (c.portfolio) {
        for (var j = 0; j < c.portfolio.length; j++) {
          if (c.portfolio[j].symbol === ticker && c.portfolio[j].shares > 0) shares += c.portfolio[j].shares;
        }
      }
      if (shares <= 0) shares = 100 + Math.round(Math.random() * 900);
      total += shares;
      blocks.push({ nickname: c.nickname, shares: shares, strategy: c.strategy, relationship: c.relationship || 'neutral' });
    }
    for (var k = 0; k < blocks.length; k++) blocks[k].weight = total > 0 ? round(blocks[k].shares / total * 20, 2) : 0;
    return blocks;
  }

  function maybeOpenAssembly(game, competitors, proposed) {
    if (state.openAssembly) return;
    if (game.week % 4 !== 0 && !proposed) return;
    var company = proposed && proposed.ticker ? findCompany(game, proposed.ticker) : pick(game.companies);
    if (!company) return;
    var profile = state.companies[company.ticker];
    var types = ['expansion', 'buyback', 'dividend', 'acquisition', 'governance', 'restructuring'];
    var type = proposed && proposed.type ? proposed.type : pick(types);
    var titles = {
      expansion: 'Espansione internazionale',
      buyback: 'Piano di riacquisto azioni',
      dividend: 'Aumento del dividendo',
      acquisition: 'Acquisizione strategica',
      governance: 'Riforma della governance',
      restructuring: 'Piano di ristrutturazione'
    };
    state.openAssembly = {
      id: 'asm_' + game.week + '_' + company.ticker,
      week: game.week,
      ticker: company.ticker,
      companyName: company.name,
      type: type,
      title: safeText((proposed && proposed.title) || titles[type] || 'Delibera strategica', 100),
      description: safeText((proposed && proposed.description) || 'Il consiglio chiede agli azionisti un mandato per cambiare la strategia societaria.', 240),
      priceImpactPct: clamp((proposed && proposed.priceImpactPct) || 3, -10, 10),
      growthImpact: clamp((proposed && proposed.growthImpact) || 2, -8, 8),
      debtImpact: clamp((proposed && proposed.debtImpact) || (type === 'expansion' || type === 'acquisition' ? 6 : -2), -15, 15),
      playerWeight: round(ownershipPct(game, company.ticker), 2),
      blocks: competitorVotingBlocks(company.ticker, competitors),
      corporateBlocks: profile.shareholderBlocks.map(function (b) { return { id: b.id, name: b.name, stake: b.stake, stance: b.stance, confidence: b.confidence, objective: b.objective }; }),
      corporateObjective: profile.objective ? profile.objective.label : '',
      boardSupport: profile.boardSupport,
      status: 'open'
    };
  }

  function resolveAssembly(vote) {
    var game = getGame();
    var assembly = state && state.openAssembly;
    if (!game || !assembly || assembly.status !== 'open') return null;
    var yes = assembly.boardSupport / 100 * 20;
    var no = (100 - assembly.boardSupport) / 100 * 20;
    var corporate = assembly.corporateBlocks || [];
    for (var ci = 0; ci < corporate.length; ci++) {
      var owner = corporate[ci];
      var ownerWeight = owner.stake * 0.55;
      var ownerSupports = /favorevole|strategica|aggressiva/.test(owner.stance) || (owner.confidence >= 60 && assembly.type !== 'restructuring');
      if (ownerSupports) yes += ownerWeight; else no += ownerWeight;
    }
    for (var i = 0; i < assembly.blocks.length; i++) {
      var block = assembly.blocks[i];
      var memory = state.rivals[block.nickname];
      var bullish = memory && memory.memory.length && memory.memory[0].stance === 'bullish';
      var supports = bullish || /crescita|controllo|attivismo/.test(memory ? memory.goal : '');
      if (supports) yes += block.weight; else no += block.weight;
    }
    if (vote === 'yes') yes += assembly.playerWeight;
    if (vote === 'no') no += assembly.playerWeight;
    assembly.yes = round(yes, 1);
    assembly.no = round(no, 1);
    assembly.playerVote = vote;
    assembly.passed = yes >= no;
    assembly.status = 'resolved';
    var company = findCompany(game, assembly.ticker);
    var profile = state.companies[assembly.ticker];
    if (assembly.passed && company && profile) {
      profile.revenueGrowth = round(clamp(profile.revenueGrowth + assembly.growthImpact, -25, 40), 1);
      profile.debt = round(clamp(profile.debt + assembly.debtImpact, 0, 150), 1);
      profile.lastDecision = assembly.title + ' approvata';
      company.price = Math.max(1, company.price * (1 + assembly.priceImpactPct / 100));
      if (profile.objective) profile.objective.progress = round(clamp(profile.objective.progress + 5, 0, 100), 1);
      for (var sb = 0; sb < profile.shareholderBlocks.length; sb++) profile.shareholderBlocks[sb].confidence = Math.round(clamp(profile.shareholderBlocks[sb].confidence + 2, 0, 100));
    } else if (profile) {
      profile.boardSupport = Math.round(clamp(profile.boardSupport - 6, 0, 100));
      for (var rb = 0; rb < profile.shareholderBlocks.length; rb++) profile.shareholderBlocks[rb].confidence = Math.round(clamp(profile.shareholderBlocks[rb].confidence - 3, 0, 100));
    }
    if (profile) {
      profile.governanceEvents.unshift({ week: game.week, actor: 'Assemblea degli azionisti', role: 'Soci', action: assembly.title + (assembly.passed ? ' approvata' : ' respinta'), motive: 'Esito: ' + assembly.yes + '% favorevoli, ' + assembly.no + '% contrari', type: 'assembly' });
      profile.governanceEvents = profile.governanceEvents.slice(0, 20);
    }
    state.assemblyLog.unshift(assembly);
    state.assemblyLog = state.assemblyLog.slice(0, 20);
    state.openAssembly = null;
    saveState();
    render();
    if (typeof renderAll === 'function') renderAll();
    return assembly;
  }

  function processWorldTurn() {
    if (processing) return Promise.resolve(null);
    var game = getGame();
    if (!game || !game.companies) return Promise.resolve(null);
    processing = true;
    var competitors = getCompetitors();
    if (!state) loadState(game, competitors);
    var context = buildContext(game, competitors);
    var fallback = fallbackTurn(context);
    var promise;
    if (global.LLMGameMaster && global.LLMGameMaster.generateWorldTurn) {
      promise = global.LLMGameMaster.generateWorldTurn(context);
    } else {
      promise = Promise.resolve(fallback);
    }
    return promise.then(function (raw) {
      var turn = normalizeTurn(raw, fallback, context);
      state.week = game.week;
      state.lastBriefing = safeText(turn.briefing, 320);
      state.lastTurn = turn;
      applyMacro(turn.macro || fallback.macro, game);
      applyCompanyActions(turn.companies || [], game);
      applyRivalPlans(turn.competitors || [], competitors, game);
      maybeOpenAssembly(game, competitors, turn.assembly);
      saveState();
      render();
      if (typeof renderAll === 'function') renderAll();
      return turn;
    }).catch(function () {
      var turn = fallback;
      applyMacro(turn.macro, game);
      applyCompanyActions(turn.companies, game);
      applyRivalPlans(turn.competitors, competitors, game);
      maybeOpenAssembly(game, competitors, null);
      saveState();
      render();
      return turn;
    }).then(function (result) {
      processing = false;
      return result;
    }, function (error) {
      processing = false;
      throw error;
    });
  }

  function regionName(id) {
    for (var i = 0; state && i < state.regions.length; i++) if (state.regions[i].id === id) return state.regions[i].name;
    return id;
  }
  function ensurePanels() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('company-governance-style')) {
      var governanceStyle = document.createElement('style');
      governanceStyle.id = 'company-governance-style';
      governanceStyle.textContent = '@media(max-width:760px){.company-governance-grid{grid-template-columns:1fr!important}}';
      document.head.appendChild(governanceStyle);
    }
    var dashboard = document.getElementById('view-dashboard');
    if (dashboard && !document.getElementById('world-pulse-card')) {
      var card = document.createElement('div');
      card.id = 'world-pulse-card';
      card.className = 'card';
      card.innerHTML = '<h3>🌍 World Intelligence</h3><div id="world-pulse-content"></div>';
      dashboard.appendChild(card);
    }
    var market = document.getElementById('view-market');
    if (market && !document.getElementById('company-governance-card')) {
      var gcard = document.createElement('div');
      gcard.id = 'company-governance-card';
      gcard.className = 'card';
      gcard.innerHTML = '<h3>🏢 Societa, amministratori e soci</h3><div id="company-governance-content"></div>';
      market.insertBefore(gcard, market.firstChild);
    }
    var assembly = document.getElementById('view-assembly');
    if (assembly && !document.getElementById('world-assembly-card')) {
      var acard = document.createElement('div');
      acard.id = 'world-assembly-card';
      acard.className = 'card';
      acard.innerHTML = '<h3>🏛️ Assemblea Globale</h3><div id="world-assembly-content"></div>';
      assembly.insertBefore(acard, assembly.firstChild);
    }
  }

  function selectCompany(ticker) {
    selectedCompanyTicker = ticker;
    renderCompanyHub();
  }

  function renderCompanyHub() {
    if (typeof document === 'undefined' || !state) return;
    var el = document.getElementById('company-governance-content');
    if (!el) return;
    var game = getGame();
    var companies = game && game.companies ? game.companies : [];
    if (!selectedCompanyTicker && companies.length) selectedCompanyTicker = companies[0].ticker;
    var profile = state.companies[selectedCompanyTicker];
    if (!profile) {
      el.innerHTML = '<div class="gray">Profilo societario non disponibile.</div>';
      return;
    }
    var options = '';
    for (var i = 0; i < companies.length; i++) {
      options += '<option value="' + safeText(companies[i].ticker, 12) + '"' + (companies[i].ticker === selectedCompanyTicker ? ' selected' : '') + '>' + safeText(companies[i].name, 70) + ' (' + safeText(companies[i].ticker, 12) + ')</option>';
    }
    var objective = profile.objective || { label: 'Obiettivo non definito', progress: 0, status: 'in corso' };
    var html = '<select onchange="WorldEngine.selectCompany(this.value)" style="width:100%;max-width:420px;background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:8px;border-radius:6px;margin-bottom:10px">' + options + '</select>';
    html += '<div style="display:grid;grid-template-columns:1.15fr .85fr;gap:10px" class="company-governance-grid">';
    html += '<div><div style="font-size:16px;font-weight:700">' + safeText(profile.name, 80) + '</div><div class="gray" style="font-size:11px">Fondata nel ' + profile.foundedYear + ' · Sede: ' + safeText(profile.headquarters, 60) + '</div><p style="font-size:12px;line-height:1.55">' + safeText(profile.originStory, 420) + '</p><div style="font-size:11px"><strong>Missione:</strong> ' + safeText(profile.mission, 220) + '</div>';
    html += '<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:11px"><strong>Obiettivo:</strong><span>' + round(objective.progress, 1) + '% · ' + safeText(objective.status, 30) + '</span></div><div style="font-size:11px;color:var(--text2);margin:3px 0">' + safeText(objective.label, 220) + '</div><div style="height:7px;background:var(--bg4);border-radius:8px;overflow:hidden"><span style="display:block;height:100%;width:' + clamp(objective.progress, 0, 100) + '%;background:linear-gradient(90deg,var(--blue),var(--green))"></span></div></div></div>';
    html += '<div><div style="font-size:11px;margin-bottom:6px"><strong>CdA</strong> · sostegno ' + profile.boardSupport + '%</div>';
    for (var b = 0; b < profile.board.length; b++) {
      var d = profile.board[b];
      html += '<div style="padding:6px;background:var(--bg3);border-radius:5px;margin-bottom:5px"><div style="font-size:11px;font-weight:700">' + safeText(d.name, 60) + '</div><div class="gray" style="font-size:9px">' + safeText(d.role, 50) + ' · influenza ' + d.influence + ' · etica ' + d.ethics + '</div><div style="font-size:10px;margin-top:2px">' + safeText(d.lastMove, 120) + '</div></div>';
    }
    html += '</div></div>';
    html += '<div style="margin-top:12px"><strong style="font-size:11px">Blocchi azionari</strong><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:5px;margin-top:6px">';
    for (var s = 0; s < profile.shareholderBlocks.length; s++) {
      var sh = profile.shareholderBlocks[s];
      html += '<div style="background:var(--bg3);padding:7px;border-radius:5px"><div style="display:flex;justify-content:space-between;font-size:10px"><strong>' + safeText(sh.name, 70) + '</strong><span>' + sh.stake + '%</span></div><div class="gray" style="font-size:9px">' + safeText(sh.stance, 30) + ' · fiducia ' + sh.confidence + '</div><div style="font-size:9px;margin-top:3px">' + safeText(sh.objective, 100) + '</div></div>';
    }
    html += '</div></div>';
    if (profile.governanceEvents.length) {
      html += '<div style="margin-top:10px"><strong style="font-size:11px">Ultima dinamica societaria</strong><div style="font-size:10px;color:var(--text2);margin-top:4px">' + safeText(profile.governanceEvents[0].actor, 80) + ': ' + safeText(profile.governanceEvents[0].action, 180) + '</div></div>';
    }
    el.innerHTML = html;
  }

  function render() {
    if (typeof document === 'undefined') return;
    ensurePanels();
    if (!state) return;
    var world = document.getElementById('world-pulse-content');
    if (world) {
      var html = '<div style="font-size:13px;margin-bottom:10px">' + safeText(state.lastBriefing, 320) + '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:6px">';
      for (var i = 0; i < state.regions.length; i++) {
        var r = state.regions[i];
        html += '<div style="background:var(--bg3);padding:8px;border-radius:6px"><strong>' + r.name + '</strong><div class="gray" style="font-size:10px">' + r.trend + '</div><div style="font-size:11px;margin-top:4px">PIL ' + r.growth + '% · Infl. ' + r.inflation + '% · Tassi ' + r.rates + '%</div></div>';
      }
      html += '</div>';
      var event = state.globalEvents[0];
      if (event) html += '<div style="margin-top:9px;padding:7px;border-left:3px solid ' + (event.impact >= 0 ? 'var(--green)' : 'var(--red)') + '"><strong>' + safeText(event.title, 90) + '</strong><div class="gray" style="font-size:11px">' + regionName(event.region) + ' — ' + safeText(event.description, 200) + '</div></div>';
      world.innerHTML = html;
    }
    renderCompanyHub();
    var assembly = document.getElementById('world-assembly-content');
    if (assembly) {
      if (!state.openAssembly) {
        var last = state.assemblyLog[0];
        assembly.innerHTML = last ? '<div style="font-size:12px"><strong>Ultimo esito:</strong> ' + safeText(last.companyName, 80) + ' — ' + safeText(last.title, 100) + ' <span class="' + (last.passed ? 'green' : 'red') + '">' + (last.passed ? 'APPROVATA' : 'RESPINTA') + '</span></div>' : '<div class="gray" style="font-size:12px">La prossima assemblea mondiale sara convocata in base agli eventi e alle quote accumulate.</div>';
      } else {
        var a = state.openAssembly;
        var canVote = a.playerWeight > 0;
        assembly.innerHTML = '<div><strong>' + safeText(a.companyName, 80) + ' (' + safeText(a.ticker, 12) + ')</strong><span class="pill b" style="margin-left:6px">Tua quota ' + a.playerWeight + '%</span></div><div style="font-size:14px;margin-top:8px"><strong>' + safeText(a.title, 100) + '</strong></div><div class="gray" style="font-size:12px;margin:5px 0 9px">' + safeText(a.description, 240) + '</div><div style="font-size:11px;margin-bottom:8px">CdA favorevole: ' + a.boardSupport + '% · Blocchi societari: ' + (a.corporateBlocks || []).length + ' · Rivali: ' + a.blocks.length + '</div>' + (canVote ? '<button class="btn btn-sm btn-blue" onclick="WorldEngine.vote(\'yes\')">Vota a favore</button> <button class="btn btn-sm" onclick="WorldEngine.vote(\'no\')">Vota contro</button>' : '<div class="gray" style="font-size:11px">Acquista azioni della societa per ottenere peso di voto.</div>');
      }
    }
  }

  function install() {
    if (installed) return;
    installed = true;
    var game = getGame();
    loadState(game, getCompetitors());
    ensurePanels();
    render();
    if (typeof advanceTurn === 'function') {
      var originalAdvance = advanceTurn;
      global.advanceTurn = function () {
        originalAdvance();
        global.setTimeout(function () { processWorldTurn(); }, 0);
      };
    }
  }

  global.WorldEngine = {
    install: install,
    processWorldTurn: processWorldTurn,
    vote: resolveAssembly,
    render: render,
    selectCompany: selectCompany,
    getCompanyProfile: function (ticker) { return state && state.companies ? state.companies[ticker] : null; },
    getState: function () { return state; },
    reset: function () {
      try { if (global.localStorage) global.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      state = createState(getGame(), getCompetitors());
      saveState();
      render();
    },
    version: ENGINE_VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.WorldEngine;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
