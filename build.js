#!/usr/bin/env node
/**
 * Build system per Wolf of Wall Street - Broker Tycoon.
 *
 * Obiettivi:
 *  1. Assemblare index.html + moduli JS in un unico file HTML giocabile.
 *  2. Traspilare ES6+ -> ES5 tramite Babel per massima compatibilita'.
 *  3. Validare che l'output finale rispetti i vincoli ES5 del progetto.
 *  4. Rimuovere riferimenti a <script> nei commenti JS per non rompere l'HTML.
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const BASE = __dirname;
const OUT_FILE = path.join(BASE, 'wolf-broker-tycoon.html');

const MODULE_FILES = [
  'market-engine.js',
  'game-engine.js',
  'ui-bridge.js',
  'ui-engine.js',
  'story-engine.js',
  'llm-news-engine.js',
  'llm-game-master.js',
  'llm-narrative-engine.js',
  'competitor-engine.js',
  'world-engine.js',
  'corporate-lifecycle.js',
  'broker-story.js',
  'player-life.js',
  'brokerage-career.js',
  'stakeholder-interactions.js',
  'immersive-engine.js',
  'immersive-ui.js',
];

function readFile(name) {
  return fs.readFileSync(path.join(BASE, name), 'utf8');
}

function writeFile(name, content) {
  fs.writeFileSync(path.join(BASE, name), content, 'utf8');
}

function cleanScriptTags(js) {
  js = js.replace(/<script[^\u003e]*>/gi, 'SCRIPT_TAG');
  js = js.replace(/<\/script>/gi, 'SCRIPT_CLOSE');
  return js;
}

function transpileWithBabel(jsCode) {
  const result = babel.transformSync(jsCode, {
    configFile: path.join(BASE, 'babel.config.json'),
    filename: 'bundle.js',
  });
  if (!result || !result.code) {
    throw new Error('Babel non ha prodotto codice');
  }
  return result.code;
}

function stripStringsAndComments(jsCode) {
  // Rimuove stringhe tra apici singoli/doppi e commenti // e /* */.
  // Preserva la struttura per l'analisi delle keyword.
  var stripped = jsCode;
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, ' ');
  stripped = stripped.replace(/\/\/.*$/gm, ' ');
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, ' ');
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, ' ');
  return stripped;
}

