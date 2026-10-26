#!/usr/bin/env node
/**
 * Build system for Wolf of Wall Street - Broker Tycoon.
 * Assembles the source modules and the legacy inline game into one ES5 HTML file.
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

// Minification (optional — falls back gracefully if not installed)
var minifyHtml, minifyJs;
try { minifyHtml = require('html-minifier-terser').minify; } catch (e) {}
try { minifyJs = require('terser').minify; } catch (e) {}

const BASE = __dirname;
const OUT_FILE = path.join(BASE, 'wolf-broker-tycoon.html');
const MODULE_FILES = [
  'llm-client.js',
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
  'immersive-ui.js',
  'desk-director.js'
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
    "try{var hasSave=!!localStorage.getItem('sbt_autosave');for(var i=1;i<=5;i++)if(localStorage.getItem('sbt_save_'+i))hasSave=true;if(hasSave)document.getElementById('wolfLoadBtn').disabled=false;}catch(e){}",
    "if(typeof wolfBridgeInstall==='function')wolfBridgeInstall();",
    "if(typeof ImmersiveEngine!=='undefined'&&typeof wolfBridge!=='undefined'&&wolfBridge.getEngine)ImmersiveEngine.install(wolfBridge.getEngine());",
    "if(typeof ImmersiveUI!=='undefined'&&typeof ImmersiveEngine!=='undefined')ImmersiveUI.install(ImmersiveEngine);",
    "if(typeof BrokerageManagement!=='undefined'&&BrokerageManagement.install)BrokerageManagement.install();",
    "DeskDirector.install(wolfBridge.getEngine());",
    "wolfBridge.sync();renderAll();updateTicker();",
    "setInterval(updateTicker,30000);",
    "document.querySelectorAll('.nav button').forEach(function(b){b.onclick=function(){wolfSwitchView(b.dataset.view);};});"
  ].join('\n');
}

async function buildHTML() {
  console.log('=== Wolf of Wall Street - Broker Tycoon Build ===');
  const htmlOrig = readFile('src/game-shell.html');
  const cssMatch = htmlOrig.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = htmlOrig.match(/<body>([\s\S]*)<\/body>/);
  const origCss = cssMatch ? cssMatch[1] : '';
  const origBody = bodyMatch ? bodyMatch[1] : '';
  const origBodyNoJs = origBody.replace(/<script[^\u003e]*>[\s\S]*?<\/script>/g, '');
  const gameOrigJs = readFile('legacy-ui.js');

  const modules = [];
  for (const fileName of MODULE_FILES) {
    modules.push(cleanScriptTags(readFile(fileName)));
    console.log('  read: ' + fileName);
  }

  const rawJs = 'window.WOLF_MANAGED_TURNS=true;\n' + modules.concat([gameOrigJs, integrationJS()]).join('\n');
  const transformed = babel.transformSync(rawJs, { configFile: path.join(BASE, 'babel.config.json'), filename: 'bundle.js' });
  if (!transformed || !transformed.code) throw new Error('Babel non ha prodotto codice');
  const errors = validateES5(transformed.code);
  if (errors.length) throw new Error('Build validation failed: ' + errors.join(', '));

  const htmlFinal = [
    '<!DOCTYPE html>',
    '<html lang="it">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">',
    '<title>🐺 Wolf of Wall Street — Broker Tycoon</title>',
    '<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" onload="if(typeof renderNetWorthChart===\'function\')renderNetWorthChart()"></script>',
    '<style>' + origCss + '</style>',
    '</head>',
    '<body>',
    origBodyNoJs,
    '<script>',
    transformed.code,
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');

  var outputHtml = htmlFinal;

  // Minify JS if terser is available
  if (minifyJs) {
    console.log('  minifying JS with terser...');
    var minified = await minifyJs(transformed.code, { compress: { passes: 2 }, mangle: false, format: { comments: false } });
    if (minified && minified.code) {
      outputHtml = htmlFinal.replace(transformed.code, function () { return minified.code; });
      console.log('  JS minified: ' + transformed.code.length + ' -> ' + minified.code.length + ' bytes');
    }
  } else {
    console.log('  terser not installed — skipping JS minification');
  }

  // Minify HTML if html-minifier-terser is available
  if (minifyHtml) {
    console.log('  minifying HTML with html-minifier-terser...');
    outputHtml = await minifyHtml(outputHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: false,
      removeOptionalTags: false,
      collapseBooleanAttributes: true
    });
    console.log('  HTML minified: ' + htmlFinal.length + ' -> ' + outputHtml.length + ' bytes');
  } else {
    console.log('  html-minifier-terser not installed — skipping HTML minification');
  }

  fs.writeFileSync(OUT_FILE, outputHtml, 'utf8');
  fs.writeFileSync(path.join(BASE, 'index.html'), outputHtml, 'utf8');
  const dropboxDir = path.join(require('os').homedir(), 'Dropbox');
  if (fs.existsSync(dropboxDir)) fs.copyFileSync(OUT_FILE, path.join(dropboxDir, 'wolf-broker-tycoon.html'));
  console.log('DONE: ' + fs.statSync(OUT_FILE).size + ' bytes');
}

buildHTML().catch(function (error) {
  console.error('BUILD FAILED: ' + error.message);
  process.exit(1);
});
