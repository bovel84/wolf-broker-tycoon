/**
 * Verifica che il file HTML compilato (wolf-broker-tycoon.html) si carichi
 * in un ambiente DOM simulato senza errori di runtime e che esponga
 * le funzioni globali necessarie al gioco.
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var { Window } = require('happy-dom');

function log(msg) {
  console.log('  ' + msg);
}

function loadHTML() {
  var filePath = path.join(__dirname, '..', 'wolf-broker-tycoon.html');
  return fs.readFileSync(filePath, 'utf8');
}

function setupMocks(window) {
  var storage = {};
  window.localStorage = {
    getItem: function (k) { return storage[k] || null; },
    setItem: function (k, v) { storage[k] = String(v); },
    removeItem: function (k) { delete storage[k]; }
  };

  window.Chart = function (ctx, cfg) {
    this.ctx = ctx;
    this.cfg = cfg;
    this.destroy = function () {};
    this.update = function () {};
  };
  window.Chart.register = function () {};
  window.Chart.defaults = {};

  window.URL = {
    createObjectURL: function () { return 'blob:mock'; },
    revokeObjectURL: function () {}
  };
  window.Blob = function (parts) { this.parts = parts; };
  window.alert = function () {};
  window.confirm = function () { return true; };

  // Intercetta timer per poterli pulire alla fine del test
  var intervalIds = [];
  var timeoutIds = [];
  var originalSetInterval = window.setInterval.bind(window);
  var originalSetTimeout = window.setTimeout.bind(window);
  var originalClearInterval = window.clearInterval.bind(window);
  var originalClearTimeout = window.clearTimeout.bind(window);
  window.setInterval = function (fn, delay) {
    var id = originalSetInterval(fn, delay);
    intervalIds.push(id);
    return id;
  };
  window.setTimeout = function (fn, delay) {
    var id = originalSetTimeout(fn, delay);
    timeoutIds.push(id);
    return id;
  };
  window.clearInterval = function (id) {
    var idx = intervalIds.indexOf(id);
    if (idx >= 0) intervalIds.splice(idx, 1);
    originalClearInterval(id);
  };
  window.clearTimeout = function (id) {
    var idx = timeoutIds.indexOf(id);
    if (idx >= 0) timeoutIds.splice(idx, 1);
    originalClearTimeout(id);
  };
  window.__cleanupTimers = function () {
    intervalIds.forEach(originalClearInterval);
    timeoutIds.forEach(originalClearTimeout);
    intervalIds = [];
    timeoutIds = [];
  };
}

function extractInlineJS(html) {
  var matches = [];
  var regex = /<script>([\s\S]*?)<\/script>/g;
  var m;
  while ((m = regex.exec(html)) !== null) {
    matches.push(m[1]);
  }
  return matches.join('\n');
}

function testHTMLBuild() {
  log('Caricamento HTML compilato');
  var html = loadHTML();
  assert(html.length > 100000, 'HTML compilato deve essere significativo');

  var window = new Window({
    url: 'https://localhost/wolf-broker-tycoon.html',
    width: 1280,
    height: 800
  });

  setupMocks(window);

  // Carica l'HTML nel DOM senza eseguire gli script
  window.document.documentElement.innerHTML = html.replace(/^<!DOCTYPE[^>]*>/i, '');

  // Estrai ed esegui gli script inline
  var js = extractInlineJS(html);
  assert(js.length > 50000, 'JS inline deve essere significativo');
  window.eval(js);

  log('Verifica funzioni globali');
  assert(typeof window.GameEngine === 'function' || typeof window.GameEngine === 'object', 'GameEngine deve essere definito');
  assert(typeof window.MarketEngine === 'function' || typeof window.MarketEngine === 'object', 'MarketEngine deve essere definito');
  assert(typeof window.advanceTurn === 'function', 'advanceTurn deve essere una funzione globale');
  assert(typeof window.newGame === 'function', 'newGame deve essere una funzione globale');
  assert(typeof window.renderAll === 'function', 'renderAll deve essere una funzione globale');
  assert(window.ImmersiveEngine, 'ImmersiveEngine deve essere definito');
  assert(window.ImmersiveUI, 'ImmersiveUI deve essere definita');
  assert(window.document.getElementById('immersive-fab'), 'FAB Immersive Core mancante');
  assert(window.document.getElementById('immersive-overlay'), 'Modal Immersive Core mancante');
  window.ImmersiveUI.open('inbox');
  assert(window.document.getElementById('immersive-overlay').classList.contains('show'), 'Modal Immersive non si apre');
  assert(window.document.getElementById('immersive-body').textContent.indexOf('Inbox narrativa') >= 0, 'Inbox narrativa non renderizzata');
  window.ImmersiveUI.close();

  log('Inizializzazione partita da HTML');
  window.newGame();
  assert(window.G, 'G (stato legacy) deve esistere dopo newGame');
  assert(window.G.companies.length >= 20, 'G.companies deve avere almeno 20 societa');
  assert(window.G.cash === 10000, 'G.cash iniziale deve essere 10000');
  assert(window.G.narrative && window.G.narrative.immersive, 'Stato Immersive mancante dopo newGame');
  assert(window.G.narrative.immersive.messages.length >= 1, 'Inbox iniziale vuota dopo newGame');

  log('Avanzamento turno da HTML');
  var result = window.advanceTurn();
  console.log('  advanceTurn result:', result);
  assert(result, 'advanceTurn deve restituire un risultato');
  assert(window.G.week === 2, 'Dopo advanceTurn la settimana deve essere 2');

  log('Trading via UI legacy bridge');
  if (typeof window.BrokerageCareer !== 'undefined' && window.BrokerageCareer.canTrade) {
    window.BrokerageCareer.canTrade = function () { return true; };
  }
  var ticker = null;
  for (var i = 0; i < window.G.companies.length; i++) {
    if (!window.G.companies[i].isPenny && window.G.companies[i].price < 500) {
      ticker = window.G.companies[i].ticker;
      break;
    }
  }
  assert(ticker, 'Deve esistere una compagnia tradeable per il test');
  window.openTradeModal(ticker);
  assert(window.tradeModalState, 'tradeModalState deve essere impostato');
  var sharesInput = window.document.getElementById('trade-shares');
  assert(sharesInput, 'Input shares deve esistere');
  sharesInput.value = '5';
  window.executeTrade();
  assert(window.G.positions[ticker], 'Dopo acquisto G.positions deve contenere ' + ticker);
  assert(window.G.positions[ticker].shares === 5, 'Deve avere 5 azioni');
  assert(window.G.transactions.length >= 1, 'Deve esserci almeno una transazione');

  window.__cleanupTimers();
  window.close();
  log('Test completato');
}

try {
  console.log('\nRunning HTML build test...');
  testHTMLBuild();
  console.log('\nHTML build test passed.\n');
} catch (e) {
  console.error('\nHTML build test failed: ' + e.message);
  console.error(e.stack);
  process.exit(1);
}
