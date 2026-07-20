/* ============================================================================
 * WOLF OF WALL STREET - GAME CORE ENGINE
 * Vanilla JS | Exported as window.GameEngine (browser) or module.exports (Node)
 * Complete, playable, no placeholders.
 * ============================================================================ */

(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.GameEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==========================================================================
   * CONSTANTS & CONFIGURATION
   * ========================================================================== */

  var SAVE_VERSION = 3;
  var AUTOSAVE_SLOT = 'autosave';
  var MAX_SAVE_SLOTS = 5;
  var WEEKS_PER_YEAR = 52;
  var WEEKS_PER_QUARTER = 13;
  var BASE_XP = 100;
  var XP_GROWTH = 1.35;

  var DIFFICULTY_CONFIG = {
    easy: {
      commissionRate: 0.002,
      slippageRate: 0.001,
      eventFrequency: 0.30,
      marketVolatility: 0.015,
      secAggression: 0.5,
      marketBias: 0.003,
      label: 'Facile'
    },
    normal: {
      commissionRate: 0.005,
      slippageRate: 0.003,
      eventFrequency: 0.50,
      marketVolatility: 0.025,
      secAggression: 1.0,
      marketBias: 0.0,
      label: 'Normale'
    },
    hard: {
      commissionRate: 0.008,
      slippageRate: 0.005,
      eventFrequency: 0.70,
      marketVolatility: 0.040,
      secAggression: 1.5,
      marketBias: -0.002,
      label: 'Difficile'
    },
    nightmare: {
      commissionRate: 0.012,
      slippageRate: 0.008,
      eventFrequency: 0.85,
      marketVolatility: 0.060,
      secAggression: 2.5,
      marketBias: -0.005,
      label: 'Nightmare'
    }
  };

  var LEVELS = [
    { id: 1, name: 'Novizio', minNetWorth: 10000, minXP: 0, minMissions: 0, unlocks: ['long'], desc: 'Solo long positions. Impara le basi.' },
    { id: 2, name: 'Apprendista', minNetWorth: 25000, minXP: 200, minMissions: 3, unlocks: ['long','limit'], desc: 'Limit orders sbloccati.' },
    { id: 3, name: 'Trader', minNetWorth: 50000, minXP: 500, minMissions: 6, unlocks: ['long','limit','short'], desc: 'Short selling sbloccato.' },
    { id: 4, name: 'Agente', minNetWorth: 100000, minXP: 1000, minMissions: 10, unlocks: ['long','limit','short','margin2x'], desc: 'Margin 2x sbloccato. Assumi agenti.' },
    { id: 5, name: 'Broker', minNetWorth: 250000, minXP: 2000, minMissions: 15, unlocks: ['long','limit','short','margin2x','margin3x','penny'], desc: 'Margin 3x + Penny stocks.' },
    { id: 6, name: 'Senior Broker', minNetWorth: 500000, minXP: 4000, minMissions: 20, unlocks: ['long','limit','short','margin2x','margin3x','margin5x','penny'], desc: 'Margin 5x sbloccato.' },
    { id: 7, name: 'Portfolio Manager', minNetWorth: 1000000, minXP: 8000, minMissions: 25, unlocks: ['long','limit','short','margin2x','margin3x','margin5x','penny','options'], desc: 'Opzioni sbloccate.' },
    { id: 8, name: 'Hedge Fund Manager', minNetWorth: 5000000, minXP: 15000, minMissions: 30, unlocks: ['long','limit','short','margin2x','margin3x','margin5x','penny','options','darkpool'], desc: 'Dark pool sbloccato.' },
    { id: 9, name: 'Market Wizard', minNetWorth: 10000000, minXP: 25000, minMissions: 35, unlocks: ['long','limit','short','margin2x','margin3x','margin5x','penny','options','darkpool','all'], desc: 'Tutto sbloccato.' },
    { id: 10, name: 'Leggenda di Wall Street', minNetWorth: 50000000, minXP: 50000, minMissions: 40, unlocks: ['long','limit','short','margin2x','margin3x','margin5x','penny','options','darkpool','all','endgame'], desc: 'Modalità endgame.' }
  ];

  var CHAPTERS = [
    { id: 1, name: 'Primi Passi', triggerLevel: 1, triggerNetWorth: 0, triggerMissions: 0,
      intro: 'Sei un giovane trader che entra nella Borsa. Hai €10.000 e un sogno.',
      mainMission: 'first_trade', npc: 'Mentore Marco', moralChoice: 'first_moral' },
    { id: 2, name: 'Sette di Spade', triggerLevel: 2, triggerNetWorth: 25000, triggerMissions: 3,
      intro: 'Enri in una boutique firm. Ti mostrano i segreti del mestiere.',
      mainMission: 'make_50k', npc: 'Direttore Rossi', moralChoice: 'first_short' },
    { id: 3, name: 'Il Salto', triggerLevel: 3, triggerNetWorth: 50000, triggerMissions: 6,
      intro: 'Fondi la tua boutique. Ora comandi tu.',
      mainMission: 'first_short_profit', npc: 'Cliente Vecchio', moralChoice: 'pump_dump_offer' },
    { id: 4, name: 'Lupo Solitario', triggerLevel: 4, triggerNetWorth: 100000, triggerMissions: 10,
      intro: 'Hai abbastanza per assumere agenti. Costruisci il tuo impero.',
      mainMission: 'hire_first_agent', npc: 'Agente Sarah', moralChoice: 'insider_offer' },
    { id: 5, name: 'L\'Orologio Ticchetta', triggerLevel: 5, triggerNetWorth: 250000, triggerMissions: 15,
      intro: 'La SEC inizia a guardarti. Stai attento.',
      mainMission: 'survive_raid', npc: 'Avvocato Tess', moralChoice: 'bribe_or_not' },
    { id: 6, name: 'Impero', triggerLevel: 6, triggerNetWorth: 500000, triggerMissions: 20,
      intro: 'Il tuo hedge fund prende forma. I clienti entrano a frotte.',
      mainMission: 'reach_1m', npc: 'Cliente Istituzionale', moralChoice: 'front_running_offer' },
    { id: 7, name: 'Apice', triggerLevel: 7, triggerNetWorth: 1000000, triggerMissions: 25,
      intro: 'Sei un Portfolio Manager. Il mondo finance ti osserva.',
      mainMission: 'options_master', npc: 'Quants Lead', moralChoice: 'market_manipulation' },
    { id: 8, name: 'Ombre', triggerLevel: 8, triggerNetWorth: 5000000, triggerMissions: 30,
      intro: 'Dark pools, derivati complessi. Gioca col fuoco.',
      mainMission: 'dark_pool_profit', npc: 'Dark Pool Operator', moralChoice: 'ultimate_power' },
    { id: 9, name: 'Il Giudizio', triggerLevel: 9, triggerNetWorth: 10000000, triggerMissions: 35,
      intro: 'Tutto sta per esplodere. La SEC, i rivali, il tuo passato.',
      mainMission: 'final_chapter', npc: 'SEC Investigator', moralChoice: 'final_choice' },
    { id: 10, name: 'Epilogo', triggerLevel: 10, triggerNetWorth: 50000000, triggerMissions: 40,
      intro: 'La tua eredità è scritta. Come sarai ricordato?',
      mainMission: 'endgame', npc: 'Narratore', moralChoice: 'legacy' }
  ];

  var ACHIEVEMENTS = [
    // Trading milestones
    { id: 'first_trade', name: 'Primo Trade', desc: 'Completa il tuo primo trade', xp: 100 },
    { id: 'first_profit', name: 'Primo Profitto', desc: 'Realizza il tuo primo profitto', xp: 100 },
    { id: 'first_loss', name: 'Prima Perdita', desc: 'Realizza la tua prima perdita', xp: 50 },
    { id: 'ten_trades', name: 'Dieci Trade', desc: 'Completa 10 trade', xp: 100 },
    { id: 'fifty_trades', name: 'Cinquanta Trade', desc: 'Completa 50 trade', xp: 200 },
    { id: 'hundred_trades', name: 'Centurione', desc: 'Completa 100 trade', xp: 300 },
    { id: 'five_hundred_trades', name: 'Professionista', desc: 'Completa 500 trade', xp: 500 },
    // Wealth milestones
    { id: 'first_10k', name: 'Primi 10K', desc: 'Raggiungi €10.000 di patrimonio', xp: 100 },
    { id: 'first_50k', name: 'Cinquanta Grande', desc: 'Raggiungi €50.000', xp: 150 },
    { id: 'first_100k', name: 'Sei Zeri', desc: 'Raggiungi €100.000', xp: 200 },
    { id: 'first_500k', name: 'Mezzo Milione', desc: 'Raggiungi €500.000', xp: 300 },
    { id: 'first_million', name: 'Primo Milione', desc: 'Raggiungi €1.000.000', xp: 500 },
    { id: 'first_5m', name: 'Cinque Milioni', desc: 'Raggiungi €5.000.000', xp: 800 },
    { id: 'first_10m', name: 'Dieci Milioni', desc: 'Raggiungi €10.000.000', xp: 1000 },
    { id: 'first_50m', name: 'Cinque Piene', desc: 'Raggiungi €50.000.000', xp: 2000 },
    // Short selling
    { id: 'first_short', name: 'Primo Short', desc: 'Esegui il tuo primo short', xp: 100 },
    { id: 'big_short', name: 'Big Short', desc: 'Profitto >€100.000 su un singolo short', xp: 500 },
    { id: 'short_master', name: 'Maestro degli Short', desc: '100 short trade completati', xp: 500 },
    // Penny stocks
    { id: 'penny_first', name: 'Prima Penny', desc: 'Compra la tua prima penny stock', xp: 50 },
    { id: 'penny_king', name: 'Penny Stock King', desc: '€50.000 di profitto da penny stocks', xp: 400 },
    // Assemblee
    { id: 'first_vote', name: 'Primo Voto', desc: 'Vota alla tua prima assemblea', xp: 100 },
    { id: 'vote_20', name: 'Re delle Assemblee', desc: '20 assemblee votate', xp: 400 },
    { id: 'control_5', name: 'Barone dell\'Industria', desc: 'Controlli 5 società', xp: 600 },
    // IPO
    { id: 'first_ipo', name: 'Prima IPO', desc: 'Compra la tua prima IPO', xp: 150 },
    { id: 'ipo_hunter', name: 'IPO Hunter', desc: '10 IPO comprate', xp: 400 },
    // Dark actions
    { id: 'first_pump', name: 'Primo Pump', desc: 'Esegui il tuo primo pump & dump', xp: 100 },
    { id: 'ghost_trader', name: 'Ghost Trader', desc: '10 insider trade senza essere beccato', xp: 600 },
    { id: 'front_runner', name: 'Front Runner', desc: 'Esegui il tuo primo front running', xp: 150 },
    { id: 'bribe_master', name: 'Corruzione', desc: 'Paga 5 tangenti', xp: 300 },
    // Ethics
    { id: 'philanthropist', name: 'Filantropo', desc: '€100.000 in donazioni', xp: 400 },
    { id: 'saint', name: 'Santo', desc: 'Etica sempre sopra 80 per 26 settimane', xp: 500 },
    { id: 'redemption', name: 'Redenzione', desc: 'Completa il gioco con etica >70', xp: 1000 },
    { id: 'wolf', name: 'Lupo di Wall Street', desc: 'Completa il gioco con etica <30', xp: 1000 },
    // Survival
    { id: 'survive_crash', name: 'Inossidabile', desc: 'Sopravvivi a un crash senza perdite', xp: 500 },
    { id: 'survive_raid', name: 'Sopravvissuto', desc: 'Sopravvivi a un raid SEC', xp: 300 },
    { id: 'bankrupt_once', name: 'Ripartenza', desc: 'Riparti dal fondo dopo bancarotta', xp: 200 },
    // Clients
    { id: 'first_client', name: 'Primo Cliente', desc: 'Ottieni il tuo primo cliente', xp: 100 },
    { id: 'ten_clients', name: 'Gestore Patrimoniale', desc: '10 clienti attivi', xp: 400 },
    { id: 'fifty_clients', name: 'Magnetismo', desc: '50 clienti attivi', xp: 800 },
    { id: 'client_million', name: 'Gestore del Secolo', desc: '€1M di AUM (asset under management)', xp: 600 },
    // Agents
    { id: 'first_agent', name: 'Primo Assunto', desc: 'Assumi il tuo primo agente', xp: 200 },
    { id: 'five_agents', name: 'Ufficio Affollato', desc: '5 agenti impiegati', xp: 400 },
    { id: 'agent_betrayal', name: 'Tradimento', desc: 'Un agente ti tradisce', xp: 100 },
    // Special
    { id: 'week_52', name: 'Un Anno', desc: 'Completa il tuo primo anno', xp: 200 },
    { id: 'all_levels', name: 'Max Level', desc: 'Raggiungi il livello 10', xp: 1000 },
    { id: 'all_achievements', name: 'Perfezionista', desc: 'Sblocca tutti gli achievement', xp: 2000 }
  ];

  var COMPANY_SECTORS = ['Tech','Finance','Energy','Healthcare','Consumer','Industrial','Real Estate','Materials','Utilities','Telecom'];
  var COMPANY_NAMES = [
    'Aurora Tech','Brioschi Finance','Cannas Energy','Diana Health','Edoardo Consumer',
    'Ferraro Industrial','Gallura RealEstate','Helios Materials','Italia Utilities','Juno Telecom',
    'Kalos Robotics','Lumen Solar','Mariposa Foods','Nova Pharma','Olimpo Bank',
    'Pixel Studios','Quasar Semiconductors','Rinascita Auto','Smeraldo Mining','Titan Aerospace'
  ];

  var NPC_NAMES = [
    'Marco Bovelli','Rossi Direttore','Sarah Chen','Tess Avvocato','Vecchio Tizio',
    'Quants Lead','Dark Pool Op','Investigator SEC','Narratore','Rivale Carlo',
    'Giovane Anna','Veterano Luigi','Analista Paola','Trader Mike','Broker Elena'
  ];

  var EVENT_TYPES = {
    company: [
      { type: 'earnings_beat', desc: 'supera le stime', impact: 0.05, vol: 0.03 },
      { type: 'earnings_miss', desc: 'delude le stime', impact: -0.06, vol: 0.04 },
      { type: 'product_launch', desc: 'lancia nuovo prodotto', impact: 0.08, vol: 0.05 },
      { type: 'scandal', desc: 'scandalo aziendale', impact: -0.12, vol: 0.07 },
      { type: 'merger_rumor', desc: 'voci di acquisizione', impact: 0.10, vol: 0.06 },
      { type: 'lawsuit', desc: 'causa legale', impact: -0.08, vol: 0.05 },
      { type: 'dividend_hike', desc: 'aumenta dividendo', impact: 0.04, vol: 0.02 },
      { type: 'ceo_change', desc: 'cambio CEO', impact: -0.03, vol: 0.05 },
      { type: 'fda_approval', desc: 'approvazione regolamentare', impact: 0.15, vol: 0.08 },
      { type: 'recall', desc: 'ritiro prodotto', impact: -0.07, vol: 0.04 }
    ],
    sector: [
      { type: 'sector_boom', desc: 'boom di settore', impact: 0.04, vol: 0.02 },
      { type: 'sector_bust', desc: 'crisi di settore', impact: -0.05, vol: 0.03 },
      { type: 'regulation', desc: 'nuova regolamentazione', impact: -0.03, vol: 0.02 }
    ],
    macro: [
      { type: 'rate_cut', desc: 'taglio tassi', impact: 0.03, vol: 0.01 },
      { type: 'rate_hike', desc: 'aumento tassi', impact: -0.04, vol: 0.02 },
      { type: 'recession', desc: 'recessione temuta', impact: -0.08, vol: 0.04 },
      { type: 'boom', desc: 'crescita economica', impact: 0.05, vol: 0.02 },
      { type: 'inflation', desc: 'inflazione alta', impact: -0.03, vol: 0.02 },
      { type: 'geopolitical', desc: 'tensioni geopolitiche', impact: -0.05, vol: 0.03 }
    ]
  };

  var MISSION_TEMPLATES = {
    first_trade: { name: 'Primo Trade', desc: 'Esegui il tuo primo trade', xp: 50, cash: 0,
      check: function(s) { return s.player.stats.totalTrades >= 1; }, deadline: 0 },
    make_50k: { name: '€50K di Patrimonio', desc: 'Raggiungi €50.000 di patrimonio', xp: 100, cash: 5000,
      check: function(s) { return s.player.netWorth >= 50000; }, deadline: 0 },
    first_short_profit: { name: 'Profitto dallo Short', desc: 'Realizza un profitto da uno short', xp: 100, cash: 2000,
      check: function(s) { return s.player.stats.shortProfits > 0; }, deadline: 0 },
    hire_first_agent: { name: 'Assumi un Agente', desc: 'Assumi il tuo primo agente', xp: 100, cash: 0,
      check: function(s) { return s.player.stats.agentsHired >= 1; }, deadline: 0 },
    survive_raid: { name: 'Sopravvivi al Raid', desc: 'Sopravvivi a un raid SEC', xp: 200, cash: 10000,
      check: function(s) { return s.player.stats.raidsSurvived >= 1; }, deadline: 0 },
    reach_1m: { name: 'Un Milione', desc: 'Raggiungi €1.000.000 di patrimonio', xp: 300, cash: 50000,
      check: function(s) { return s.player.netWorth >= 1000000; }, deadline: 0 },
    options_master: { name: 'Maestro delle Opzioni', desc: 'Esegui 10 trade di opzioni', xp: 200, cash: 10000,
      check: function(s) { return s.player.stats.optionsTrades >= 10; }, deadline: 0 },
    dark_pool_profit: { name: 'Profitti Oscuri', desc: '€500K di profitto dal dark pool', xp: 300, cash: 25000,
      check: function(s) { return s.player.stats.darkPoolProfit >= 500000; }, deadline: 0 },
    final_chapter: { name: 'Giudizio Finale', desc: 'Sopravvivi fino al capitolo 10', xp: 500, cash: 100000,
      check: function(s) { return s.player.chapter >= 10; }, deadline: 0 },
    endgame: { name: 'Eredita Wall Street', desc: 'Raggiungi €50M', xp: 1000, cash: 500000,
      check: function(s) { return s.player.netWorth >= 50000000; }, deadline: 0 },
    trade_10: { name: 'Dieci Trade', desc: 'Completa 10 trade', xp: 100, cash: 1000,
      check: function(s) { return s.player.stats.totalTrades >= 10; }, deadline: 0 },
    trade_50: { name: 'Cinquanta Trade', desc: 'Completa 50 trade', xp: 200, cash: 5000,
      check: function(s) { return s.player.stats.totalTrades >= 50; }, deadline: 0 },
    first_million_aum: { name: 'Primo Milione AUM', desc: 'Raggiungi €1M di AUM', xp: 200, cash: 10000,
      check: function(s) { return s.player.stats.totalAUM >= 1000000; }, deadline: 0 },
    donate_10k: { name: 'Generoso', desc: 'Dona €10.000 in beneficenza', xp: 100, cash: 0,
      check: function(s) { return s.player.stats.totalDonated >= 10000; }, deadline: 0 },
    survive_year: { name: 'Sopravvissuto', desc: 'Completa un anno di trading', xp: 200, cash: 5000,
      check: function(s) { return s.player.year >= 2; }, deadline: 0 },
    vote_assembly: { name: 'Democrazia', desc: 'Vota a un\'assemblea aziendale', xp: 100, cash: 0,
      check: function(s) { return s.player.stats.assembliesVoted >= 1; }, deadline: 0 }
  };

  var CLIENT_NAMES = [
    'Giovanni Ricco','Anna Saggio','Carlo Investitori','Maria Denaro','Paolo Risparmi',
    'Lucia Affari','Roberto Capitale','Sofia Beni','Francesco Oro','Chiara Portafoglio',
    'Alessandro Bond','Valeria Crescita','Michele Dividendo','Barbara Azioni','Stefano Mercato'
  ];

  var AGENT_NAMES = [
    'Sarah Chen','Mike Ross','Elena Vargas','Tom Reed','Lisa Park',
    'Carlos Mendez','Nina Patel','James Wolf','Diana Fox','Mark Stone'
  ];

  var AGENT_SKILLS = ['trading','sales','research'];

  /* ==========================================================================
   * UTILITIES
   * ========================================================================== */

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function round2(v) { return Math.round(v * 100) / 100; }
  function roundCents(v) { return Math.round(v * 100) / 100; }
  function rng() { return Math.random(); }
  function rngInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function rngPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rngGauss(mean, stdev) {
    var u1 = Math.random() || 0.0001;
    var u2 = Math.random();
    return mean + stdev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function b64encode(str) {
    if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(str)));
    return Buffer ? Buffer.from(str, 'utf8').toString('base64') : str;
  }
  function b64decode(str) {
    if (typeof atob !== 'undefined') return decodeURIComponent(escape(atob(str)));
    return Buffer ? Buffer.from(str, 'base64').toString('utf8') : str;
  }
  function formatMoney(v) {
    if (v >= 1e9) return '\u20ac' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '\u20ac' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '\u20ac' + (v / 1e3).toFixed(1) + 'K';
    return '\u20ac' + v.toFixed(2);
  }

  /* ==========================================================================
   * CORE GAME ENGINE
   * ========================================================================== */

  function GameEngine() {
    this.state = null;
    this.listeners = [];
    this._saveCallbacks = [];
  }

  /* --- Event system --- */
  GameEngine.prototype.on = function (event, cb) {
    this.listeners.push({ event: event, cb: cb });
  };

  GameEngine.prototype.emit = function (event, data) {
    for (var i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i].event === event) {
        this.listeners[i].cb(data);
      }
    }
  };

  GameEngine.prototype.notify = function (type, title, message) {
    var n = { id: uid(), type: type, title: title, message: message, time: this.state ? this.state.player.week : 0, read: false };
    this.state.notifications.unshift(n);
    if (this.state.notifications.length > 50) this.state.notifications.pop();
    this.emit('notification', n);
    return n;
  };

  /* ==========================================================================
   * 1. GAME STATE INITIALIZATION
   * ========================================================================== */

  GameEngine.prototype.createInitialState = function (playerName, difficulty) {
    playerName = playerName || 'Trader';
    difficulty = difficulty || 'normal';
    var diffCfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;

    var companies = this._generateCompanies(20);

    var state = {
      player: {
        name: playerName,
        cash: 10000,
        netWorth: 10000,
        level: 1,
        xp: 0,
        ethics: 50,
        reputation: {
          sec: 100,
          clients: 50,
          wallStreet: 50,
          underworld: 10
        },
        week: 1,
        year: 1,
        chapter: 1,
        missions: [],
        achievements: [],
        stats: {
          totalTrades: 0,
          totalProfit: 0,
          totalLoss: 0,
          shortProfits: 0,
          optionsTrades: 0,
          darkPoolProfit: 0,
          totalDonated: 0,
          totalAUM: 0,
          agentsHired: 0,
          raidsSurvived: 0,
          assembliesVoted: 0,
          iposBought: 0,
          pennyProfit: 0,
          weeksPlayed: 0,
          highestNetWorth: 10000,
          bribesPaid: 0,
          insiderTrades: 0,
          pumpDumpsExecuted: 0,
          frontRunningExecuted: 0,
          companiesControlled: 0,
          bankruptcies: 0,
          maxClients: 0
        }
      },
      portfolio: {
        positions: {},
        history: [],
        realizedPnL: 0,
        unrealizedPnL: 0
      },
      market: {
        companies: companies,
        indices: {
          FTSEMIB: { value: 24000, change: 0 },
          SP500: { value: 4500, change: 0 },
          NASDAQ: { value: 15000, change: 0 }
        },
        sentiment: 50,
        macro: {
          interestRate: 2.5,
          inflation: 2.0,
          gdpGrowth: 1.5,
          unemployment: 5.0
        },
        pendingOrders: [],
        iposThisWeek: [],
        assembliesThisWeek: []
      },
      story: {
        currentChapter: 1,
        chapterProgress: 0,
        dialoguesSeen: [],
        choicesMade: [],
        flags: {}
      },
      darkActions: {
        pumpDumps: [],
        insiderTrades: [],
        frontRunning: [],
        bribes: []
      },
      clients: [],
      agents: [],
      notifications: [],
      settings: {
        sound: true,
        animations: true,
        difficulty: difficulty,
        difficultyConfig: diffCfg
      },
      meta: {
        saveVersion: SAVE_VERSION,
        createdAt: Date.now(),
        playtime: 0
      }
    };

    this.state = state;
    this._initMissions();
    this._checkAchievements();
    this.emit('stateCreated', state);
    return state;
  };

  GameEngine.prototype._generateCompanies = function (n) {
    var self = this;
    var MarketEngineCtor = null;
    if (typeof MarketEngine !== 'undefined') {
      MarketEngineCtor = MarketEngine;
    } else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      try { MarketEngineCtor = require('./market-engine.js'); } catch (e) { MarketEngineCtor = null; }
    }

    if (MarketEngineCtor) {
      var me = new MarketEngineCtor();
      var source = me.companies.slice(0, Math.min(n, me.companies.length));
      var companies = [];
      for (var i = 0; i < source.length; i++) {
        var c = source[i];
        var eps = c.consensusEPS;
        if (eps === null || eps === undefined || isNaN(eps)) eps = 0;
        var revenue = c.fundamentals && c.fundamentals.revenue ? c.fundamentals.revenue : 0;
        var profit = c.fundamentals && c.fundamentals.profit ? c.fundamentals.profit : 0;
        companies.push({
          id: c.id,
          ticker: c.ticker,
          name: c.name,
          sector: c.sector,
          price: c.price,
          prevClose: c.prevClose,
          open: c.openPrice,
          high: c.dayHigh,
          low: c.dayLow,
          volume: c.volumeToday || c.avgVolume,
          avgVolume: c.avgVolume,
          marketCap: c.marketCap,
          sharesOutstanding: c.sharesOutstanding,
          float: c.float,
          dividendYield: c.dividendYield,
          peRatio: c.peRatio || 999,
          beta: c.beta,
          momentum: c.momentum,
          sentiment: 50,
          isPenny: c.isPenny,
          isIPO: c.isIPO,
          IPOWeek: c.ipoWeek,
          earnings: {
            revenue: revenue,
            netIncome: profit,
            eps: eps,
            quarter: 1
          },
          assemblyScheduled: false,
          assemblyVotes: {},
          events: []
        });
      }
      return companies;
    }

    var companies = [];
    for (var i = 0; i < n; i++) {
      var sector = COMPANY_SECTORS[i % COMPANY_SECTORS.length];
      var price = roundCents(rngGauss(50, 30));
      if (price < 1) price = roundCents(rng() * 5 + 1);
      var shares = rngInt(1000000, 50000000);
      var isPenny = price < 5;
      var divYield = rng() < 0.4 ? round2(rng() * 0.05) : 0;
      companies.push({
        id: 'C' + (i + 1),
        ticker: COMPANY_NAMES[i].slice(0, 4).toUpperCase(),
        name: COMPANY_NAMES[i],
        sector: sector,
        price: Math.max(0.10, price),
        prevClose: Math.max(0.10, price),
        open: Math.max(0.10, price),
        high: Math.max(0.10, price),
        low: Math.max(0.10, price),
        volume: rngInt(100000, 10000000),
        avgVolume: rngInt(100000, 10000000),
        marketCap: Math.max(0.10, price) * shares,
        sharesOutstanding: shares,
        float: Math.floor(shares * (0.6 + rng() * 0.3)),
        dividendYield: divYield,
        peRatio: round2(rngGauss(20, 10)),
        beta: round2(rngGauss(1.0, 0.3)),
        momentum: 0,
        sentiment: 50,
        isPenny: isPenny,
        isIPO: false,
        IPOWeek: 0,
        earnings: {
          revenue: rngInt(1000000, 1000000000),
          netIncome: rngInt(-100000000, 500000000),
          eps: round2(rngGauss(2, 3)),
          quarter: 1
        },
        assemblyScheduled: false,
        assemblyVotes: {},
        events: []
      });
    }
    return companies;
  };

  GameEngine.prototype.getState = function () { return this.state; };
  GameEngine.prototype.setState = function (s) { this.state = s; this.emit('stateLoaded', s); };
  GameEngine.prototype.installCompetitorEngine = function (ce) { this._competitorEngine = ce; };

  /* ==========================================================================
   * 2. XP & LEVELING SYSTEM
   * ========================================================================== */

  GameEngine.prototype.xpForLevel = function (level) {
    if (level <= 1) return 0;
    var total = 0;
    for (var l = 1; l < level; l++) {
      total += Math.floor(BASE_XP * Math.pow(XP_GROWTH, l - 1));
    }
    return total;
  };

  GameEngine.prototype.addXP = function (amount) {
    this.state.player.xp += amount;
    this.emit('xpGained', { amount: amount, total: this.state.player.xp });
    this._checkLevelUp();
  };

  GameEngine.prototype._checkLevelUp = function () {
    var p = this.state.player;
    var leveledUp = false;
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      var lv = LEVELS[i];
      if (p.xp >= lv.minXP && p.netWorth >= lv.minNetWorth && this._completedMissionsCount() >= lv.minMissions) {
        if (p.level < lv.id) {
          p.level = lv.id;
          leveledUp = true;
          this.emit('levelUp', { level: lv });
          this.notify('levelup', 'Level Up!', 'Sei ora ' + lv.name + ' (Livello ' + lv.id + ')');
          this._onChapterProgress();
          this._checkAchievements();
        }
        break;
      }
    }
    return leveledUp;
  };

  GameEngine.prototype.getLevelInfo = function (level) {
    level = level || this.state.player.level;
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].id === level) return LEVELS[i];
    }
    return LEVELS[0];
  };

  GameEngine.prototype.hasUnlock = function (unlockName) {
    var lv = this.getLevelInfo();
    if (!lv.unlocks) return false;
    return lv.unlocks.indexOf(unlockName) !== -1 || lv.unlocks.indexOf('all') !== -1;
  };

  GameEngine.prototype._completedMissionsCount = function () {
    return this.state.player.achievements.filter(function (a) { return a.source === 'mission'; }).length;
  };

  /* ==========================================================================
   * 3. MISSION SYSTEM
   * ========================================================================== */

  GameEngine.prototype._initMissions = function () {
    var self = this;
    var missions = [];
    var keys = Object.keys(MISSION_TEMPLATES);
    for (var i = 0; i < keys.length; i++) {
      var tpl = MISSION_TEMPLATES[keys[i]];
      missions.push({
        id: keys[i],
        name: tpl.name,
        desc: tpl.desc,
        xp: tpl.xp,
        cash: tpl.cash,
        check: tpl.check,
        deadline: tpl.deadline,
        startWeek: this.state.player.week,
        status: 'active',
        progress: 0
      });
    }
    this.state.player.missions = missions;
  };

  GameEngine.prototype._checkMissions = function () {
    var self = this;
    var missions = this.state.player.missions;
    var completed = [];
    for (var i = missions.length - 1; i >= 0; i--) {
      var m = missions[i];
      if (m.status !== 'active') continue;
      if (m.check && m.check(this.state)) {
        m.status = 'completed';
        completed.push(m);
        this._rewardMission(m);
        this.state.player.achievements.push({ id: 'mission_' + m.id, source: 'mission', week: this.state.player.week });
        this.emit('missionCompleted', m);
        this.notify('mission', 'Missione Completata!', m.name + ' - ' + m.desc);
      } else if (m.deadline > 0 && (this.state.player.week - m.startWeek) > m.deadline) {
        m.status = 'failed';
        this.emit('missionFailed', m);
        this.notify('warning', 'Missione Fallita', m.name);
      }
    }
    return completed;
  };

  GameEngine.prototype._rewardMission = function (m) {
    if (m.xp) this.addXP(m.xp);
    if (m.cash) {
      this.state.player.cash += m.cash;
      this.notify('reward', 'Ricompensa', '+' + formatMoney(m.cash) + ' e +' + m.xp + ' XP');
    }
  };

  GameEngine.prototype.getActiveMissions = function () {
    return this.state.player.missions.filter(function (m) { return m.status === 'active'; });
  };

  GameEngine.prototype.getCompletedMissions = function () {
    return this.state.player.missions.filter(function (m) { return m.status === 'completed'; });
  };

  /* ==========================================================================
   * 4. ACHIEVEMENT SYSTEM
   * ========================================================================== */

  GameEngine.prototype._checkAchievements = function () {
    var self = this;
    var p = this.state.player;
    var stats = p.stats;
    var unlocked = [];
    var alreadyHave = {};
    for (var i = 0; i < p.achievements.length; i++) {
      alreadyHave[p.achievements[i].id] = true;
    }

    var checks = {
      first_trade: function () { return stats.totalTrades >= 1; },
      first_profit: function () { return stats.totalProfit > 0; },
      first_loss: function () { return stats.totalLoss > 0; },
      ten_trades: function () { return stats.totalTrades >= 10; },
      fifty_trades: function () { return stats.totalTrades >= 50; },
      hundred_trades: function () { return stats.totalTrades >= 100; },
      five_hundred_trades: function () { return stats.totalTrades >= 500; },
      first_10k: function () { return p.netWorth >= 10000; },
      first_50k: function () { return p.netWorth >= 50000; },
      first_100k: function () { return p.netWorth >= 100000; },
      first_500k: function () { return p.netWorth >= 500000; },
      first_million: function () { return p.netWorth >= 1000000; },
      first_5m: function () { return p.netWorth >= 5000000; },
      first_10m: function () { return p.netWorth >= 10000000; },
      first_50m: function () { return p.netWorth >= 50000000; },
      first_short: function () { return stats.shortProfits !== undefined && stats.totalTrades > 0; },
      big_short: function () {
        var pos = self.state.portfolio.positions;
        var keys = Object.keys(pos);
        for (var i = 0; i < keys.length; i++) {
          var v = pos[keys[i]];
          if (v.type === 'short' && v.realizedProfit > 100000) return true;
        }
        return false;
      },
      short_master: function () { return stats.totalTrades >= 100 && stats.shortProfits > 0; },
      penny_first: function () {
        var pos = self.state.portfolio.positions;
        var keys = Object.keys(pos);
        for (var i = 0; i < keys.length; i++) {
          if (pos[keys[i]].isPenny) return true;
        }
        return false;
      },
      penny_king: function () { return stats.pennyProfit >= 50000; },
      first_vote: function () { return stats.assembliesVoted >= 1; },
      vote_20: function () { return stats.assembliesVoted >= 20; },
      control_5: function () { return stats.companiesControlled >= 5; },
      first_ipo: function () { return stats.iposBought >= 1; },
      ipo_hunter: function () { return stats.iposBought >= 10; },
      first_pump: function () { return stats.pumpDumpsExecuted >= 1; },
      ghost_trader: function () { return stats.insiderTrades >= 10 && (self.state.player.reputation.sec > 30); },
      front_runner: function () { return stats.frontRunningExecuted >= 1; },
      bribe_master: function () { return stats.bribesPaid >= 5; },
      philanthropist: function () { return stats.totalDonated >= 100000; },
      saint: function () { return p.ethics >= 80 && (p.week % 26 === 0 || p.week >= 26); },
      redemption: function () { return p.chapter >= 10 && p.ethics > 70; },
      wolf: function () { return p.chapter >= 10 && p.ethics < 30; },
      survive_crash: function () { return stats.crashSurvived === true; },
      survive_raid: function () { return stats.raidsSurvived >= 1; },
      bankrupt_once: function () { return stats.bankruptcies >= 1; },
      first_client: function () { return self.state.clients.length >= 1; },
      ten_clients: function () { return self.state.clients.length >= 10; },
      fifty_clients: function () { return self.state.clients.length >= 50; },
      client_million: function () { return stats.totalAUM >= 1000000; },
      first_agent: function () { return stats.agentsHired >= 1; },
      five_agents: function () { return stats.agentsHired >= 5; },
      agent_betrayal: function () { return stats.agentBetrayal === true; },
      week_52: function () { return p.year >= 2; },
      all_levels: function () { return p.level >= 10; },
      all_achievements: function () { return p.achievements.length >= ACHIEVEMENTS.length - 1; }
    };

    for (var j = 0; j < ACHIEVEMENTS.length; j++) {
      var ach = ACHIEVEMENTS[j];
      if (alreadyHave[ach.id]) continue;
      var fn = checks[ach.id];
      if (fn && fn()) {
        p.achievements.push({ id: ach.id, week: p.week });
        this.addXP(ach.xp);
        this.emit('achievement', ach);
        this.notify('achievement', 'Achievement: ' + ach.name, ach.desc + ' (+' + ach.xp + ' XP)');
        unlocked.push(ach);
      }
    }
    return unlocked;
  };

  GameEngine.prototype.getAchievements = function () {
    return this.state.player.achievements;
  };

  GameEngine.prototype.getAllAchievementDefs = function () { return ACHIEVEMENTS; };

  /* ==========================================================================
   * 5. SEC RAID SYSTEM
   * ========================================================================== */

  GameEngine.prototype._checkSECRaid = function () {
    var p = this.state.player;
    var diffCfg = this.state.settings.difficultyConfig;
    var secRep = p.reputation.sec;
    var darkCount = this.state.darkActions.pumpDumps.length +
      this.state.darkActions.insiderTrades.length +
      this.state.darkActions.frontRunning.length +
      this.state.darkActions.bribes.length;
    var raidChance = 0;
    if (secRep < 80) raidChance += (80 - secRep) / 200 * diffCfg.secAggression;
    if (darkCount > 0) raidChance += darkCount * 0.02 * diffCfg.secAggression;
    if (p.ethics < 30) raidChance += 0.05 * diffCfg.secAggression;
    raidChance = clamp(raidChance, 0, 0.35);

    if (rng() < raidChance) {
      this._triggerSECRaid();
    }
  };

  GameEngine.prototype._triggerSECRaid = function () {
    var self = this;
    var p = this.state.player;
    var diffCfg = this.state.settings.difficultyConfig;
    var darkCount = this.state.darkActions.pumpDumps.length +
      this.state.darkActions.insiderTrades.length +
      this.state.darkActions.frontRunning.length;

    this.notify('danger', 'RAID SEC!', 'La SEC sta perquisendo i tuoi uffici!');
    this.emit('secRaid', {});

    // Freeze assets temporarily
    var frozenAmount = Math.min(p.cash * 0.5, darkCount * 50000 * diffCfg.secAggression);
    p.cash -= frozenAmount;
    p.reputation.sec = Math.max(0, p.reputation.sec - 20);
    p.reputation.wallStreet = Math.max(0, p.reputation.wallStreet - 10);

    // Fine proportional to dark actions
    var fine = darkCount * rngInt(20000, 100000) * diffCfg.secAggression;
    if (fine > p.cash) fine = p.cash * 0.8;
    p.cash -= fine;

    this.notify('danger', 'Multa SEC', 'Multa: ' + formatMoney(fine) + '. Asset congelati: ' + formatMoney(frozenAmount));

    // Check for game over
    if (p.ethics < 15 && p.netWorth < 50000) {
      this._gameOver('prison');
      return;
    }

    // Bribe option (high risk)
    var bribeCost = fine * 0.5;
    if (p.cash >= bribeCost && rng() < 0.4) {
      // Bribe can make raid go away
      if (rng() < 0.6) {
        p.cash -= bribeCost;
        p.stats.bribesPaid++;
        this.state.darkActions.bribes.push({ week: p.week, amount: bribeCost, reason: 'SEC raid' });
        p.reputation.underworld = clamp(p.reputation.underworld + 5, 0, 100);
        p.reputation.sec = clamp(p.reputation.sec + 15, 0, 100);
        this.notify('warning', 'Tangente Accettata', 'Hai pagato ' + formatMoney(bribeCost) + ' per far sparire il problema.');
        this.emit('bribe', { amount: bribeCost, success: true });
      } else {
        this.notify('danger', 'Tangente Rifiutata!', 'Il funzionario ha rifiutato e ha segnalato il tentativo.');
        p.reputation.sec = Math.max(0, p.reputation.sec - 15);
        this.emit('bribe', { amount: bribeCost, success: false });
      }
    }

    p.stats.raidsSurvived = (p.stats.raidsSurvived || 0) + 1;
    this._checkAchievements();
  };

  /* ==========================================================================
   * 6. CLIENTS SYSTEM
   * ========================================================================== */

  GameEngine.prototype._spawnClient = function () {
    var p = this.state.player;
    if (this.state.clients.length >= 100) return null;
    var name = rngPick(CLIENT_NAMES) + ' ' + rngInt(1, 99);
    var capital = rngInt(50000, 500000) * (1 + p.level * 0.1);
    var riskProfile = rngPick(['conservative','moderate','aggressive']);
    var feeRate = riskProfile === 'conservative' ? 0.01 : riskProfile === 'moderate' ? 0.02 : 0.03;
    var client = {
      id: uid(),
      name: name,
      capital: capital,
      initialCapital: capital,
      feeRate: feeRate,
      performanceFee: 0.20,
      riskProfile: riskProfile,
      joinedWeek: p.week,
      satisfaction: 60,
      isActive: true,
      lifetimeFees: 0
    };
    this.state.clients.push(client);
    p.stats.totalAUM += capital;
    if (this.state.clients.length > p.stats.maxClients) p.stats.maxClients = this.state.clients.length;
    this.emit('clientJoined', client);
    this.notify('client', 'Nuovo Cliente!', name + ' ha affidato ' + formatMoney(capital) + ' (fee ' + (feeRate * 100) + '%)');
    this._checkAchievements();
    return client;
  };

  GameEngine.prototype._processClients = function () {
    var p = this.state.player;
    var weeklyMarketReturn = this._computeMarketReturn();
    for (var i = this.state.clients.length - 1; i >= 0; i--) {
      var c = this.state.clients[i];
      if (!c.isActive) continue;
      // Growth/decline of client capital based on market + player reputation
      var perfMod = (p.reputation.wallStreet - 50) / 200;
      var growth = weeklyMarketReturn + perfMod + rngGauss(0, 0.01);
      c.capital *= (1 + growth);
      c.capital = Math.max(1000, c.capital);

      // Weekly management fee
      var weeklyFee = c.capital * (c.feeRate / 52);
      c.lifetimeFees += weeklyFee;
      p.cash += weeklyFee;

      // Performance fee if profitable
      if (c.capital > c.initialCapital) {
        var perfProfit = c.capital - c.initialCapital;
        var perfFee = perfProfit * c.performanceFee * 0.02; // small fraction weekly
        if (perfFee > 0) {
          c.lifetimeFees += perfFee;
          p.cash += perfFee;
        }
      }

      // Satisfaction update
      if (growth > 0) c.satisfaction = clamp(c.satisfaction + 1, 0, 100);
      else c.satisfaction = clamp(c.satisfaction - 2, 0, 100);

      // Client leaves if satisfaction too low
      if (c.satisfaction < 20 && rng() < 0.3) {
        c.isActive = false;
        p.stats.totalAUM -= c.capital;
        p.reputation.clients = clamp(p.reputation.clients - 5, 0, 100);
        this.notify('client', 'Cliente Perso', c.name + ' ha ritirato il capitale.');
        this.emit('clientLeft', c);
        this.state.clients.splice(i, 1);
      }
    }

    // Attract new clients based on reputation
    if (p.reputation.clients > 60 && rng() < 0.15 + p.level * 0.01) {
      this._spawnClient();
    }
  };

  GameEngine.prototype.getClients = function () { return this.state.clients; };

  /* ==========================================================================
   * 7. AGENTS SYSTEM
   * ========================================================================== */

  GameEngine.prototype.hireAgent = function (name, skill, salary) {
    if (!this.hasUnlock('margin2x')) {
      this.notify('warning', 'Livello troppo basso', 'Devi essere livello 4+ per assumere agenti.');
      return null;
    }
    var p = this.state.player;
    name = name || rngPick(AGENT_NAMES);
    skill = skill || rngPick(AGENT_SKILLS);
    salary = salary || rngInt(2000, 8000);
    if (p.cash < salary * 4) {
      this.notify('warning', 'Fondi insufficienti', 'Servono almeno ' + formatMoney(salary * 4) + ' per assumere.');
      return null;
    }
    var agent = {
      id: uid(),
      name: name,
      skill: skill,
      level: 1,
      salary: salary,
      hiredWeek: p.week,
      efficiency: rngGauss(0.8, 0.2),
      loyalty: 70,
      isActive: true,
      totalEarned: 0,
      totalMistakes: 0
    };
    this.state.agents.push(agent);
    p.stats.agentsHired++;
    this.emit('agentHired', agent);
    this.notify('success', 'Agente Assunto!', name + ' (' + skill + ') - Stipendio: ' + formatMoney(salary) + '/sett');
    this._checkAchievements();
    return agent;
  };

  GameEngine.prototype._processAgents = function () {
    var p = this.state.player;
    for (var i = this.state.agents.length - 1; i >= 0; i--) {
      var a = this.state.agents[i];
      if (!a.isActive) continue;
      // Pay salary
      p.cash -= a.salary;
      if (p.cash < 0) {
        a.isActive = false;
        this.notify('warning', 'Agente Licenziato', a.name + ' non pu\u00f2 essere pagato. Se n\'\u00e8 andato.');
        p.reputation.wallStreet = clamp(p.reputation.wallStreet - 3, 0, 100);
        this.state.agents.splice(i, 1);
        continue;
      }
      // Generate income based on skill
      var income = 0;
      if (a.skill === 'trading') {
        income = a.salary * a.efficiency * rngGauss(1.5, 0.5);
      } else if (a.skill === 'sales') {
        income = a.salary * a.efficiency * rngGauss(1.2, 0.4);
        if (rng() < 0.1) this._spawnClient();
      } else if (a.skill === 'research') {
        income = a.salary * a.efficiency * rngGauss(1.0, 0.3);
        // Boost market knowledge
        p.reputation.wallStreet = clamp(p.reputation.wallStreet + 0.5, 0, 100);
      }
      a.totalEarned += income;
      p.cash += income;

      // Loyalty update
      a.loyalty += rngGauss(0, 1);
      a.loyalty = clamp(a.loyalty, 0, 100);

      // Betrayal
      if (a.loyalty < 20 && rng() < 0.05) {
        var stolen = Math.min(p.cash * 0.1, a.salary * 50);
        p.cash -= stolen;
        a.isActive = false;
        p.stats.agentBetrayal = true;
        p.reputation.sec = clamp(p.reputation.sec - 10, 0, 100);
        this.notify('danger', 'Tradimento!', a.name + ' ti ha tradito e rubato ' + formatMoney(stolen) + '!');
        this.emit('agentBetrayal', { agent: a, stolen: stolen });
        this.state.agents.splice(i, 1);
        this._checkAchievements();
        continue;
      }

      // Level up agent
      if (a.totalEarned > a.salary * 20) {
        a.level++;
        a.efficiency = clamp(a.efficiency + 0.05, 0.5, 2.0);
      }

      // Mistakes
      if (rng() < 0.02) {
        a.totalMistakes++;
        var loss = a.salary * rngGauss(2, 1);
        if (loss > 0) {
          p.cash -= loss;
          this.notify('warning', 'Errore Agente', a.name + ' ha fatto un errore: -' + formatMoney(loss));
        }
      }
    }
  };

  GameEngine.prototype.getAgents = function () { return this.state.agents; };

  GameEngine.prototype.fireAgent = function (agentId) {
    for (var i = 0; i < this.state.agents.length; i++) {
      if (this.state.agents[i].id === agentId) {
        this.state.agents[i].isActive = false;
        this.state.agents.splice(i, 1);
        this.notify('info', 'Agente Licenziato', 'Hai licenziato l\'agente.');
        return true;
      }
    }
    return false;
  };

  /* ==========================================================================
   * 8. CHAPTER SYSTEM
   * ========================================================================== */

  GameEngine.prototype._onChapterProgress = function () {
    var p = this.state.player;
    for (var i = CHAPTERS.length - 1; i >= 0; i--) {
      var ch = CHAPTERS[i];
      if (p.level >= ch.triggerLevel && p.netWorth >= ch.triggerNetWorth && this._completedMissionsCount() >= ch.triggerMissions) {
        if (p.chapter < ch.id) {
          p.chapter = ch.id;
          this.state.story.currentChapter = ch.id;
          this.state.story.chapterProgress = 0;
          this.addXP(500);
          this.notify('chapter', 'Nuovo Capitolo: ' + ch.name, ch.intro);
          this.emit('chapterStart', ch);
          this._triggerChapterDialogue(ch);
        }
        break;
      }
    }
  };

  GameEngine.prototype._triggerChapterDialogue = function (chapter) {
    var dialogue = {
      chapter: chapter.id,
      npc: chapter.npc,
      text: chapter.intro,
      choices: this._getMoralChoices(chapter.id)
    };
    this.state.story.dialoguesSeen.push({ chapter: chapter.id, week: this.state.player.week });
    this.emit('dialogue', dialogue);
    return dialogue;
  };

  GameEngine.prototype._getMoralChoices = function (chapterId) {
    var choices = {
      1: [
        { id: 'first_moral_honest', text: 'Gioca pulito da subito', ethics: +5 },
        { id: 'first_moral_risky', text: 'Un piccolo shortcut non fa male', ethics: -5 }
      ],
      2: [
        { id: 'first_short_safe', text: 'Short selling etico', ethics: +3 },
        { id: 'first_short_aggressive', text: 'Short aggressivo su voci', ethics: -5 }
      ],
      3: [
        { id: 'pump_dump_refuse', text: 'Rifiuta il pump & dump', ethics: +10 },
        { id: 'pump_dump_accept', text: 'Accetta, soldi facili', ethics: -15 }
      ],
      4: [
        { id: 'insider_refuse', text: 'Rifiuta informazioni riservate', ethics: +10 },
        { id: 'insider_accept', text: 'Usa le informazioni riservate', ethics: -10 }
      ],
      5: [
        { id: 'bribe_refuse', text: 'Non pagare tangenti', ethics: +10 },
        { id: 'bribe_pay', text: 'Paga per risolvere', ethics: -10 }
      ],
      6: [
        { id: 'front_run_refuse', text: 'No al front running', ethics: +10 },
        { id: 'front_run_accept', text: 'Front running sui clienti', ethics: -15 }
      ],
      7: [
        { id: 'manipulation_refuse', text: 'Manipolazione no', ethics: +10 },
        { id: 'manipulation_accept', text: 'Manipola il mercato', ethics: -20 }
      ],
      8: [
        { id: 'dark_pool_ethical', text: 'Usa dark pool eticamente', ethics: +5 },
        { id: 'dark_pool_unethical', text: 'Sfrutta il dark pool al massimo', ethics: -15 }
      ],
      9: [
        { id: 'final_choice_cooperate', text: 'Coopera con la SEC', ethics: +20 },
        { id: 'final_choice_fight', text: 'Combatti la SEC', ethics: -20 }
      ],
      10: [
        { id: 'legacy_good', text: 'Lascia un\'eredit\u00e0 positiva', ethics: +10 },
        { id: 'legacy_bad', text: 'Lascia un\'eredit\u00e0 oscura', ethics: -10 }
      ]
    };
    return choices[chapterId] || [];
  };

  GameEngine.prototype.makeMoralChoice = function (choiceId) {
    var p = this.state.player;
    var allChoices = [];
    for (var i = 0; i < CHAPTERS.length; i++) {
      var ch = CHAPTERS[i];
      var ch_choices = this._getMoralChoices(ch.id);
      for (var j = 0; j < ch_choices.length; j++) {
        allChoices.push(ch_choices[j]);
      }
    }
    for (var k = 0; k < allChoices.length; k++) {
      if (allChoices[k].id === choiceId) {
        p.ethics = clamp(p.ethics + allChoices[k].ethics, 0, 100);
        this.state.story.choicesMade.push({ id: choiceId, week: p.week, ethicsChange: allChoices[k].ethics });
        this.emit('moralChoice', allChoices[k]);
        this.state.story.chapterProgress++;
        return true;
      }
    }
    return false;
  };

  /* ==========================================================================
   * 9. ENDING SYSTEM
   * ========================================================================== */

  GameEngine.prototype._checkEnding = function () {
    var p = this.state.player;
    if (p.chapter < 10) return null;
    if (p.netWorth >= 50000000) {
      var ending;
      if (p.ethics > 70) {
        ending = {
          id: 'redemption',
          title: 'Redenzione',
          text: 'Hai costruito un impero finanziario con integrit\u00e0. Sei rispettato come uno degli investitori pi\u00f9 saggi di Wall Street. La tua eredit\u00e0 \u00e8 quella di un leader etico.',
          score: p.netWorth + p.ethics * 100000
        };
      } else if (p.ethics < 30) {
        ending = {
          id: 'wolf',
          title: 'Il Lupo',
          text: 'Regni come re oscuro di Wall Street. Il tuo impero \u00e8 vasto ma costruito su sabbie mobili. Nessuno si fida di te, ma tutti ti temono. Guardati le spalle.',
          score: p.netWorth - (100 - p.ethics) * 50000
        };
      } else if (p.netWorth < 100000 && p.ethics < 30) {
        ending = {
          id: 'fall',
          title: 'Caduta',
          text: 'La giustizia ha prevalso. Hai perso tutto. Prigione, vergogna, e un mucchio di rimpianti.',
          score: p.netWorth * 0.1
        };
      } else {
        ending = {
          id: 'quiet_life',
          title: 'Vita Quotidiana',
          text: 'Hai scelto la via pi\u00f9 saggia. Abbastanza ricco per non preoccuparti, abbastanza etico per dormire la notte. Una vita tranquilla ti aspetta.',
          score: p.netWorth + p.ethics * 50000
        };
      }
      this.emit('gameEnding', ending);
      this.notify('ending', 'Finale: ' + ending.title, ending.text);
      return ending;
    }
    return null;
  };

  GameEngine.prototype._gameOver = function (reason) {
    var p = this.state.player;
    var ending;
    if (reason === 'prison') {
      ending = {
        id: 'fall',
        title: 'Caduta',
        text: 'La SEC ti ha incastrato. Processo, condanna, prigione. Tutto perduto.',
        score: 0
      };
    } else if (reason === 'bankrupt') {
      p.stats.bankruptcies = (p.stats.bankruptcies || 0) + 1;
      if (p.stats.bankruptcies >= 2) {
        ending = {
          id: 'fall',
          title: 'Bancarotta Definitiva',
          text: 'Hai perso tutto. Non puoi pi\u00f9 ripartire.',
          score: 0
        };
      } else {
        // Reset and allow restart
        p.cash = 10000;
        p.netWorth = 10000;
        p.level = 1;
        p.xp = 0;
        this.state.portfolio.positions = {};
        this.state.portfolio.realizedPnL = 0;
        this.notify('danger', 'Bancarotta!', 'Hai perso tutto. Riparti da €10.000.');
        this.emit('bankrupt', {});
        this._checkAchievements();
        return null;
      }
    } else {
      ending = {
        id: 'fall',
        title: 'Game Over',
        text: 'Il tuo viaggio \u00e8 finito.',
        score: p.netWorth
      };
    }
    this.emit('gameOver', ending);
    this.notify('gameover', 'Game Over', ending.text);
    return ending;
  };

  GameEngine.prototype.getCareerSummary = function () {
    var p = this.state.player;
    return {
      name: p.name,
      finalNetWorth: p.netWorth,
      finalLevel: p.level,
      finalEthics: p.ethics,
      weeksPlayed: p.stats.weeksPlayed,
      totalTrades: p.stats.totalTrades,
      totalProfit: p.stats.totalProfit,
      totalLoss: p.stats.totalLoss,
      achievements: p.achievements.length,
      missionsCompleted: this._completedMissionsCount(),
      clientsMax: p.stats.maxClients,
      agentsHired: p.stats.agentsHired,
      raidsSurvived: p.stats.raidsSurvived,
      reputation: p.reputation,
      chapter: p.chapter
    };
  };

  /* ==========================================================================
   * 10. DIFFICULTY SYSTEM
   * ========================================================================== */

  GameEngine.prototype.setDifficulty = function (difficulty) {
    if (!DIFFICULTY_CONFIG[difficulty]) return false;
    this.state.settings.difficulty = difficulty;
    this.state.settings.difficultyConfig = DIFFICULTY_CONFIG[difficulty];
    this.emit('difficultyChanged', difficulty);
    return true;
  };

  GameEngine.prototype.getDifficultyConfig = function () {
    return this.state.settings.difficultyConfig;
  };

  GameEngine.prototype.getDifficultyLabel = function () {
    return DIFFICULTY_CONFIG[this.state.settings.difficulty].label;
  };

  /* ==========================================================================
   * 11. SAVE/LOAD SYSTEM
   * ========================================================================== */

  GameEngine.prototype._serializeState = function () {
    var s = this.state;
    var positionsObj = {};
    var posKeys = Object.keys(s.portfolio.positions);
    for (var pki = 0; pki < posKeys.length; pki++) {
      positionsObj[posKeys[pki]] = s.portfolio.positions[posKeys[pki]];
    }
    return {
      player: s.player,
      portfolio: {
        positions: positionsObj,
        history: s.portfolio.history.slice(-200),
        realizedPnL: s.portfolio.realizedPnL,
        unrealizedPnL: s.portfolio.unrealizedPnL
      },
      market: s.market,
      story: s.story,
      darkActions: s.darkActions,
      clients: s.clients,
      agents: s.agents,
      notifications: s.notifications.slice(0, 20),
      settings: s.settings,
      meta: {
        saveVersion: SAVE_VERSION,
        createdAt: s.meta.createdAt,
        playtime: s.meta.playtime + (Date.now() - (s.meta.lastLoad || s.meta.createdAt))
      }
    };
  };

  GameEngine.prototype._deserializeState = function (data) {
    if (!data || !data.player) return null;
    var s = data;
    if (!s.portfolio) s.portfolio = { positions: {}, history: [], realizedPnL: 0, unrealizedPnL: 0 };
    var posMap = {};
    if (s.portfolio.positions) {
      var keys = Object.keys(s.portfolio.positions);
      for (var i = 0; i < keys.length; i++) {
        posMap[keys[i]] = s.portfolio.positions[keys[i]];
      }
    }
    s.portfolio.positions = posMap;
    if (!s.clients) s.clients = [];
    if (!s.agents) s.agents = [];
    if (!s.notifications) s.notifications = [];
    if (!s.settings) s.settings = { sound: true, animations: true, difficulty: 'normal', difficultyConfig: DIFFICULTY_CONFIG.normal };
    if (!s.settings.difficultyConfig) s.settings.difficultyConfig = DIFFICULTY_CONFIG[s.settings.difficulty] || DIFFICULTY_CONFIG.normal;
    if (!s.meta) s.meta = { saveVersion: SAVE_VERSION, createdAt: Date.now(), playtime: 0 };
    s.meta.lastLoad = Date.now();
    return s;
  };

  GameEngine.prototype.saveToSlot = function (slotName) {
    var data = this._serializeState();
    var key = 'wolf_game_save_' + slotName;
    var json = JSON.stringify(data);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, json);
    }
    this.emit('saved', { slot: slotName });
    return json;
  };

  GameEngine.prototype.loadFromSlot = function (slotName) {
    var key = 'wolf_game_save_' + slotName;
    var json = null;
    if (typeof localStorage !== 'undefined') {
      json = localStorage.getItem(key);
    }
    if (!json) return null;
    var data = JSON.parse(json);
    var state = this._deserializeState(data);
    if (state) {
      this.state = state;
      this.emit('loaded', { slot: slotName });
    }
    return state;
  };

  GameEngine.prototype.listSaves = function () {
    var saves = [];
    if (typeof localStorage === 'undefined') return saves;
    for (var i = 1; i <= MAX_SAVE_SLOTS; i++) {
      var json = localStorage.getItem('wolf_game_save_slot' + i);
      if (json) {
        try {
          var d = JSON.parse(json);
          saves.push({
            slot: 'slot' + i,
            name: d.player ? d.player.name : 'Unknown',
            netWorth: d.player ? d.player.netWorth : 0,
            week: d.player ? d.player.week : 0,
            level: d.player ? d.player.level : 1
          });
        } catch (e) {}
      }
    }
    var auto = localStorage.getItem('wolf_game_save_autosave');
    if (auto) {
      try {
        var ad = JSON.parse(auto);
        saves.push({
          slot: 'autosave',
          name: ad.player ? ad.player.name + ' (Auto)' : 'Autosave',
          netWorth: ad.player ? ad.player.netWorth : 0,
          week: ad.player ? ad.player.week : 0,
          level: ad.player ? ad.player.level : 1
        });
      } catch (e) {}
    }
    return saves;
  };

  GameEngine.prototype.deleteSave = function (slotName) {
    if (typeof localStorage === 'undefined') return false;
    localStorage.removeItem('wolf_game_save_' + slotName);
    return true;
  };

  GameEngine.prototype.autosave = function () {
    return this.saveToSlot(AUTOSAVE_SLOT);
  };

  GameEngine.prototype.exportSave = function () {
    var data = this._serializeState();
    var json = JSON.stringify(data);
    return b64encode(json);
  };

  GameEngine.prototype.importSave = function (b64) {
    try {
      var json = b64decode(b64);
      var data = JSON.parse(json);
      if (data.meta && data.meta.saveVersion !== SAVE_VERSION) {
        data = this._migrateSave(data);
      }
      var state = this._deserializeState(data);
      if (state) {
        this.state = state;
        this.emit('imported', {});
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  GameEngine.prototype._migrateSave = function (data) {
    // Handle save version migrations
    if (!data.meta) data.meta = { saveVersion: 1 };
    while (data.meta.saveVersion < SAVE_VERSION) {
      data.meta.saveVersion++;
      // Future migrations go here
    }
    return data;
  };

  /* ==========================================================================
   * TRADING SYSTEM
   * ========================================================================== */

  GameEngine.prototype.getCompany = function (tickerOrId) {
    var companies = this.state.market.companies;
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].ticker === tickerOrId || companies[i].id === tickerOrId) return companies[i];
    }
    return null;
  };

  GameEngine.prototype.buy = function (ticker, shares, options) {
    options = options || {};
    var company = this.getCompany(ticker);
    if (!company) return { success: false, error: 'Azienda non trovata' };
    var p = this.state.player;
    var diffCfg = this.state.settings.difficultyConfig;
    var price = company.price;
    var total = price * shares;
    var commission = total * diffCfg.commissionRate;
    var slippage = total * diffCfg.slippageRate * Math.min(1, shares / company.float);
    var cost = total + commission + slippage;

    // Level checks
    if (company.isPenny && !this.hasUnlock('penny')) return { success: false, error: 'Livello troppo basso per penny stocks' };
    if (options.margin && !this.hasUnlock('margin' + options.margin + 'x')) return { success: false, error: 'Margin non sbloccato' };
    if (options.limit && !this.hasUnlock('limit')) return { success: false, error: 'Limit orders non sbloccati' };
    if (options.short && !this.hasUnlock('short')) return { success: false, error: 'Short selling non sbloccato' };

    // Limit order: add to pending
    if (options.limit && options.limitPrice) {
      this.state.market.pendingOrders.push({
        id: uid(),
        type: options.short ? 'limit_short' : 'limit_buy',
        ticker: company.ticker,
        companyId: company.id,
        shares: shares,
        limitPrice: options.limitPrice,
        placedWeek: p.week,
        options: options
      });
      return { success: true, message: 'Ordine limite piazzato a ' + formatMoney(options.limitPrice) };
    }

    // Margin
    var maxCost = p.cash;
    if (options.margin) maxCost = p.cash * options.margin;
    if (cost > maxCost) return { success: false, error: 'Fondi insufficienti' };

    if (!options.short) {
      p.cash -= cost;
      var pos = this.state.portfolio.positions[company.id];
      if (pos) {
        var newAvg = (pos.avgPrice * pos.shares + price * shares) / (pos.shares + shares);
        pos.avgPrice = newAvg;
        pos.shares += shares;
        pos.totalCost += cost;
      } else {
        this.state.portfolio.positions[company.id] = {
          companyId: company.id,
          ticker: company.ticker,
          name: company.name,
          shares: shares,
          avgPrice: price,
          currentPrice: price,
          totalCost: cost,
          type: 'long',
          isPenny: company.isPenny,
          openedWeek: p.week
        };
      }
    } else {
      // Short selling
      p.cash -= commission + slippage;
      var shortPos = this.state.portfolio.positions[company.id + '_short'];
      if (shortPos) {
        shortPos.shares += shares;
        shortPos.avgPrice = (shortPos.avgPrice * shortPos.shares + price * shares) / (shortPos.shares + shares);
      } else {
        this.state.portfolio.positions[company.id + '_short'] = {
          companyId: company.id,
          ticker: company.ticker,
          name: company.name,
          shares: shares,
          avgPrice: price,
          currentPrice: price,
          totalCost: price * shares,
          type: 'short',
          isPenny: company.isPenny,
          openedWeek: p.week
        };
      }
    }

    p.stats.totalTrades++;
    this.addXP(10);
    this._recordTrade('buy', company, shares, price, cost);
    this._updateReputation('wallStreet', 0.5);
    this._checkMissions();
    this._checkAchievements();
    this.emit('trade', { type: 'buy', ticker: company.ticker, shares: shares, price: price });
    return { success: true, message: 'Acquistati ' + shares + ' ' + company.ticker + ' @ ' + formatMoney(price), cost: cost };
  };

  GameEngine.prototype.sell = function (ticker, shares, options) {
    options = options || {};
    var company = this.getCompany(ticker);
    if (!company) return { success: false, error: 'Azienda non trovata' };
    var p = this.state.player;
    var diffCfg = this.state.settings.difficultyConfig;
    var price = company.price;
    var pos = this.state.portfolio.positions[company.id];
    var shortPos = this.state.portfolio.positions[company.id + '_short'];

    if (pos && pos.shares >= shares) {
      // Long sell
      var proceeds = price * shares;
      var commission = proceeds * diffCfg.commissionRate;
      var slippage = proceeds * diffCfg.slippageRate * Math.min(1, shares / company.float);
      var net = proceeds - commission - slippage;
      var costBasis = pos.avgPrice * shares;
      var profit = net - costBasis;

      p.cash += net;
      pos.shares -= shares;
      pos.totalCost -= costBasis;
      if (pos.shares <= 0) {
        delete this.state.portfolio.positions[company.id];
      }

      if (profit > 0) p.stats.totalProfit += profit;
      else p.stats.totalLoss += Math.abs(profit);
      this.state.portfolio.realizedPnL += profit;
      this._recordTrade('sell', company, shares, price, net);
      p.stats.totalTrades++;
      this.addXP(10);

      if (pos && pos.isPenny && profit > 0) p.stats.pennyProfit += profit;
      this._checkMissions();
      this._checkAchievements();
      this.emit('trade', { type: 'sell', ticker: company.ticker, shares: shares, price: price, profit: profit });
      return { success: true, message: 'Venduti ' + shares + ' ' + company.ticker + ' @ ' + formatMoney(price) + ' (P&L: ' + formatMoney(profit) + ')', profit: profit };
    } else if (shortPos && shortPos.shares >= shares) {
      // Short cover
      var coverCost = price * shares;
      var comm = coverCost * diffCfg.commissionRate;
      var slip = coverCost * diffCfg.slippageRate * Math.min(1, shares / company.float);
      var totalCover = coverCost + comm + slip;
      var shortProfit = (shortPos.avgPrice - price) * shares - comm - slip;

      p.cash += shortProfit;
      shortPos.shares -= shares;
      if (shortPos.shares <= 0) {
        delete this.state.portfolio.positions[company.id + '_short'];
      }

      if (shortProfit > 0) {
        p.stats.totalProfit += shortProfit;
        p.stats.shortProfits += shortProfit;
        if (shortProfit > 100000) {
          this._checkAchievements();
        }
      } else {
        p.stats.totalLoss += Math.abs(shortProfit);
      }
      this.state.portfolio.realizedPnL += shortProfit;
      this._recordTrade('cover', company, shares, price, totalCover);
      p.stats.totalTrades++;
      this.addXP(10);
      this._checkMissions();
      this._checkAchievements();
      this.emit('trade', { type: 'cover', ticker: company.ticker, shares: shares, price: price, profit: shortProfit });
      return { success: true, message: 'Short coperto: ' + shares + ' ' + company.ticker + ' (P&L: ' + formatMoney(shortProfit) + ')', profit: shortProfit };
    }
    return { success: false, error: 'Posizione insufficiente' };
  };

  GameEngine.prototype._recordTrade = function (type, company, shares, price, value) {
    this.state.portfolio.history.push({
      type: type,
      ticker: company.ticker,
      shares: shares,
      price: price,
      value: value,
      week: this.state.player.week,
      year: this.state.player.year
    });
    if (this.state.portfolio.history.length > 500) this.state.portfolio.history.shift();
  };

  GameEngine.prototype._updateReputation = function (key, delta) {
    this.state.player.reputation[key] = clamp(this.state.player.reputation[key] + delta, 0, 100);
  };

  /* ==========================================================================
   * DARK ACTIONS SYSTEM
   * ========================================================================== */

  GameEngine.prototype.pumpAndDump = function (ticker) {
    var company = this.getCompany(ticker);
    if (!company) return { success: false, error: 'Azienda non trovata' };
    var p = this.state.player;
    var pos = this.state.portfolio.positions[company.id];
    if (!pos || pos.shares < 100) return { success: false, error: 'Devi avere almeno 100 azioni' };

    // Pump phase: price rises
    var pumpAmount = rngGauss(0.15, 0.05);
    company.price *= (1 + pumpAmount);
    company.price = roundCents(company.price);
    company.sentiment = clamp(company.sentiment + 20, 0, 100);

    // Dump: sell positions at pumped price
    var proceeds = company.price * pos.shares;
    var profit = proceeds - pos.totalCost;
    p.cash += proceeds;
    delete this.state.portfolio.positions[company.id];
    p.stats.totalProfit += profit;
    p.stats.pumpDumpsExecuted++;

    // Reputation impact
    p.ethics = clamp(p.ethics - 10, 0, 100);
    p.reputation.sec = clamp(p.reputation.sec - 15, 0, 100);
    p.reputation.underworld = clamp(p.reputation.underworld + 8, 0, 100);

    this.state.darkActions.pumpDumps.push({ ticker: ticker, week: p.week, profit: profit });
    this.notify('dark', 'Pump & Dump!', company.ticker + ' pompato del ' + (pumpAmount * 100).toFixed(1) + '%. Profitto: ' + formatMoney(profit));
    this.emit('darkAction', { type: 'pumpDump', ticker: ticker, profit: profit });
    this._checkAchievements();
    return { success: true, profit: profit };
  };

  GameEngine.prototype.insiderTrade = function (ticker, action) {
    var company = this.getCompany(ticker);
    if (!company) return { success: false, error: 'Azienda non trovata' };
    var p = this.state.player;
    var amount = rngInt(5000, 50000);
    var caught = rng() < (0.15 * this.state.settings.difficultyConfig.secAggression) && p.reputation.sec < 50;

    if (action === 'buy') {
      p.cash -= amount;
      this.buy(ticker, Math.floor(amount / company.price), {});
    } else {
      this.sell(ticker, Math.floor(amount / company.price), {});
    }

    p.stats.insiderTrades++;
    p.ethics = clamp(p.ethics - 5, 0, 100);
    p.reputation.sec = clamp(p.reputation.sec - 8, 0, 100);

    this.state.darkActions.insiderTrades.push({ ticker: ticker, action: action, week: p.week, caught: caught });

    if (caught) {
      p.reputation.sec = clamp(p.reputation.sec - 20, 0, 100);
      var fine = rngInt(20000, 200000);
      p.cash -= fine;
      this.notify('danger', 'INSIDER TRADING SCOPERTO!', 'Multa: ' + formatMoney(fine));
      this._checkSECRaid();
    } else {
      this.notify('dark', 'Insider Trade', 'Operazione riuscita. +5 XP');
      this.addXP(5);
    }
    this._checkAchievements();
    return { success: !caught, caught: caught, fine: caught ? fine : 0 };
  };

  GameEngine.prototype.frontRun = function (ticker, shares) {
    var company = this.getCompany(ticker);
    if (!company) return { success: false, error: 'Azienda non trovata' };
    var p = this.state.player;
    if (!this.hasUnlock('margin2x')) return { success: false, error: 'Livello troppo basso' };

    var result = this.buy(ticker, shares, {});
    if (!result.success) return result;

    // Price moves after big order
    company.price *= (1 + rngGauss(0.03, 0.02));
    company.price = roundCents(company.price);

    var pos = this.state.portfolio.positions[company.id];
    if (pos) {
      var sellResult = this.sell(ticker, shares, {});
      p.stats.frontRunningExecuted++;
      p.ethics = clamp(p.ethics - 8, 0, 100);
      p.reputation.sec = clamp(p.reputation.sec - 10, 0, 100);
      this.state.darkActions.frontRunning.push({ ticker: ticker, week: p.week, shares: shares });
      this.notify('dark', 'Front Running', 'Eseguito su ' + company.ticker);
      this._checkAchievements();
      return sellResult;
    }
    return { success: false, error: 'Front running fallito' };
  };

  GameEngine.prototype.donate = function (amount) {
    var p = this.state.player;
    if (p.cash < amount) return { success: false, error: 'Fondi insufficienti' };
    p.cash -= amount;
    p.stats.totalDonated += amount;
    p.ethics = clamp(p.ethics + amount / 10000, 0, 100);
    p.reputation.clients = clamp(p.reputation.clients + 2, 0, 100);
    p.reputation.wallStreet = clamp(p.reputation.wallStreet + 1, 0, 100);
    this.notify('success', 'Donazione', 'Hai donato ' + formatMoney(amount) + ' in beneficenza. Etica +');
    this._checkAchievements();
    this.emit('donation', { amount: amount });
    return { success: true };
  };

  /* ==========================================================================
   * ASSEMBLY SYSTEM
   * ========================================================================== */

  GameEngine.prototype._checkAssemblies = function () {
    var p = this.state.player;
    var companies = this.state.market.companies;
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      if (c.assemblyScheduled) continue;
      var pos = this.state.portfolio.positions[c.id];
      if (!pos) continue;
      var ownership = pos.shares / c.sharesOutstanding;
      if (ownership > 0.01 && rng() < 0.05) {
        c.assemblyScheduled = true;
        c.assemblyVotes = { for: 0, against: 0, abstain: 0 };
        this.state.market.assembliesThisWeek.push(c);
        this.notify('info', 'Assemblea ' + c.ticker, 'Hai diritto di voto. Possiedi ' + (ownership * 100).toFixed(2) + '%');
      }
    }
  };

  GameEngine.prototype.voteAssembly = function (ticker, vote) {
    var company = this.getCompany(ticker);
    if (!company || !company.assemblyScheduled) return { success: false, error: 'Nessuna assemblea attiva' };
    var pos = this.state.portfolio.positions[company.id];
    if (!pos) return { success: false, error: 'Non possiedi azioni' };
    var votes = pos.shares;
    if (vote === 'for') company.assemblyVotes.for += votes;
    else if (vote === 'against') company.assemblyVotes.against += votes;
    else company.assemblyVotes.abstain += votes;
    company.assemblyScheduled = false;
    this.state.player.stats.assembliesVoted++;
    this.state.player.ethics = clamp(this.state.player.ethics + 1, 0, 100);
    this.addXP(20);
    this.notify('success', 'Voto Registrato', 'Hai votato ' + vote + ' con ' + votes + ' azioni');
    this._checkAchievements();
    // Check control
    if (company.assemblyVotes.for > company.sharesOutstanding * 0.5) {
      this.state.player.stats.companiesControlled++;
      this.notify('success', 'Controllo!', 'Hai ottenuto il controllo di ' + company.name);
    }
    this.emit('assemblyVote', { ticker: ticker, vote: vote, shares: votes });
    return { success: true };
  };

  /* ==========================================================================
   * MARKET SIMULATION
   * ========================================================================== */

  GameEngine.prototype._computeMarketReturn = function () {
    var companies = this.state.market.companies;
    var totalCap = 0, totalReturn = 0;
    for (var i = 0; i < companies.length; i++) {
      totalCap += companies[i].marketCap;
      totalReturn += (companies[i].price - companies[i].prevClose) / companies[i].prevClose * companies[i].marketCap;
    }
    return totalCap > 0 ? totalReturn / totalCap : 0;
  };

  GameEngine.prototype._generateEvents = function () {
    var diffCfg = this.state.settings.difficultyConfig;
    if (rng() > diffCfg.eventFrequency) return [];
    var events = [];
    var eventType = rngPick(['company','sector','macro']);
    var eventList = EVENT_TYPES[eventType];
    var event = rngPick(eventList);

    if (eventType === 'company') {
      var company = rngPick(this.state.market.companies);
      company.events.push({ type: event.type, desc: event.desc, week: this.state.player.week });
      company.price *= (1 + event.impact);
      company.price = Math.max(0.10, roundCents(company.price));
      company.sentiment = clamp(company.sentiment + event.impact * 100, 0, 100);
      events.push({ type: eventType, company: company.ticker, event: event });
      this.notify('market', company.name + ': ' + event.desc, event.impact > 0 ? 'Rialzista' : 'Ribassista');
    } else if (eventType === 'sector') {
      var sector = rngPick(COMPANY_SECTORS);
      for (var i = 0; i < this.state.market.companies.length; i++) {
        if (this.state.market.companies[i].sector === sector) {
          this.state.market.companies[i].price *= (1 + event.impact * 0.5);
          this.state.market.companies[i].price = Math.max(0.10, roundCents(this.state.market.companies[i].price));
        }
      }
      events.push({ type: eventType, sector: sector, event: event });
      this.notify('market', sector + ': ' + event.desc, event.impact > 0 ? 'Positivo' : 'Negativo');
    } else {
      // Macro event
      for (var j = 0; j < this.state.market.companies.length; j++) {
        this.state.market.companies[j].price *= (1 + event.impact * 0.3);
        this.state.market.companies[j].price = Math.max(0.10, roundCents(this.state.market.companies[j].price));
      }
      this.state.market.sentiment = clamp(this.state.market.sentiment + event.impact * 100, 0, 100);
      if (event.type === 'rate_cut') this.state.market.macro.interestRate = Math.max(0, this.state.market.macro.interestRate - 0.25);
      if (event.type === 'rate_hike') this.state.market.macro.interestRate += 0.25;
      if (event.type === 'recession') this.state.market.macro.gdpGrowth -= 0.5;
      if (event.type === 'boom') this.state.market.macro.gdpGrowth += 0.5;
      events.push({ type: eventType, event: event });
      this.notify('market', 'MACRO: ' + event.desc, event.impact > 0 ? 'Mercato rialzista' : 'Mercato ribassista');
    }
    return events;
  };

  GameEngine.prototype._updatePrices = function () {
    var diffCfg = this.state.settings.difficultyConfig;
    var companies = this.state.market.companies;
    var sentiment = this.state.market.sentiment;
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      c.prevClose = c.price;
      // Fundamental growth + momentum + market bias + volatility
      var fundamental = rngGauss(0.001, 0.01) + (sentiment - 50) / 5000;
      var momentum = c.momentum * 0.3;
      var bias = diffCfg.marketBias;
      var noise = rngGauss(0, diffCfg.marketVolatility);
      var change = fundamental + momentum + bias + noise;
      c.price = Math.max(0.10, roundCents(c.price * (1 + change)));
      c.high = Math.max(c.high, c.price);
      c.low = Math.min(c.low, c.price);
      c.momentum = change;
      c.volume = Math.floor(c.avgVolume * (0.5 + rng() * 1.5));
      c.marketCap = c.price * c.sharesOutstanding;
      // Sentiment drift
      c.sentiment = clamp(c.sentiment + rngGauss(0, 3), 0, 100);
    }
    // Update indices
    var totalCap = 0, prevTotalCap = 0;
    for (var j = 0; j < companies.length; j++) {
      totalCap += companies[j].marketCap;
      prevTotalCap += companies[j].prevClose * companies[j].sharesOutstanding;
    }
    var indexChange = prevTotalCap > 0 ? (totalCap - prevTotalCap) / prevTotalCap : 0;
    this.state.market.indices.FTSEMIB.value *= (1 + indexChange);
    this.state.market.indices.SP500.value *= (1 + indexChange * 0.8);
    this.state.market.indices.NASDAQ.value *= (1 + indexChange * 1.2);
    this.state.market.indices.FTSEMIB.change = indexChange;
    this.state.market.indices.SP500.change = indexChange * 0.8;
    this.state.market.indices.NASDAQ.change = indexChange * 1.2;
  };

  GameEngine.prototype._processPendingOrders = function () {
    var p = this.state.player;
    var orders = this.state.market.pendingOrders;
    for (var i = orders.length - 1; i >= 0; i--) {
      var order = orders[i];
      var company = this.getCompany(order.companyId);
      if (!company) continue;
      var shouldExecute = false;
      if (order.type === 'limit_buy' && company.price <= order.limitPrice) shouldExecute = true;
      if (order.type === 'limit_short' && company.price >= order.limitPrice) shouldExecute = true;
      if (order.type === 'limit_sell' && company.price >= order.limitPrice) shouldExecute = true;

      if (shouldExecute) {
        if (order.type === 'limit_buy') {
          this.buy(order.ticker, order.shares, {});
        } else if (order.type === 'limit_short') {
          this.buy(order.ticker, order.shares, { short: true });
        } else if (order.type === 'limit_sell') {
          this.sell(order.ticker, order.shares, {});
        }
        orders.splice(i, 1);
      } else if (p.week - order.placedWeek > 8) {
        // Expire after 8 weeks
        orders.splice(i, 1);
        this.notify('info', 'Ordine Scaduto', 'Ordine limite su ' + order.ticker + ' scaduto');
      }
    }
  };

  GameEngine.prototype._processDividends = function () {
    var p = this.state.player;
    if (p.week % 13 !== 0) return; // Quarterly
    var positions = this.state.portfolio.positions;
    var self = this;
    var keys = Object.keys(positions);
    for (var i = 0; i < keys.length; i++) {
      var pos = positions[keys[i]];
      if (pos.type === 'short') continue;
      var company = self.getCompany(pos.companyId);
      if (!company || company.dividendYield <= 0) continue;
      var dividend = pos.shares * company.price * company.dividendYield / 4;
      p.cash += dividend;
      if (dividend > 0.01) {
        self.notify('dividend', 'Dividendo', company.ticker + ': +' + formatMoney(dividend));
      }
    }
  };

  GameEngine.prototype._processQuarterlyReports = function () {
    var p = this.state.player;
    if (p.week % 13 !== 0) return;
    var companies = this.state.market.companies;
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      c.earnings.quarter++;
      var growth = rngGauss(0.03, 0.1);
      c.earnings.revenue *= (1 + growth);
      c.earnings.netIncome *= (1 + rngGauss(0.02, 0.15));
      c.earnings.eps = round2(c.earnings.netIncome / c.sharesOutstanding);
      c.peRatio = c.earnings.eps > 0 ? round2(c.price / c.earnings.eps) : 999;
      if (c.earnings.netIncome > 0 && rng() < 0.3) {
        c.dividendYield = clamp(c.dividendYield + rngGauss(0, 0.005), 0, 0.10);
      }
    }
    this.notify('info', 'Report Trimestrali', 'Nuovi report aziendali disponibili');
  };

  GameEngine.prototype._processIPOs = function () {
    var p = this.state.player;
    if (rng() < 0.15) {
      var sector = rngPick(COMPANY_SECTORS);
      var price = roundCents(rngGauss(20, 10));
      if (price < 1) price = roundCents(rng() * 20 + 5);
      var shares = rngInt(500000, 20000000);
      var idx = this.state.market.companies.length + 1;
      var company = {
        id: 'C' + idx,
        ticker: 'IPO' + idx,
        name: 'Nuova ' + sector + ' ' + idx,
        sector: sector,
        price: price,
        prevClose: price,
        open: price,
        high: price,
        low: price,
        volume: rngInt(1000000, 20000000),
        avgVolume: rngInt(500000, 5000000),
        marketCap: price * shares,
        sharesOutstanding: shares,
        float: Math.floor(shares * 0.2),
        dividendYield: 0,
        peRatio: round2(rngGauss(30, 15)),
        beta: round2(rngGauss(1.5, 0.5)),
        momentum: 0.05,
        sentiment: 70,
        isPenny: price < 5,
        isIPO: true,
        IPOWeek: p.week,
        earnings: { revenue: rngInt(1000000, 100000000), netIncome: rngInt(-50000000, 100000000), eps: round2(rngGauss(1, 2)), quarter: 1 },
        assemblyScheduled: false,
        assemblyVotes: {},
        events: []
      };
      this.state.market.companies.push(company);
      this.state.market.iposThisWeek.push(company);
      this.notify('ipo', 'Nuova IPO: ' + company.name, 'Prezzo: ' + formatMoney(price) + ' - Settore: ' + sector);
    }
  };

  GameEngine.prototype._updateSentiment = function () {
    var diffCfg = this.state.settings.difficultyConfig;
    var sentimentDrift = rngGauss(0, 2) + diffCfg.marketBias * 100;
    this.state.market.sentiment = clamp(this.state.market.sentiment + sentimentDrift, 0, 100);
    // Ethics affects sentiment slightly
    if (this.state.player.ethics > 70) this.state.market.sentiment = clamp(this.state.market.sentiment + 0.5, 0, 100);
  };

  GameEngine.prototype._updateUnrealizedPnL = function () {
    var self = this;
    var totalUnrealized = 0;
    var positions = this.state.portfolio.positions;
    var keys = Object.keys(positions);
    for (var i = 0; i < keys.length; i++) {
      var pos = positions[keys[i]];
      var company = self.getCompany(pos.companyId);
      if (!company) continue;
      pos.currentPrice = company.price;
      if (pos.type === 'short') {
        pos.unrealizedPnL = (pos.avgPrice - company.price) * pos.shares;
      } else {
        pos.unrealizedPnL = (company.price - pos.avgPrice) * pos.shares;
      }
      totalUnrealized += pos.unrealizedPnL;
    }
    this.state.portfolio.unrealizedPnL = totalUnrealized;

    // Update net worth
    var p = this.state.player;
    p.netWorth = p.cash + totalUnrealized;
    if (p.netWorth > p.stats.highestNetWorth) p.stats.highestNetWorth = p.netWorth;
  };

  /* ==========================================================================
   * TURN SIMULATION (WEEKLY TICK)
   * ========================================================================== */

  GameEngine.prototype.advanceWeek = function () {
    if (!this.state) return null;
    var p = this.state.player;
    var self = this;

    // Step 1: Process pending limit orders
    this._processPendingOrders();

    // Step 2: Update market sentiment
    this._updateSentiment();

    // Step 3: Generate events
    this._generateEvents();

    // Step 4: Process IPOs
    this._processIPOs();

    // Step 5: Update prices
    this._updatePrices();

    // Step 6: Process dividends (every quarter)
    this._processDividends();

    // Step 7: Process quarterly reports
    this._processQuarterlyReports();

    // Step 8: Check assemblies
    this._checkAssemblies();

    // Step 8.5: World Engine turn (governance, regions, corporate events)
    if (typeof WorldEngine !== 'undefined' && WorldEngine.processWorldTurn) {
      try { WorldEngine.processWorldTurn(this.state); } catch (e) {}
    }

    // Step 9: Process clients
    this._processClients();

    // Step 9.5: Competitor Engine turn
    if (this._competitorEngine) {
      try {
        var companies = this.state.market.companies;
        var stocks = [];
        for (var ci = 0; ci < companies.length; ci++) {
          var cc = companies[ci];
          stocks.push({ symbol: cc.ticker, price: cc.price, sector: cc.sector, volume: cc.volume || 0, avgVolume: cc.avgVolume || 1000000, change: cc.change || 0 });
        }
        var posArr = [];
        var posKeys = Object.keys(this.state.portfolio.positions);
        for (var pi = 0; pi < posKeys.length; pi++) {
          var pp = this.state.portfolio.positions[posKeys[pi]];
          posArr.push({ symbol: pp.ticker, shares: pp.shares });
        }
        this._competitorEngine.setMarketData({ stocks: stocks, currentWeek: this.state.player.week });
        this._competitorEngine.setPlayerData(posArr, this.state.player.cash, this.state.player.reputation.wallStreet || 50, this.state.player.xp || 0);
        this._competitorEngine.processWeek();
      } catch (e) {}
    }

    // Step 10: Process agents
    this._processAgents();

    // Step 11: Update unrealized P&L and net worth
    this._updateUnrealizedPnL();

    // Step 12: Update missions
    this._checkMissions();

    // Step 13: Trigger narrative events / chapter progress
    this._onChapterProgress();

    // Step 14: Level up check
    this._checkLevelUp();

    // Step 15: Achievement check
    this._checkAchievements();

    // Step 16: SEC raid check
    this._checkSECRaid();

    // Step 17: Week increment
    p.week++;
    p.stats.weeksPlayed++;
    if (p.week > WEEKS_PER_YEAR) {
      p.week = 1;
      p.year++;
      this.notify('info', 'Nuovo Anno', 'Anno ' + p.year + ' iniziato');
      this._checkAchievements();
    }

    // Step 18: Check for crash survival achievement
    var marketReturn = this._computeMarketReturn();
    if (marketReturn < -0.05) {
      var positions = this.state.portfolio.positions;
      var hasLoss = false;
      var keys = Object.keys(positions);
      for (var i = 0; i < keys.length; i++) {
        if (positions[keys[i]].unrealizedPnL < 0) hasLoss = true;
      }
      if (!hasLoss) {
        p.stats.crashSurvived = true;
        this._checkAchievements();
      }
    }

    // Step 19: Check bankruptcy
    if (p.netWorth < 0 || p.cash < -50000) {
      this._gameOver('bankrupt');
    }

    // Step 20: Check ending
    var ending = this._checkEnding();
    if (ending) return { ending: ending };

    // Step 21: Autosave
    this.autosave();

    // Emit tick complete
    this.emit('weekAdvanced', { week: p.week, year: p.year });

    return {
      week: p.week,
      year: p.year,
      netWorth: p.netWorth,
      level: p.level,
      chapter: p.chapter
    };
  };

  /* ==========================================================================
   * PUBLIC API HELPERS
   * ========================================================================== */

  GameEngine.prototype.getPortfolio = function () {
    var arr = [];
    var positions = this.state.portfolio.positions;
    var keys = Object.keys(positions);
    for (var i = 0; i < keys.length; i++) { arr.push(positions[keys[i]]); }
    return arr;
  };

  GameEngine.prototype.getMarketOverview = function () {
    return {
      indices: this.state.market.indices,
      sentiment: this.state.market.sentiment,
      macro: this.state.market.macro,
      companies: this.state.market.companies.map(function (c) {
        return { id: c.id, ticker: c.ticker, name: c.name, sector: c.sector, price: c.price, change: c.price - c.prevClose, marketCap: c.marketCap, peRatio: c.peRatio, dividendYield: c.dividendYield, isPenny: c.isPenny, isIPO: c.isIPO };
      })
    };
  };

  GameEngine.prototype.getPlayerInfo = function () {
    var p = this.state.player;
    return {
      name: p.name,
      cash: p.cash,
      netWorth: p.netWorth,
      level: p.level,
      levelName: this.getLevelInfo().name,
      xp: p.xp,
      xpNext: this.xpForLevel(p.level + 1),
      ethics: p.ethics,
      reputation: p.reputation,
      week: p.week,
      year: p.year,
      chapter: p.chapter,
      chapterName: CHAPTERS[p.chapter - 1] ? CHAPTERS[p.chapter - 1].name : 'Unknown',
      missions: this.getActiveMissions(),
      achievements: p.achievements,
      stats: p.stats
    };
  };

  GameEngine.prototype.getLeaderboard = function () {
    // Local leaderboard based on career score
    var p = this.state.player;
    var score = p.netWorth + p.ethics * 100000 + p.achievements.length * 10000 + p.level * 50000;
    return { score: score, name: p.name, netWorth: p.netWorth, ethics: p.ethics };
  };

  GameEngine.prototype.applyEthicsChange = function (delta) {
    this.state.player.ethics = clamp(this.state.player.ethics + delta, 0, 100);
  };

  GameEngine.prototype.getNotifications = function () {
    return this.state.notifications;
  };

  GameEngine.prototype.markNotificationRead = function (id) {
    for (var i = 0; i < this.state.notifications.length; i++) {
      if (this.state.notifications[i].id === id) {
        this.state.notifications[i].read = true;
        return true;
      }
    }
    return false;
  };

  GameEngine.prototype.clearNotifications = function () {
    this.state.notifications = [];
  };

  GameEngine.prototype.getGameStats = function () {
    var p = this.state.player;
    return {
      playtime: (Date.now() - (this.state.meta.createdAt || Date.now())) / 1000,
      weeksPlayed: p.stats.weeksPlayed,
      totalTrades: p.stats.totalTrades,
      winRate: p.stats.totalTrades > 0 ? (p.stats.totalProfit / (p.stats.totalProfit + p.stats.totalLoss || 1)) : 0,
      totalProfit: p.stats.totalProfit,
      totalLoss: p.stats.totalLoss,
      highestNetWorth: p.stats.highestNetWorth,
      achievements: p.achievements.length,
      missionsCompleted: this._completedMissionsCount(),
      clients: this.state.clients.length,
      agents: this.state.agents.length,
      raidsSurvived: p.stats.raidsSurvived,
      difficulty: this.getDifficultyLabel()
    };
  };

  /* ==========================================================================
   * EXPORT
   * ========================================================================== */

  return GameEngine;
}));