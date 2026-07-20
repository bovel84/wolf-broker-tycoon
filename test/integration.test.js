/**
 * Test di integrazione base per i motori puri di Wolf Broker Tycoon.
 * Verifica che GameEngine, MarketEngine, WorldEngine e CompetitorEngine
 * possano essere istanziati e usati insieme in ambiente Node.js.
 */

var assert = require('assert');
var Bridge = require('../ui-bridge.js');
var GameEngine = require('../game-engine.js');
var MarketEngine = require('../market-engine.js');
var WorldEngine = require('../world-engine.js');
var CE = require('../competitor-engine.js');

function log(msg) {
  console.log('  ' + msg);
}

function testMarketEngine() {
  log('MarketEngine genera societa realistiche');
  var me = new MarketEngine();
  assert(me.companies.length >= 100, 'MarketEngine deve generare almeno 100 societa');
  assert(me.companies[0].ticker, 'Ogni societa deve avere un ticker');
  assert(me.sectors, 'MarketEngine deve avere i settori');
}

function testGameEngineUsesMarketEngine() {
  log('GameEngine usa le societa di MarketEngine');
  var ge = new GameEngine();
  var state = ge.createInitialState('Test', 'normal');
  assert(state.market.companies.length >= 20, 'GameEngine deve avere almeno 20 societa');
  assert(state.market.companies[0].ticker, 'La prima societa deve avere un ticker');
}

function findNonPennyCompany(state) {
  for (var i = 0; i < state.market.companies.length; i++) {
    if (!state.market.companies[i].isPenny) return state.market.companies[i];
  }
  return state.market.companies[0];
}

function testTradeAndSave() {
  log('Trade, salvataggio e caricamento funzionano');
  var ge = new GameEngine();
  var state = ge.createInitialState('Test', 'normal');
  var company = findNonPennyCompany(state);
  var result = ge.buy(company.ticker, 10, {});
  assert(result.success, 'L\'acquisto deve avere successo: ' + (result.error || ''));

  var serialized = JSON.stringify(ge._serializeState());
  assert(serialized.length > 1000, 'Lo stato serializzato deve essere significativo');

  var parsed = JSON.parse(serialized);
  assert(Object.keys(parsed.portfolio.positions).length > 0, 'Il portafoglio serializzato deve contenere posizioni');

  var ge2 = new GameEngine();
  var loaded = ge2._deserializeState(parsed);
  assert(loaded, 'Il caricamento deve restituire uno stato');
  assert(Object.keys(loaded.portfolio.positions).length > 0, 'Il portafoglio caricato deve contenere posizioni');
}

function testWorldEngineIntegration() {
  log('WorldEngine si installa sullo stato di GameEngine');
  var ge = new GameEngine();
  var state = ge.createInitialState('Test', 'normal');
  WorldEngine.install(state);
  var ws = WorldEngine.getState();
  assert(ws, 'WorldEngine deve avere uno stato');
  assert(Object.keys(ws.companies).length >= 20, 'WorldEngine deve tracciare le societa di GameEngine');
}

function testFullLoop() {
  log('Loop completo: avanzamento turno con WorldEngine e CompetitorEngine');
  var ge = new GameEngine();
  var state = ge.createInitialState('Test', 'normal');
  WorldEngine.install(state);

  var ce = new CE.CompetitorEngine();
  ce.init({
    stocks: state.market.companies.map(function (c) {
      return { symbol: c.ticker, price: c.price, sector: c.sector };
    }),
    currentWeek: 1
  });
  ge.installCompetitorEngine(ce);

  var result = ge.advanceWeek();
  assert(result && result.week === 2, 'Dopo advanceWeek la settimana deve essere 2');
  assert(WorldEngine.getState().week >= 1, 'WorldEngine deve avere aggiornato la settimana');
}

function testBridgeSyncsTrades() {
  log('UI bridge sincronizza trading legacy');
  var ge = Bridge.getEngine();
  ge.createInitialState('Test', 'normal');
  var state = ge.getState();
  var company = findNonPennyCompany(state);
  var buyResult = ge.buy(company.ticker, 10, {});
  assert(buyResult.success, 'Acquisto via bridge/engine: ' + (buyResult.error || ''));

  var legacy = Bridge.legacyStateFromEngine();
  assert(legacy.companies.length >= 20, 'Legacy deve vedere le societa');
  assert(legacy.positions[company.ticker], 'Legacy deve vedere la posizione per ' + company.ticker);
  assert(legacy.positions[company.ticker].shares === 10, 'La posizione legacy deve avere 10 azioni');
  assert(legacy.transactions.length === 1, 'Legacy deve avere una transazione');

  // Simula una vendita
  var sellResult = ge.sell(company.ticker, 5, {});
  assert(sellResult.success, 'Vendita via bridge/engine: ' + (sellResult.error || ''));
  legacy = Bridge.legacyStateFromEngine();
  assert(legacy.positions[company.ticker].shares === 5, 'Dopo vendita legacy deve avere 5 azioni');
  assert(legacy.transactions.length === 2, 'Legacy deve avere due transazioni');
}

function run() {
  console.log('\nRunning integration tests...');
  testMarketEngine();
  testGameEngineUsesMarketEngine();
  testTradeAndSave();
  testWorldEngineIntegration();
  testFullLoop();
  testBridgeSyncsTrades();
  console.log('\nAll tests passed.\n');
}

run();
