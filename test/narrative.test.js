/**
 * Test per LLM Narrative Engine.
 * Verifica generazione personaggi, memorie, eventi e integrazione con GameEngine.
 */

var assert = require('assert');
var GameEngine = require('../game-engine.js');
var NarrativeEngine = require('../llm-narrative-engine.js');

function testNarrativeStateCreation() {
  console.log('  Narrative state viene creato');
  var ge = new GameEngine();
  var state = ge.createInitialState('NarrativeTest', 'normal');
  var ns = NarrativeEngine.ensureNarrativeState(state);
  assert(ns, 'Narrative state deve esistere');
  assert(ns.characters, 'Deve avere characters');
  assert(ns.events, 'Deve avere events');
  assert(ns.memories, 'Deve avere memories');
}

function testCharacterGeneration() {
  console.log('  Personaggi generati dallo stato');
  var ge = new GameEngine();
  var state = ge.createInitialState('CharTest', 'normal');
  NarrativeEngine.ensureNarrativeState(state);
  NarrativeEngine.ensureKeyCharacters(state);
  var chars = NarrativeEngine.getCharacters(state);
  var keys = Object.keys(chars);
  assert(keys.length > 6, 'Deve generare almeno i 6 NPC fissi + player: ' + keys.length);
}

function testMemoryAndRelationship() {
  console.log('  Memorie e relazioni');
  var ge = new GameEngine();
  var state = ge.createInitialState('MemTest', 'normal');
  NarrativeEngine.ensureNarrativeState(state);
  NarrativeEngine.ensureKeyCharacters(state);
  NarrativeEngine.addMemory(state, {
    type: 'test',
    text: 'Test memory',
    actors: ['npc:jordan_belfort'],
    importance: 8
  });
  var mem = NarrativeEngine.getMemories(state);
  assert(mem.length >= 1, 'Deve esserci almeno una memoria');

  NarrativeEngine.setRelationship(state, 'npc:jordan_belfort', 'player:broker', 10, 'Affari comuni');
  var rel = NarrativeEngine.getRelationship(state, 'npc:jordan_belfort', 'player:broker');
  assert(rel === 10, 'Relazione deve essere 10, got ' + rel);
}

function testFallbackWithoutLLM() {
  console.log('  Fallback senza LLM');
  var ge = new GameEngine();
  var state = ge.createInitialState('FallbackTest', 'normal');
  NarrativeEngine.ensureNarrativeState(state);
  NarrativeEngine.configure({ enabled: false, endpoint: '', apiKey: '' });

  return NarrativeEngine.processTurn(state).then(function (result) {
    assert(result, 'Risultato fallback deve esistere');
    assert(result.news.length === 0, 'Senza LLM non ci sono notizie LLM');
    var mem = NarrativeEngine.getMemories(state);
    assert(mem.length >= 1, 'Deve esserci almeno una memoria di stato');
  });
}

function testIntegrationWithGameEngine() {
  console.log('  Integrazione con GameEngine advanceWeek');
  var ge = new GameEngine();
  NarrativeEngine.configure({ enabled: false });
  var state = ge.createInitialState('IntegrationTest', 'normal');

  // Compra qualcosa per avere personaggi extra
  var c = null;
  for (var i = 0; i < state.market.companies.length; i++) {
    if (!state.market.companies[i].isPenny) { c = state.market.companies[i]; break; }
  }
  ge.buy(c.ticker, 10, {});

  var result = ge.advanceWeek();
  assert(result.week === 2, 'Turno avanzato');

  // Narrative process ora e\' chiamato esplicitamente (es. da LLMNewsEngine.processNewsTurn)
  return NarrativeEngine.processTurn(state).then(function () {
    assert(state.narrative, 'Narrative state persistito');
    assert(Object.keys(state.narrative.characters).length > 6, 'Personaggi narrativi generati');
  });
}

function run() {
  console.log('\nRunning narrative tests...');
  testNarrativeStateCreation();
  testCharacterGeneration();
  testMemoryAndRelationship();

  var integration = testIntegrationWithGameEngine();

  integration.then(function () {
    return testFallbackWithoutLLM();
  }).then(function () {
    console.log('\nNarrative tests passed.\n');
  }).catch(function (err) {
    console.error('Narrative tests failed:', err);
    process.exit(1);
  });
}

run();