function validateES5(jsCode) {
  const errors = [];
  const code = stripStringsAndComments(jsCode);
  const keywords = [
    { name: 'const', regex: /\bconst\b/g },
    { name: 'let', regex: /\blet\b/g },
    { name: 'class', regex: /\bclass\b/g },
    { name: 'async', regex: /\basync\b/g },
    { name: 'await', regex: /\bawait\b/g },
  ];
  for (const kw of keywords) {
    const matches = code.match(kw.regex);
    if (matches && matches.length > 0) {
      errors.push('Trovate ' + matches.length + ' occorrenze reali di "' + kw.name + '"');
    }
  }
  if (/`/.test(code)) {
    errors.push('Trovati template literals residui (backtick)');
  }
  if (/\)\s*=>/.test(code)) {
    errors.push('Trovate arrow functions');
  }
  if (/\bfor\s*\(\s*var\s+\w+\s+of\s+/.test(code)) {
    errors.push('Trovati cicli for-of');
  }
  return errors;
}

function buildIntegrationJS() {
  return [
    "function wolfStartGame(){",
    "  document.getElementById('wolfTitleScreen').classList.add('hide');",
    "  setTimeout(function(){document.getElementById('wolfTitleScreen').style.display='none'},600);",
    "  if(typeof newGame==='function') newGame();",
    "  syncWolfBottomNav('dashboard');",
    "}",
    "function wolfLoadGame(){",
    "  if(typeof loadAuto==='function' && loadAuto()){",
    "    document.getElementById('wolfTitleScreen').classList.add('hide');",
    "    setTimeout(function(){document.getElementById('wolfTitleScreen').style.display='none'},600);",
    "    if(typeof renderAll==='function') renderAll();",
    "    syncWolfBottomNav('dashboard');",
    "  }",
    "}",
    "function syncWolfBottomNav(view){",
    "  var btns = document.querySelectorAll('#bottomNav button');",
    "  for(var i=0;i<btns.length;i++){ btns[i].classList.remove('active'); }",
    "  var map = {dashboard:0, market:1, portfolio:2, brokerage:3};",
    "  var idx = map[view];",
    "  if(typeof idx==='number' && btns[idx]) btns[idx].classList.add('active');",
    "}",
    "function wolfSwitchView(v){",
    "  if(typeof switchView==='function'){ switchView(v); syncWolfBottomNav(v); return; }",
    "  var views = document.querySelectorAll('.view');",
    "  for(var i=0;i<views.length;i++){ views[i].classList.remove('active'); }",
    "  var el = document.getElementById('view-'+v);",
    "  if(el) el.classList.add('active');",
    "  syncWolfBottomNav(v);",
    "}",
    "function toggleMobileMoreMenu(){",
    "  var m = document.getElementById('mobileMoreMenu');",
    "  if(m) m.style.display = (m.style.display==='block') ? 'none' : 'block';",
    "}",
    "try{",
    "  var hasSave=false;",
    "  for(var i=1;i<=5;i++){ if(localStorage.getItem('sbt_save_'+i)){ hasSave=true; break; } }",
    "  if(localStorage.getItem('sbt_autosave')) hasSave=true;",
    "  if(hasSave) document.getElementById('wolfLoadBtn').disabled=false;",
    "}catch(e){}",
    "if(typeof LLMNewsEngine!=='undefined' && LLMNewsEngine.configure){ LLMNewsEngine.configure({model:'glm-5.2',enabled:false}); }",
    "if(typeof LLMGameMaster!=='undefined' && LLMGameMaster.configure){ LLMGameMaster.configure({model:'glm-5.2',enabled:false}); }",
    "if(typeof CompetitorEngine!=='undefined'){",
    "  try{",
    "    window._competitorEngine = new CompetitorEngine();",
    "    var _md = {",
    "      stocks: (typeof G!=='undefined' && G && G.companies) ? G.companies.map(function(c){ return {symbol:c.ticker,price:c.price,sector:c.sector,volume:c.vol||0,avgVolume:1000000,change:c.change||0}; }) : [],",
    "      currentWeek: (typeof G!=='undefined' && G) ? G.week : 1",
    "    };",
    "    window._competitorEngine.init(_md);",
    "  }catch(e){}",
    "}",
    "// Integrazione con UI bridge (se presente) o wrapping legacy",
    "if(typeof wolfBridge !== 'undefined' && wolfBridge.getEngine){",
    "  var _engine = wolfBridge.getEngine();",
    "  _engine.on('weekAdvanced', function(){",
    "    if(window._competitorEngine){",
    "      try{",
    "        window._competitorEngine.setMarketData({",
    "          stocks: (typeof G!=='undefined' && G && G.companies) ? G.companies.map(function(c){ return {symbol:c.ticker,price:c.price,sector:c.sector,volume:c.vol||0,avgVolume:1000000,change:c.change||0}; }) : [],",
    "          currentWeek: G ? G.week : 1",
    "        });",
    "        window._competitorEngine.setPlayerData(",
    "          (typeof positions!=='undefined') ? Object.keys(positions).map(function(k){ return {symbol:k,shares:positions[k].shares}; }) : [],",
    "          (typeof cash!=='undefined') ? cash : 10000,",
    "          (typeof G!=='undefined' && G) ? G.rep || 50 : 50,",
    "          (typeof G!=='undefined' && G) ? G.xp || 0 : 0",
    "        );",
    "      }catch(e){}",
    "    }",
    "    if(typeof LLMNewsEngine!=='undefined' && LLMNewsEngine.processNewsTurn){",
    "      var gs = {",
    "        week: (typeof G!=='undefined' && G) ? G.week : 1,",
    "        cash: (typeof cash!=='undefined') ? cash : 10000,",
    "        level: (typeof G!=='undefined' && G) ? G.level || 1 : 1,",
    "        portfolio: (typeof positions!=='undefined') ? positions : {},",
    "        companies: (typeof G!=='undefined' && G && G.companies) ? G.companies : []",
    "      };",
    "      LLMNewsEngine.processNewsTurn(gs).then(function(r){",
    "        if(r && r.length>0 && typeof addNews==='function'){",
    "          for(var i=0;i<r.length;i++){ addNews(r[i].title, r[i].impact, r[i].content); }",
    "        }",
    "      }).catch(function(){});",
    "    }",
    "  });",
    "} else if(typeof advanceTurn!=='undefined'){",
    "  var _origAdvance = advanceTurn;",
    "  window.advanceTurn = function(){",
    "    var result = _origAdvance();",
    "    if(window._competitorEngine){",
    "      try{",
    "        window._competitorEngine.setMarketData({",
    "          stocks: (typeof G!=='undefined' && G && G.companies) ? G.companies.map(function(c){ return {symbol:c.ticker,price:c.price,sector:c.sector,volume:c.vol||0,avgVolume:1000000,change:c.change||0}; }) : [],",
    "          currentWeek: G ? G.week : 1",
    "        });",
    "        window._competitorEngine.setPlayerData(",
    "          (typeof positions!=='undefined') ? Object.keys(positions).map(function(k){ return {symbol:k,shares:positions[k].shares}; }) : [],",
    "          (typeof cash!=='undefined') ? cash : 10000,",
    "          (typeof G!=='undefined' && G) ? G.rep || 50 : 50,",
    "          (typeof G!=='undefined' && G) ? G.xp || 0 : 0",
    "        );",
    "      }catch(e){}",
    "    }",
    "    if(typeof LLMNewsEngine!=='undefined' && LLMNewsEngine.processNewsTurn){",
    "      var gs = {",
    "        week: (typeof G!=='undefined' && G) ? G.week : 1,",
    "        cash: (typeof cash!=='undefined') ? cash : 10000,",
    "        level: (typeof G!=='undefined' && G) ? G.level || 1 : 1,",
    "        portfolio: (typeof positions!=='undefined') ? positions : {},",
    "        companies: (typeof G!=='undefined' && G && G.companies) ? G.companies : []",
    "      };",
    "      LLMNewsEngine.processNewsTurn(gs).then(function(r){",
    "        if(r && r.length>0 && typeof addNews==='function'){",
    "          for(var i=0;i<r.length;i++){ addNews(r[i].title, r[i].impact, r[i].content); }",
    "        }",
    "      }).catch(function(){});",
    "    }",
    "    return result;",
    "  };",
    "}",
    "// Attiva UI bridge come ultimo passo per sovrascrivere le funzioni legacy",
    "if(typeof wolfBridgeInstall === 'function'){ wolfBridgeInstall(); }",
    "// Installa Immersive Core sul vero GameEngine dopo il bridge e la carriera",
    "if(typeof ImmersiveEngine!=='undefined' && typeof wolfBridge!=='undefined' && wolfBridge.getEngine){ ImmersiveEngine.install(wolfBridge.getEngine()); }",
    "if(typeof ImmersiveUI!=='undefined' && typeof ImmersiveEngine!=='undefined'){ ImmersiveUI.install(ImmersiveEngine); }",
    "// Ripristina wrapper del bridge per funzioni di trading sovrascritte da index.html inline",
    "if(typeof wolfBridge !== 'undefined' && wolfBridge.wrappers){",
    "  if(wolfBridge.wrappers.executeTrade) window.executeTrade = wolfBridge.wrappers.executeTrade;",
    "  if(wolfBridge.wrappers.executeShort) window.executeShort = wolfBridge.wrappers.executeShort;",
    "  if(wolfBridge.wrappers.coverShort) window.coverShort = wolfBridge.wrappers.coverShort;",
    "}",
  ].join('\n');
}

function buildHTML() {
  console.log('=== Wolf of Wall Street - Broker Tycoon Build ===');

  // 1. Leggi index.html originale
  const htmlOrig = readFile('index.html');

  // Estrai CSS
  const cssMatch = htmlOrig.match(/<style>([\s\S]*?)<\/style>/);
  const origCss = cssMatch ? cssMatch[1] : '';

  // Estrai body senza script
  const bodyMatch = htmlOrig.match(/<body>([\s\S]*)<\/body>/);
  const origBody = bodyMatch ? bodyMatch[1] : '';
  const origBodyNoJs = origBody.replace(/<script[^\u003e]*>[\s\S]*?<\/script>/g, '');

  // Estrai JS inline del gioco originale
  const scriptMatches = [...origBody.matchAll(/<script[^\u003e]*>([\s\S]*?)<\/script>/g)];
  const gameOrigJs = scriptMatches
    .map(function(m) { return m[1]; })
    .filter(function(s) { return s.length > 100; })
    .join('\n');

  // 2. CSS aggiuntivi
  const mobileCss = '@media (max-width:1024px){.grid-2{grid-template-columns:1fr!important}.grid-3{grid-template-columns:1fr 1fr!important}.kpi-row{grid-template-columns:repeat(3,1fr)!important}.main{padding:10px}.news-feed{max-height:300px}}@media (max-width:640px){*{touch-action:manipulation;-webkit-tap-highlight-color:transparent}body{font-size:13px;padding-bottom:60px;padding-top:env(safe-area-inset-top)}.topbar{flex-wrap:wrap;height:auto!important;padding:6px 10px;gap:6px}.topbar .logo{font-size:15px}.cash-display{gap:8px;flex-wrap:wrap;margin-left:0;width:100%;justify-content:flex-end}.stat-mini .val{font-size:12px}.stat-mini .label{font-size:9px}.week-display{padding:4px 8px}.week-display .wk{font-size:14px}.btn-advance{padding:6px 14px;font-size:12px}.lvl-badge{font-size:10px;padding:3px 8px}.nav{display:none!important}.main{padding:8px;padding-bottom:70px}.kpi-row{grid-template-columns:1fr 1fr!important;gap:6px}.kpi{padding:8px}.kpi .val{font-size:15px}.kpi .label{font-size:9px}.grid-2,.grid-3{grid-template-columns:1fr!important}.card{padding:10px;margin-bottom:8px}.card h3{font-size:11px}table{font-size:12px;display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap}th,td{padding:6px 8px}.section-filter button{padding:3px 8px;font-size:10px}.search-box{width:100%;margin-bottom:6px}.chart-container canvas{max-height:180px!important}.chart-container{padding:8px}.modal{max-width:100%!important;width:100%!important;max-height:100vh!important;border-radius:0!important}.modal-overlay{padding:0!important}.modal-body{padding:12px!important}.modal-header{padding:10px 12px!important}.trade-row input,.trade-row select{min-height:44px;font-size:15px}.trade-actions button{min-height:44px}.btn{min-height:40px;padding:8px 14px}.btn-sm{min-height:36px}.news-feed{max-height:250px}.news-item{padding:6px 8px}.career-track{flex-wrap:wrap;gap:4px}.career-step{flex:1 1 30%;font-size:10px;padding:6px 2px}.career-step .cs-name{font-size:10px}.career-stats{grid-template-columns:1fr}.ticker-bar{height:22px}.ticker-content{animation-duration:90s;font-size:11px}.ticker-item{font-size:11px}.assembly-card{padding:10px}.proposal-item{padding:8px}.save-slot{padding:8px;flex-direction:column;gap:6px;align-items:flex-start}#wolfTitleScreen{padding:20px}.wolf-title{font-size:28px!important}.wolf-subtitle{font-size:13px!important;margin-bottom:24px}.wolf-btn{width:100%;padding:12px;font-size:16px}.bottom-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:var(--bg2);border-top:1px solid var(--border);height:56px;z-index:50;padding-bottom:env(safe-area-inset-bottom)}.bottom-nav button{flex:1;background:none;border:none;color:var(--text2);font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;min-height:44px}.bottom-nav button.active{color:var(--blue)}.bottom-nav button .bn-label{font-size:9px}}.bottom-nav{display:none}@media (prefers-reduced-motion:reduce){.ticker-content{animation:none!important}*{transition:none!important;animation:none!important}}';

  const titleCss = '#wolfTitleScreen{position:fixed;inset:0;background:radial-gradient(ellipse at center,#1a1a2e 0%,#0a0a0a 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .6s}#wolfTitleScreen.hide{opacity:0;pointer-events:none}.wolf-title{font-size:clamp(28px,6vw,64px);font-weight:900;color:#d4af37;text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(212,175,55,.4);margin-bottom:8px}.wolf-subtitle{font-size:clamp(14px,2.5vw,20px);color:#8a96b0;text-align:center;margin-bottom:40px;letter-spacing:3px}.wolf-btn{padding:14px 48px;font-size:18px;font-weight:700;border:none;border-radius:8px;cursor:pointer;margin:6px;transition:transform .15s,box-shadow .2s}.wolf-btn-new{background:linear-gradient(135deg,#d4af37,#b5832a);color:#000;box-shadow:0 4px 20px rgba(212,175,55,.3)}.wolf-btn-new:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(212,175,55,.5)}.wolf-btn-load{background:linear-gradient(135deg,#1e2740,#161d2e);color:#d4af37;border:1px solid #d4af33}.wolf-btn-load:hover{transform:translateY(-2px)}.wolf-btn-load:disabled{opacity:.3;cursor:not-allowed;transform:none}.wolf-credits{position:absolute;bottom:20px;font-size:11px;color:#555}#mobileMoreMenu{display:none;position:fixed;bottom:56px;left:0;right:0;background:var(--bg2);border-top:1px solid var(--border);padding:10px;z-index:49}#mobileMoreMenu button{margin-bottom:6px}';

  // 3. HTML per titolo e bottom nav
  const titleHtml = "<div id=\"wolfTitleScreen\"><div class=\"wolf-title\">🐺 WOLF OF WALL STREET</div><div class=\"wolf-subtitle\">B R O K E R &nbsp; T Y C O O N</div><button class=\"wolf-btn wolf-btn-new\" onclick=\"wolfStartGame()\">NUOVA PARTITA</button><button class=\"wolf-btn wolf-btn-load\" id=\"wolfLoadBtn\" onclick=\"wolfLoadGame()\" disabled>CARICA</button><div class=\"wolf-credits\">Un gioco di trading, potere e redenzione · 2026</div></div>";

  const bottomNav = "<nav class=\"bottom-nav\" id=\"bottomNav\"><button onclick=\"wolfSwitchView('dashboard')\" class=\"active\">📊<span class=\"bn-label\">Dashboard</span></button><button onclick=\"wolfSwitchView('market')\">📈<span class=\"bn-label\">Mercato</span></button><button onclick=\"wolfSwitchView('portfolio')\">💼<span class=\"bn-label\">Portafoglio</span></button><button onclick=\"wolfSwitchView('brokerage')\">🏦<span class=\"bn-label\">Societa</span></button><button onclick=\"toggleMobileMoreMenu()\">⋮<span class=\"bn-label\">Altro</span></button></nav><div id=\"mobileMoreMenu\"><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('assembly');toggleMobileMoreMenu()\">🏛️ Assemblee</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('news');toggleMobileMoreMenu()\">📰 Notizie</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('narrative');toggleMobileMoreMenu()\">📖 Diario</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('transactions');toggleMobileMoreMenu()\">📋 Transazioni</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('career');toggleMobileMoreMenu()\">🎯 Carriera</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px\" onclick=\"wolfSwitchView('save');toggleMobileMoreMenu()\">💾 Salvataggio</button><button class=\"btn\" style=\"display:block;width:100%;text-align:left;min-height:44px\" onclick=\"wolfSwitchView('settings');toggleMobileMoreMenu()\">⚙️ Impostazioni</button></div>";
  // 4. Processa tutti i moduli JS
  const modules = [];
  for (const fname of MODULE_FILES) {
    let js = readFile(fname);
    js = cleanScriptTags(js);
    modules.push(js);
    console.log('  read: ' + fname);
  }

  // 5. Assembla tutto il JS
  const integrationJs = buildIntegrationJS();
  const rawJs = modules.concat([gameOrigJs, integrationJs]).join('\n');

  console.log('\n  transpiling with Babel...');
  const transpiledJs = transpileWithBabel(rawJs);
  console.log('  transpiled length: ' + transpiledJs.length);

  // 6. Validazione ES5
  console.log('  validating ES5 output...');
  const errors = validateES5(transpiledJs);
  if (errors.length > 0) {
    console.log('  VALIDATION ERRORS:');
    for (const err of errors) {
      console.log('    - ' + err);
    }
    throw new Error('Build validation failed');
  } else {
    console.log('  ES5 validation: OK');
  }

  // 7. Statistiche
  const backticks = (transpiledJs.match(/`/g) || []).length;
  const bracesDiff = (transpiledJs.match(/{/g) || []).length - (transpiledJs.match(/}/g) || []).length;
  const parensDiff = (transpiledJs.match(/\(/g) || []).length - (transpiledJs.match(/\)/g) || []).length;
  console.log('  JS stats:');
  console.log('    backticks: ' + backticks);
  console.log('    braces diff: ' + bracesDiff);
  console.log('    parens diff: ' + parensDiff);

  // 8. Assembla HTML
  const cdnScript = '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>';
  const styleBlock = '<style>\n' + origCss + '\n' + mobileCss + '\n' + titleCss + '\n</style>';

  const htmlFinal = [
    '<!DOCTYPE html>',
    '<html lang="it">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">',
    '<title>🐺 Wolf of Wall Street — Broker Tycoon</title>',
    cdnScript,
    styleBlock,
    '</head>',
    '<body>',
    titleHtml,
    bottomNav,
    origBodyNoJs,
    '<script>',
    transpiledJs,
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');

  // 9. Verifica tag script
  const scriptOpens = (htmlFinal.match(/<script[^\u003e]*>/g) || []).length;
  const scriptCloses = (htmlFinal.match(/<\/script>/g) || []).length;
  console.log('\n  HTML validation:');
  console.log('    script opens: ' + scriptOpens);
  console.log('    script closes: ' + scriptCloses);

  // 10. Verifica no code leak outside script
  const parts = htmlFinal.split('<script>');
  let outside = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const sub = parts[i].split('</script>');
    if (sub.length > 1) {
      outside += sub.slice(1).join('</script>');
    }
  }
  const leakMarkers = ['LLM NEWS', 'COMPETITOR', 'window.MarketEngine', 'window.LLMNewsEngine', 'window.CompetitorEngine', 'function wolfStartGame'];
  const leak = leakMarkers.some(function(marker) { return outside.indexOf(marker) >= 0; });
  console.log('    code leak outside script: ' + (leak ? 'YES' : 'NO'));

  // 11. Scrivi file
  writeFile('wolf-broker-tycoon.html', htmlFinal);

  // 12. Copia opzionale per sviluppo locale
  const dropboxDir = path.join(require('os').homedir(), 'Dropbox');
  if (fs.existsSync(dropboxDir)) {
    const dropboxPath = path.join(dropboxDir, 'wolf-broker-tycoon.html');
    fs.copyFileSync(OUT_FILE, dropboxPath);
    console.log('Local copy: ' + dropboxPath);
  }

  const size = fs.statSync(OUT_FILE).size;
  const lines = htmlFinal.split('\n').length;
  console.log('\nDONE: ' + size + ' bytes (' + Math.floor(size / 1024) + 'KB), ' + lines + ' lines');
}

try {
  buildHTML();
} catch (e) {
  console.error('BUILD FAILED: ' + e.message);
  process.exit(1);
}
