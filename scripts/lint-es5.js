#!/usr/bin/env node
/**
 * Lint ES5 per i file sorgente JavaScript del progetto.
 * Verifica che i file rispettino i vincoli autoimposti:
 *  - nessun const / let
 *  - nessuna arrow function
 *  - nessun template literal
 *  - nessuna class / async / await
 *  - nessun for-of
 *
 * Uso: node scripts/lint-es5.js
 */

var fs = require('fs');
var path = require('path');

var TARGETS = [
  'market-engine.js',
  'game-engine.js',
  'ui-bridge.js',
  // 'ui-engine.js' e 'competitor-engine.js' sono transpilati da Babel, esclusi dal lint sorgente
  'story-engine.js',
  'llm-news-engine.js',
  'llm-game-master.js',
  // 'competitor-engine.js',
  'world-engine.js',
  'corporate-lifecycle.js',
  'broker-story.js',
  'player-life.js',
  'brokerage-career.js',
  'stakeholder-interactions.js'
];

function stripStringsAndComments(code) {
  var stripped = code;
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, ' ');
  stripped = stripped.replace(/\/\/.*$/gm, ' ');
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, ' "STR" ');
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, " 'STR' ");
  return stripped;
}

function checkFile(filePath) {
  var code = fs.readFileSync(filePath, 'utf8');
  var stripped = stripStringsAndComments(code);
  var errors = [];

  var keywords = [
    { name: 'const', regex: /\bconst\b/g },
    { name: 'let', regex: /\blet\b/g },
    { name: 'class', regex: /\bclass\b/g },
    { name: 'async', regex: /\basync\b/g },
    { name: 'await', regex: /\bawait\b/g }
  ];
  for (var i = 0; i < keywords.length; i++) {
    var kw = keywords[i];
    var matches = stripped.match(kw.regex);
    if (matches && matches.length > 0) {
      errors.push('Trovate ' + matches.length + ' occorrenze di "' + kw.name + '"');
    }
  }

  if (/\)\s*=>/.test(stripped)) {
    errors.push('Trovate arrow functions');
  }
  if (/`/.test(code)) {
    errors.push('Trovati template literals');
  }
  if (/\bfor\s*\(\s*var\s+\w+\s+of\s+/.test(stripped)) {
    errors.push('Trovati cicli for-of');
  }

  return errors;
}

function run() {
  console.log('=== ES5 Lint ===');
  var failed = false;
  for (var i = 0; i < TARGETS.length; i++) {
    var file = TARGETS[i];
    var filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      console.log('  SKIP: ' + file + ' (non trovato)');
      continue;
    }
    var errors = checkFile(filePath);
    if (errors.length === 0) {
      console.log('  OK:   ' + file);
    } else {
      failed = true;
      console.log('  FAIL: ' + file);
      for (var j = 0; j < errors.length; j++) {
        console.log('    - ' + errors[j]);
      }
    }
  }
  if (failed) {
    console.log('\nES5 lint FAILED');
    process.exit(1);
  } else {
    console.log('\nES5 lint OK');
  }
}

run();
