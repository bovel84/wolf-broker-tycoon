/*
 * llm-narrative-engine.js
 * Narrative Engine LLM-driven per Wolf Broker Tycoon.
 * Ogni turno il motore genera/memorizza personaggi, relazioni e eventi narrativi.
 * Lavora in tandem con GameEngine: legge lo stato, arricchisce la storia, scrive nel save.
 *
 * Restrizioni di compatibilita':
 * - solo var (no let/const)
 * - solo function tradizionali (no arrow functions)
 * - no template literals
 * - no class
 * - Promise .then/.catch (no async/await)
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  // ============================================================
  // DEFAULTS
  // ============================================================
  var DEFAULT_SETTINGS = {
    enabled: false,
    endpoint: '',
    apiKey: '',
    model: 'glm-5.2',
    temperature: 0.85,
    maxTokens: 2500,
    timeoutMs: 30000,
    maxCallsPerTurn: 3,
    newsPerTurn: 3,
    characterNotesPerTurn: 2,
    eventsPerTurn: 2
  };

  var STORAGE_KEY = 'sbt_llm_narrative_settings';

  // ============================================================
  // STATE
  // ============================================================
  var config = loadSettings();
  var callsThisTurn = 0;
  var lastTurn = 0;

  // ============================================================
  // UTILITIES
  // ============================================================
  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return 'narr_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e9).toString(36); }
  function money(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'Mrd';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'Mln';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  }
  function clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Array) {
      var arr = [];
      for (var i = 0; i < obj.length; i++) arr.push(clone(obj[i]));
      return arr;
    }
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = clone(obj[k]);
    return out;
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  function getDefaultSettings() {
    var copy = {};
    for (var k in DEFAULT_SETTINGS) if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, k)) copy[k] = DEFAULT_SETTINGS[k];
    return copy;
  }

  function loadSettings() {
    var defaults = getDefaultSettings();
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in saved) if (Object.prototype.hasOwnProperty.call(saved, k)) defaults[k] = saved[k];
      }
    } catch (e) {}
    return defaults;
  }

  function saveSettings(settings) {
    if (!settings) settings = {};
    var current = loadSettings();
    for (var k in settings) if (Object.prototype.hasOwnProperty.call(settings, k)) current[k] = settings[k];
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {}
    config = current;
    return current;
  }

  function getSettings() { return loadSettings(); }

  // ============================================================
  // NARRATIVE STATE ATTACHED TO GAME STATE
  // ============================================================
  function ensureNarrativeState(gameState) {
    if (!gameState) return null;
    if (!gameState.narrative || typeof gameState.narrative !== 'object') {
      gameState.narrative = createNarrativeState();
    }
    var ns = gameState.narrative;
    if (!ns.characters) ns.characters = {};
    if (!ns.events) ns.events = [];
    if (!ns.relationships) ns.relationships = {};
    if (!ns.memories) ns.memories = [];
    if (!ns.companyLore) ns.companyLore = {};
    if (!ns.lastGeneratedWeek) ns.lastGeneratedWeek = 0;
    return ns;
  }

  function createNarrativeState() {
    return {
      characters: {},
      events: [],
      relationships: {},
      memories: [],
      companyLore: {},
      lastGeneratedWeek: 0
    };
  }

  // ============================================================
  // CHARACTER REGISTRY
  // ============================================================
  function makeCharacterId(namespace, name) {
    return namespace + ':' + (name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  function getOrCreateCharacter(ns, gameState, baseInfo) {
    var nsState = ensureNarrativeState(gameState);
    var id = makeCharacterId(ns, baseInfo.name);
    var c = nsState.characters[id];
    if (!c) {
      c = {
        id: id,
        name: baseInfo.name,
        namespace: ns,
        role: baseInfo.role || 'Personaggio',
        archetype: baseInfo.archetype || pick(['ambizioso', 'prudente', 'cinico', 'leale', 'opportunista', 'idealista', 'vendicativo', 'visionario']),
        traits: baseInfo.traits || generateTraits(),
        backstory: baseInfo.backstory || '',
        currentMood: 'neutrale',
        currentGoal: '',
        memory: [],
        relationships: {},
        stats: {
          trust: 50,
          fear: 0,
          respect: 50,
          affection: 0,
          suspicion: 0
        },
        createdWeek: gameState.player.week || 1,
        lastSeenWeek: gameState.player.week || 1,
        active: true
      };
      nsState.characters[id] = c;
    }
    c.lastSeenWeek = gameState.player.week || 1;
    return c;
  }

  function generateTraits() {
    var pool = ['ambizioso', 'prudente', 'cinico', 'leale', 'opportunista', 'idealista', 'vendicativo', 'visionario', 'paranoico', 'generoso', 'manipolatore', 'onesto', 'coraggioso', 'insicuro', 'freddo', 'passionale'];
    return [pick(pool), pick(pool)];
  }

  function ensureKeyCharacters(gameState) {
    var p = gameState.player;
    var chars = [];

    // Player
    chars.push(getOrCreateCharacter('player', gameState, {
      name: p.name || 'Broker',
      role: 'Protagonista',
      archetype: pick(['ambizioso', 'cinico', 'visionario']),
      traits: ['ambizioso', 'opportunista'],
      backstory: 'Giovane broker che entra a Wall Street con 10.000 euro e un sogno.'
    }));

    // Fixed story NPCs if not already
    var fixedNPCs = [
      { name: 'Jordan Belfort', role: 'Mentore cinico', traits: ['manipolatore', 'cinico'] },
      { name: 'Naomi', role: 'Moglie', traits: ['leale', 'prudente'] },
      { name: 'Donnie Azoff', role: 'Amico leale', traits: ['leale', 'paranoico'] },
      { name: 'Patrick Combs', role: 'Commissario SEC', traits: ['onesto', 'vendicativo'] },
      { name: 'Ken Savage', role: 'Rivale', traits: ['opportunista', 'freddo'] },
      { name: 'Brad Bodnick', role: 'Contatto insider', traits: ['cinico', 'paranoico'] }
    ];
    for (var i = 0; i < fixedNPCs.length; i++) {
      chars.push(getOrCreateCharacter('npc', gameState, fixedNPCs[i]));
    }

    // Clients as characters
    var clients = gameState.clients || [];
    for (var c = 0; c < clients.length; c++) {
      var cl = clients[c];
      if (!cl.name) continue;
      chars.push(getOrCreateCharacter('client', gameState, {
        name: cl.name,
        role: 'Cliente ' + (cl.riskProfile || 'moderate'),
        traits: generateTraits(),
        backstory: 'Affidato ' + money(cl.capital || 100000) + ' al broker.'
      }));
    }

    // Agents as characters
    var agents = gameState.agents || [];
    for (var a = 0; a < agents.length; a++) {
      var ag = agents[a];
      if (!ag.name) continue;
      chars.push(getOrCreateCharacter('agent', gameState, {
        name: ag.name,
        role: 'Agente ' + (ag.skill || 'trading'),
        traits: generateTraits(),
        backstory: 'Assunto per ' + (ag.skill || 'trading') + '.'
      }));
    }

    // Top competitors as characters
    var competitors = (gameState.competitors && gameState.competitors.list) ? gameState.competitors.list : [];
    for (var r = 0; r < competitors.length && r < 5; r++) {
      var comp = competitors[r];
      if (!comp.name) continue;
      chars.push(getOrCreateCharacter('competitor', gameState, {
        name: comp.name,
        role: 'Competitor ' + (comp.strategy || 'mixed'),
        traits: generateTraits(),
        backstory: 'Rivale di mercato con capitale ' + money(comp.capital || 1000000) + '.'
      }));
    }

    // CEOs / executives for owned companies
    var companies = (gameState.market && gameState.market.companies) ? gameState.market.companies : [];
    for (var ci = 0; ci < companies.length; ci++) {
      var co = companies[ci];
      if (!co.name) continue;
      // Generate a CEO character per company with >1% ownership or any event
      var pos = gameState.portfolio && gameState.portfolio.positions ? gameState.portfolio.positions[co.id] : null;
      if (pos && pos.shares > co.sharesOutstanding * 0.01) {
        var ceoName = co.ceoName || (co.name.split(' ')[0] + ' CEO');
        chars.push(getOrCreateCharacter('ceo', gameState, {
          name: ceoName,
          role: 'CEO di ' + co.name,
          traits: generateTraits(),
          backstory: 'Amministratore delegato di ' + co.name + ' (' + co.ticker + ').'
        }));
      }
    }

    return chars;
  }

  // ============================================================
  // MEMORY BANK
  // ============================================================
  function addMemory(gameState, fact) {
    var ns = ensureNarrativeState(gameState);
    var mem = {
      id: uid(),
      week: gameState.player.week,
      year: gameState.player.year,
      type: fact.type || 'generic',
      text: fact.text || '',
      actors: fact.actors || [],
      company: fact.company || null,
      impact: fact.impact || 'neutral',
      importance: clamp(fact.importance || 5, 1, 10)
    };
    ns.memories.unshift(mem);
    if (ns.memories.length > 200) ns.memories.pop();

    // Link memory to characters
    for (var i = 0; i < (fact.actors || []).length; i++) {
      var actorId = fact.actors[i];
      var c = ns.characters[actorId];
      if (c) {
        c.memory.unshift(mem.id);
        if (c.memory.length > 30) c.memory.pop();
      }
    }
  }

  function getRecentMemories(gameState, count) {
    var ns = ensureNarrativeState(gameState);
    return (ns.memories || []).slice(0, count || 10);
  }

  function getCharacterMemories(gameState, characterId, count) {
    var ns = ensureNarrativeState(gameState);
    var c = ns.characters[characterId];
    if (!c || !c.memory) return [];
    var out = [];
    for (var i = 0; i < c.memory.length && out.length < (count || 5); i++) {
      var mem = findMemoryById(ns, c.memory[i]);
      if (mem) out.push(mem);
    }
    return out;
  }

  function findMemoryById(ns, id) {
    for (var i = 0; i < ns.memories.length; i++) if (ns.memories[i].id === id) return ns.memories[i];
    return null;
  }

  // ============================================================
  // RELATIONSHIP WEB
  // ============================================================
  function setRelationship(gameState, aId, bId, delta, reason) {
    var ns = ensureNarrativeState(gameState);
    if (!ns.relationships[aId]) ns.relationships[aId] = {};
    var rel = ns.relationships[aId][bId];
    if (!rel) rel = { value: 0, history: [] };
    rel.value = clamp(rel.value + delta, -100, 100);
    rel.history.unshift({ week: gameState.player.week, delta: delta, reason: reason || '' });
    if (rel.history.length > 20) rel.history.pop();
    ns.relationships[aId][bId] = rel;

    // Mirror
    if (!ns.relationships[bId]) ns.relationships[bId] = {};
    var relB = ns.relationships[bId][aId] || { value: 0, history: [] };
    relB.value = rel.value;
    relB.history.unshift({ week: gameState.player.week, delta: delta, reason: reason || '' });
    if (relB.history.length > 20) relB.history.pop();
    ns.relationships[bId][aId] = relB;
  }

  function getRelationship(gameState, aId, bId) {
    var ns = ensureNarrativeState(gameState);
    return (ns.relationships[aId] && ns.relationships[aId][bId]) ? ns.relationships[aId][bId].value : 0;
  }

  // ============================================================
  // PROMPT COMPOSER
  // ============================================================
  function buildCharacterPrompt(gameState) {
    var p = gameState.player;
    var ns = ensureNarrativeState(gameState);
    var chars = ensureKeyCharacters(gameState);

    var charList = [];
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      charList.push('- ' + c.name + ' (' + c.role + ', ' + c.archetype + ', tratti: ' + (c.traits || []).join(', ') + ')');
    }

    var memories = getRecentMemories(gameState, 8);
    var memText = [];
    for (var m = 0; m < memories.length; m++) {
      memText.push('- Sett.' + memories[m].week + ': ' + memories[m].text);
    }

    var recentEvents = [];
    for (var e = 0; e < ns.events.length && e < 6; e++) {
      recentEvents.push('- Sett.' + ns.events[e].week + ': ' + ns.events[e].title + ' - ' + ns.events[e].summary);
    }

    return 'Sei il Narratore di Wolf of Wall Street Broker Tycoon. ' +
      'Genera aggiornamenti narrativi per i personaggi di questa partita.\n\n' +
      'CONTESTO:\n' +
      '- Settimana: ' + p.week + ', Anno: ' + p.year + '\n' +
      '- Giocatore: ' + (p.name || 'Broker') + ', livello ' + p.level + ', patrimonio ' + money(p.netWorth) + '\n' +
      '- Etica: ' + p.ethics + '/100, Reputazione SEC: ' + (p.reputation ? p.reputation.sec : 50) + '/100\n\n' +
      'PERSONAGGI ATTIVI:\n' + charList.join('\n') + '\n\n' +
      'MEMORIE RECENTI:\n' + (memText.length ? memText.join('\n') : '- Nessuna memoria') + '\n\n' +
      'EVENTI RECENTI:\n' + (recentEvents.length ? recentEvents.join('\n') : '- Nessun evento') + '\n\n' +
      'ISTRUZIONI:\n' +
      'Genera esattamente ' + config.characterNotesPerTurn + ' aggiornamenti narrativi brevi (1-2 frasi ciascuno).\n' +
      'Ogni aggiornamento deve coinvolgere un personaggio, reagire a un evento o memoria recente, e cambiare leggermente un rapporto.\n' +
      'Rispondi SOLO con un array JSON valido del formato:\n' +
      '[{"characterName":"Nome","note":"frase narrativa","relationshipDelta":-5,"relationshipTarget":"altro Nome o player","mood":"allarmato|fiducioso|arrabbiato|sorpreso|deluso"}]';
  }

  function buildNewsPrompt(gameState) {
    var p = gameState.player;
    var market = gameState.market || {};
    var companies = (market.companies || []).slice(0, 12);

    var companyList = [];
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      companyList.push('- ' + c.name + ' (' + c.ticker + ', settore ' + (c.sector || 'N/D') + ', prezzo ' + c.price.toFixed(2) + ')');
    }

    var recent = getRecentMemories(gameState, 5);
    var recentText = [];
    for (var r = 0; r < recent.length; r++) recentText.push('- ' + recent[r].text);

    return 'Sei un giornalista finanziario del Wall Street Journal degli anni \'90. ' +
      'Scrivi notizie di mercato in italiano, vivaci e sensazionalistiche. ' +
      'Le notizie devono raccontare una storia coerente con i personaggi e gli eventi recenti.\n\n' +
      'CONTESTO:\n' +
      '- Settimana: ' + p.week + ', Anno: ' + p.year + '\n' +
      '- Sentiment mercato: ' + market.sentiment + '/100\n' +
      '- Pil: ' + (market.macro ? market.macro.gdpGrowth : 2.5) + '%, inflazione: ' + (market.macro ? market.macro.inflation : 2.0) + '%\n\n' +
      'SOCIETA\':\n' + companyList.join('\n') + '\n\n' +
      'MEMORIE RECENTI (usale per rendere le notizie coerenti):\n' + (recentText.length ? recentText.join('\n') : '- Nessuna') + '\n\n' +
      'ISTRUZIONI:\n' +
      'Genera esattamente ' + config.newsPerTurn + ' notizie. Ogni notizia deve avere titolo, contenuto, impatto (positive/negative/neutral), settore, societa\' coinvolta (o null), e cambio prezzo % realistico.\n' +
      'Rispondi SOLO con un array JSON valido del formato:\n' +
      '[{"title":"...","content":"...","impact":"positive","sector":"TECH","company":"Nome societa o null","priceChangePct":3.2}]';
  }

  function buildEventsPrompt(gameState) {
    var p = gameState.player;
    var ns = ensureNarrativeState(gameState);
    var companies = (gameState.market && gameState.market.companies) ? gameState.market.companies.slice(0, 8) : [];

    var playerName = p.name || 'Broker';
    var portfolio = [];
    var posKeys = gameState.portfolio && gameState.portfolio.positions ? Object.keys(gameState.portfolio.positions) : [];
    for (var i = 0; i < posKeys.length; i++) {
      var pos = gameState.portfolio.positions[posKeys[i]];
      portfolio.push('- ' + (pos.ticker || posKeys[i]) + ': ' + pos.shares + ' azioni');
    }

    return 'Sei il Game Master narrativo di Wolf of Wall Street Broker Tycoon. ' +
      'Genera eventi di trama che coinvolgono il giocatore, i suoi personaggi e le societa\'.\n\n' +
      'CONTESTO:\n' +
      '- Giocatore: ' + playerName + ', livello ' + p.level + ', patrimonio ' + money(p.netWorth) + ', etica ' + p.ethics + '/100\n' +
      '- Settimana: ' + p.week + '\n' +
      '- Portafoglio:\n' + (portfolio.length ? portfolio.join('\n') : '- Nessuna posizione') + '\n\n' +
      'ISTRUZIONI:\n' +
      'Genera esattamente ' + config.eventsPerTurn + ' eventi narrativi brevi. Ogni evento deve coinvolgere un personaggio o una societa\', e suggerire una conseguenza sul gioco.\n' +
      'Rispondi SOLO con un array JSON valido del formato:\n' +
      '[{"type":"encounter|company|personal|rival","actor":"Nome personaggio","target":"player o nome","title":"titolo evento","summary":"2-3 frasi","consequence":"suggerimento gameplay","impact":"positive|negative|neutral"}]';
  }

  // ============================================================
  // LLM CALL
  // ============================================================
  function fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('Timeout dopo ' + timeoutMs + 'ms'));
      }, timeoutMs);
      var opts = options || {};
      if (controller) opts.signal = controller.signal;
      global.fetch(url, opts).then(function (res) { clearTimeout(timer); resolve(res); }, function (err) { clearTimeout(timer); reject(err); });
    });
  }

  function callLLM(systemPrompt, userPrompt) {
    if (CONFIG.enabled === false || !config.endpoint || !config.apiKey) {
      return Promise.resolve(null);
    }
    if (callsThisTurn >= config.maxCallsPerTurn) {
      return Promise.resolve(null);
    }
    callsThisTurn++;

    var body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      format: 'json',
      stream: false,
      options: { temperature: config.temperature, num_predict: config.maxTokens }
    };

    return fetchWithTimeout(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.apiKey },
      body: JSON.stringify(body)
    }, config.timeoutMs).then(function (response) {
      if (!response.ok) return null;
      return response.json().then(function (data) {
        var content = data.message || (data.choices && data.choices[0] && data.choices[0].message) || data;
        return typeof content === 'string' ? content : (content.content || content.text || '');
      });
    }).catch(function () { return null; });
  }

  function parseJsonArray(text) {
    if (!text || typeof text !== 'string') return null;
    var cleaned = text.trim();
    var fence = String.fromCharCode(96, 96, 96);
    if (cleaned.indexOf(fence) === 0) {
      cleaned = cleaned.replace(new RegExp('^' + fence + '(?:json)?\\n?'), '').replace(new RegExp('\\n?' + fence + '$'), '');
    }
    var start = cleaned.indexOf('[');
    var end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    try {
      var parsed = JSON.parse(cleaned.substring(start, end + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      try {
        var match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          var parsed2 = JSON.parse(match[0]);
          return Array.isArray(parsed2) ? parsed2 : null;
        }
      } catch (e2) {}
      return null;
    }
  }

  // ============================================================
  // APPLY NARRATIVE OUTPUTS
  // ============================================================
  function applyCharacterNotes(gameState, notes) {
    if (!notes || !notes.length) return;
    var ns = ensureNarrativeState(gameState);
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      if (!note.characterName || !note.note) continue;
      var c = getOrCreateCharacter('npc', gameState, { name: note.characterName, role: 'Personaggio' });
      c.currentMood = note.mood || c.currentMood || 'neutrale';
      c.memory.unshift({ id: uid(), week: gameState.player.week, text: note.note, type: 'note' });
      if (c.memory.length > 30) c.memory.pop();
      if (note.relationshipTarget && typeof note.relationshipDelta === 'number') {
        var targetName = note.relationshipTarget === 'player' ? (gameState.player.name || 'Broker') : note.relationshipTarget;
        var targetId = makeCharacterId(note.relationshipTarget === 'player' ? 'player' : 'npc', targetName);
        setRelationship(gameState, c.id, targetId, note.relationshipDelta, note.note);
      }
      addMemory(gameState, { type: 'character', text: c.name + ' (' + c.currentMood + '): ' + note.note, actors: [c.id], importance: 6 });
    }
  }

  function applyEvents(gameState, events) {
    if (!events || !events.length) return;
    var ns = ensureNarrativeState(gameState);
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (!ev.title) continue;
      ns.events.unshift({
        id: uid(),
        week: gameState.player.week,
        type: ev.type || 'generic',
        actor: ev.actor || '',
        target: ev.target || 'player',
        title: ev.title,
        summary: ev.summary || '',
        consequence: ev.consequence || '',
        impact: ev.impact || 'neutral'
      });
      addMemory(gameState, { type: 'event', text: ev.title + ': ' + (ev.summary || ''), actors: [ev.actor || 'npc:unknown'], importance: 7 });
    }
    if (ns.events.length > 100) ns.events.pop();
  }

  function normalizeNews(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = raw.title || raw.titolo || '';
    var content = raw.content || raw.contenuto || '';
    if (!title || !content) return null;
    return {
      title: title,
      content: content,
      impact: (raw.impact || raw.impatto || 'neutral').toLowerCase(),
      sector: raw.sector || raw.settore || null,
      company: raw.company || raw.societa || null,
      priceChangePct: Number(raw.priceChangePct || raw.priceChange || raw.cambioPrezzoPct || 0)
    };
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  function processTurn(gameState) {
    if (!gameState) return Promise.resolve(null);
    var p = gameState.player;
    if (!p) return Promise.resolve(null);

    // Reset rate limiter on new turn
    if (lastTurn !== p.week) {
      callsThisTurn = 0;
      lastTurn = p.week;
    }

    var ns = ensureNarrativeState(gameState);
    if (ns.lastGeneratedWeek >= p.week) return Promise.resolve(null);
    ns.lastGeneratedWeek = p.week;

    // Pre-populate characters from current game state
    ensureKeyCharacters(gameState);

    // Se LLM disabilitato, aggiungi solo memorie di fallback basate sullo stato
    if (!config.enabled || !config.endpoint || !config.apiKey) {
      addStateBasedMemories(gameState);
      return Promise.resolve({ news: [], notes: [], events: [] });
    }

    // Parallel LLM calls (up to 3)
    var promises = [
      callLLM('Sei il narratore di un videogioco di finanza. Rispondi solo con JSON.', buildNewsPrompt(gameState)),
      callLLM('Sei il narratore di un videogioco di finanza. Rispondi solo con JSON.', buildCharacterPrompt(gameState)),
      callLLM('Sei il narratore di un videogioco di finanza. Rispondi solo con JSON.', buildEventsPrompt(gameState))
    ];

    return Promise.all(promises).then(function (results) {
      var newsRaw = parseJsonArray(results[0]) || [];
      var notesRaw = parseJsonArray(results[1]) || [];
      var eventsRaw = parseJsonArray(results[2]) || [];

      var news = [];
      for (var n = 0; n < newsRaw.length; n++) {
        var norm = normalizeNews(newsRaw[n]);
        if (norm) news.push(norm);
      }

      // Persist generated news into game state for LLMNewsEngine to pick up
      if (!gameState.market.generatedNews) gameState.market.generatedNews = [];
      for (var g = 0; g < news.length; g++) {
        news[g].source = 'narrative';
        gameState.market.generatedNews.push(news[g]);
      }
      if (gameState.market.generatedNews.length > 50) gameState.market.generatedNews.shift();

      applyCharacterNotes(gameState, notesRaw);
      applyEvents(gameState, eventsRaw);

      // Add state-based memories even with LLM, to ground narrative
      addStateBasedMemories(gameState);

      return { news: news, notes: notesRaw, events: eventsRaw };
    }).catch(function () {
      addStateBasedMemories(gameState);
      return { news: [], notes: [], events: [] };
    });
  }

  function addStateBasedMemories(gameState) {
    var p = gameState.player;
    var changes = [];
    if (p.netWorth > 100000) changes.push('Patrimonio superiore a 100K euro.');
    if (p.netWorth > 1000000) changes.push('Patrimonio superiore a 1 milione: il broker e\' ora un milionario.');
    if (p.level > 1) changes.push('Sbloccato livello ' + p.level + ': ' + (p.level === 2 ? 'limit orders' : p.level === 3 ? 'short selling' : p.level === 4 ? 'margin 2x' : 'nuovi strumenti'));
    if (p.ethics < 30) changes.push('Etica in caduta libera: il broker e\' considerato spregiudicato.');
    if (p.ethics > 70) changes.push('Etica solida: il broker gode di rispetto morale.');
    if ((gameState.portfolio && gameState.portfolio.realizedPnL) > 50000) changes.push('Profitti realizzati significativi.');

    if (changes.length === 0) {
      changes.push('Settimana ' + p.week + ': il broker inizia la scalata da ' + money(p.netWorth) + ' euro.');
    }

    for (var i = 0; i < changes.length; i++) {
      addMemory(gameState, { type: 'state', text: changes[i], actors: ['player:broker'], importance: 5 });
    }
  }

  function getCharacter(gameState, id) {
    var ns = ensureNarrativeState(gameState);
    return ns.characters[id] || null;
  }

  function getCharacters(gameState) {
    var ns = ensureNarrativeState(gameState);
    return ns.characters || {};
  }

  function getEvents(gameState) {
    var ns = ensureNarrativeState(gameState);
    return (ns.events || []).slice(0, 20);
  }

  function getMemories(gameState) {
    var ns = ensureNarrativeState(gameState);
    return (ns.memories || []).slice(0, 30);
  }

  function configure(settings) { return saveSettings(settings); }

  function isEnabled() { return config.enabled; }

  // ============================================================
  // EXPORTS
  // ============================================================
  global.LLMNarrativeEngine = {
    version: VERSION,
    configure: configure,
    getSettings: getSettings,
    processTurn: processTurn,
    ensureNarrativeState: ensureNarrativeState,
    ensureKeyCharacters: ensureKeyCharacters,
    getCharacter: getCharacter,
    getCharacters: getCharacters,
    getEvents: getEvents,
    getMemories: getMemories,
    getCharacterMemories: getCharacterMemories,
    setRelationship: setRelationship,
    getRelationship: getRelationship,
    addMemory: addMemory,
    isEnabled: isEnabled
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.LLMNarrativeEngine;
})(typeof window !== 'undefined' ? window : this);
