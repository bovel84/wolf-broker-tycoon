#!/usr/bin/env node
/**
 * Build system for Wolf of Wall Street - Broker Tycoon.
 * Assembles the source modules and the legacy inline game into one ES5 HTML file.
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
  'brokerage-management.js',
  'stakeholder-interactions.js',
  'immersive-engine.js',
  'immersive-ui.js'
];

function readFile(name) {
  return fs.readFileSync(path.join(BASE, name), 'utf8');
}

function cleanScriptTags(js) {
  return js.replace(/<script[^\u003e]*>/gi, 'SCRIPT_TAG').replace(/<\/script>/gi, 'SCRIPT_CLOSE');
}

function stripStringsAndComments(jsCode) {
  var stripped = jsCode;
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, ' ');
  stripped = stripped.replace(/\/\/.*$/gm, ' ');
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, ' ');
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, ' ');
  return stripped;
}

function validateES5(jsCode) {
  const code = stripStringsAndComments(jsCode);
  const checks = [
    ['const', /\bconst\b/g],
    ['let', /\blet\b/g],
    ['async', /\basync\b/g],
    ['await', /\bawait\b/g],
    ['template literal', /`/g],
    ['arrow function', /\)\s*=>/g],
    ['for-of', /\bfor\s*\(\s*var\s+\w+\s+of\s+/g]
  ];
  const errors = [];
  for (const check of checks) {
    const matches = code.match(check[1]);
    if (matches && matches.length) errors.push(check[0] + ': ' + matches.length);
  }
  return errors;
}

function integrationJS() {
  return [
    "// Navigation functions live in index.html; do not duplicate them in the bundle.",
    "try{var hasSave=!!localStorage.getItem('sbt_autosave');for(var i=1;i<=5;i++)if(localStorage.getItem('sbt_save_'+i))hasSave=true;if(hasSave)document.getElementById('wolfLoadBtn').disabled=false;}catch(e){}",
    "if(typeof LLMNewsEngine!=='undefined'&&LLMNewsEngine.configure)LLMNewsEngine.configure({model:'glm-5.2',enabled:false});",
    "if(typeof LLMGameMaster!=='undefined'&&LLMGameMaster.configure)LLMGameMaster.configure({model:'glm-5.2',enabled:false});",
    "if(typeof CompetitorEngine!=='undefined'){try{window._competitorEngine=new CompetitorEngine();window._competitorEngine.init({stocks:[],currentWeek:1});}catch(e){}}",
    "if(typeof wolfBridgeInstall==='function')wolfBridgeInstall();",
    "if(typeof ImmersiveEngine!=='undefined'&&typeof wolfBridge!=='undefined'&&wolfBridge.getEngine)ImmersiveEngine.install(wolfBridge.getEngine());",
    "if(typeof ImmersiveUI!=='undefined'&&typeof ImmersiveEngine!=='undefined')ImmersiveUI.install(ImmersiveEngine);",
    "if(typeof BrokerageManagement!=='undefined'&&BrokerageManagement.install)BrokerageManagement.install();",
    "(function(){if(typeof newGame!=='function'||typeof ImmersiveEngine==='undefined'||newGame.__immersiveInboxWrapped)return;var previousNewGame=newGame;window.newGame=function(){var result=previousNewGame.apply(this,arguments);var engine=window.wolfBridge&&wolfBridge.getEngine?wolfBridge.getEngine():null;var state=engine&&engine.getState?engine.getState():null;if(state&&ImmersiveEngine.processWeek)ImmersiveEngine.processWeek(state);return result;};window.newGame.__immersiveInboxWrapped=true;}());",
    "if(typeof wolfBridge!=='undefined'&&wolfBridge.wrappers){",
    "  if(wolfBridge.wrappers.executeTrade)window.executeTrade=wolfBridge.wrappers.executeTrade;",
    "  if(wolfBridge.wrappers.executeShort)window.executeShort=wolfBridge.wrappers.executeShort;",
    "  if(wolfBridge.wrappers.coverShort)window.coverShort=wolfBridge.wrappers.coverShort;",
    "}"
  ].join('\n');
}

function buildHTML() {
  console.log('=== Wolf of Wall Street - Broker Tycoon Build ===');
  const htmlOrig = readFile('index.html');
  const cssMatch = htmlOrig.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = htmlOrig.match(/<body>([\s\S]*)<\/body>/);
  const origCss = cssMatch ? cssMatch[1] : '';
  const origBody = bodyMatch ? bodyMatch[1] : '';
  const origBodyNoJs = origBody.replace(/<script[^\u003e]*>[\s\S]*?<\/script>/g, '');
  const scriptMatches = [...origBody.matchAll(/<script[^\u003e]*>([\s\S]*?)<\/script>/g)];
  const gameOrigJs = scriptMatches.map(function (match) { return match[1]; }).filter(function (script) { return script.length > 100; }).join('\n');

  const modules = [];
  for (const fileName of MODULE_FILES) {
    modules.push(cleanScriptTags(readFile(fileName)));
    console.log('  read: ' + fileName);
  }

  const rawJs = modules.concat([gameOrigJs, integrationJS()]).join('\n');
  const transformed = babel.transformSync(rawJs, { configFile: path.join(BASE, 'babel.config.json'), filename: 'bundle.js' });
  if (!transformed || !transformed.code) throw new Error('Babel non ha prodotto codice');
  const errors = validateES5(transformed.code);
  if (errors.length) throw new Error('Build validation failed: ' + errors.join(', '));

  const mobileCss = '@media(max-width:640px){body{padding-bottom:60px}.nav{display:none!important}.main{padding:8px;padding-bottom:70px}.grid-2,.grid-3{grid-template-columns:1fr!important}.bottom-nav{display:flex!important}.card{padding:10px}.btn{min-height:40px}}.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:56px;background:var(--bg2);border-top:1px solid var(--border);z-index:50}.bottom-nav button{flex:1;background:none;border:0;color:var(--text2);display:flex;flex-direction:column;align-items:center;justify-content:center}.bottom-nav button.active{color:var(--blue)}.bn-label{font-size:9px}';
  const titleCss = '#wolfTitleScreen{position:fixed;inset:0;background:radial-gradient(ellipse at center,#1a1a2e 0%,#0a0a0a 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .6s}#wolfTitleScreen.hide{opacity:0;pointer-events:none}.wolf-title{font-size:clamp(28px,6vw,64px);font-weight:900;color:#d4af37}.wolf-subtitle{color:#8a96b0;letter-spacing:3px;margin-bottom:32px}.wolf-btn{padding:14px 40px;margin:6px;border-radius:8px;font-weight:700}.wolf-btn-new{background:#d4af37;color:#000}.wolf-btn-load{background:#161d2e;color:#d4af37}#mobileMoreMenu{display:none;position:fixed;bottom:56px;left:0;right:0;background:var(--bg2);padding:10px;z-index:49}';
  const titleHtml = '<div id="wolfTitleScreen"><div class="wolf-title">🐺 WOLF OF WALL STREET</div><div class="wolf-subtitle">B R O K E R &nbsp; T Y C O O N</div><button class="wolf-btn wolf-btn-new" onclick="wolfStartGame()">NUOVA PARTITA</button><button class="wolf-btn wolf-btn-load" id="wolfLoadBtn" onclick="wolfLoadGame()" disabled>CARICA</button></div>';
  const bottomNav = '<nav class="bottom-nav" id="bottomNav"><button onclick="wolfSwitchView(\'dashboard\')" class="active">📊<span class="bn-label">Dashboard</span></button><button onclick="wolfSwitchView(\'market\')">📈<span class="bn-label">Mercato</span></button><button onclick="wolfSwitchView(\'portfolio\')">💼<span class="bn-label">Portafoglio</span></button><button onclick="wolfSwitchView(\'brokerage\')">🏦<span class="bn-label">Società</span></button><button onclick="toggleMobileMoreMenu()">⋮<span class="bn-label">Altro</span></button></nav><div id="mobileMoreMenu"><button class="btn" onclick="wolfSwitchView(\'assembly\');toggleMobileMoreMenu()">🏛️ Assemblee</button><button class="btn" onclick="wolfSwitchView(\'news\');toggleMobileMoreMenu()">📰 Notizie</button><button class="btn" onclick="wolfSwitchView(\'career\');toggleMobileMoreMenu()">🎯 Carriera</button><button class="btn" onclick="wolfSwitchView(\'save\');toggleMobileMoreMenu()">💾 Salvataggio</button></div>';

  const htmlFinal = [
    '<!DOCTYPE html>',
    '<html lang="it">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">',
    '<title>🐺 Wolf of Wall Street — Broker Tycoon</title>',
    '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>',
    '<style>' + origCss + '\n' + mobileCss + '\n' + titleCss + '</style>',
    '</head>',
    '<body>',
    titleHtml,
    bottomNav,
    origBodyNoJs,
    '<script>',
    transformed.code,
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');

  fs.writeFileSync(OUT_FILE, htmlFinal, 'utf8');
  const dropboxDir = path.join(require('os').homedir(), 'Dropbox');
  if (fs.existsSync(dropboxDir)) fs.copyFileSync(OUT_FILE, path.join(dropboxDir, 'wolf-broker-tycoon.html'));
  console.log('DONE: ' + fs.statSync(OUT_FILE).size + ' bytes');
}

try {
  buildHTML();
} catch (error) {
  console.error('BUILD FAILED: ' + error.message);
  process.exit(1);
}
