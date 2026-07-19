/*
 * llm-game-master.js
 * LLM Game Master per Wolf of Wall Street Broker Tycoon
 * Versione 4.0.0 - Usa Ollama Cloud via proxy Vercel
 * Genera contenuto dinamico: notizie, decisioni competitor, dialoghi, eventi.
 *
 * Restrizioni di compatibilita':
 * - Solo apici singoli con concatenazione (no template literals)
 * - Solo function tradizionali (no arrow functions)
 * - Solo var (no let/const)
 * - Solo Promise .then/.catch (no async/await)
 */
(function (global) {
  'use strict';

  // ============================================================
  // CONFIGURAZIONE DEFAULT
  // ============================================================

  var DEFAULT_SETTINGS = {
    endpoint: 'https://ollama-cors-proxy.vercel.app/api/chat',
    apiKey: '',
    model: 'glm-5.2',
    enabled: true,
    temperature: 0.8,
    maxTokens: 2000,
    timeout: 30000,
    cacheSize: 20,
    rateLimitPerTurn: 3
  };

  var STORAGE_KEY = 'sbt_llm_settings';

  // ============================================================
  // STATO INTERNO
  // ============================================================

  var CONFIG = _loadSettings();
  var cache = [];
  var stats = { totalCalls: 0, cacheHits: 0, errors: 0, turnCalls: 0 };

  // ============================================================
  // GESTIONE IMPOSTAZIONI
  // ============================================================

  function _getDefaultSettings() {
    var copy = {};
    for (var k in DEFAULT_SETTINGS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, k)) {
        copy[k] = DEFAULT_SETTINGS[k];
      }
    }
    return copy;
  }

  function _loadSettings() {
    var defaults = _getDefaultSettings();
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in saved) {
          if (Object.prototype.hasOwnProperty.call(saved, k)) {
            defaults[k] = saved[k];
          }
        }
      }
    } catch (e) {
      // localStorage non disponibile o JSON invalido
    }
    return defaults;
  }

  function saveSettings(settings) {
    if (!settings) settings = {};
    var current = _loadSettings();
    for (var k in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, k)) {
        current[k] = settings[k];
      }
    }
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      }
    } catch (e) {
      // ignore
    }
    CONFIG = current;
    return current;
  }

  function getSettings() {
    return _loadSettings();
  }

  // ============================================================
  // SYSTEM PROMPT
  // ============================================================

  var SYSTEM_PROMPT = 'Sei il Game Master del gioco Wolf of Wall Street Broker Tycoon. ' +
    'Generi contenuto dinamico che guida il mondo di gioco: notizie di mercato, ' +
    'decisioni dei competitor AI, dialoghi narrativi, eventi mondiali. ' +
    'Stile: giornale finanziario anni \'90, vivace e sensazionalistico. ' +
    'Lingua: italiano. Rispondi SEMPRE con JSON valido.';

  // ============================================================
  // UTILITY: deep clone semplice
  // ============================================================

  function clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Array) {
      var arr = [];
      for (var i = 0; i < obj.length; i++) arr.push(clone(obj[i]));
      return arr;
    }
    var out = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = clone(obj[k]);
    }
    return out;
  }

  // ============================================================
  // CACHE LRU
  // ============================================================

  function cacheGet(key) {
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].key === key) {
        var entry = cache[i];
        cache.splice(i, 1);
        cache.push(entry);
        return entry.value;
      }
    }
    return undefined;
  }

  function cacheSet(key, value) {
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].key === key) cache.splice(i, 1);
    }
    cache.push({ key: key, value: value });
    while (cache.length > CONFIG.cacheSize) cache.shift();
  }

  // ============================================================
  // RATE LIMITING
  // ============================================================

  function canCall() {
    return stats.turnCalls < CONFIG.rateLimitPerTurn;
  }

  function resetTurn() {
    stats.turnCalls = 0;
  }

  // ============================================================
  // CHIAMATA API OLLAMA CLOUD via PROXY VERCEL
  // ============================================================

  function callAPI(messages) {
    return new Promise(function (resolve, reject) {
      // Se LLM disabilitato, restituisci errore per trigger fallback
      if (CONFIG.enabled === false) {
        reject(new Error('LLM disabilitato'));
        return;
      }

      if (!CONFIG.apiKey) {
        reject(new Error('API key non configurata'));
        return;
      }

      stats.totalCalls++;
      stats.turnCalls++;

      var body = JSON.stringify({
        model: CONFIG.model,
        messages: messages,
        stream: false,
        options: {
          temperature: CONFIG.temperature,
          num_predict: CONFIG.maxTokens
        }
      });

      var xhr = new XMLHttpRequest();
      xhr.open('POST', CONFIG.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + CONFIG.apiKey);
      xhr.timeout = CONFIG.timeout;

      xhr.ontimeout = function () {
        stats.errors++;
        reject(new Error('Timeout API (' + CONFIG.timeout + 'ms)'));
      };

      xhr.onerror = function () {
        stats.errors++;
        reject(new Error('Errore di rete API'));
      };

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var resp = JSON.parse(xhr.responseText);
            // Ollama Cloud format: { message: { content: "..." } }
            // OpenAI format: { choices: [{ message: { content: "..." } }] }
            var content = resp.message || (resp.choices && resp.choices[0] && resp.choices[0].message) || resp;
            var text = typeof content === 'string' ? content : (content.content || content.text || '');
            var parsed = tryParseJSON(text);
            resolve(parsed !== null ? parsed : text);
          } catch (e) {
            stats.errors++;
            reject(new Error('Risposta API non valida: ' + e.message));
          }
        } else {
          stats.errors++;
          reject(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
        }
      };

      xhr.send(body);
    });
  }

  // ============================================================
  // TRY PARSE JSON (gestisce markdown code fences)
  // ============================================================

  function tryParseJSON(text) {
    if (!text || typeof text !== 'string') return null;
    var fence = String.fromCharCode(96,96,96);
    var reJson = new RegExp(fence + 'json\\s*', 'gi');
    var reFence = new RegExp(fence + '\\s*', 'g');
    var cleaned = text.replace(reJson, '').replace(reFence, '').trim();
    var start = -1;
    var end = -1;
    for (var i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{' || cleaned[i] === '[') { start = i; break; }
    }
    for (var j = cleaned.length - 1; j >= 0; j--) {
      if (cleaned[j] === '}' || cleaned[j] === ']') { end = j + 1; break; }
    }
    if (start === -1 || end === -1) return null;
    var slice = cleaned.substring(start, end);
    try {
      return JSON.parse(slice);
    } catch (e) {
      return null;
    }
  }

  // ============================================================
  // SAFE CALL: chiama API con cache + fallback
  // ============================================================

  function safeCall(cacheKey, messages, fallback) {
    var cached = cacheGet(cacheKey);
    if (cached) {
      stats.cacheHits++;
      return Promise.resolve(cached);
    }
    if (!canCall()) {
      return Promise.resolve(fallback);
    }
    return callAPI(messages).then(function (result) {
      cacheSet(cacheKey, result);
      return result;
    }).catch(function () {
      return fallback;
    });
  }

  // ============================================================
  // COSTRUISCI USER PROMPT PER NOTIZIE
  // ============================================================

  function buildNewsPrompt(gameState) {
    var companies = gameState.companies || [];
    var recent = gameState.recentNews || [];
    var sentiment = gameState.marketSentiment || 50;
    var week = gameState.week || 1;
    var year = gameState.year || 1987;

    var prompt = 'Settimana ' + week + ', Anno ' + year + '. ';
    prompt += 'Sentiment di mercato: ' + sentiment + '/100. ';
    prompt += 'Genera 3-5 notizie di mercato in italiano. ';
    prompt += 'Aziende disponibili: ';
    for (var i = 0; i < companies.length; i++) {
      prompt += companies[i].ticker + ' (' + companies[i].name + ', ' + companies[i].sector + ', prezzo $' + companies[i].price + '), ';
    }
    if (recent.length > 0) {
      prompt += 'Ultime notizie: ';
      for (var j = 0; j < recent.length; j++) {
        prompt += '"' + (recent[j].title || '') + '" ';
      }
    }
    prompt += 'Rispondi con JSON array. Ogni notizia: {title, content, impact, sector, company, priceChangePct}. ';
    prompt += 'impact deve essere "positive", "negative" o "neutral". priceChangePct tra -15 e +15.';
    return prompt;
  }

  // ============================================================
  // COSTRUISCI USER PROMPT PER COMPETITOR ACTIONS
  // ============================================================

  function buildCompetitorPrompt(competitors, gameState) {
    var comps = competitors || [];
    var companies = gameState.companies || [];
    var sentiment = gameState.marketSentiment || 50;
    var week = gameState.week || 1;

    var prompt = 'Settimana ' + week + '. Sentiment: ' + sentiment + '. ';
    prompt += 'Aziende: ';
    for (var i = 0; i < companies.length; i++) {
      prompt += companies[i].ticker + ' ($' + companies[i].price + ', PE ' + companies[i].peRatio + '), ';
    }
    prompt += 'Competitor AI: ';
    for (var j = 0; j < comps.length; j++) {
      prompt += comps[j].nickname + ' (strategia: ' + (comps[j].strategy || 'balanced') + ', capitale: ' + (comps[j].capital || 0) + ', relazione: ' + (comps[j].relationship || 'neutral') + ', obiettivo: ' + (comps[j].goal || 'rendimento') + ', piano: ' + (comps[j].worldPlan || 'nessuno') + ', convinzione: ' + (comps[j].conviction || 50) + '), ';
    }
    prompt += 'Per ogni competitor genera una decisione. ';
    prompt += 'Rispondi con JSON array, uno per competitor: ';
    prompt += '{nickname, action, target, quantity, reason, aggression}. ';
    prompt += 'action: "buy"|"sell"|"hold"|"short"|"cover". target: ticker o null. ';
    prompt += 'quantity: numero. reason: motivazione in italiano (1 frase). aggression: 1-10.';
    return prompt;
  }

  // ============================================================
  // COSTRUISCI USER PROMPT PER DIALOGO NPC
  // ============================================================

  function buildDialoguePrompt(npc, context, gameState) {
    var week = gameState.week || 1;
    var year = gameState.year || 1987;
    var level = gameState.level || 1;
    var rep = gameState.reputation || 50;
    var netWorth = gameState.netWorth || 0;

    var prompt = 'Settimana ' + week + ', Anno ' + year + '. Livello giocatore: ' + level + '. ';
    prompt += 'Reputazione: ' + rep + '/100. Patrimonio: $' + netWorth + '. ';
    prompt += 'NPC: ' + (npc.name || 'Sconosciuto') + ', ruolo: ' + (npc.role || 'NPC') + '. ';
    prompt += 'Contesto situazione: ' + (context || 'Interazione generica') + '. ';
    prompt += 'Genera un dialogo narrativo in italiano (2-4 frasi). ';
    prompt += 'Rispondi con JSON: {text, emotion, choices}. ';
    prompt += 'emotion: "angry"|"happy"|"worried"|"confident"|"neutral". ';
    prompt += 'choices: array di 2-3 stringhe (opzioni di risposta del giocatore).';
    return prompt;
  }

  // ============================================================
  // COSTRUISCI USER PROMPT PER EVENTO MONDIALE
  // ============================================================

  function buildEventPrompt(gameState) {
    var week = gameState.week || 1;
    var year = gameState.year || 1987;
    var sentiment = gameState.marketSentiment || 50;
    var level = gameState.level || 1;

    var prompt = 'Settimana ' + week + ', Anno ' + year + '. Sentiment: ' + sentiment + '. Livello: ' + level + '. ';
    prompt += 'Genera un evento mondiale casuale che impatta i mercati. ';
    prompt += 'Puo\' essere: crisi, boom, scandalo, opportunita\', disastro naturale, decisione politica. ';
    prompt += 'Rispondi con JSON: {type, title, description, impact, affectedSectors, severity, durationWeeks}. ';
    prompt += 'type: "crisis"|"boom"|"scandal"|"opportunity"|"disaster"|"political". ';
    prompt += 'impact: "positive"|"negative"|"mixed". severity: 1-10. durationWeeks: 1-8. ';
    prompt += 'affectedSectors: array di stringhe.';
    return prompt;
  }

  // ============================================================
  // COSTRUISCI USER PROMPT PER MARKET COMMENTARY
  // ============================================================

  function buildCommentaryPrompt(gameState) {
    var week = gameState.week || 1;
    var sentiment = gameState.marketSentiment || 50;
    var companies = gameState.companies || [];
    var recent = gameState.recentNews || [];
    var phase = (sentiment > 60) ? 'rally' : (sentiment < 40 ? 'bear' : 'laterale');

    var prompt = 'Settimana ' + week + '. Fase di mercato: ' + phase + '. Sentiment: ' + sentiment + '. ';
    prompt += 'Principali titoli: ';
    for (var i = 0; i < companies.length && i < 5; i++) {
      prompt += companies[i].ticker + ' ($' + companies[i].price + '), ';
    }
    if (recent.length > 0) {
      prompt += 'Notizie recenti: ';
      for (var j = 0; j < recent.length; j++) {
        prompt += '"' + (recent[j].title || '') + '" ';
      }
    }
    prompt += 'Genera un commento di mercato stile "opening bell" o "closing bell" in italiano, vivace, anni \'90. ';
    prompt += 'Rispondi con JSON: {bell, text, mood, topMovers}. ';
    prompt += 'bell: "opening"|"closing". mood: "bullish"|"bearish"|"neutral". ';
    prompt += 'topMovers: array di {ticker, direction, pctChange}.';
    return prompt;
  }

  // ============================================================
  // FALLBACK: NOTIZIE
  // ============================================================

  function fallbackNews() {
    var templates = [
      {
        title: 'Wall Street respira: rialzo sorpresa dei titoli tecnologici',
        content: 'I trader piu\' scettici sono stati colti di sorpresa oggi quando un improvviso afflusso di ordini ha spinto i titoli tecnologici al rialzo.',
        impact: 'positive', sector: 'technology', company: 'TCH', priceChangePct: 4.2
      },
      {
        title: 'OPEC taglia la produzione: il petrolio schizza',
        content: 'L\'Organizzazione dei Paesi Esportatori di Petrolio ha annunciato una riduzione della produzione del 5%.',
        impact: 'positive', sector: 'energy', company: 'OIL', priceChangePct: 7.1
      },
      {
        title: 'Scandalo contabile alla Giant Corp: crollo del 12%',
        content: 'Una soffiata interna ha rivelato irregolarita\' contabili presso Giant Corp. La SEC ha aperto un\'indagine.',
        impact: 'negative', sector: 'industrial', company: 'GNT', priceChangePct: -12.3
      },
      {
        title: 'Federal Reserve mantiene i tassi: mercati stabilizzati',
        content: 'La Fed ha deciso di mantenere invariati i tassi di interesse. I mercati hanno reagito con moderato sollievo.',
        impact: 'neutral', sector: 'finance', company: null, priceChangePct: 1.5
      }
    ];
    var result = [];
    var indices = [0, 1, 2, 3];
    var picked = 0;
    while (picked < 3 && indices.length > 0) {
      var idx = Math.floor(Math.random() * indices.length);
      result.push(clone(templates[indices[idx]]));
      indices.splice(idx, 1);
      picked++;
    }
    return result;
  }

  // ============================================================
  // FALLBACK: COMPETITOR ACTIONS
  // ============================================================

  function fallbackCompetitors(competitors) {
    var actions = ['buy', 'sell', 'hold', 'short'];
    var reasons = [
      'Il mercato mostra segnali interessanti in questo settore.',
      'Cambio strategia: riduco il rischio e aspetto occasioni migliori.',
      'Posizione di mantenimento, il momentum e\' ancora incerto.',
      'Vedo un\'opportunita\' di profitto a breve termine su questo titolo.',
      'Sento puzza di bruciato, vendo prima del crollo.',
      'Confido in un rimbalzo tecnico nella prossima settimana.'
    ];
    var tickers = ['TCH', 'OIL', 'GNT', 'FIN', 'RTL', 'DRG'];
    var result = [];
    var comps = competitors || [];
    for (var i = 0; i < comps.length; i++) {
      var act = actions[Math.floor(Math.random() * actions.length)];
      var qty = Math.floor(Math.random() * 500) + 50;
      result.push({
        nickname: comps[i].nickname || 'Bot' + i,
        action: act,
        target: act === 'hold' ? null : tickers[Math.floor(Math.random() * tickers.length)],
        quantity: act === 'hold' ? 0 : qty,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        aggression: Math.floor(Math.random() * 10) + 1
      });
    }
    return result;
  }

  // ============================================================
  // FALLBACK: DIALOGO NPC
  // ============================================================

  function fallbackDialogue(npc, context) {
    var dialogues = [
      {
        text: 'Ehi, ti vedo in forma! Le cose si stanno scaldando la\' fuori. Ho sentito voci su un grande affare che sta per saltare fuori. Sei pronto a cogliere l\'occasione?',
        emotion: 'happy',
        choices: ['Raccontami tutto, sono interessato.', 'Non ho tempo per voci, portami fatti.', 'Quanto vale questa informazione?']
      },
      {
        text: 'Ascolta, la situazione si sta complicando. I ragazzi al piano di sopra non sono contenti dei tuoi ultimi numeri. Devi dare una scossa al portafoglio o saranno problemi.',
        emotion: 'worried',
        choices: ['Hai ragione, cambio strategia subito.', 'Non preoccuparti, so cosa faccio.', 'Cosa suggerisci di preciso?']
      },
      {
        text: 'Sei diventato il talk of the town, ragazzo! Tutti parlano di te ai cocktail party. Ma ricorda: chi vola alto rischia di cadere. Mantieni la lucidita\'.',
        emotion: 'confident',
        choices: ['La lucidita\' non mi manca mai.', 'Parlami dei rischi che vedi.', 'Ho in mente una mossa audace.']
      },
      {
        text: 'Basta chiacchiere! Mi hai promesso risultati e non li vedo. Il mercato non aspetta, e nemmeno io. Scegli: o produci o sei fuori.',
        emotion: 'angry',
        choices: ['Dammi un\'altra settimana.', 'Ho un\'operazione in corso proprio ora.', 'Forse non siamo sulla stessa lunghezza d\'onda.']
      }
    ];
    var idx = Math.floor(Math.random() * dialogues.length);
    return clone(dialogues[idx]);
  }

  // ============================================================
  // FALLBACK: EVENTO MONDIALE
  // ============================================================

  function fallbackEvent() {
    var events = [
      {
        type: 'crisis',
        title: 'Crisi petrolifera: tensioni in Medio Oriente',
        description: 'Conflitti geopolitici fanno temere un blocco delle forniture petrolifere. Prezzi alle stelle, panico diffuso.',
        impact: 'negative',
        affectedSectors: ['energy', 'transport', 'industrial'],
        severity: 8, durationWeeks: 4
      },
      {
        type: 'boom',
        title: 'Boom del settore biotecnologico',
        description: 'Una serie di breakthrough scientifici ha acceso l\'entusiasmo degli investitori sui titoli biotecnologici.',
        impact: 'positive',
        affectedSectors: ['healthcare', 'biotechnology', 'technology'],
        severity: 6, durationWeeks: 3
      },
      {
        type: 'scandal',
        title: 'Scandalo insider trading alla maggiore banca d\'affari',
        description: 'Un alto dirigente e\' stato sorpreso a usare informazioni confidenziali. Indagine FBI in corso.',
        impact: 'negative',
        affectedSectors: ['finance'],
        severity: 7, durationWeeks: 2
      },
      {
        type: 'opportunity',
        title: 'Nuovo piano di liberalizzazione dei mercati',
        description: 'Il governo annuncia deregulation finanziaria che favorisce i broker indipendenti.',
        impact: 'positive',
        affectedSectors: ['finance', 'technology', 'industrial'],
        severity: 5, durationWeeks: 6
      },
      {
        type: 'disaster',
        title: 'Uragano colpisce la costa est: danni miliardari',
        description: 'Un uragano di categoria 5 ha colpito il cuore finanziario della costa est.',
        impact: 'negative',
        affectedSectors: ['insurance', 'real_estate', 'construction'],
        severity: 7, durationWeeks: 3
      }
    ];
    var idx = Math.floor(Math.random() * events.length);
    return clone(events[idx]);
  }

  // ============================================================
  // FALLBACK: MARKET COMMENTARY
  // ============================================================

  function fallbackCommentary(gameState) {
    var sentiment = gameState.marketSentiment || 50;
    var isOpening = Math.random() > 0.5;
    var bell = isOpening ? 'opening' : 'closing';
    var mood, text, movers;

    if (sentiment > 60) {
      mood = 'bullish';
      text = isOpening ?
        'Buongiorno trader! Il campanello d\'apertura suona e si sente odore di soldi nell\'aria! I compratori sono affamati oggi, i listini si muovono al rialzo. Preparatevi a una giornata infuocata!' :
        'Chiusura da urlo! Il mercato ha cavalzato l\'onda rialzista per tutta la seduta. Gli ottimisti stappano lo champagne, gli orsi si leccano le ferite. Vediamo cosa ci porta domani.';
    } else if (sentiment < 40) {
      mood = 'bearish';
      text = isOpening ?
        'Apre la seduta con un clima pesantissimo. Si respira paura in sala, i listini partono in rosso. Tenetevi forte, potrebbe essere una giornata molto movimentata.' :
        'Chiusura amara per Wall Street. Il sangue scorre sui listini, i ribassisti festeggiano. Sara\' un miracolo per invertire la rotta domani.';
    } else {
      mood = 'neutral';
      text = isOpening ?
        'Il campanello suona e il mercato cerca direzione. Movimenti laterali, nessun trend chiaro. I trader piu\' astuti sanno che e\' nei giorni cosi\' che si fanno le mosse migliori.' :
        'Chiusura piatta, senza sorprese. Il mercato ha digerito la giornata senza grandi scosse. Domani e\' un altro giorno, e le opportunita\' non mancheranno.';
    }

    movers = [
      { ticker: 'TCH', direction: 'up', pctChange: 2.3 },
      { ticker: 'OIL', direction: 'down', pctChange: -1.8 },
      { ticker: 'FIN', direction: 'up', pctChange: 0.9 }
    ];

    return { bell: bell, text: text, mood: mood, topMovers: movers };
  }

  // ============================================================
  // TEST CONNESSIONE API
  // ============================================================

  function testConnection() {
    var body = JSON.stringify({
      model: CONFIG.model,
      messages: [{ role: 'user', content: 'Rispondi con la parola: OK' }],
      stream: false,
      options: { temperature: 0, num_predict: 10 }
    });

    return new Promise(function (resolve) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', CONFIG.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + CONFIG.apiKey);
      xhr.timeout = CONFIG.timeout;

      xhr.ontimeout = function () {
        resolve({ success: false, error: 'Timeout (' + CONFIG.timeout + 'ms)' });
      };

      xhr.onerror = function () {
        resolve({ success: false, error: 'Errore di rete' });
      };

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var resp = JSON.parse(xhr.responseText);
            var content = resp.message || (resp.choices && resp.choices[0] && resp.choices[0].message) || resp;
            var text = typeof content === 'string' ? content : (content.content || content.text || '');
            resolve({ success: true, response: text, model: CONFIG.model, endpoint: CONFIG.endpoint });
          } catch (e) {
            resolve({ success: false, error: 'Risposta non valida: ' + e.message });
          }
        } else {
          resolve({ success: false, error: 'HTTP ' + xhr.status + ': ' + xhr.statusText });
        }
      };

      xhr.send(body);
    });
  }

  // ============================================================
  // METODI PUBBLICI
  // ============================================================

  function configure(opts) {
    if (!opts) return;
    var settings = {};
    if (opts.endpoint) settings.endpoint = opts.endpoint;
    if (opts.apiKey) settings.apiKey = opts.apiKey;
    if (opts.model) settings.model = opts.model;
    if (typeof opts.enabled === 'boolean') settings.enabled = opts.enabled;
    if (typeof opts.temperature === 'number') settings.temperature = opts.temperature;
    if (typeof opts.maxTokens === 'number') settings.maxTokens = opts.maxTokens;
    if (typeof opts.timeout === 'number') settings.timeout = opts.timeout;
    if (typeof opts.cacheSize === 'number') settings.cacheSize = opts.cacheSize;
    if (typeof opts.rateLimitPerTurn === 'number') settings.rateLimitPerTurn = opts.rateLimitPerTurn;
    saveSettings(settings);
  }

  function generateNews(gameState) {
    var gs = gameState || {};
    var key = 'news_' + (gs.week || 1) + '_' + (gs.year || 1987) + '_' + (gs.marketSentiment || 50);
    var fb = fallbackNews();
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildNewsPrompt(gs) }
    ];
    return safeCall(key, messages, fb).then(function (result) {
      if (result instanceof Array) return result;
      if (result && result.news && result.news instanceof Array) return result.news;
      return fb;
    }).catch(function () { return fb; });
  }

  function generateCompetitorActions(competitors, gameState) {
    var gs = gameState || {};
    var comps = competitors || [];
    var key = 'comp_' + (gs.week || 1) + '_' + (gs.year || 1987) + '_' + comps.length;
    var fb = fallbackCompetitors(comps);
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildCompetitorPrompt(comps, gs) }
    ];
    return safeCall(key, messages, fb).then(function (result) {
      if (result instanceof Array) return result;
      if (result && result.actions && result.actions instanceof Array) return result.actions;
      return fb;
    }).catch(function () { return fb; });
  }

  function generateDialogue(npc, context, gameState) {
    var gs = gameState || {};
    var n = npc || { name: 'Sconosciuto', role: 'NPC' };
    var key = 'dialogue_' + (n.name || 'npc') + '_' + (context || '').substring(0, 30) + '_' + (gs.week || 1);
    var fb = fallbackDialogue(n, context);
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildDialoguePrompt(n, context, gs) }
    ];
    return safeCall(key, messages, fb).then(function (result) {
      if (result && result.text) return result;
      return fb;
    }).catch(function () { return fb; });
  }

  function generateEvent(gameState) {
    var gs = gameState || {};
    var key = 'event_' + (gs.week || 1) + '_' + (gs.year || 1987) + '_' + (gs.level || 1);
    var fb = fallbackEvent();
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildEventPrompt(gs) }
    ];
    return safeCall(key, messages, fb).then(function (result) {
      if (result && result.type) return result;
      return fb;
    }).catch(function () { return fb; });
  }

  function generateMarketCommentary(gameState) {
    var gs = gameState || {};
    var key = 'commentary_' + (gs.week || 1) + '_' + (gs.year || 1987) + '_' + (gs.marketSentiment || 50);
    var fb = fallbackCommentary(gs);
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildCommentaryPrompt(gs) }
    ];
    return safeCall(key, messages, fb).then(function (result) {
      if (result && result.text) return result;
      return fb;
    }).catch(function () { return fb; });
  }

  function buildWorldPrompt(context) {
    var compact = JSON.stringify(context || {});
    if (compact.length > 18000) compact = compact.substring(0, 18000);
    return 'Simula una settimana coerente di un ecosistema finanziario mondiale persistente. ' +
      'Ogni societa possiede una storia, una missione e un obiettivo pluriennale. Gli amministratori sono persone autonome: agiscono secondo ruolo, etica, influenza, lealta e agenda. I soci reagiscono secondo quota, fiducia e obiettivo. ' +
      'Fai avanzare o arretrare gli obiettivi in modo causale. Crea conflitti tra CdA e soci, alleanze, dimissioni, richieste attiviste o assemblee solo quando giustificati. ' +
      'I competitor perseguono obiettivi di medio periodo. Non inventare ticker, amministratori o blocchi diversi da quelli ricevuti. Mantieni memoria e continuita. Contesto: ' + compact + ' ' +
      'Rispondi con JSON {briefing,macro,companies,competitors,assembly}. ' +
      'macro={region,title,description,growthDelta,inflationDelta,ratesDelta,sentimentImpact}; ' +
      'companies=max 4 elementi {ticker,action,title,description,revenueGrowthDelta,marginDelta,debtDelta,governanceDelta,innovationDelta,priceImpactPct,boardDecision,shareholderMoves}. ' +
      'boardDecision={directorRole,action,motive,supportDelta,objectiveProgress,influenceDelta}. ' +
      'shareholderMoves=max 4 elementi {blockId,action,motive,confidenceDelta,stance}. Usa solo directorRole e blockId presenti nel contesto; ' +
      'competitors={nickname,goal,plan,target,stance,conviction}; ' +
      'assembly=null oppure {ticker,type,title,description,priceImpactPct,growthImpact,debtImpact}. Applica delta piccoli e realistici.';
  }

  function generateWorldTurn(context) {
    var ctx = context || {};
    var key = 'world_' + (ctx.week || 1) + '_' + (ctx.year || 1987);
    var fallback = { briefing: '', macro: null, companies: [], competitors: [], assembly: null };
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT + ' Mantieni continuita causale tra i turni.' },
      { role: 'user', content: buildWorldPrompt(ctx) }
    ];
    return safeCall(key, messages, fallback).then(function (result) {
      return result && typeof result === 'object' ? result : fallback;
    }).catch(function () { return fallback; });
  }

  function processTurn(gameState) {
    var gs = gameState || {};
    resetTurn();

    var newsPromise = generateNews(gs);
    var compPromise = generateCompetitorActions(gs.competitors || [], gs);
    var eventPromise = generateEvent(gs);
    var commentaryPromise = generateMarketCommentary(gs);

    return Promise.all([
      newsPromise,
      compPromise,
      eventPromise,
      commentaryPromise
    ]).then(function (results) {
      return {
        news: results[0],
        competitorActions: results[1],
        events: results[2],
        commentary: results[3]
      };
    }).catch(function () {
      return {
        news: fallbackNews(),
        competitorActions: fallbackCompetitors(gs.competitors || []),
        events: fallbackEvent(),
        commentary: fallbackCommentary(gs)
      };
    });
  }

  function isAvailable() {
    return !!CONFIG.apiKey && !!CONFIG.endpoint && CONFIG.enabled !== false;
  }

  function getStats() {
    return {
      totalCalls: stats.totalCalls,
      cacheHits: stats.cacheHits,
      errors: stats.errors,
      turnCalls: stats.turnCalls,
      cacheSize: cache.length,
      cacheMax: CONFIG.cacheSize,
      rateLimitPerTurn: CONFIG.rateLimitPerTurn,
      model: CONFIG.model,
      available: isAvailable()
    };
  }

  // ============================================================
  // ESPORTA MODULO
  // ============================================================

  global.LLMGameMaster = {
    configure: configure,
    getSettings: getSettings,
    saveSettings: saveSettings,
    testConnection: testConnection,
    generateNews: generateNews,
    generateCompetitorActions: generateCompetitorActions,
    generateDialogue: generateDialogue,
    generateEvent: generateEvent,
    generateMarketCommentary: generateMarketCommentary,
    generateWorldTurn: generateWorldTurn,
    processTurn: processTurn,
    isAvailable: isAvailable,
    getStats: getStats,
    resetTurn: resetTurn,
    version: '4.0.0'
  };

  var _root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : (typeof self !== 'undefined' ? self : this));
  if (typeof module !== 'undefined' && module.exports) { module.exports = _root.LLMGameMaster; }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));