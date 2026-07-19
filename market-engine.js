/* ============================================================
 * market-engine.js — Company & Market Engine
 * Versione: 2.0
 * Espande massicciamente il mercato del gioco Stock Broker
 *
 * Espone: window.MarketEngine (browser) o module.exports (Node)
 *
 * Sistemi inclusi:
 *   1. 100 società con dati realistici
 *   2. Sistema economico avanzato (fondamenta, momentum, macro, volume)
 *   3. Report trimestrali (earnings, EPS, guidance, surprise)
 *   4. IPO e Secondary offerings
 *   5. M&A Activity (acquisition offers, premiums, failed deals)
 *   6. Sistema di settore avanzato (cicli, rotation, correlazioni)
 *   7. Opzioni (call/put, scadenze, pricing Black-Scholes semplificato)
 *   8. Market sentiment (Fear & Greed Index)
 *   9. Short interest (short squeeze, borrowing cost)
 *   10. Dividendi avanzati (yield, special dividends, dividend cuts, DRIP)
 *
 * Vanilla JS, nessuna dipendenza esterna.
 * ============================================================ */

(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.MarketEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================
  // UTILITY
  // ============================================================

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }
  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }
  function round2(n) {
    return Math.round(n * 100) / 100;
  }
  function round4(n) {
    return Math.round(n * 10000) / 10000;
  }
  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }
  function gaussian() {
    var u1 = Math.random() || 0.0001;
    var u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  function formatMoney(n) {
    return '€' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ============================================================
  // DEFINIZIONI SETTORI
  // ============================================================

  var SECTORS = {
    'TECH': {
      name: 'Tecnologia',
      cyclePhase: 'expansion',
      cycleProgress: 0.35,
      favorability: 0.8,
      volatility: 0.035,
      correlatedWith: ['COMM'],
      baseDividendYield: 0.012,
      avgPE: 28
    },
    'ENERGY': {
      name: 'Energia',
      cyclePhase: 'trough',
      cycleProgress: 0.6,
      favorability: 0.4,
      volatility: 0.028,
      correlatedWith: ['MATR'],
      baseDividendYield: 0.045,
      avgPE: 14
    },
    'FIN': {
      name: 'Finanza',
      cyclePhase: 'peak',
      cycleProgress: 0.7,
      favorability: 0.6,
      volatility: 0.022,
      correlatedWith: ['RE'],
      baseDividendYield: 0.025,
      avgPE: 12
    },
    'HEAL': {
      name: 'Sanità',
      cyclePhase: 'expansion',
      cycleProgress: 0.5,
      favorability: 0.7,
      volatility: 0.020,
      correlatedWith: [],
      baseDividendYield: 0.020,
      avgPE: 22
    },
    'CONS': {
      name: 'Consumi',
      cyclePhase: 'contraction',
      cycleProgress: 0.3,
      favorability: 0.5,
      volatility: 0.025,
      correlatedWith: ['COMM'],
      baseDividendYield: 0.030,
      avgPE: 18
    },
    'INDU': {
      name: 'Industriale',
      cyclePhase: 'expansion',
      cycleProgress: 0.4,
      favorability: 0.6,
      volatility: 0.024,
      correlatedWith: ['MATR'],
      baseDividendYield: 0.022,
      avgPE: 16
    },
    'MATR': {
      name: 'Materiali',
      cyclePhase: 'trough',
      cycleProgress: 0.8,
      favorability: 0.45,
      volatility: 0.030,
      correlatedWith: ['ENERGY'],
      baseDividendYield: 0.028,
      avgPE: 15
    },
    'UTIL': {
      name: 'Utilities',
      cyclePhase: 'peak',
      cycleProgress: 0.5,
      favorability: 0.55,
      volatility: 0.015,
      correlatedWith: [],
      baseDividendYield: 0.055,
      avgPE: 18
    },
    'RE': {
      name: 'Immobiliare',
      cyclePhase: 'contraction',
      cycleProgress: 0.25,
      favorability: 0.35,
      volatility: 0.026,
      correlatedWith: ['FIN'],
      baseDividendYield: 0.040,
      avgPE: 20
    },
    'COMM': {
      name: 'Comunicazioni',
      cyclePhase: 'expansion',
      cycleProgress: 0.55,
      favorability: 0.65,
      volatility: 0.023,
      correlatedWith: ['TECH'],
      baseDividendYield: 0.018,
      avgPE: 19
    }
  };

  var SECTOR_KEYS = Object.keys(SECTORS);

  // ============================================================
  // NOMI E TICKER DELLE 100 SOCIETÀ
  // ============================================================

  var COMPANY_NAMES = [
    // TECH (12)
    ['MicroDyne Systems', 'TECH'],
    ['NetBlast Communications', 'TECH'],
    ['StratComm Software', 'TECH'],
    ['CyberNet Industries', 'TECH'],
    ['Quantum Logic Corp', 'TECH'],
    ['DataStream Inc', 'TECH'],
    ['OmniChip Semiconductor', 'TECH'],
    ['VisionTech Labs', 'TECH'],
    ['NexusSoft Solutions', 'TECH'],
    ['Hyperion Systems', 'TECH'],
    ['InfoCore Technologies', 'TECH'],
    ['PixelForge Graphics', 'TECH'],
    // ENERGY (10)
    ['GoldHaven Energy', 'ENERGY'],
    ['PetroStar Oil & Gas', 'ENERGY'],
    ['SolarFlare Power', 'ENERGY'],
    ['AtomicCore Nuclear', 'ENERGY'],
    ['DeepWater Drilling', 'ENERGY'],
    ['GreenGrid Renewables', 'ENERGY'],
    ['CoalRidge Resources', 'ENERGY'],
    ['TerraVolt Energy', 'ENERGY'],
    ['WindCrest Power', 'ENERGY'],
    ['PowerLine Utilities', 'ENERGY'],
    // FIN (10)
    ['OmegaBank Group', 'FIN'],
    ['Meridian Financial', 'FIN'],
    ['PrimeCap Holdings', 'FIN'],
    ['Sterling Trust Corp', 'FIN'],
    ['Atlas Capital Partners', 'FIN'],
    ['Continental Insurance', 'FIN'],
    ['Fidelity Mortgage', 'FIN'],
    ['Liberty Savings Bank', 'FIN'],
    ['GlobalEdge Finance', 'FIN'],
    ['Renaissance Asset Mgmt', 'FIN'],
    // HEALTH (10)
    ['BioGenix Pharma', 'HEAL'],
    ['MediCare Systems', 'HEAL'],
    ['PharmaCore Labs', 'HEAL'],
    ['LifeLine Biotech', 'HEAL'],
    ['VitalSign Devices', 'HEAL'],
    ['GenoTech Genetics', 'HEAL'],
    ['NeuroMed Sciences', 'HEAL'],
    ['CardioHealth Corp', 'HEAL'],
    ['DentaPlus Supplies', 'HEAL'],
    ['ThermaCare Medical', 'HEAL'],
    // CONSUMER (10)
    ['ConsumerWorld Retail', 'CONS'],
    ['FreshMart Groceries', 'CONS'],
    ['StyleBrands Apparel', 'CONS'],
    ['HomeNest Furnishings', 'CONS'],
    ['AutoDrive Motors', 'CONS'],
    ['LeisureTime Entertainment', 'CONS'],
    ['BrewMaster Beverages', 'CONS'],
    ['BiteFast Restaurants', 'CONS'],
    ['SportZone Athletics', 'CONS'],
    ['CleanWell Products', 'CONS'],
    // INDUSTRIAL (10)
    ['AeroDynamics Aerospace', 'INDU'],
    ['CargoLine Logistics', 'INDU'],
    ['BuildRite Construction', 'INDU'],
    ['HeavyMach Industries', 'INDU'],
    ['TransContinental Rail', 'INDU'],
    ['AirFreight Express', 'INDU'],
    ['ShipYard Marine', 'INDU'],
    ['MetalWorks Manufacturing', 'INDU'],
    ['DefenceTech Systems', 'INDU'],
    ['ElectroMotive Engineering', 'INDU'],
    // MATERIALS (8)
    ['StoneRidge Mining', 'MATR'],
    ['IronForge Steel', 'MATR'],
    ['ChemiCore Industries', 'MATR'],
    ['LumberJack Forest Products', 'MATR'],
    ['GlassHouse Materials', 'MATR'],
    ['CementWorks Holdings', 'MATR'],
    ['AgriChem Fertilizers', 'MATR'],
    ['RareEarth Minerals', 'MATR'],
    // UTILITIES (7)
    ['ElecGrid Power Corp', 'UTIL'],
    ['WaterWorks Utilities', 'UTIL'],
    ['GasPipeline Network', 'UTIL'],
    ['MetroTransit Authority', 'UTIL'],
    ['WasteMgmt Solutions', 'UTIL'],
    ['ThermalGas Holdings', 'UTIL'],
    ['HydroPlant Authority', 'UTIL'],
    // REAL ESTATE (8)
    ['SkyLine Properties', 'RE'],
    ['UrbanVest REIT', 'RE'],
    ['MetroSpace Commercial', 'RE'],
    ['HomeFront Residential', 'RE'],
    ['PlazaCorp Realty', 'RE'],
    ['IndustrialPark Trust', 'RE'],
    ['HarborView Developments', 'RE'],
    ['LandMark Holdings', 'RE'],
    // COMMUNICATIONS (6)
    ['BroadBand Telecom', 'COMM'],
    ['MediaWave Broadcasting', 'COMM'],
    ['SignalPoint Wireless', 'COMM'],
    ['CinePlex Entertainment', 'COMM'],
    ['PrintHouse Publishing', 'COMM'],
    ['SkyCast Satellite', 'COMM'],
    // Extra per altri settori (10)
    ['DataMiner Analytics', 'TECH'],
    ['CyberShield Security', 'TECH'],
    ['GeoScan Petroleum', 'ENERGY'],
    ['PrimeTrust Bank', 'FIN'],
    ['OptiCare Vision', 'HEAL'],
    ['Robotix Automation', 'INDU'],
    ['TitaniumEx Metals', 'MATR'],
    ['BrightLight Power', 'UTIL'],
    ['EcoVillage Homes', 'RE'],
    ['GlobalReach Media', 'COMM']
  ];

  // Genera ticker da nome
  function genTicker(name) {
    var words = name.split(' ');
    var ticker;
    if (words.length === 1) {
      ticker = words[0].substring(0, 4);
    } else {
      ticker = (words[0].substring(0, 3) + (words[1] ? words[1].substring(0, 2) : '')).toUpperCase();
    }
    return ticker.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
  }

  // Determina se la società è penny stock o blue chip durante la generazione
  function generateCompany(idx, name, sectorKey) {
    var sector = SECTORS[sectorKey];
    var ticker = genTicker(name);
    // Evita collisioni di ticker
    var usedTickers = {};
    // Il ticker verrà verificato esternamente, qui usiamo un suffisso

    var basePrice;
    var marketCap;
    var volatility;
    var dividendYield;
    var pe;
    var revenue, profit, debt, growthRate;

    // Classifichiamo le società
    var tier = 'mid';
    var isPenny = false;
    var isBlueChip = false;

    // ~15 penny stocks (prezzo < €5, altissima volatilità)
    if (idx < 15) {
      // I primi 15 sono penny stock (idx 0-14)
      tier = 'penny';
      isPenny = true;
      basePrice = round2(rand(0.50, 4.99));
      volatility = rand(0.06, 0.12);
      dividendYield = 0;
      marketCap = round2(rand(20e6, 200e6));
      revenue = round2(rand(5e6, 50e6));
      profit = rand(-10e6, 5e6);
      debt = round2(rand(10e6, 100e6));
      growthRate = rand(-0.15, 0.40);
      pe = profit > 0 ? round2(rand(15, 80)) : null;
    } else if (idx >= 90) {
      // ~10 blue chips (prezzo > €100, bassa volatilità)
      tier = 'blue';
      isBlueChip = true;
      basePrice = round2(rand(100, 450));
      volatility = rand(0.008, 0.020);
      dividendYield = round4(rand(0.015, 0.060));
      marketCap = round2(rand(50e9, 400e9));
      revenue = round2(rand(10e9, 80e9));
      profit = round2(rand(1e9, 12e9));
      debt = round2(rand(5e9, 40e9));
      growthRate = rand(0.02, 0.12);
      pe = round2(rand(10, 35));
    } else {
      // Mid-cap (~75 società)
      tier = 'mid';
      basePrice = round2(rand(6, 99));
      volatility = rand(0.018, 0.040);
      dividendYield = round4(rand(0, 0.045));
      marketCap = round2(rand(500e6, 15e9));
      revenue = round2(rand(200e6, 5e9));
      profit = round2(rand(-50e6, 800e6));
      debt = round2(rand(100e6, 5e9));
      growthRate = rand(-0.05, 0.25);
      pe = profit > 0 ? round2(rand(12, 50)) : null;
    }

    return {
      id: 'CO' + String(idx + 1).padStart(3, '0'),
      name: name,
      ticker: ticker,
      sector: sectorKey,
      tier: tier,
      isPenny: isPenny,
      isBlueChip: isBlueChip,
      price: basePrice,
      prevClose: basePrice,
      openPrice: basePrice,
      marketCap: marketCap,
      sharesOutstanding: Math.round(marketCap / basePrice),
      float: Math.round((marketCap / basePrice) * rand(0.6, 0.9)),
      volatility: volatility,
      dividendYield: dividendYield,
      peRatio: pe,
      // Fondamenta
      fundamentals: {
        revenue: revenue,
        profit: profit,
        debt: debt,
        growthRate: growthRate,
        bookValue: round2(rand(0.5, 8) * basePrice),
        cashFlow: round2(profit * rand(0.7, 1.3)),
        roe: round4(profit / (marketCap * 0.4)), // approx equity
        eps: round2(profit / (marketCap / basePrice)),
        debtToEquity: round2(debt / (marketCap * 0.4)),
        profitMargin: round4(profit / revenue)
      },
      // Momentum & technicals
      momentum: 0,
      rsi: 50,
      avgVolume: Math.round((marketCap / basePrice) * rand(0.005, 0.03)),
      volumeToday: 0,
      volume30d: [],
      priceHistory: [basePrice],
      dayHigh: basePrice,
      dayLow: basePrice,
      weekHigh52: basePrice,
      weekLow52: basePrice,
      // Dividendi
      dividendPerShare: round2(basePrice * dividendYield / 4), // trimestrale
      dividendHistory: [],
      lastDividendDate: 0,
      specialDividendPending: false,
      dividendCut: false,
      // Earnings
      nextEarningsWeek: randInt(1, 4),
      earningsHistory: [],
      lastEarningsSurprise: 0,
      analystRating: pick(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']),
      priceTarget: round2(basePrice * rand(0.85, 1.20)),
      consensusEPS: 0,
      // IPO
      isIPO: false,
      ipoWeek: -1,
      ipoLockupWeeks: randInt(12, 24),
      // Short interest
      shortInterest: round4(rand(0.01, 0.25)), // percentuale del float
      shortBorrowCost: 0,
      shortSqueezeRisk: 0,
      // M&A
      maStatus: null, // null | 'target' | 'acquirer' | 'completed' | 'failed'
      maPartnerId: null,
      maPremium: 0,
      maWeek: -1,
      maDuration: 0,
      // Stato
      halted: false,
      delisted: false,
      bankruptcyRisk: 0,
      // Beta (correlazione con mercato)
      beta: round2(rand(0.5, 1.8)),
      // Tag per UI
      tags: []
    };
  }

  // ============================================================
  // EVENTI MACRO & NEWS
  // ============================================================

  var MACRO_EVENTS = [
    { id: 'rate_hike', label: 'Fed alza tassi di 0.50%', impact: -0.03, sectorsAffected: ['FIN', 'RE', 'CONS'], duration: 4 },
    { id: 'rate_cut', label: 'Fed taglia tassi di 0.50%', impact: 0.04, sectorsAffected: ['FIN', 'RE', 'CONS'], duration: 4 },
    { id: 'oil_crisis', label: 'Crisi petrolifera: petrolio +30%', impact: -0.02, sectorsAffected: ['ENERGY'], duration: 6, positiveSectors: ['ENERGY'] },
    { id: 'tech_boom', label: 'Boom tecnologico: nuovo paradigma', impact: 0.05, sectorsAffected: ['TECH', 'COMM'], duration: 8, positiveSectors: ['TECH', 'COMM'] },
    { id: 'recession', label: 'Rallentamento economico: recessione imminente', impact: -0.06, sectorsAffected: ['CONS', 'INDU', 'RE', 'FIN'], duration: 10, positiveSectors: ['UTIL', 'HEAL'] },
    { id: 'inflation', label: 'Inflazione in aumento, CPI +4%', impact: -0.02, sectorsAffected: ['CONS', 'UTIL'], duration: 6, positiveSectors: ['MATR', 'ENERGY'] },
    { id: 'trade_deal', label: 'Accordo commerciale raggiunto', impact: 0.03, sectorsAffected: ['INDU', 'MATR', 'CONS'], duration: 5 },
    { id: 'geopolitical', label: 'Tensioni geopolitiche escalate', impact: -0.04, sectorsAffected: ['ENERGY', 'INDU', 'MATR'], duration: 5, positiveSectors: ['UTIL', 'HEAL'] },
    { id: 'earnings_beat', label: 'Stagione earnings: risultati positivi', impact: 0.02, sectorsAffected: [], duration: 2 },
    { id: 'earnings_miss', label: 'Stagione earnings: risultati deludenti', impact: -0.025, sectorsAffected: [], duration: 2 },
    { id: 'consumer_confidence', label: 'Consumer confidence ai massimi', impact: 0.025, sectorsAffected: ['CONS', 'COMM'], duration: 4 },
    { id: 'housing_boom', label: 'Boom immobiliare: case +12%', impact: 0.03, sectorsAffected: ['RE', 'FIN', 'MATR'], duration: 6 },
    { id: 'dollar_strong', label: 'Dollar forte, esportazioni colpite', impact: -0.02, sectorsAffected: ['TECH', 'INDU', 'MATR'], duration: 5 },
    { id: 'gold_rush', label: 'Gold rush: investitori cercano rifugio', impact: 0.015, sectorsAffected: ['MATR', 'ENERGY'], duration: 3 },
    { id: 'biotech_breakthrough', label: 'Breakthrough biotech: nuovo farmaco approvato', impact: 0.04, sectorsAffected: ['HEAL'], duration: 4 },
    { id: 'merger_wave', label: 'Onda di fusioni e acquisizioni', impact: 0.02, sectorsAffected: ['FIN'], duration: 3 },
    { id: 'market_crash', label: 'Panico di mercato: flash crash', impact: -0.08, sectorsAffected: [], duration: 2 },
    { id: 'santa_rally', label: 'Santa Claus Rally', impact: 0.03, sectorsAffected: [], duration: 3 },
    { id: 'sector_rotation_growth', label: 'Rotazione settoriale verso growth', impact: 0.02, sectorsAffected: ['TECH', 'HEAL'], duration: 4 },
    { id: 'sector_rotation_value', label: 'Rotazione settoriale verso value', impact: 0.02, sectorsAffected: ['UTIL', 'ENERGY', 'FIN'], duration: 4 }
  ];

  var MICRO_NEWS = [
    { label: 'CEO intervistato su CNBC — outlook positivo', impact: 0.01 },
    { label: 'Prodotto richiamato per difetto', impact: -0.03 },
    { label: 'Contratto governativo vinto', impact: 0.02 },
    { label: 'Indagine SEC avviata', impact: -0.05 },
    { label: 'Nuova partnership strategica', impact: 0.015 },
    { label: 'Espansione in nuovo mercato', impact: 0.02 },
    { label: 'Layoff annunciato — 5% forza lavoro', impact: -0.01 },
    { label: 'Acquisto azionario proprio (buyback)', impact: 0.025 },
    { label: 'Insider selling segnalato', impact: -0.02 },
    { label: 'Insider buying segnalato', impact: 0.02 },
    { label: 'Nuovo prodotto lanciato', impact: 0.015 },
    { label: 'Patent approvata', impact: 0.01 },
    { label: 'Lawsuit collettivo intentato', impact: -0.04 },
    { label: 'Rating upgrade da analista', impact: 0.02 },
    { label: 'Rating downgrade da analista', impact: -0.025 },
    { label: 'Guidance raised', impact: 0.03 },
    { label: 'Guidance lowered', impact: -0.035 },
    { label: 'Contratto major perso', impact: -0.02 },
    { label: 'Expansione impianto produttivo', impact: 0.015 },
    { label: 'Restrizione normativa europea', impact: -0.02 }
  ];

  // ============================================================
  // NOMI IPO
  // ============================================================

  var IPO_NAMES = [
    ['eTernity Web Services', 'TECH'],
    ['MobileXpress Apps', 'TECH'],
    ['CloudVault Storage', 'TECH'],
    ['GenoMap Biosciences', 'HEAL'],
    ['TheraPure Pharmaceuticals', 'HEAL'],
    ['NanoTech Diagnostics', 'HEAL'],
    ['StreamLine Media', 'COMM'],
    ['SocialLink Networks', 'COMM'],
    ['EcoFuel BioEnergy', 'ENERGY'],
    ['LithiumPeak Resources', 'ENERGY'],
    ['RoboAuto Industries', 'INDU'],
    ['DroneFleet Logistics', 'INDU'],
    ['FashionForward Brands', 'CONS'],
    ['OrganicEarth Foods', 'CONS'],
    ['QuantumPay Fintech', 'FIN'],
    ['BlockChain Capital', 'FIN'],
    ['SkyTower REIT', 'RE'],
    ['GreenMega Developments', 'RE'],
    ['SmartGrid Solutions', 'UTIL'],
    ['FiberOptic Express', 'COMM'],
    ['AI Cortex Labs', 'TECH'],
    ['VirtuReal Studios', 'TECH'],
    ['NeuroLink Systems', 'HEAL'],
    ['SolarPeak Energy', 'ENERGY'],
    ['AutoPilot Systems', 'INDU']
  ];

  // ============================================================
  // OPZIONI
  // ============================================================

  function createOption(contract) {
    return {
      id: 'OPT' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      type: contract.type, // 'call' | 'put'
      ticker: contract.ticker,
      strike: contract.strike,
      expiryWeek: contract.expiryWeek,
      premium: contract.premium,
      contracts: contract.contracts || 1,
      cost: contract.premium * 100 * (contract.contracts || 1), // 100 shares per contract
      soldAt: null,
      soldPremium: null,
      status: 'open', // open | exercised | expired | sold
      createdAt: contract.createdAt || 0,
      // Per calcolo P&L
      impliedVolatility: contract.impliedVolatility || 0.30,
      // Greci semplificati
      delta: 0,
      gamma: 0,
      theta: 0
    };
  }

  // Black-Scholes semplificato
  function blackScholesSimple(type, S, K, T, sigma, r) {
    // S = spot, K = strike, T = tempo (in anni), sigma = volatilità, r = tasso risk-free
    r = r || 0.03;
    if (T <= 0) {
      // Scadenza: valore intrinseco
      if (type === 'call') return Math.max(0, S - K);
      return Math.max(0, K - S);
    }
    var d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    var d2 = d1 - sigma * Math.sqrt(T);

    // N(x) approssimazione
    function N(x) {
      var c = 0.3989422804014327; // 1/sqrt(2pi)
      var g = 0.2316419;
      var t = 1 / (1 + g * Math.abs(x));
      var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      var cdf = 1 - c * Math.exp(-x * x / 2) * poly;
      return x < 0 ? 1 - cdf : cdf;
    }

    if (type === 'call') {
      return S * N(d1) - K * Math.exp(-r * T) * N(d2);
    } else {
      return K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
    }
  }

  function calcGreeks(option, S, T) {
    var sigma = option.impliedVolatility;
    var r = 0.03;
    if (T <= 0) {
      option.delta = option.type === 'call' ? (S > option.strike ? 1 : 0) : (S < option.strike ? -1 : 0);
      option.gamma = 0;
      option.theta = 0;
      return;
    }
    var d1 = (Math.log(S / option.strike) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    var d2 = d1 - sigma * Math.sqrt(T);

    function N(x) {
      var c = 0.3989422804014327;
      var g = 0.2316419;
      var t = 1 / (1 + g * Math.abs(x));
      var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      var cdf = 1 - c * Math.exp(-x * x / 2) * poly;
      return x < 0 ? 1 - cdf : cdf;
    }
    function n(x) {
      return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    }

    if (option.type === 'call') {
      option.delta = N(d1);
    } else {
      option.delta = N(d1) - 1;
    }
    option.gamma = n(d1) / (S * sigma * Math.sqrt(T));
    option.theta = -(S * n(d1) * sigma) / (2 * Math.sqrt(T)) - r * option.strike * Math.exp(-r * T) * (option.type === 'call' ? N(d2) : -N(-d2));
    option.theta = option.theta / 365; // per giorno
  }

  // ============================================================
  // MOTORE PRINCIPALE
  // ============================================================

  function MarketEngine(config) {
    config = config || {};
    this.week = 0;
    this.day = 0; // 0-4 dentro la settimana (Lun-Ven)
    this.companies = [];
    this.companiesById = {};
    this.companiesByTicker = {};
    this.tickerSet = {};
    this.marketIndex = 10000;
    this.marketIndexHistory = [10000];
    this.marketTrend = 0; // -1 to 1, bear/bull
    this.marketVolatility = 0.015;
    this.fearGreedIndex = 50; // 0=extreme fear, 100=extreme greed
    this.fearGreedHistory = [50];
    this.macroEvents = [];
    this.activeEvents = [];
    this.newsLog = [];
    this.earningsLog = [];
    this.ipoLog = [];
    this.maLog = [];
    this.options = [];
    this.optionsEnabled = false;
    this.unlocks = { options: false, short: true };
    this.quarterCounter = 0;
    this.riskFreeRate = 0.03;
    this.usedTickers = {};
    this.dividendsPaidThisWeek = [];

    // Sectors
    this.sectors = JSON.parse(JSON.stringify(SECTORS));

    // Genera 100 società
    this._generateCompanies();

    // Genera storico iniziale per 30 giorni
    this._bootstrapHistory();

    // Eventi iniziali
    this._maybeTriggerMacroEvent();

    if (config.debug) this.debug = true;
  }

  // ============================================================
  // GENERAZIONE SOCIETÀ
  // ============================================================

  MarketEngine.prototype._generateCompanies = function () {
    var self = this;
    COMPANY_NAMES.forEach(function (entry, idx) {
      var name = entry[0];
      var sector = entry[1];
      var company = generateCompany(idx, name, sector);

      // Risolvi collisioni ticker
      var baseTicker = company.ticker;
      var suffix = 1;
      while (self.tickerSet[company.ticker]) {
        company.ticker = (baseTicker + suffix).substring(0, 5);
        suffix++;
      }
      self.tickerSet[company.ticker] = true;

      self.companies.push(company);
      self.companiesById[company.id] = company;
      self.companiesByTicker[company.ticker] = company;
    });
  };

  MarketEngine.prototype._bootstrapHistory = function () {
    var self = this;
    // Simula 30 giorni di trading per creare storico
    for (var d = 0; d < 30; d++) {
      self.companies.forEach(function (c) {
        var change = gaussian() * c.volatility;
        var newPrice = round2(Math.max(0.01, c.price * (1 + change)));
        c.price = newPrice;
        c.priceHistory.push(newPrice);
        if (c.priceHistory.length > 252) c.priceHistory.shift();
        if (newPrice > c.weekHigh52) c.weekHigh52 = newPrice;
        if (newPrice < c.weekLow52) c.weekLow52 = newPrice;
        var vol = Math.round(c.avgVolume * rand(0.5, 1.5));
        c.volume30d.push(vol);
        if (c.volume30d.length > 30) c.volume30d.shift();
      });
      // Aggiorna indice
      var idxChange = gaussian() * 0.005;
      self.marketIndex = round2(self.marketIndex * (1 + idxChange));
      self.marketIndexHistory.push(self.marketIndex);
    }
    // Ripristina dayHigh/Low al prezzo corrente
    self.companies.forEach(function (c) {
      c.dayHigh = c.price;
      c.dayLow = c.price;
      c.prevClose = c.priceHistory[c.priceHistory.length - 2] || c.price;
      c.openPrice = c.price;
    });
  };

  // ============================================================
  // TICK GIORNALIERO
  // ============================================================

  MarketEngine.prototype.tick = function () {
    var self = this;
    this.day++;
    if (this.day >= 5) {
      this.day = 0;
      this.week++;
      this._weeklyUpdate();
    }

    // Reset giornaliero
    var dayLog = [];

    // Aggiorna eventi macro attivi
    this._updateActiveEvents();

    // Aggiorna sentiment Fear & Greed
    this._updateFearGreed();

    // Aggiorna cicli settoriali
    this._updateSectorCycles();

    // Tick di mercato per ogni società
    this.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      self._tickCompany(c, dayLog);
    });

    // Correlazioni intrasettoriali
    this._applySectorCorrelations();

    // Short squeeze check
    this._checkShortSqueezes();

    // Aggiorna indice di mercato
    var totalChange = 0;
    var count = 0;
    this.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      totalChange += (c.price - c.prevClose) / c.prevClose;
      count++;
    });
    if (count > 0) {
      var avgChange = totalChange / count;
      self.marketIndex = round2(self.marketIndex * (1 + avgChange * 0.6));
      self.marketIndexHistory.push(self.marketIndex);
      if (self.marketIndexHistory.length > 500) self.marketIndexHistory.shift();

      // Aggiorna marketTrend
      self.marketTrend = self.marketTrend * 0.95 + avgChange * 0.05;
      self.marketTrend = clamp(self.marketTrend, -0.05, 0.05);
    }

    // Micro-news casuali (15% chance al giorno)
    if (Math.random() < 0.15) {
      var company = pick(this.companies.filter(function (c) { return !c.halted && !c.delisted; }));
      if (company) {
        var news = pick(MICRO_NEWS);
        company.price = round2(Math.max(0.01, company.price * (1 + news.impact)));
        company.priceHistory.push(company.price);
        if (company.priceHistory.length > 252) company.priceHistory.shift();
        dayLog.push({
          week: this.week,
          day: this.day,
          ticker: company.ticker,
          news: news.label,
          impact: news.impact
        });
      }
    }

    // Aggiungi dayLog al newsLog
    if (dayLog.length > 0) {
      this.newsLog.push({ week: this.week, day: this.day, events: dayLog });
    }

    // Aggiorna opzioni
    this._updateOptions();

    return {
      week: this.week,
      day: this.day,
      marketIndex: this.marketIndex,
      fearGreed: this.fearGreedIndex,
      dayEvents: dayLog,
      dividendsPaid: this.dividendsPaidThisWeek
    };
  };

  // ============================================================
  // TICK SINGOLA SOCIETÀ
  // ============================================================

  MarketEngine.prototype._tickCompany = function (c, dayLog) {
    var sector = this.sectors[c.sector];
    var prevPrice = c.price;

    // 1. Componente fondamenta (drift verso valore intrinseco)
    var intrinsicValue = c.fundamentals.profit > 0
      ? c.fundamentals.profit * sector.avgPE / c.sharesOutstanding
      : c.fundamentals.bookValue;
    var fundamentalComponent = (intrinsicValue - c.price) / c.price * 0.01;

    // 2. Componente momentum
    var momentumComponent = c.momentum * 0.3;
    c.momentum = c.momentum * 0.90; // decay

    // 3. Componente macro (market trend + eventi attivi)
    var macroComponent = this.marketTrend * c.beta * 0.5;

    // Eventi attivi che influenzano questa società
    var eventImpact = 0;
    this.activeEvents.forEach(function (ev) {
      if (ev.sectorsAffected.indexOf(c.sector) !== -1) {
        eventImpact += ev.impact * 0.3;
      }
      if (ev.positiveSectors && ev.positiveSectors.indexOf(c.sector) !== -1) {
        eventImpact += Math.abs(ev.impact) * 0.5;
      }
    });

    // 4. Settore favorability
    var sectorComponent = (sector.favorability - 0.5) * 0.01;

    // 5. Sentiment Fear & Greed
    var sentimentComponent = (this.fearGreedIndex - 50) / 5000;

    // 6. Random shock (volatilità)
    var volMultiplier = 1 + (this.fearGreedIndex < 25 ? 0.5 : 0) + (this.fearGreedIndex > 75 ? 0.3 : 0);
    var randomComponent = gaussian() * c.volatility * volMultiplier;

    // 7. IPO volatilità extra nei primi turni
    var ipoComponent = 0;
    if (c.isIPO && this.week - c.ipoWeek < 8) {
      ipoComponent = gaussian() * 0.08;
    }

    // 8. M&A impact
    var maComponent = 0;
    if (c.maStatus === 'target') {
      maComponent = 0.002; // drift verso prezzo di offerta
    } else if (c.maStatus === 'acquirer') {
      maComponent = -0.001; // lieve pressione
    }

    // 9. Bankruptcy drift per penny stock con problemi
    var bankruptcyComponent = 0;
    if (c.bankruptcyRisk > 0.3) {
      bankruptcyComponent = -c.bankruptcyRisk * 0.005;
    }

    // 10. Short interest pressure
    var shortComponent = 0;
    if (c.shortInterest > 0.15) {
      // Short squeeze risk crea pressione rialzista latente
      shortComponent = c.shortInterest * 0.001;
    }

    // Calcola change totale
    var totalChange = fundamentalComponent + momentumComponent + macroComponent +
                      eventImpact + sectorComponent + sentimentComponent +
                      randomComponent + ipoComponent + maComponent +
                      bankruptcyComponent + shortComponent;

    var newPrice = round2(Math.max(0.01, c.price * (1 + totalChange)));

    // Update volume
    var vol = Math.round(c.avgVolume * rand(0.5, 1.8) * (1 + Math.abs(totalChange) * 20));
    c.volumeToday = vol;
    c.volume30d.push(vol);
    if (c.volume30d.length > 30) c.volume30d.shift();

    // Update price
    c.prevClose = c.price;
    c.price = newPrice;
    c.priceHistory.push(newPrice);
    if (c.priceHistory.length > 252) c.priceHistory.shift();

    // Day high/low
    if (newPrice > c.dayHigh) c.dayHigh = newPrice;
    if (newPrice < c.dayLow) c.dayLow = newPrice;

    // 52-week high/low
    if (newPrice > c.weekHigh52) c.weekHigh52 = newPrice;
    if (newPrice < c.weekLow52) c.weekLow52 = newPrice;

    // Update momentum
    var priceChange = (newPrice - prevPrice) / prevPrice;
    c.momentum = c.momentum * 0.7 + priceChange * 0.3;

    // Update RSI (14-period)
    c.rsi = this._calcRSI(c.priceHistory, 14);

    // Update market cap
    c.marketCap = round2(newPrice * c.sharesOutstanding);

    // Update P/E
    if (c.fundamentals.profit > 0) {
      c.peRatio = round2(newPrice / c.fundamentals.eps);
    }

    // Update short borrow cost
    c.shortBorrowCost = c.shortInterest * 0.02; // annualized

    // Update bankruptcy risk per penny stock
    if (c.isPenny) {
      if (c.fundamentals.profit < 0 && priceChange < 0) {
        c.bankruptcyRisk = clamp(c.bankruptcyRisk + 0.005, 0, 1);
      } else {
        c.bankruptcyRisk = clamp(c.bankruptcyRisk - 0.002, 0, 1);
      }
    }
  };

  // ============================================================
  // RSI
  // ============================================================

  MarketEngine.prototype._calcRSI = function (history, period) {
    if (history.length < period + 1) return 50;
    var gains = 0, losses = 0;
    for (var i = history.length - period; i < history.length; i++) {
      var change = history[i] - history[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    var rs = losses === 0 ? 100 : gains / losses;
    return round2(100 - 100 / (1 + rs));
  };

  // ============================================================
  // AGGIORNAMENTO SETTORI
  // ============================================================

  MarketEngine.prototype._updateSectorCycles = function () {
    var self = this;
    SECTOR_KEYS.forEach(function (key) {
      var s = self.sectors[key];
      s.cycleProgress += 0.002;
      if (s.cycleProgress >= 1) {
        // Ciclo completo, passa alla fase successiva
        var phases = ['trough', 'expansion', 'peak', 'contraction'];
        var currentIdx = phases.indexOf(s.cyclePhase);
        s.cyclePhase = phases[(currentIdx + 1) % 4];
        s.cycleProgress = 0;

        // Aggiorna favorability in base alla fase
        switch (s.cyclePhase) {
          case 'trough': s.favorability = 0.3 + rand(0, 0.15); break;
          case 'expansion': s.favorability = 0.6 + rand(0, 0.2); break;
          case 'peak': s.favorability = 0.65 + rand(0, 0.15); break;
          case 'contraction': s.favorability = 0.35 + rand(0, 0.15); break;
        }
      }
    });
  };

  MarketEngine.prototype._applySectorCorrelations = function () {
    var self = this;
    SECTOR_KEYS.forEach(function (key) {
      var sector = self.sectors[key];
      if (!sector.correlatedWith || sector.correlatedWith.length === 0) return;

      // Calcola cambio medio del settore
      var sectorCompanies = self.companies.filter(function (c) { return c.sector === key; });
      var avgChange = 0;
      sectorCompanies.forEach(function (c) {
        avgChange += (c.price - c.prevClose) / c.prevClose;
      });
      avgChange /= sectorCompanies.length;

      // Applica ai settori correlati
      sector.correlatedWith.forEach(function (corrKey) {
        var corrCompanies = self.companies.filter(function (c) { return c.sector === corrKey; });
        corrCompanies.forEach(function (c) {
          var correlationStrength = 0.3;
          var adjustment = avgChange * correlationStrength;
          c.price = round2(Math.max(0.01, c.price * (1 + adjustment)));
        });
      });
    });
  };

  // ============================================================
  // FEAR & GREED
  // ============================================================

  MarketEngine.prototype._updateFearGreed = function () {
    var self = this;
    var change = 0;

    // Market trend
    change += self.marketTrend * 100;

    // Market volatility
    if (self.marketVolatility > 0.03) change -= 5;
    if (self.marketVolatility < 0.01) change += 5;

    // Eventi attivi
    self.activeEvents.forEach(function (ev) {
      if (ev.impact > 0) change += 2;
      else change -= 2;
    });

    // Mean reversion verso 50
    change += (50 - self.fearGreedIndex) * 0.05;

    // Random noise
    change += gaussian() * 2;

    self.fearGreedIndex = clamp(round2(self.fearGreedIndex + change), 0, 100);
    self.fearGreedHistory.push(self.fearGreedIndex);
    if (self.fearGreedHistory.length > 252) self.fearGreedHistory.shift();
  };

  // ============================================================
  // EVENTI MACRO
  // ============================================================

  MarketEngine.prototype._maybeTriggerMacroEvent = function () {
    if (Math.random() < 0.08 || this.activeEvents.length === 0 && this.week === 0) {
      var ev = pick(MACRO_EVENTS);
      var event = {
        id: ev.id + '_' + this.week,
        label: ev.label,
        impact: ev.impact,
        sectorsAffected: ev.sectorsAffected.slice(),
        positiveSectors: ev.positiveSectors ? ev.positiveSectors.slice() : [],
        duration: ev.duration,
        weekTriggered: this.week,
        remaining: ev.duration
      };
      this.activeEvents.push(event);
      this.macroEvents.push({
        week: this.week,
        label: ev.label,
        impact: ev.impact,
        sectorsAffected: event.sectorsAffected
      });
      this.newsLog.push({
        week: this.week,
        day: this.day,
        events: [{ ticker: 'MARKET', news: ev.label, impact: ev.impact }]
      });
    }
  };

  MarketEngine.prototype._updateActiveEvents = function () {
    var self = this;
    this.activeEvents = this.activeEvents.filter(function (ev) {
      ev.remaining--;
      if (ev.remaining <= 0) {
        self.newsLog.push({
          week: self.week,
          day: self.day,
          events: [{ ticker: 'MARKET', news: 'Evento concluso: ' + ev.label, impact: 0 }]
        });
        return false;
      }
      return true;
    });
    this._maybeTriggerMacroEvent();
  };

  // ============================================================
  // AGGIORNAMENTO SETTIMANALE
  // ============================================================

  MarketEngine.prototype._weeklyUpdate = function () {
    var self = this;

    // Reset day high/low
    self.companies.forEach(function (c) {
      c.dayHigh = c.price;
      c.dayLow = c.price;
      c.openPrice = c.price;
    });

    self.dividendsPaidThisWeek = [];

    // Earnings (ogni 4 settimane = trimestre)
    self.quarterCounter++;
    if (self.quarterCounter % 4 === 0) {
      self._runEarningsSeason();
    }

    // Dividendi
    self._payDividends();

    // IPO
    self._maybeIPO();

    // Secondary offerings
    self._maybeSecondaryOffering();

    // M&A
    self._maybeMAActivity();

    // Sector rotation
    self._sectorRotation();

    // Opzioni expiry
    self._expireOptions();

    // Aggiorna price targets
    self._updatePriceTargets();

    // Bankruptcy check
    self._checkBankruptcies();

    // Check unlock opzioni
    if (!self.unlocks.options && self.week >= 5) {
      self.unlocks.options = true;
      self.optionsEnabled = true;
    }
  };

  // ============================================================
  // EARNINGS SEASON
  // ============================================================

  MarketEngine.prototype._runEarningsSeason = function () {
    var self = this;
    self.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;

      // Genera consensus EPS
      c.consensusEPS = round2(c.fundamentals.eps * rand(0.9, 1.1));

      // Genera actual EPS (con surprise)
      var surpriseFactor = gaussian() * 0.15;
      var actualEPS = round2(c.fundamentals.eps * (1 + surpriseFactor));
      var surprise = round2(actualEPS - c.consensusEPS);
      var surprisePercent = c.consensusEPS !== 0 ? surprise / Math.abs(c.consensusEPS) : surprise * 0.1;

      // Revenue surprise
      var revenueSurprise = gaussian() * 0.1;
      var actualRevenue = round2(c.fundamentals.revenue * (1 + revenueSurprise));

      // Guidance
      var guidance = c.fundamentals.growthRate + gaussian() * 0.05;
      var guidanceRaised = guidance > c.fundamentals.growthRate;

      // Impact sul prezzo
      var earningsImpact = surprisePercent * 0.8 + revenueSurprise * 0.3;
      if (!guidanceRaised) earningsImpact -= 0.02;

      c.price = round2(Math.max(0.01, c.price * (1 + earningsImpact)));
      c.priceHistory.push(c.price);
      if (c.priceHistory.length > 252) c.priceHistory.shift();
      c.lastEarningsSurprise = surprisePercent;

      // Aggiorna fondamenta
      c.fundamentals.revenue = actualRevenue;
      c.fundamentals.profit = round2(c.fundamentals.profit * (1 + surpriseFactor * 0.5));
      c.fundamentals.eps = actualEPS;
      c.fundamentals.growthRate = guidance;

      // Aggiorna rating analista
      if (surprisePercent > 0.1) {
        c.analystRating = pick(['Strong Buy', 'Buy']);
        c.priceTarget = round2(c.price * rand(1.10, 1.25));
      } else if (surprisePercent < -0.1) {
        c.analystRating = pick(['Sell', 'Strong Sell']);
        c.priceTarget = round2(c.price * rand(0.75, 0.90));
      } else {
        c.analystRating = pick(['Buy', 'Hold', 'Hold', 'Sell']);
        c.priceTarget = round2(c.price * rand(0.95, 1.10));
      }

      // Salva earnings
      c.earningsHistory.push({
        week: self.week,
        consensusEPS: c.consensusEPS,
        actualEPS: actualEPS,
        surprise: surprise,
        surprisePercent: surprisePercent,
        revenue: actualRevenue,
        guidance: guidance,
        guidanceRaised: guidanceRaised
      });
      if (c.earningsHistory.length > 20) c.earningsHistory.shift();

      // Log
      self.earningsLog.push({
        week: self.week,
        ticker: c.ticker,
        name: c.name,
        consensusEPS: c.consensusEPS,
        actualEPS: actualEPS,
        surprise: surprise,
        surprisePercent: surprisePercent,
        revenue: actualRevenue,
        guidance: guidance,
        guidanceRaised: guidanceRaised,
        rating: c.analystRating,
        priceTarget: c.priceTarget
      });
    });
  };

  // ============================================================
  // DIVIDENDI
  // ============================================================

  MarketEngine.prototype._payDividends = function () {
    var self = this;
    self.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      if (c.dividendYield <= 0) return;

      // Ogni 4 settimane per le società che pagano dividendi
      if (self.week % 4 !== c.lastDividendDate % 4) return;

      var div = round2(c.price * c.dividendYield / 4);
      if (div <= 0) return;

      // Special dividend (5% chance)
      var isSpecial = false;
      if (Math.random() < 0.05 && c.fundamentals.profit > 0) {
        div = round2(div * rand(2, 5));
        isSpecial = true;
        c.specialDividendPending = false;
      }

      // Dividend cut (3% chance per società in difficoltà)
      if (c.fundamentals.profit < 0 && Math.random() < 0.15) {
        div = round2(div * 0.3);
        c.dividendCut = true;
        c.dividendYield = round4(c.dividendYield * 0.3);
        self.newsLog.push({
          week: self.week,
          day: 0,
          events: [{ ticker: c.ticker, news: c.name + ' taglia il dividendo del 70%!', impact: -0.03 }]
        });
        c.price = round2(Math.max(0.01, c.price * 0.97));
      } else {
        c.dividendCut = false;
      }

      c.dividendPerShare = div;
      c.lastDividendDate = self.week;
      c.dividendHistory.push({
        week: self.week,
        amount: div,
        special: isSpecial
      });
      if (c.dividendHistory.length > 20) c.dividendHistory.shift();

      self.dividendsPaidThisWeek.push({
        ticker: c.ticker,
        name: c.name,
        amount: div,
        special: isSpecial,
        cut: c.dividendCut
      });
    });
  };

  // ============================================================
  // IPO
  // ============================================================

  MarketEngine.prototype._maybeIPO = function () {
    if (Math.random() < 0.12 && this.companies.length < 120) {
      var ipoData = pick(IPO_NAMES);
      var name = ipoData[0];
      var sector = ipoData[1];
      var idx = this.companies.length;

      // Prezzo di listino
      var ipoPrice = round2(rand(8, 45));
      var sectorData = this.sectors[sector];

      var company = {
        id: 'CO' + String(idx + 1).padStart(3, '0'),
        name: name,
        ticker: this._uniqueTicker(genTicker(name)),
        sector: sector,
        tier: 'mid',
        isPenny: ipoPrice < 5,
        isBlueChip: false,
        price: ipoPrice,
        prevClose: ipoPrice,
        openPrice: ipoPrice,
        marketCap: round2(rand(500e6, 5e9)),
        sharesOutstanding: 0,
        float: 0,
        volatility: rand(0.04, 0.08),
        dividendYield: 0,
        peRatio: round2(rand(20, 60)),
        fundamentals: {
          revenue: round2(rand(50e6, 500e6)),
          profit: round2(rand(-20e6, 50e6)),
          debt: round2(rand(10e6, 200e6)),
          growthRate: rand(0.10, 0.50),
          bookValue: round2(rand(2, 15)),
          cashFlow: round2(rand(10e6, 80e6)),
          roe: round4(rand(0.05, 0.25)),
          eps: 0,
          debtToEquity: round2(rand(0.2, 1.5)),
          profitMargin: round4(rand(0.02, 0.15))
        },
        momentum: 0.02,
        rsi: 50,
        avgVolume: 0,
        volumeToday: 0,
        volume30d: [],
        priceHistory: [ipoPrice],
        dayHigh: ipoPrice,
        dayLow: ipoPrice,
        weekHigh52: ipoPrice,
        weekLow52: ipoPrice,
        dividendPerShare: 0,
        dividendHistory: [],
        lastDividendDate: 0,
        specialDividendPending: false,
        dividendCut: false,
        nextEarningsWeek: randInt(4, 16),
        earningsHistory: [],
        lastEarningsSurprise: 0,
        analystRating: 'Buy',
        priceTarget: round2(ipoPrice * rand(1.10, 1.30)),
        consensusEPS: 0,
        isIPO: true,
        ipoWeek: this.week,
        ipoLockupWeeks: randInt(12, 24),
        shortInterest: round4(rand(0.01, 0.10)),
        shortBorrowCost: 0,
        shortSqueezeRisk: 0,
        maStatus: null,
        maPartnerId: null,
        maPremium: 0,
        maWeek: -1,
        maDuration: 0,
        halted: false,
        delisted: false,
        bankruptcyRisk: 0,
        beta: round2(rand(0.8, 2.0)),
        tags: ['IPO']
      };

      company.sharesOutstanding = Math.round(company.marketCap / ipoPrice);
      company.float = Math.round(company.sharesOutstanding * rand(0.2, 0.4)); // IPO ha float basso
      company.avgVolume = Math.round(company.float * rand(0.02, 0.08));
      company.fundamentals.eps = round2(company.fundamentals.profit / company.sharesOutstanding);

      this.companies.push(company);
      this.companiesById[company.id] = company;
      this.companiesByTicker[company.ticker] = company;
      this.tickerSet[company.ticker] = true;

      this.ipoLog.push({
        week: this.week,
        ticker: company.ticker,
        name: company.name,
        sector: company.sector,
        ipoPrice: ipoPrice,
        shares: company.sharesOutstanding
      });

      this.newsLog.push({
        week: this.week,
        day: 0,
        events: [{
          ticker: company.ticker,
          news: 'IPO: ' + company.name + ' debutta a ' + formatMoney(ipoPrice),
          impact: 0
        }]
      });
    }
  };

  MarketEngine.prototype._uniqueTicker = function (base) {
    var suffix = 1;
    var ticker = base;
    while (this.tickerSet[ticker]) {
      ticker = (base + suffix).substring(0, 5);
      suffix++;
    }
    return ticker;
  };

  // ============================================================
  // SECONDARY OFFERING
  // ============================================================

  MarketEngine.prototype._maybeSecondaryOffering = function () {
    var self = this;
    if (Math.random() < 0.05) {
      // Solo società non-IPO recenti
      var eligible = self.companies.filter(function (c) {
        return !c.halted && !c.delisted && !c.isIPO && c.fundamentals.debt > c.fundamentals.revenue * 0.5;
      });
      if (eligible.length === 0) return;
      var c = pick(eligible);
      var dilution = rand(0.05, 0.15); // 5-15% dilution
      var newShares = Math.round(c.sharesOutstanding * dilution);
      c.sharesOutstanding += newShares;
      c.float += Math.round(newShares * 0.8);
      c.price = round2(c.price * (1 - dilution * 0.8));
      c.priceHistory.push(c.price);
      if (c.priceHistory.length > 252) c.priceHistory.shift();
      c.marketCap = round2(c.price * c.sharesOutstanding);

      self.newsLog.push({
        week: self.week,
        day: 0,
        events: [{
          ticker: c.ticker,
          news: c.name + ' annuncia secondary offering di ' + (dilution * 100).toFixed(1) + '% — diluzione',
          impact: -dilution
        }]
      });
    }
  };

  // ============================================================
  // M&A ACTIVITY
  // ============================================================

  MarketEngine.prototype._maybeMAActivity = function () {
    var self = this;
    if (Math.random() < 0.06) {
      // Trova acquirer (mid/large cap con cash)
      var acquirers = self.companies.filter(function (c) {
        return !c.halted && !c.delisted && !c.isIPO && c.marketCap > 2e9 && !c.maStatus;
      });
      if (acquirers.length === 0) return;
      var acquirer = pick(acquirers);

      // Trova target (più piccolo, stesso settore o correlato)
      var targets = self.companies.filter(function (c) {
        return !c.halted && !c.delisted && c.id !== acquirer.id &&
               c.marketCap < acquirer.marketCap * 0.5 &&
               !c.maStatus && !c.isIPO;
      });
      if (targets.length === 0) return;
      var target = pick(targets);

      var premium = rand(0.20, 0.40);
      var offerPrice = round2(target.price * (1 + premium));

      target.maStatus = 'target';
      target.maPartnerId = acquirer.id;
      target.maPremium = premium;
      target.maWeek = self.week;
      target.maDuration = randInt(2, 6);

      acquirer.maStatus = 'acquirer';
      acquirer.maPartnerId = target.id;
      acquirer.maPremium = premium;
      acquirer.maWeek = self.week;
      acquirer.maDuration = target.maDuration;

      // Il prezzo del target salta verso l'offerta
      target.price = round2(target.price * (1 + premium * 0.7));
      target.priceHistory.push(target.price);

      // L'acquirer scende leggermente
      acquirer.price = round2(acquirer.price * 0.97);
      acquirer.priceHistory.push(acquirer.price);

      self.maLog.push({
        week: self.week,
        type: 'announcement',
        acquirer: acquirer.ticker,
        acquirerName: acquirer.name,
        target: target.ticker,
        targetName: target.name,
        premium: premium,
        offerPrice: offerPrice,
        status: 'pending'
      });

      self.newsLog.push({
        week: self.week,
        day: 0,
        events: [{
          ticker: target.ticker,
          news: 'M&A: ' + acquirer.name + ' (' + acquirer.ticker + ') lancia offerta su ' + target.name + ' (' + target.ticker + ') con premium ' + (premium * 100).toFixed(0) + '%',
          impact: premium
        }]
      });
    }

    // Aggiorna M&A in corso
    self.companies.forEach(function (c) {
      if (!c.maStatus || c.maStatus === 'completed' || c.maStatus === 'failed') return;
      c.maDuration--;
      if (c.maDuration <= 0) {
        // Risoluzione
        var partner = self.companiesById[c.maPartnerId];
        if (!partner) {
          c.maStatus = null;
          return;
        }

        // 70% chance completazione, 30% fallimento
        var success = Math.random() < 0.70;

        if (c.maStatus === 'target') {
          if (success) {
            // Target acquired — prezzo va all'offer price
            var offerPrice = round2(c.price * (1 + c.maPremium * 0.3));
            c.price = offerPrice;
            c.priceHistory.push(c.price);
            c.maStatus = 'completed';
            if (partner) partner.maStatus = 'completed';

            self.maLog.push({
              week: self.week,
              type: 'completion',
              acquirer: partner.ticker,
              target: c.ticker,
              premium: c.maPremium,
              offerPrice: offerPrice,
              status: 'completed'
            });

            // Notifica
            self.newsLog.push({
              week: self.week,
              day: 0,
              events: [{
                ticker: c.ticker,
                news: 'M&A completata: ' + partner.name + ' completa acquisizione di ' + c.name + ' a ' + formatMoney(offerPrice),
                impact: 0
              }]
            });

            // Fondi le fondamenta
            partner.fundamentals.revenue += c.fundamentals.revenue;
            partner.fundamentals.profit += c.fundamentals.profit;
            partner.fundamentals.debt += c.fundamentals.debt;
            partner.sharesOutstanding += Math.round(c.sharesOutstanding * 0.3); // stock swap parziale

            // Target delisted dopo acquisizione
            c.halted = true;
            c.delisted = true;

          } else {
            // Deal failed — target crolla, acquirer anche
            c.price = round2(c.price * 0.85);
            c.priceHistory.push(c.price);
            c.maStatus = 'failed';
            if (partner) {
              partner.price = round2(partner.price * 0.90);
              partner.priceHistory.push(partner.price);
              partner.maStatus = 'failed';
            }

            self.maLog.push({
              week: self.week,
              type: 'failure',
              acquirer: partner ? partner.ticker : '?',
              target: c.ticker,
              status: 'failed'
            });

            self.newsLog.push({
              week: self.week,
              day: 0,
              events: [{
                ticker: c.ticker,
                news: 'M&A fallita: deal tra ' + (partner ? partner.name : '?') + ' e ' + c.name + ' saltato',
                impact: -0.15
              }]
            });
          }

          // Reset dopo 1 settimana
          setTimeout(function () {
            if (c.maStatus === 'completed' || c.maStatus === 'failed') {
              if (partner && partner.maStatus !== 'completed' && partner.maStatus !== 'failed') {
                partner.maStatus = null;
              }
              c.maStatus = null;
            }
          }, 0);
        }
      }
    });
  };

  // ============================================================
  // SECTOR ROTATION
  // ============================================================

  MarketEngine.prototype._sectorRotation = function () {
    var self = this;
    // Capitale si sposta da settori sfavoriti a favoriti
    SECTOR_KEYS.forEach(function (key) {
      var s = self.sectors[key];
      // Ogni settimana, favorability si muove leggermente
      s.favorability += gaussian() * 0.02;
      s.favorability = clamp(s.favorability, 0.1, 0.9);

      // Aggiorna volatilità di settore in base alla fase
      switch (s.cyclePhase) {
        case 'trough': s.volatility = 0.035; break;
        case 'expansion': s.volatility = 0.022; break;
        case 'peak': s.volatility = 0.018; break;
        case 'contraction': s.volatility = 0.030; break;
      }
    });

    // Rotazione: se un settore è molto favorito, aumenta i prezzi
    SECTOR_KEYS.forEach(function (key) {
      var s = self.sectors[key];
      if (s.favorability > 0.7) {
        var sectorCompanies = self.companies.filter(function (c) { return c.sector === key; });
        sectorCompanies.forEach(function (c) {
          c.price = round2(c.price * (1 + 0.005));
        });
      } else if (s.favorability < 0.3) {
        var sectorCompanies = self.companies.filter(function (c) { return c.sector === key; });
        sectorCompanies.forEach(function (c) {
          c.price = round2(c.price * (1 - 0.005));
        });
      }
    });
  };

  // ============================================================
  // SHORT SQUEEZE
  // ============================================================

  MarketEngine.prototype._checkShortSqueezes = function () {
    var self = this;
    self.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;

      // Calcola short squeeze risk
      c.shortSqueezeRisk = c.shortInterest * (c.rsi < 40 ? 1.5 : 1) * (c.fundamentals.profit > 0 ? 1.2 : 0.8);

      // Squeeze event: short interest alto + notizia positiva
      if (c.shortInterest > 0.20 && Math.random() < 0.02) {
        var squeezeImpact = c.shortInterest * rand(0.5, 1.5);
        c.price = round2(c.price * (1 + squeezeImpact));
        c.priceHistory.push(c.price);
        c.momentum += squeezeImpact * 0.5;
        c.shortInterest *= 0.5; // gli short sellers coprono

        self.newsLog.push({
          week: self.week,
          day: self.day,
          events: [{
            ticker: c.ticker,
            news: 'SHORT SQUEEZE su ' + c.name + '! Short interest ' + (c.shortInterest * 200).toFixed(0) + '% — prezzo esplode',
            impact: squeezeImpact
          }]
        });
      }

      // Decay short interest
      c.shortInterest += gaussian() * 0.005;
      c.shortInterest = clamp(c.shortInterest, 0.005, 0.45);
    });
  };

  // ============================================================
  // PRICE TARGETS
  // ============================================================

  MarketEngine.prototype._updatePriceTargets = function () {
    this.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      var drift = (c.analystRating === 'Strong Buy' || c.analystRating === 'Buy') ? 1.02 :
                  (c.analystRating === 'Sell' || c.analystRating === 'Strong Sell') ? 0.98 : 1.0;
      c.priceTarget = round2(c.priceTarget * drift * rand(0.99, 1.01));
    });
  };

  // ============================================================
  // BANKRUPTCY
  // ============================================================

  MarketEngine.prototype._checkBankruptcies = function () {
    var self = this;
    self.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      if (c.bankruptcyRisk > 0.85 && Math.random() < 0.15) {
        // Fallimento
        c.halted = true;
        c.delisted = true;
        c.price = 0.01;
        c.priceHistory.push(0.01);
        self.newsLog.push({
          week: self.week,
          day: 0,
          events: [{
            ticker: c.ticker,
            news: 'BANCAROTTA: ' + c.name + ' dichiara fallimento — azioni a zero',
            impact: -1
          }]
        });
      }
    });
  };

  // ============================================================
  // OPZIONI
  // ============================================================

  MarketEngine.prototype._getEligibleOptionsCompanies = function () {
    // 20 società principali per opzioni (blue chips + large mid)
    return this.companies
      .filter(function (c) { return !c.halted && !c.delisted && c.price >= 10; })
      .sort(function (a, b) { return b.marketCap - a.marketCap; })
      .slice(0, 20);
  };

  MarketEngine.prototype.getOptionChain = function (ticker) {
    var c = this.companiesByTicker[ticker];
    if (!c || c.halted || c.delisted) return [];
    if (c.price < 10) return []; // solo società >= €10

    var strikes = [];
    var currentPrice = c.price;
    // Strike prices: -20%, -10%, -5%, ATM, +5%, +10%, +20%
    var multipliers = [0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20];
    multipliers.forEach(function (m) {
      strikes.push(round2(currentPrice * m));
    });

    var expiries = [4, 8, 12]; // settimane
    var chain = [];

    strikes.forEach(function (strike) {
      expiries.forEach(function (exp) {
        var T = exp / 52; // in anni
        var sigma = c.volatility * Math.sqrt(252); // annualized
        var callPremium = round2(blackScholesSimple('call', currentPrice, strike, T, sigma, this.riskFreeRate));
        var putPremium = round2(blackScholesSimple('put', currentPrice, strike, T, sigma, this.riskFreeRate));

        chain.push({
          type: 'call',
          ticker: ticker,
          strike: strike,
          expiryWeek: this.week + exp,
          expiryIn: exp,
          premium: Math.max(0.01, callPremium),
          impliedVolatility: round4(sigma),
          intrinsicValue: Math.max(0, currentPrice - strike),
          timeValue: round2(Math.max(0, callPremium - Math.max(0, currentPrice - strike)))
        });
        chain.push({
          type: 'put',
          ticker: ticker,
          strike: strike,
          expiryWeek: this.week + exp,
          expiryIn: exp,
          premium: Math.max(0.01, putPremium),
          impliedVolatility: round4(sigma),
          intrinsicValue: Math.max(0, strike - currentPrice),
          timeValue: round2(Math.max(0, putPremium - Math.max(0, strike - currentPrice)))
        });
      }, this);
    }, this);

    return chain;
  };

  MarketEngine.prototype.buyOption = function (type, ticker, strike, expiryWeek, contracts) {
    var self = this;
    if (!self.unlocks.options) return { success: false, error: 'Opzioni non ancora sbloccate (richiede settimana 5+)' };

    var c = self.companiesByTicker[ticker];
    if (!c || c.halted || c.delisted) return { success: false, error: 'Società non trovata o sospesa' };
    if (c.price < 10) return { success: false, error: 'Opzioni non disponibili per questa società' };

    contracts = contracts || 1;
    var T = (expiryWeek - self.week) / 52;
    if (T <= 0) return { success: false, error: 'Opzione scaduta' };

    var sigma = c.volatility * Math.sqrt(252);
    var premium = round2(blackScholesSimple(type, c.price, strike, T, sigma, self.riskFreeRate));
    var totalCost = premium * 100 * contracts;

    var option = createOption({
      type: type,
      ticker: ticker,
      strike: strike,
      expiryWeek: expiryWeek,
      premium: premium,
      contracts: contracts,
      cost: totalCost,
      createdAt: self.week,
      impliedVolatility: round4(sigma)
    });

    calcGreeks(option, c.price, T);
    self.options.push(option);

    return {
      success: true,
      option: option,
      totalCost: totalCost,
      premiumPerShare: premium
    };
  };

  MarketEngine.prototype.sellOption = function (optionId) {
    var self = this;
    var option = self.options.find(function (o) { return o.id === optionId; });
    if (!option || option.status !== 'open') return { success: false, error: 'Opzione non trovata o non aperta' };

    var c = self.companiesByTicker[option.ticker];
    if (!c) return { success: false, error: 'Società non trovata' };

    var T = (option.expiryWeek - self.week) / 52;
    var currentPremium = round2(blackScholesSimple(option.type, c.price, option.strike, T, option.impliedVolatility, self.riskFreeRate));
    var proceeds = currentPremium * 100 * option.contracts;

    option.status = 'sold';
    option.soldAt = self.week;
    option.soldPremium = currentPremium;

    return {
      success: true,
      proceeds: proceeds,
      premiumReceived: currentPremium,
      pnl: round2(proceeds - option.cost)
    };
  };

  MarketEngine.prototype.exerciseOption = function (optionId) {
    var self = this;
    var option = self.options.find(function (o) { return o.id === optionId; });
    if (!option || option.status !== 'open') return { success: false, error: 'Opzione non trovata o non aperta' };

    var c = self.companiesByTicker[option.ticker];
    if (!c) return { success: false, error: 'Società non trovata' };

    var intrinsicValue = option.type === 'call'
      ? Math.max(0, c.price - option.strike)
      : Math.max(0, option.strike - c.price);

    var totalValue = intrinsicValue * 100 * option.contracts;
    option.status = 'exercised';
    option.soldAt = self.week;

    return {
      success: true,
      intrinsicValue: intrinsicValue,
      totalValue: totalValue,
      pnl: round2(totalValue - option.cost)
    };
  };

  MarketEngine.prototype._expireOptions = function () {
    var self = this;
    self.options.forEach(function (o) {
      if (o.status !== 'open') return;
      if (self.week >= o.expiryWeek) {
        var c = self.companiesByTicker[o.ticker];
        if (!c) {
          o.status = 'expired';
          return;
        }
        var intrinsicValue = o.type === 'call'
          ? Math.max(0, c.price - o.strike)
          : Math.max(0, o.strike - c.price);
        o.status = 'expired';
        o.pnl = round2(intrinsicValue * 100 * o.contracts - o.cost);
      }
    });
  };

  MarketEngine.prototype._updateOptions = function () {
    var self = this;
    self.options.forEach(function (o) {
      if (o.status !== 'open') return;
      var c = self.companiesByTicker[o.ticker];
      if (!c) return;
      var T = (o.expiryWeek - self.week) / 52;
      if (T <= 0) return;
      calcGreeks(o, c.price, T);
    });
  };

  MarketEngine.prototype.getOptionsForTicker = function (ticker) {
    return this.options.filter(function (o) { return o.ticker === ticker && o.status === 'open'; });
  };

  MarketEngine.prototype.getAllOpenOptions = function () {
    return this.options.filter(function (o) { return o.status === 'open'; });
  };

  MarketEngine.prototype.getOptionsSummary = function () {
    var open = this.options.filter(function (o) { return o.status === 'open'; });
    var totalCost = 0;
    var totalValue = 0;
    open.forEach(function (o) {
      totalCost += o.cost;
      var c = this.companiesByTicker[o.ticker];
      if (c) {
        var T = (o.expiryWeek - this.week) / 52;
        if (T > 0) {
          var val = blackScholesSimple(o.type, c.price, o.strike, T, o.impliedVolatility, this.riskFreeRate);
          totalValue += val * 100 * o.contracts;
        }
      }
    }, this);
    return {
      openCount: open.length,
      totalCost: round2(totalCost),
      currentValue: round2(totalValue),
      unrealizedPnL: round2(totalValue - totalCost)
    };
  };

  // ============================================================
  // API PUBBLICA
  // ============================================================

  MarketEngine.prototype.getCompany = function (ticker) {
    return this.companiesByTicker[ticker];
  };

  MarketEngine.prototype.getCompanyById = function (id) {
    return this.companiesById[id];
  };

  MarketEngine.prototype.getAllCompanies = function () {
    return this.companies.filter(function (c) { return !c.delisted; });
  };

  MarketEngine.prototype.getCompaniesBySector = function (sectorKey) {
    return this.companies.filter(function (c) { return c.sector === sectorKey && !c.delisted; });
  };

  MarketEngine.prototype.getPennyStocks = function () {
    return this.companies.filter(function (c) { return c.isPenny && !c.delisted; });
  };

  MarketEngine.prototype.getBlueChips = function () {
    return this.companies.filter(function (c) { return c.isBlueChip && !c.delisted; });
  };

  MarketEngine.prototype.getMarketSummary = function () {
    var advancers = 0, decliners = 0, unchanged = 0;
    this.companies.forEach(function (c) {
      if (c.halted || c.delisted) return;
      if (c.price > c.prevClose) advancers++;
      else if (c.price < c.prevClose) decliners++;
      else unchanged++;
    });

    var topGainers = this.companies
      .filter(function (c) { return !c.halted && !c.delisted; })
      .map(function (c) { return { ticker: c.ticker, name: c.name, change: (c.price - c.prevClose) / c.prevClose, price: c.price }; })
      .sort(function (a, b) { return b.change - a.change; })
      .slice(0, 5);

    var topLosers = this.companies
      .filter(function (c) { return !c.halted && !c.delisted; })
      .map(function (c) { return { ticker: c.ticker, name: c.name, change: (c.price - c.prevClose) / c.prevClose, price: c.price }; })
      .sort(function (a, b) { return a.change - b.change; })
      .slice(0, 5);

    return {
      week: this.week,
      day: this.day,
      marketIndex: this.marketIndex,
      marketTrend: this.marketTrend,
      fearGreedIndex: this.fearGreedIndex,
      fearGreedLabel: this._fearGreedLabel(),
      advancers: advancers,
      decliners: decliners,
      unchanged: unchanged,
      totalCompanies: this.companies.filter(function (c) { return !c.delisted; }).length,
      topGainers: topGainers,
      topLosers: topLosers,
      activeEvents: this.activeEvents.map(function (e) {
        return { label: e.label, remaining: e.remaining, sectorsAffected: e.sectorsAffected };
      })
    };
  };

  MarketEngine.prototype._fearGreedLabel = function () {
    var v = this.fearGreedIndex;
    if (v < 20) return 'Extreme Fear';
    if (v < 40) return 'Fear';
    if (v < 60) return 'Neutral';
    if (v < 80) return 'Greed';
    return 'Extreme Greed';
  };

  MarketEngine.prototype.getSectorSummary = function () {
    var self = this;
    return SECTOR_KEYS.map(function (key) {
      var s = self.sectors[key];
      var companies = self.companies.filter(function (c) { return c.sector === key && !c.delisted; });
      var avgPrice = 0;
      companies.forEach(function (c) { avgPrice += c.price; });
      avgPrice = companies.length > 0 ? round2(avgPrice / companies.length) : 0;

      return {
        key: key,
        name: s.name,
        cyclePhase: s.cyclePhase,
        cycleProgress: s.cycleProgress,
        favorability: round2(s.favorability),
        volatility: s.volatility,
        avgPE: s.avgPE,
        companyCount: companies.length,
        avgPrice: avgPrice
      };
    });
  };

  MarketEngine.prototype.getEarningsThisWeek = function () {
    return this.earningsLog.filter(function (e) { return e.week === this.week; }, this);
  };

  MarketEngine.prototype.getRecentNews = function (count) {
    count = count || 10;
    var allNews = [];
    this.newsLog.slice(-count).forEach(function (entry) {
      entry.events.forEach(function (ev) {
        allNews.push({
          week: entry.week,
          day: entry.day,
          ticker: ev.ticker,
          news: ev.news,
          impact: ev.impact
        });
      });
    });
    return allNews.slice(-count);
  };

  MarketEngine.prototype.getRecentIPOs = function (count) {
    count = count || 5;
    return this.ipoLog.slice(-count);
  };

  MarketEngine.prototype.getRecentMA = function (count) {
    count = count || 5;
    return this.maLog.slice(-count);
  };

  MarketEngine.prototype.getCompanyDetail = function (ticker) {
    var c = this.companiesByTicker[ticker];
    if (!c) return null;

    return {
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      sector: c.sector,
      sectorName: this.sectors[c.sector].name,
      tier: c.tier,
      isPenny: c.isPenny,
      isBlueChip: c.isBlueChip,
      price: c.price,
      prevClose: c.prevClose,
      change: round2(c.price - c.prevClose),
      changePercent: round4((c.price - c.prevClose) / c.prevClose),
      dayHigh: c.dayHigh,
      dayLow: c.dayLow,
      weekHigh52: c.weekHigh52,
      weekLow52: c.weekLow52,
      marketCap: c.marketCap,
      sharesOutstanding: c.sharesOutstanding,
      float: c.float,
      volumeToday: c.volumeToday,
      avgVolume: c.avgVolume,
      volatility: c.volatility,
      dividendYield: c.dividendYield,
      dividendPerShare: c.dividendPerShare,
      peRatio: c.peRatio,
      beta: c.beta,
      rsi: c.rsi,
      momentum: c.momentum,
      analystRating: c.analystRating,
      priceTarget: c.priceTarget,
      shortInterest: c.shortInterest,
      shortBorrowCost: c.shortBorrowCost,
      shortSqueezeRisk: c.shortSqueezeRisk,
      bankruptcyRisk: c.bankruptcyRisk,
      isIPO: c.isIPO,
      ipoWeek: c.isIPO ? this.week - c.ipoWeek : 0,
      maStatus: c.maStatus,
      maPremium: c.maPremium,
      tags: c.tags,
      fundamentals: {
        revenue: c.fundamentals.revenue,
        profit: c.fundamentals.profit,
        debt: c.fundamentals.debt,
        growthRate: c.fundamentals.growthRate,
        eps: c.fundamentals.eps,
        bookValue: c.fundamentals.bookValue,
        cashFlow: c.fundamentals.cashFlow,
        roe: c.fundamentals.roe,
        debtToEquity: c.fundamentals.debtToEquity,
        profitMargin: c.fundamentals.profitMargin
      },
      earningsHistory: c.earningsHistory.slice(-4),
      dividendHistory: c.dividendHistory.slice(-4),
      priceHistory: c.priceHistory.slice(-30)
    };
  };

  MarketEngine.prototype.getMacroEvents = function () {
    return this.macroEvents.slice(-20);
  };

  MarketEngine.prototype.getActiveEvents = function () {
    return this.activeEvents;
  };

  MarketEngine.prototype.getDividendsThisWeek = function () {
    return this.dividendsPaidThisWeek;
  };

  MarketEngine.prototype.getState = function () {
    return {
      week: this.week,
      day: this.day,
      marketIndex: this.marketIndex,
      marketTrend: this.marketTrend,
      fearGreedIndex: this.fearGreedIndex,
      sectors: this.sectors,
      activeEvents: this.activeEvents,
      totalCompanies: this.companies.filter(function (c) { return !c.delisted; }).length,
      totalDelisted: this.companies.filter(function (c) { return c.delisted; }).length,
      totalIPOs: this.ipoLog.length,
      totalMAs: this.maLog.length,
      optionsUnlocked: this.unlocks.options,
      openOptions: this.options.filter(function (o) { return o.status === 'open'; }).length
    };
  };

  // Export
  return MarketEngine;
}));