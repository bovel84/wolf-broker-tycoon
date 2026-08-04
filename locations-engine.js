/*
 * locations-engine.js
 * Sistema dei luoghi per Wolf Broker Tycoon
 * Il giocatore può visitare luoghi per intercettare soffiate, fare networking e ottenere vantaggi
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'wbt_locations_v1';
  
  // Definizione di tutti i luoghi disponibili
  var LOCATIONS_DB = [
    {
      id: 'office',
      name: 'Ufficio',
      icon: '🏢',
      description: 'Il tuo quartier generale. Analizza i mercati e gestisci il portafoglio.',
      unlockLevel: 1,
      cost: 0,
      energyCost: 0,
      actions: ['analyze', 'rest'],
      tips: ['Usa l\'ufficio per analizzare le azioni senza costi', 'Riposati qui per recuperare energia']
    },
    {
      id: 'trading_floor',
      name: 'Piano di Trading',
      icon: '📊',
      description: 'Il cuore pulsante del mercato. Informazioni in tempo reale e rumore di fondo.',
      unlockLevel: 2,
      cost: 50,
      energyCost: 10,
      actions: ['listen_rumors', 'network', 'quick_trade'],
      tips: ['Ascolta i rumors per ottenere anticipazioni', 'Fai networking con altri trader']
    },
    {
      id: 'conference',
      name: 'Conferenza Finanziaria',
      icon: '🎤',
      description: 'CEO e analisti presentano i risultati. Opportunità di fare domande dirette.',
      unlockLevel: 3,
      cost: 200,
      energyCost: 20,
      actions: ['attend_presentation', 'qa_session', 'vip_lounge'],
      tips: ['Le presentazioni possono rivelare dati fondamentali', 'Il VIP lounge è perfetto per contatti esclusivi']
    },
    {
      id: 'club',
      name: 'Private Club',
      icon: '🥃',
      description: 'Dove l\\'élite finanziaria si incontra informalmente. Soffiate guaranteed.',
      unlockLevel: 4,
      cost: 500,
      energyCost: 25,
      actions: ['drink_insider', 'private_room', 'high_stakes_poker'],
      tips: ['I drink sciolgono le lingue degli insider', 'Le partite a poker possono rivelare molto']
    },
    {
      id: 'charity',
      name: 'Gala di Beneficenza',
      icon: '🎭',
      description: 'L\\'alta società si riunisce per cause nobili. Networking di alto livello.',
      unlockLevel: 5,
      cost: 1000,
      energyCost: 30,
      actions: ['auction', 'dinner_table', 'silent_meeting'],
      tips: ['Le aste possono rivelare movimenti di capitale', 'I tavoli da cena sono miniere d\\'oro di informazioni']
    },
    {
      id: 'rooftop',
      name: 'Rooftop Bar',
      icon: '🌆',
      description: 'Vista mozzafiato e conversazioni ancora migliori. Incontri informali.',
      unlockLevel: 6,
      cost: 300,
      energyCost: 15,
      actions: ['sunset_drink', 'smoke_break', 'casual_chat'],
      tips: ['Il tramonto è il momento migliore per confidenze', 'Le sigarette creano complicità']
    },
    {
      id: 'marina',
      name: 'Marina degli Yacht',
      icon: '⛵',
      description: 'Dove i miliardari ormeggiano i loro yacht. Accesso al vero potere.',
      unlockLevel: 7,
      cost: 2000,
      energyCost: 40,
      actions: ['yacht_party', 'dock_walk', 'captain_talk'],
      tips: ['Le feste sugli yacht sono eventi esclusivi', 'I capitani sanno tutto prima di tutti']
    },
    {
      id: 'golf_club',
      name: 'Golf Club Esclusivo',
      icon: '⛳',
      description: 'Dove si chiudono gli affari tra una buca e l\\'altra.',
      unlockLevel: 8,
      cost: 800,
      energyCost: 35,
      actions: ['play_round', 'clubhouse_bar', 'pro_shop_chat'],
      tips: ['Un buon handicap apre molte porte', 'Il bar della clubhouse è pieno di gossip']
    },
    {
      id: 'tech_summit',
      name: 'Tech Summit',
      icon: '💻',
      description: 'Innovazione e startup. Dove nascono le prossime grandi opportunità.',
      unlockLevel: 9,
      cost: 600,
      energyCost: 25,
      actions: ['keynote', 'startup_pitch', 'demo_floor'],
      tips: ['Le keynote rivelano trend futuri', 'Gli startup pitch possono nascondere gemme']
    },
    {
      id: 'fed_hearing',
      name: 'Audizione FED',
      icon: '🏛️',
      description: 'Decisioni di politica monetaria che muovono i mercati.',
      unlockLevel: 10,
      cost: 0,
      energyCost: 50,
      actions: ['testimony', 'press_conference', 'analyst_briefing'],
      tips: ['Ogni parola del Chairman conta', 'Le conferenze stampa chiariscono le posizioni']
    }
  ];

  var state = null;

  function getDefaultState() {
    return {
      visitedLocations: [],
      locationLevels: {},
      unlockedLocations: ['office'],
      currentLocation: 'office',
      locationReputation: {},
      discoveredTips: [],
      activeContacts: [],
      pendingLeads: []
    };
  }

  function loadState() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        var loaded = JSON.parse(raw);
        state = Object.assign(getDefaultState(), loaded);
      } else {
        state = getDefaultState();
      }
    } catch (e) {
      state = getDefaultState();
    }
    return state;
  }

  function saveState() {
    try {
      if (global.localStorage && state) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {}
  }

  function getLocation(id) {
    for (var i = 0; i < LOCATIONS_DB.length; i++) {
      if (LOCATIONS_DB[i].id === id) return LOCATIONS_DB[i];
    }
    return null;
  }

  function getUnlockedLocations(playerLevel) {
    var unlocked = [];
    for (var i = 0; i < LOCATIONS_DB.length; i++) {
      var loc = LOCATIONS_DB[i];
      if (loc.unlockLevel <= playerLevel) {
        unlocked.push(loc);
      }
    }
    return unlocked;
  }

  function unlockLocation(locationId) {
    if (state.unlockedLocations.indexOf(locationId) === -1) {
      state.unlockedLocations.push(locationId);
      saveState();
      return true;
    }
    return false;
  }

  function visitLocation(locationId, playerCash, playerEnergy) {
    var location = getLocation(locationId);
    if (!location) {
      return { success: false, error: 'Luogo non trovato' };
    }

    if (state.unlockedLocations.indexOf(locationId) === -1) {
      return { success: false, error: 'Luogo non sbloccato' };
    }

    if (playerCash < location.cost) {
      return { 
        success: false, 
        error: 'Fondi insufficienti',
        required: location.cost 
      };
    }

    if (playerEnergy < location.energyCost) {
      return { 
        success: false, 
        error: 'Energia insufficiente',
        required: location.energyCost 
      };
    }

    // Deduci costi
    var newCash = playerCash - location.cost;
    var newEnergy = playerEnergy - location.energyCost;

    // Registra visita
    if (state.visitedLocations.indexOf(locationId) === -1) {
      state.visitedLocations.push(locationId);
    }

    // Incrementa livello del luogo (familiarità)
    if (!state.locationLevels[locationId]) {
      state.locationLevels[locationId] = 1;
    } else {
      state.locationLevels[locationId]++;
    }

    state.currentLocation = locationId;
    saveState();

    // Genera risultato della visita
    var result = generateLocationResult(location);

    return {
      success: true,
      location: location,
      cashRemaining: newCash,
      energyRemaining: newEnergy,
      result: result,
      locationLevel: state.locationLevels[locationId]
    };
  }

  function generateLocationResult(location) {
    var level = state.locationLevels[location.id] || 1;
    var roll = Math.random();
    
    // Probabilità migliorate con il livello
    var tipChance = 0.3 + (level * 0.05);
    var contactChance = 0.15 + (level * 0.03);
    var leadChance = 0.2 + (level * 0.04);

    var result = {
      type: 'nothing',
      message: '',
      data: null
    };

    if (roll < tipChance) {
      // Ottieni una soffiata
      var tip = generateTip(location);
      result.type = 'tip';
      result.message = 'Hai intercettato una soffiata interessante!';
      result.data = tip;
      
      // Aggiungi ai lead pendenti
      state.pendingLeads.push({
        location: location.id,
        tip: tip,
        week: typeof G !== 'undefined' ? G.week : 1,
        used: false
      });
    } else if (roll < tipChance + contactChance) {
      // Nuovo contatto
      var contact = generateContact(location);
      result.type = 'contact';
      result.message = 'Hai fatto un nuovo contatto influente!';
      result.data = contact;
      
      state.activeContacts.push(contact);
    } else if (roll < tipChance + contactChance + leadChance) {
      // Lead informativo
      var lead = generateLead(location);
      result.type = 'lead';
      result.message = 'Hai raccolto informazioni preziose!';
      result.data = lead;
    } else {
      // Nessuna informazione utile
      var nothingMessages = [
        'Nessuna informazione utile questa volta.',
        'Solo chiacchiere banali.',
        'Hai passato del tempo ma senza risultati.',
        'Le acque sono calme oggi.',
        'Nessun insider degno di nota.'
      ];
      result.message = nothingMessages[Math.floor(Math.random() * nothingMessages.length)];
    }

    // Scopri nuovi tips
    if (Math.random() < 0.3 && location.tips) {
      var undiscoveredTips = location.tips.filter(function(t) {
        return state.discoveredTips.indexOf(t) === -1;
      });
      if (undiscoveredTips.length > 0) {
        var newTip = undiscoveredTips[Math.floor(Math.random() * undiscoveredTips.length)];
        state.discoveredTips.push(newTip);
        result.newTip = newTip;
      }
    }

    return result;
  }

  function generateTip(location) {
    var companies = typeof G !== 'undefined' && G.companies ? G.companies : [];
    if (companies.length === 0) {
      return {
        ticker: 'UNKNOWN',
        hint: 'Qualcosa sta per muoversi nel mercato.',
        confidence: Math.round(40 + Math.random() * 30),
        direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
      };
    }

    var company = companies[Math.floor(Math.random() * companies.length)];
    var directions = ['bullish', 'bearish'];
    var direction = directions[Math.floor(Math.random() * directions.length)];
    
    var hints = {
      bullish: [
        'Ho sentito parlare di risultati eccezionali in arrivo.',
        'Qualcuno sta accumulando grosse posizioni.',
        'Un analista importante sta per alzare il target.',
        'Ci sono voci di un buyback imminente.',
        'Il CEO sembra molto ottimista per il prossimo trimestre.'
      ],
      bearish: [
        'Qualcuno sta scaricando posizioni importanti.',
        'Ho sentito parlare di problemi interni.',
        'Un analista sta per abbassare le stime.',
        'Ci sono voci di un\\'indagine in corso.',
        'Il sentiment sta peggiorando rapidamente.'
      ]
    };

    var hintList = hints[direction];
    var hint = hintList[Math.floor(Math.random() * hintList.length)];

    return {
      ticker: company.ticker,
      companyName: company.name,
      hint: hint,
      confidence: Math.round(50 + Math.random() * 40 + (state.locationLevels[location.id] || 1) * 2),
      direction: direction,
      source: location.name,
      expiresWeek: (typeof G !== 'undefined' ? G.week : 1) + 2
    };
  }

  function generateContact(location) {
    var roles = ['Analista Senior', 'Fund Manager', 'Insider', 'Broker', 'CEO', 'CFO', 'Giornalista Finanziario', 'Consulente'];
    var names = ['Michael R.', 'Sarah K.', 'David L.', 'Emma W.', 'James P.', 'Lisa M.', 'Robert T.', 'Anna C.'];
    
    var role = roles[Math.floor(Math.random() * roles.length)];
    var name = names[Math.floor(Math.random() * names.length)];
    
    return {
      id: 'contact_' + Date.now(),
      name: name,
      role: role,
      location: location.id,
      relationship: 50,
      usefulness: Math.round(40 + Math.random() * 40),
      metWeek: typeof G !== 'undefined' ? G.week : 1
    };
  }

  function generateLead(location) {
    var sectors = ['Tech', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'];
    var types = ['M&A', 'Earnings Beat', 'Product Launch', 'Regulatory', 'Management Change', 'Market Expansion'];
    
    var sector = sectors[Math.floor(Math.random() * sectors.length)];
    var type = types[Math.floor(Math.random() * types.length)];
    
    return {
      sector: sector,
      type: type,
      summary: 'Movimenti interessanti nel settore ' + sector + ': possibile ' + type.toLowerCase(),
      reliability: Math.round(50 + Math.random() * 40),
      location: location.id,
      week: typeof G !== 'undefined' ? G.week : 1
    };
  }

  function useLead(leadIndex, playerCash) {
    if (leadIndex < 0 || leadIndex >= state.pendingLeads.length) {
      return { success: false, error: 'Lead non valido' };
    }

    var lead = state.pendingLeads[leadIndex];
    if (lead.used) {
      return { success: false, error: 'Lead già utilizzato' };
    }

    // Costo per agire sul lead
    var actionCost = 100;
    if (playerCash < actionCost) {
      return { success: false, error: 'Fondi insufficienti', required: actionCost };
    }

    lead.used = true;
    
    // Il lead potrebbe diventare un tip specifico
    var tip = generateTipFromLead(lead);
    
    return {
      success: true,
      tip: tip,
      cost: actionCost
    };
  }

  function generateTipFromLead(lead) {
    var companies = typeof G !== 'undefined' && G.companies ? G.companies : [];
    var sectorCompanies = companies.filter(function(c) {
      return c.sector === lead.sector;
    });
    
    var company = sectorCompanies.length > 0 
      ? sectorCompanies[Math.floor(Math.random() * sectorCompanies.length)]
      : companies[Math.floor(Math.random() * companies.length)];

    return {
      ticker: company ? company.ticker : 'UNKNOWN',
      hint: lead.summary,
      confidence: lead.reliability,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      source: 'Investigazione',
      expiresWeek: (typeof G !== 'undefined' ? G.week : 1) + 3
    };
  }

  function getCurrentLocation() {
    return getLocation(state.currentLocation);
  }

  function getActiveContacts() {
    return state.activeContacts;
  }

  function getPendingLeads() {
    return state.pendingLeads.filter(function(l) { return !l.used; });
  }

  function getDiscoveredTips() {
    return state.discoveredTips;
  }

  function reset() {
    state = getDefaultState();
    saveState();
  }

  // API pubblica
  global.LocationsEngine = {
    load: loadState,
    save: saveState,
    getLocation: getLocation,
    getUnlockedLocations: getUnlockedLocations,
    unlockLocation: unlockLocation,
    visitLocation: visitLocation,
    useLead: useLead,
    getCurrentLocation: getCurrentLocation,
    getActiveContacts: getActiveContacts,
    getPendingLeads: getPendingLeads,
    getDiscoveredTips: getDiscoveredTips,
    getState: function() { return state; },
    reset: reset
  };

})(typeof window !== 'undefined' ? window : this);
