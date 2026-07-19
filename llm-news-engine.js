/**
 * llm-news-engine.js
 * LLM News Engine per Wolf of Wall Street Broker Tycoon
 * Versione 2.0.0 - Usa Ollama Cloud via proxy Vercel
 * Genera notizie di mercato dinamiche con LLM (glm-5.2)
 * Fallback con 50 notizie statiche se l'API non e' disponibile.
 *
 * Esporta: window.LLMNewsEngine
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
    apiKey: 'b9ac0518ccf1414d9f046cce331009ea.sTbNE0X5t2T_n8fTACWaS8U0',
    model: 'glm-5.2',
    enabled: true,
    timeoutMs: 30000,
    maxCacheSize: 10,
    maxCallsPerTurn: 1,
    temperature: 0.8,
    maxTokens: 1200
  };

  var STORAGE_KEY = 'sbt_llm_settings';

  // ============================================================
  // STATO INTERNO
  // ============================================================

  var CONFIG = _loadSettings();
  var cache = [];
  var callsThisTurn = 0;
  var lastCallTime = 0;

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
      // localStorage non disponibile o JSON invalido, usa default
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
    // Aggiorna CONFIG in tempo reale
    CONFIG = current;
    return current;
  }

  function getSettings() {
    return _loadSettings();
  }

  // ============================================================
  // POOL NOTIZIE STATICHE (FALLBACK -- 50 notizie)
  // ============================================================

  var STATIC_NEWS_POOL = [
    // --- REPORT AZIENDALI (10) ---
    { title: 'Utile trimestrale record per MicroDyne Systems', content: 'MicroDyne Systems ha comunicato utili trimestrali superiori alle attese del 22%. Il CEO ha annunciato piani di espansione per il prossimo anno.', impact: 'positive', sector: 'TECH', company: 'MicroDyne Systems', priceChangePct: 3.5 },
    { title: 'Perdita inattesa per OmniChip Semiconductor', content: 'OmniChip ha registrato una perdita trimestrale di 15 milioni a causa della riduzione della domanda di chip per smartphone. Le azioni crollano in pre-market.', impact: 'negative', sector: 'TECH', company: 'OmniChip Semiconductor', priceChangePct: -4.2 },
    { title: 'Fusione annunciata tra QuantumPay e BlockChain Capital', content: 'Le due società fintech hanno annunciato una fusione da 800 milioni. Il board di entrambe le aziende ha approvato l\'operazione.', impact: 'positive', sector: 'FIN', company: 'QuantumPay Fintech', priceChangePct: 5.8 },
    { title: 'Scandalo contabile alla TheraPure Pharmaceuticals', content: 'Un whistleblower ha rivelato irregolarità contabili nei bilanci degli ultimi tre anni. La SEC ha aperto un\'indagine formale.', impact: 'negative', sector: 'HEAL', company: 'TheraPure Pharmaceuticals', priceChangePct: -7.5 },
    { title: 'Guidance raised da DataStream Inc', content: 'DataStream ha rivisto al rialzo le stime di fatturato annuali citando una domanda esplosiva per i servizi cloud.', impact: 'positive', sector: 'TECH', company: 'DataStream Inc', priceChangePct: 4.1 },
    { title: 'Restruzione aziendale alla RoboAuto Industries', content: 'RoboAuto annuncia 1.200 licenziamenti nel reparto R&D per tagliare i costi. Gli analisti sono divisi sulla mossa.', impact: 'negative', sector: 'INDU', company: 'RoboAuto Industries', priceChangePct: -2.8 },
    { title: 'Buyback record da CyberNet Industries', content: 'CyberNet ha autorizzato un programma di riacquisto azionario da 500 milioni, il piu\' grande della storia della società.', impact: 'positive', sector: 'TECH', company: 'CyberNet Industries', priceChangePct: 3.2 },
    { title: 'Dividendo tagliato al 50% per SkyTower REIT', content: 'SkyTower REIT ha comunicato un drastico taglio del dividendo a causa della riduzione degli affitti commerciali.', impact: 'negative', sector: 'RE', company: 'SkyTower REIT', priceChangePct: -5.1 },
    { title: 'GenoMap Biosciences ottiene approvazione FDA', content: 'La FDA ha approvato il nuovo test diagnostico genetico di GenoMap. Il mercato stima potenziali ricavi annuali di 200 milioni.', impact: 'positive', sector: 'HEAL', company: 'GenoMap Biosciences', priceChangePct: 6.7 },
    { title: 'Lawsuit collettivo contro FashionForward Brands', content: 'Una class action e\' stata intentata contro FashionForward per presunti danni da difetti nei tessuti. Richiesta risarcimento 50 milioni.', impact: 'negative', sector: 'CONS', company: 'FashionForward Brands', priceChangePct: -3.3 },

    // --- EVENTI MACRO (10) ---
    { title: 'La Fed alza i tassi di 0.50%', content: 'Il Federal Open Market Committee ha deciso un rialzo dei tassi di 50 punti base per combattere l\'inflazione in crescita.', impact: 'negative', sector: 'FIN', company: null, priceChangePct: -2.5 },
    { title: 'Inflazione in rallentamento, CPI sotto le attese', content: 'L\'indice dei prezzi al consumo e\' cresciuto solo dello 0.1% mensile, sotto il consensus dello 0.3%.', impact: 'positive', sector: null, company: null, priceChangePct: 2.0 },
    { title: 'Rallentamento economico: il PIL scende sotto lo 0%', content: 'I dati preliminari indicano una contrazione del PIL nello scorso trimestre. Timori di recessione si diffondono.', impact: 'negative', sector: null, company: null, priceChangePct: -3.8 },
    { title: 'Accordo commerciale raggiunto tra USA e UE', content: 'Dopo mesi di negoziazioni, le parti hanno trovato un accordo sui dazi. Le esportazioni italiane beneficeranno della riduzione delle barriere.', impact: 'positive', sector: 'INDU', company: null, priceChangePct: 1.8 },
    { title: 'Petrolio in rialzo del 20% per tensioni geopolitiche', content: 'Le tensioni nel Medio Oriente hanno fatto schizzare il prezzo del petrolio. Le compagnie energetiche guadagnano.', impact: 'neutral', sector: 'ENERGY', company: null, priceChangePct: 0 },
    { title: 'Consumer confidence ai Massimi Storici', content: 'L\'indice di fiducia dei consumatori ha raggiunto il livello piu\' alto degli ultimi 5 anni.', impact: 'positive', sector: 'CONS', company: null, priceChangePct: 1.5 },
    { title: 'Dollar forte, esportazioni italiane colpite', content: 'L\'euro ha perso il 3% contro il dollaro in una settimana. Le aziende esportatrici italiane registrano perdite competitive.', impact: 'negative', sector: 'INDU', company: null, priceChangePct: -1.8 },
    { title: 'BCE annuncia quantitative easing straordinario', content: 'La Banca Centrale Europea ha lanciato un programma di acquisto di asset per 500 miliardi di euro.', impact: 'positive', sector: 'FIN', company: null, priceChangePct: 2.8 },
    { title: 'Gold rush: investitori cercano rifugio nell\'oro', content: 'L\'incertezza geopolitica spinge gli investitori verso i metalli preziosi. L\'oro ha guadagnato il 5% in una settimana.', impact: 'neutral', sector: 'MATR', company: null, priceChangePct: 0 },
    { title: 'Rapporto occupazione sopra le attese', content: 'L\'economia ha creato 250.000 nuovi posti di lavoro nel mese, ben sopra le attese di 180.000.', impact: 'positive', sector: null, company: null, priceChangePct: 1.2 },

    // --- NEWS DI SETTORE (10) ---
    { title: 'Boom tecnologico: nuovi paradigmi digitali', content: 'L\'intero settore tech e\' in frenesia. Gli analisti parlano di nuova bolla ma i fondamentali sono solidi per molte aziende.', impact: 'positive', sector: 'TECH', company: null, priceChangePct: 4.0 },
    { title: 'Crisi energia: blackout minaccia il nordest', content: 'La rete elettrica del nordest e\' sotto stress. Le utility chiedono investimenti urgenti mentre i cittadini protestano.', impact: 'negative', sector: 'ENERGY', company: null, priceChangePct: -2.2 },
    { title: 'Regolamentazione fintech: nuove regole UE', content: 'Bruxelles ha approvato nuove regole per le società fintech. Compliance piu\' costosa ma maggiore protezione consumatori.', impact: 'negative', sector: 'FIN', company: null, priceChangePct: -1.5 },
    { title: 'Boom immobiliare: prezzi case +15% annuo', content: 'Il settore immobiliare continua a crescere. I REIT beneficiano del trend ma gli analisti temono una bolla.', impact: 'positive', sector: 'RE', company: null, priceChangePct: 2.5 },
    { title: 'Crisi farmaceutica: brevetto scaduto', content: 'La scadenza di numerosi brevetti chiave fara\' entrare sul mercato i generici. Calo dei margini previsto.', impact: 'negative', sector: 'HEAL', company: null, priceChangePct: -2.0 },
    { title: 'Rinascita industriale: ordini in aumento', content: 'Le commissioni industriali hanno registrato un aumento del 6% mensile. Il settore manifatturiero mostra segni di ripresa.', impact: 'positive', sector: 'INDU', company: null, priceChangePct: 2.2 },
    { title: 'Materiali in rally: rame e acciaio ai massimi', content: 'La domanda cinese spinge i prezzi delle materie prime. Le società minerarie e siderurgiche guidano i gains.', impact: 'positive', sector: 'MATR', company: null, priceChangePct: 3.0 },
    { title: 'Utilities sotto pressione: transizione verde costosa', content: 'I costi della transizione ecologica pesano sui bilanci delle utility tradizionali.', impact: 'negative', sector: 'UTIL', company: null, priceChangePct: -1.8 },
    { title: 'Telecom in trasformazione: 5G accelera', content: 'Il roll-out del 5G sta trasformando il settore delle telecomunicazioni. Nuovi servizi e opportunita\' di revenue.', impact: 'positive', sector: 'COMM', company: null, priceChangePct: 2.8 },
    { title: 'Consumi in calo: gli italiani stringono la cinghia', content: 'I dati sulle vendite al dettaglio mostrano una contrazione del 3% mensile. I beni voluttuari sono i piu\' colpiti.', impact: 'negative', sector: 'CONS', company: null, priceChangePct: -2.5 },

    // --- GOSSIP FINANZIARIO & SCANDALI (10) ---
    { title: 'CEO di StratComm Software si dimette improvvisamente', content: 'Il CEO di StratComm ha rassegnato le dimissioni senza preavviso. Voci di tensioni con il board.', impact: 'negative', sector: 'TECH', company: 'StratComm Software', priceChangePct: -3.0 },
    { title: 'Voci di OPA su NetBlast Communications', content: 'Fonti ben informate suggeriscono che un hedge fund sta accumulando quote di NetBlast per lanciare un\'OPA ostile.', impact: 'positive', sector: 'TECH', company: 'NetBlast Communications', priceChangePct: 5.2 },
    { title: 'Scandalo insider trading alla Quantum Logic', content: 'Un alto dirigente di Quantum Logic e\' stato indagato per insider trading.', impact: 'negative', sector: 'TECH', company: 'Quantum Logic Corp', priceChangePct: -4.5 },
    { title: 'CEO di SolarPeak Energy intervistato su CNBC', content: 'Il carismatico CEO di SolarPeak ha presentato una visione ambiziosa su scala globale.', impact: 'positive', sector: 'ENERGY', company: 'SolarPeak Energy', priceChangePct: 2.3 },
    { title: 'Audit sorpresa alla BlockChain Capital', content: 'Una squadra di revisori ha fatto visita improvvisamente alla sede di BlockChain Capital.', impact: 'negative', sector: 'FIN', company: 'BlockChain Capital', priceChangePct: -3.8 },
    { title: 'Nuovo CEO per VirtuReal Studios', content: 'VirtuReal annuncia l\'arrivo di un nuovo CEO con track record alla Silicon Valley.', impact: 'positive', sector: 'TECH', company: 'VirtuReal Studios', priceChangePct: 2.7 },
    { title: 'Voci di fusione tra AI Cortex e NeuroLink', content: 'Il mercato rumora una possibile fusione tra le due società di intelligenza artificiale.', impact: 'positive', sector: 'TECH', company: 'AI Cortex Labs', priceChangePct: 4.3 },
    { title: 'Indagine antitrust su DroneFleet Logistics', content: 'L\'antitrust ha aperto un\'indagine su DroneFleet per presunta posizione dominante.', impact: 'negative', sector: 'INDU', company: 'DroneFleet Logistics', priceChangePct: -3.2 },
    { title: 'Celebrita\' investe in SocialLink Networks', content: 'Una celebrita\' di Hollywood ha investito 10 milioni in SocialLink, portando attenzione mediatica.', impact: 'positive', sector: 'COMM', company: 'SocialLink Networks', priceChangePct: 3.6 },
    { title: 'Cambio azionario alla EcoFuel BioEnergy', content: 'Un fondo attivista ha acquisito il 7% di EcoFuel e chiede cambiamenti strategici.', impact: 'neutral', sector: 'ENERGY', company: 'EcoFuel BioEnergy', priceChangePct: 0.5 },

    // --- IPO, DIVIDENDI, CRASH & BOOM (10) ---
    { title: 'IPO record: AI Cortex Labs debutta a 45 euro', content: 'L\'IPO di AI Cortex e\' stata 8 volte sopravanzata. Il prezzo di apertura e\' il doppio del range iniziale.', impact: 'positive', sector: 'TECH', company: 'AI Cortex Labs', priceChangePct: 8.0 },
    { title: 'Crash di mercato: flash crash spaventa Wall Street', content: 'Un flash crash ha fatto perdere il 6% all\'indice in 10 minuti. I circuit breaker sono scattati.', impact: 'negative', sector: null, company: null, priceChangePct: -6.0 },
    { title: 'Santa Claus Rally: i mercati chiudono in rialzo', content: 'La tradizionale fine anno rally ha portato gains generalizzati.', impact: 'positive', sector: null, company: null, priceChangePct: 2.5 },
    { title: 'Dividendo straordinario da SmartGrid Solutions', content: 'SmartGrid ha distribuito un dividendo straordinario di 2 euro ad azione.', impact: 'positive', sector: 'UTIL', company: 'SmartGrid Solutions', priceChangePct: 3.0 },
    { title: 'Boom biotech: nuovo farmaco approvato', content: 'Un nuovo farmaco rivoluzionario per il trattamento del diabete ha ricevuto l\'approvazione.', impact: 'positive', sector: 'HEAL', company: null, priceChangePct: 4.5 },
    { title: 'Market crash: timori di recessione globale', content: 'I mercati sono crollati del 5% in una giornata per timori di una recessione globale.', impact: 'negative', sector: null, company: null, priceChangePct: -5.0 },
    { title: 'IPO del secolo: StreamLine Media quota a 80 euro', content: 'StreamLine Media ha debuttato in borsa con una valutazione di 12 miliardi.', impact: 'positive', sector: 'COMM', company: 'StreamLine Media', priceChangePct: 7.5 },
    { title: 'Earnings season: risultati oltre le attese', content: 'La stagione degli utili ha sorpreso al rialzo. Il 70% delle società ha battuto le stime.', impact: 'positive', sector: null, company: null, priceChangePct: 2.0 },
    { title: 'Correzione tecnica: i mercati prendono fiato', content: 'Dopo un rally prolungato, i mercati sono in correzione tecnica.', impact: 'negative', sector: null, company: null, priceChangePct: -2.0 },
    { title: 'Rally metalli: litio in corsa per domande EV', content: 'Il litio ha raggiunto nuovi massimi per la domanda crescente di veicoli elettrici.', impact: 'positive', sector: 'MATR', company: 'LithiumPeak Resources', priceChangePct: 5.5 }
  ];

  // ============================================================
  // UTILITY
  // ============================================================

  function _rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _pickN(arr, n) {
    var copy = arr.slice();
    var result = [];
    for (var i = 0; i < n && copy.length > 0; i++) {
      var idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  function _formatMoney(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'Mrd';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'Mln';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  }

  // ============================================================
  // PROMPT ENGINEERING
  // ============================================================

  var SYSTEM_PROMPT =
    'Sei un giornalista finanziario del Wall Street Journal degli anni \'90. ' +
    'Scrivi notizie di mercato realistiche, drammatiche, in italiano. ' +
    'Ogni notizia deve avere un impatto concreto sul mercato. ' +
    'Usa uno stile vivace, professionale, con un pizzico di sensazionalismo. ' +
    'Riferisciti a società e settori del gioco. Le notizie devono essere varie: ' +
    'report aziendali, eventi macro, notizie di settore, gossip finanziario, scandali, OPA, IPO, dividendi. ' +
    'Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo aggiuntivo prima o dopo.';

  function _buildUserPrompt(gameState) {
    var p = gameState.player || {};
    var market = gameState.market || {};
    var companies = market.companies || [];
    var week = p.week || 1;
    var year = p.year || 1;
    var level = p.level || 1;
    var netWorth = p.netWorth || 10000;
    var sentiment = market.sentiment || 50;
    var macro = market.macro || {};
    var darkActions = gameState.darkActions || {};

    var sorted = companies.slice().sort(function (a, b) {
      var capA = (a.price || 0) * (a.sharesOutstanding || 0);
      var capB = (b.price || 0) * (b.sharesOutstanding || 0);
      return capB - capA;
    });
    var top10 = sorted.slice(0, Math.min(10, sorted.length));

    var companyList = top10.map(function (c) {
      return '- ' + c.name + ' (' + c.ticker + ', settore: ' + (c.sector || 'N/D') +
        ', prezzo: ' + (c.price ? c.price.toFixed(2) : 'N/D') + ', ' +
        'P/E: ' + (c.peRatio ? c.peRatio.toFixed(1) : 'N/D') + ')';
    }).join('\n');

    var newsLog = market.newsLog || [];
    var recentNews = newsLog.slice(-5).map(function (entry) {
      var events = entry.events || [];
      return events.map(function (e) {
        return (e.ticker || 'MARKET') + ': ' + (e.news || '') + ' (' + (e.impact || 0) + ')';
      }).join('; ');
    }).join('\n');

    var sentimentDesc = sentiment > 70 ? 'euphoric' : sentiment > 55 ? 'optimistic' : sentiment > 45 ? 'neutral' : sentiment > 30 ? 'pessimistic' : 'fearful';

    var playerActions = [];
    if (darkActions.insiderTrades && darkActions.insiderTrades.length > 0) {
      playerActions.push('Il giocatore ha eseguito ' + darkActions.insiderTrades.length + ' operazioni di insider trading');
    }
    if (darkActions.pumpDumps && darkActions.pumpDumps.length > 0) {
      playerActions.push('Il giocatore ha eseguito ' + darkActions.pumpDumps.length + ' operazioni di pump & dump');
    }
    if (darkActions.bribes && darkActions.bribes.length > 0) {
      playerActions.push('Il giocatore ha pagato ' + darkActions.bribes.length + ' tangenti');
    }
    if ((p.stats || {}).totalTrades > 50) {
      playerActions.push('Il giocatore ha eseguito ' + p.stats.totalTrades + ' trade totali');
    }
    if (netWorth > 1000000) {
      playerActions.push('Il giocatore ha un patrimonio di ' + _formatMoney(netWorth) + ' euro -- e\' un broker di successo');
    }
    if (netWorth > 10000000) {
      playerActions.push('Il giocatore e\' un magnate della finanza con ' + _formatMoney(netWorth) + ' euro -- famoso a Wall Street');
    }
    if ((p.reputation || {}).sec < 50) {
      playerActions.push('La SEC sta tenendo d\'occhio il giocatore (reputazione SEC: ' + p.reputation.sec + '/100)');
    }

    var playerSection = playerActions.length > 0
      ? '\n\nAZIONI DEL GIOCATORE (genera notizie su di lui se e\' famoso):\n' + playerActions.join('\n')
      : '';

    var levelDesc = level <= 2 ? 'principiante' : level <= 4 ? 'intermedio' : level <= 6 ? 'esperto' : level <= 8 ? 'veterano' : 'leggenda';

    var prompt =
      'CONTESTO DI MERCATO:\n' +
      '- Settimana: ' + week + ', Anno: ' + year + '\n' +
      '- Livello giocatore: ' + level + ' (' + levelDesc + ')\n' +
      '- Patrimonio giocatore: ' + _formatMoney(netWorth) + ' euro\n' +
      '- Sentiment di mercato: ' + sentiment + '/100 (' + sentimentDesc + ')\n' +
      '- Tasso di interesse: ' + (macro.interestRate || 2.5) + '%\n' +
      '- Inflazione: ' + (macro.inflation || 2.0) + '%\n' +
      '- PIL: ' + (macro.gdpGrowth || 1.5) + '%\n' +
      '- Disoccupazione: ' + (macro.unemployment || 5.0) + '%\n\n' +
      'TOP 10 SOCIETA\' PER MARKET CAP:\n' + companyList + '\n\n' +
      'EVENTI RECENTI (ultime notizie):\n' + (recentNews || 'Nessun evento recente') + '\n' +
      playerSection + '\n\n' +
      'ISTRUZIONI:\n' +
      'Genera 3-5 notizie di mercato in italiano, stile giornale finanziario anni \'90.\n' +
      'Varia i tipi: report aziendali, eventi macro, notizie di settore, gossip/scandali, OPA, IPO, dividendi.\n' +
      (level >= 5 && netWorth > 1000000 ? 'Includi ALMENO una notizia sul giocatore (il broker emergente).\n' : '') +
      'Ogni notizia deve specificare un impatto numerico realistico (% cambio prezzo tra -10% e +10%).\n' +
      'Il settore deve essere uno di: TECH, ENERGY, FIN, HEAL, CONS, INDU, MATR, UTIL, RE, COMM.\n' +
      'Se la notizia non e\' specifica di una società, usa company: null.\n\n' +
      'Rispondi con un array JSON di 3-5 oggetti con questo formato esatto:\n' +
      '[{"title":"titolo della notizia","content":"2-3 frasi di contenuto","impact":"positive|negative|neutral","sector":"TECH|ENERGY|FIN|HEAL|CONS|INDU|MATR|UTIL|RE|COMM|null","company":"nome società o null","priceChangePct": numero_tra_-10_e_10}]';

    return prompt;
  }

  // ============================================================
  // CHIAMATA API OLLAMA CLOUD via PROXY VERCEL
  // ============================================================

  function generateNews(gameState) {
    // Se LLM disabilitato, usa fallback
    if (CONFIG.enabled === false) {
      console.warn('[LLMNewsEngine] LLM disabilitato, uso fallback statico');
      return Promise.resolve(_getFallbackNews(gameState));
    }

    // Rate limiter
    if (callsThisTurn >= CONFIG.maxCallsPerTurn) {
      console.warn('[LLMNewsEngine] Rate limit: gia\' chiamato questo turno, uso fallback');
      return Promise.resolve(_getFallbackNews(gameState));
    }

    // Se API key non configurata, usa fallback
    if (!CONFIG.apiKey || CONFIG.apiKey === 'YOUR_OLLAMA_CLOUD_API_KEY') {
      console.warn('[LLMNewsEngine] API key non configurata, uso fallback statico');
      return Promise.resolve(_getFallbackNews(gameState));
    }

    callsThisTurn++;
    lastCallTime = Date.now();

    var userPrompt = _buildUserPrompt(gameState);
    var requestBody = {
      model: CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      format: 'json',
      stream: false,
      options: {
        temperature: CONFIG.temperature,
        num_predict: CONFIG.maxTokens
      }
    };

    return _fetchWithTimeout(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.apiKey
      },
      body: JSON.stringify(requestBody)
    }, CONFIG.timeoutMs).then(function (response) {
      if (!response.ok) {
        console.warn('[LLMNewsEngine] API error HTTP ' + response.status + ', uso fallback');
        return _getFallbackNews(gameState);
      }
      return response.json().then(function (data) {
        var content = data.message || (data.choices && data.choices[0] && data.choices[0].message) || data;
        var text = typeof content === 'string' ? content : (content.content || content.text || '');

        var news = _parseNewsResponse(text);
        if (!news || news.length === 0) {
          console.warn('[LLMNewsEngine] Parsing fallito, uso fallback');
          return _getFallbackNews(gameState);
        }

        _addToCache({ prompt: userPrompt, response: text, news: news, timestamp: Date.now() });
        return news;
      });
    }).catch(function (err) {
      console.warn('[LLMNewsEngine] Errore API: ' + (err.message || err) + ', uso fallback');
      return _getFallbackNews(gameState);
    });
  }

  /**
   * Fetch con timeout usando AbortController
   */
  function _fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('Timeout dopo ' + timeoutMs + 'ms'));
      }, timeoutMs);

      var opts = options || {};
      if (controller) opts.signal = controller.signal;

      global.fetch(url, opts).then(
        function (res) {
          clearTimeout(timer);
          resolve(res);
        },
        function (err) {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  /**
   * Parsa la risposta JSON dell'LLM
   */
  function _parseNewsResponse(text) {
    if (!text || typeof text !== 'string') return null;

    var cleaned = text.trim();
    var fence = String.fromCharCode(96,96,96);
    if (cleaned.indexOf(fence) === 0) {
      cleaned = cleaned.replace(new RegExp('^' + fence + '(?:json)?\\n?'), '').replace(new RegExp('\\n?' + fence + '$'), '');
    }

    var start = cleaned.indexOf('[');
    var end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return null;

    var jsonStr = cleaned.substring(start, end + 1);

    try {
      var parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return null;
      return parsed.map(_normalizeNews).filter(function (n) { return n !== null; });
    } catch (e) {
      try {
        var match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          var parsed2 = JSON.parse(match[0]);
          return parsed2.map(_normalizeNews).filter(function (n) { return n !== null; });
        }
      } catch (e2) {
        console.warn('[LLMNewsEngine] JSON parse error: ' + e2.message);
      }
      return null;
    }
  }

  /**
   * Normalizza un oggetto notizia dall'LLM
   */
  function _normalizeNews(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var title = raw.title || raw.titolo || '';
    var content = raw.content || raw.contenuto || '';
    var impact = (raw.impact || raw.impatto || 'neutral').toLowerCase();
    var sector = raw.sector || raw.settore || null;
    var company = raw.company || raw.societa || raw.societa || null;
    var priceChangePct = raw.priceChangePct || raw.priceChange || raw.cambioPrezzoPct || 0;

    if (!title || !content) return null;

    if (impact !== 'positive' && impact !== 'negative' && impact !== 'neutral') {
      impact = 'neutral';
    }

    var validSectors = ['TECH', 'ENERGY', 'FIN', 'HEAL', 'CONS', 'INDU', 'MATR', 'UTIL', 'RE', 'COMM'];
    if (sector && validSectors.indexOf(sector) === -1) {
      var sectorMap = {
        'tecnologia': 'TECH', 'tech': 'TECH',
        'energia': 'ENERGY', 'energy': 'ENERGY',
        'finanza': 'FIN', 'fin': 'FIN',
        'sanita': 'HEAL', 'heal': 'HEAL', 'salute': 'HEAL',
        'consumi': 'CONS', 'cons': 'CONS',
        'industriale': 'INDU', 'indu': 'INDU',
        'materiali': 'MATR', 'matr': 'MATR',
        'utilities': 'UTIL', 'util': 'UTIL',
        'immobiliare': 'RE', 're': 'RE',
        'comunicazioni': 'COMM', 'comm': 'COMM'
      };
      sector = sectorMap[sector.toLowerCase()] || null;
    }

    priceChangePct = parseFloat(priceChangePct) || 0;
    if (priceChangePct < -10) priceChangePct = -10;
    if (priceChangePct > 10) priceChangePct = 10;

    return {
      title: String(title).trim(),
      content: String(content).trim(),
      impact: impact,
      sector: sector,
      company: company ? String(company).trim() : null,
      priceChangePct: priceChangePct,
      source: 'llm',
      timestamp: Date.now()
    };
  }

  // ============================================================
  // FALLBACK STATICO
  // ============================================================

  function _getFallbackNews(gameState) {
    var p = (gameState && gameState.player) || {};
    var level = p.level || 1;
    var netWorth = p.netWorth || 10000;
    var darkActions = (gameState && gameState.darkActions) || {};
    var week = p.week || 1;

    var pool = STATIC_NEWS_POOL.slice();
    var playerNews = _generatePlayerNews(gameState);
    var result = [];

    if (playerNews.length > 0 && level >= 5 && netWorth > 500000) {
      result.push(_pick(playerNews));
    }

    var count = result.length > 0 ? 3 : 4;
    var selected = _pickN(pool, count + 1);

    for (var i = 0; i < selected.length && result.length < 5; i++) {
      var news = Object.assign({}, selected[i]);
      news.priceChangePct = news.priceChangePct * (0.8 + Math.random() * 0.4);
      news.priceChangePct = Math.round(news.priceChangePct * 100) / 100;
      news.source = 'static';
      news.timestamp = Date.now();
      result.push(news);
    }

    return result;
  }

  function _generatePlayerNews(gameState) {
    var p = (gameState && gameState.player) || {};
    var name = p.name || 'il broker emergente';
    var netWorth = p.netWorth || 10000;
    var level = p.level || 1;
    var stats = p.stats || {};
    var darkActions = (gameState && gameState.darkActions) || {};
    var rep = p.reputation || {};

    var news = [];

    if (netWorth > 1000000) {
      news.push({
        title: 'Il giovane lupo di Wall Street fa tremare i mercati',
        content: name + ' ha superato il milione di euro di patrimonio. Gli analisti parlano di fenomeno della finanza italiana.',
        impact: 'positive', sector: 'FIN', company: null, priceChangePct: 1.5, source: 'player'
      });
    }

    if (netWorth > 10000000) {
      news.push({
        title: 'Magnate della finanza: ' + name + ' raggiunge i 10 milioni',
        content: name + ' e\' ormai una leggenda di Wall Street. Il suo patrimonio supera i 10 milioni di euro.',
        impact: 'positive', sector: 'FIN', company: null, priceChangePct: 2.0, source: 'player'
      });
    }

    if (darkActions.insiderTrades && darkActions.insiderTrades.length > 2) {
      news.push({
        title: 'SEC indaga su operazioni sospette del broker emergente',
        content: 'La SEC ha aperto un\'indagine preliminare su ' + name + ' per presunte operazioni di insider trading.',
        impact: 'negative', sector: 'FIN', company: null, priceChangePct: -1.5, source: 'player'
      });
    }

    if (darkActions.pumpDumps && darkActions.pumpDumps.length > 1) {
      news.push({
        title: 'Voci di manipolazione di mercato intorno a ' + name,
        content: 'Analisti indipendenti hanno notato pattern sospetti nei trade di ' + name + ', compatibili con schemi di pump & dump.',
        impact: 'negative', sector: 'FIN', company: null, priceChangePct: -1.0, source: 'player'
      });
    }

    if (rep.sec && rep.sec < 40) {
      news.push({
        title: 'Raid SEC imminente? Gli occhi puntati su ' + name,
        content: 'I punteggi di reputazione regulator di ' + name + ' sono ai minimi storici.',
        impact: 'negative', sector: 'FIN', company: null, priceChangePct: -0.8, source: 'player'
      });
    }

    if (rep.wallStreet && rep.wallStreet > 80 && level >= 6) {
      news.push({
        title: name + ' entra nell\'oligarchia di Wall Street',
        content: name + ' e\' stato ammesso all\'exclusive Wall Street Club.',
        impact: 'positive', sector: 'FIN', company: null, priceChangePct: 1.2, source: 'player'
      });
    }

    if (stats.totalTrades > 100) {
      news.push({
        title: 'Il broker piu\' attivo del mese: ' + name,
        content: name + ' ha eseguito oltre ' + stats.totalTrades + ' operazioni, diventando il broker piu\' attivo della piazza.',
        impact: 'neutral', sector: 'FIN', company: null, priceChangePct: 0.3, source: 'player'
      });
    }

    if (level >= 10) {
      news.push({
        title: 'Il re di Wall Street: intervista esclusiva a ' + name,
        content: name + ' ha raggiunto l\'apice della carriera finanziaria.',
        impact: 'positive', sector: 'FIN', company: null, priceChangePct: 1.0, source: 'player'
      });
    }

    return news;
  }

  // ============================================================
  // GESTIONE CACHE
  // ============================================================

  function _addToCache(entry) {
    cache.push(entry);
    while (cache.length > CONFIG.maxCacheSize) {
      cache.shift();
    }
  }

  function getCache() {
    return cache.slice();
  }

  function clearCache() {
    cache = [];
  }

  // ============================================================
  // APPLICAZIONE IMPATTI SUL MERCATO
  // ============================================================

  function applyNewsImpact(news, companies) {
    if (!news || !Array.isArray(news) || !companies || !Array.isArray(companies)) return;

    news.forEach(function (n) {
      if (!n.priceChangePct || n.priceChangePct === 0) return;

      var changeFraction = n.priceChangePct / 100;

      if (n.company) {
        var company = companies.find(function (c) {
          return c.name === n.company || c.ticker === n.company;
        });
        if (company && company.price) {
          company.price = Math.max(0.01, company.price * (1 + changeFraction));
          company.price = Math.round(company.price * 100) / 100;
        }
      } else if (n.sector) {
        companies.forEach(function (c) {
          if (c.sector === n.sector && c.price) {
            var sectorChange = changeFraction * (0.5 + Math.random() * 0.5);
            c.price = Math.max(0.01, c.price * (1 + sectorChange));
            c.price = Math.round(c.price * 100) / 100;
          }
        });
      } else {
        companies.forEach(function (c) {
          if (c.price) {
            var generalChange = changeFraction * (0.3 + Math.random() * 0.4);
            c.price = Math.max(0.01, c.price * (1 + generalChange));
            c.price = Math.round(c.price * 100) / 100;
          }
        });
      }
    });
  }

  // ============================================================
  // PROCESS NEWS TURN
  // ============================================================

  function processNewsTurn(gameState) {
    callsThisTurn = 0;

    var market = gameState.market || {};
    var companies = market.companies || [];

    return generateNews(gameState).then(function (news) {
      // Applica impatti sui prezzi
      applyNewsImpact(news, companies);

      // Aggiorna sentiment
      var sentimentDelta = 0;
      news.forEach(function (n) {
        if (n.impact === 'positive') sentimentDelta += 1.5;
        else if (n.impact === 'negative') sentimentDelta -= 1.5;
      });
      if (market.sentiment !== undefined) {
        market.sentiment = Math.max(0, Math.min(100, market.sentiment + sentimentDelta));
      }

      // Aggiungi al newsLog
      if (market.newsLog) {
        var week = (gameState.player && gameState.player.week) || 1;
        var events = news.map(function (n) {
          return {
            ticker: n.company || n.sector || 'MARKET',
            news: n.title + ' -- ' + n.content.substring(0, 80) + '...',
            impact: n.priceChangePct / 100,
            source: n.source || 'llm'
          };
        });
        market.newsLog.push({ week: week, events: events, timestamp: Date.now() });
      }

      return news;
    });
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

    return _fetchWithTimeout(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.apiKey
      },
      body: body
    }, CONFIG.timeoutMs).then(function (response) {
      if (!response.ok) {
        return { success: false, error: 'HTTP ' + response.status + ' ' + response.statusText };
      }
      return response.json().then(function (data) {
        var content = data.message || (data.choices && data.choices[0] && data.choices[0].message) || data;
        var text = typeof content === 'string' ? content : (content.content || content.text || '');
        return { success: true, response: text, model: CONFIG.model, endpoint: CONFIG.endpoint };
      });
    }).catch(function (err) {
      return { success: false, error: err.message || String(err) };
    });
  }

  // ============================================================
  // API PUBBLICA
  // ============================================================

  var LLMNewsEngine = {
    // Config
    config: CONFIG,
    configure: function (opts) {
      if (!opts) return;
      var settings = {};
      if (opts.endpoint) settings.endpoint = opts.endpoint;
      if (opts.apiKey) settings.apiKey = opts.apiKey;
      if (opts.model) settings.model = opts.model;
      if (typeof opts.enabled === 'boolean') settings.enabled = opts.enabled;
      if (typeof opts.temperature === 'number') settings.temperature = opts.temperature;
      if (typeof opts.maxTokens === 'number') settings.maxTokens = opts.maxTokens;
      if (typeof opts.timeoutMs === 'number') settings.timeoutMs = opts.timeoutMs;
      saveSettings(settings);
    },

    // Settings
    getSettings: getSettings,
    saveSettings: saveSettings,

    // Generazione notizie
    generateNews: generateNews,
    processNewsTurn: processNewsTurn,
    applyNewsImpact: applyNewsImpact,

    // Fallback
    getFallbackNews: function (gameState) { return _getFallbackNews(gameState); },
    getStaticPool: function () { return STATIC_NEWS_POOL.slice(); },

    // Player news
    generatePlayerNews: function (gameState) { return _generatePlayerNews(gameState); },

    // Cache
    getCache: getCache,
    clearCache: clearCache,

    // Reset rate limiter
    resetTurn: function () { callsThisTurn = 0; },

    // Test
    testConnection: testConnection,

    // Utility
    buildUserPrompt: _buildUserPrompt,
    parseNewsResponse: _parseNewsResponse,

    // Versione
    version: '2.0.0'
  };

  global.LLMNewsEngine = LLMNewsEngine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMNewsEngine;
  }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);