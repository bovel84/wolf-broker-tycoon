/**
 * Test di gameplay avanzati per Wolf Broker Tycoon.
 * Coprono: short selling, margin, game over, missioni, achievement.
 */

var assert = require('assert');
var GameEngine = require('../game-engine.js');

function findTradeableCompany(state, opts) {
  opts = opts || {};
  for (var i = 0; i < state.market.companies.length; i++) {
    var c = state.market.companies[i];
    if (opts.nonPenny && c.isPenny) continue;
    if (opts.maxPrice && c.price > opts.maxPrice) continue;
    return c;
  }
  return state.market.companies[0];
}

function findNonPennyCompany(state, opts) {
  opts = opts || {};
  for (var i = 0; i < state.market.companies.length; i++) {
    var c = state.market.companies[i];
    if (c.isPenny) continue;
    if (opts.maxPrice && c.price > opts.maxPrice) continue;
    return c;
  }
  return state.market.companies[0];
}

function testShortSelling() {
  console.log('  Short selling');
  var ge = new GameEngine();
  var state = ge.createInitialState('ShortTest', 'normal');
  // Sblocca short (livello 3): netWorth >= 50000, xp >= 500, 6 missioni
  state.player.cash = 60000;
  state.player.netWorth = 60000;
  state.player.xp = 500;
  // Completa forzatamente 6 missioni
  for (var m = 0; m < 6; m++) {
    state.player.achievements.push({ id: 'mission_' + m, source: 'mission', week: 1 });
  }
  ge._checkLevelUp();
  assert(state.player.level >= 3, 'Livello per short deve essere sbloccato, got ' + state.player.level);

  var c = findTradeableCompany(state, { nonPenny: true });
  var buyResult = ge.buy(c.ticker, 10, { short: true });
  assert(buyResult.success, 'Apertura short deve riuscire: ' + (buyResult.error || ''));

  var pos = state.portfolio.positions[c.id + '_short'];
  assert(pos, 'Deve esistere posizione short');
  assert(pos.type === 'short', 'Tipo deve essere short');

  // Copre lo short
  var coverResult = ge.sell(c.ticker, 10, {});
  assert(coverResult.success, 'Cover short deve riuscire: ' + (coverResult.error || ''));
  assert(!state.portfolio.positions[c.id + '_short'], 'Posizione short deve essere rimossa');
}

function testMarginTrading() {
  console.log('  Margin trading');
  var ge = new GameEngine();
  var state = ge.createInitialState('MarginTest', 'normal');
  // Sblocca margin 2x (livello 4): netWorth >= 100000, xp >= 1000, 10 missioni
  state.player.cash = 200000;
  state.player.netWorth = 200000;
  state.player.xp = 2000;
  for (var m = 0; m < 10; m++) {
    state.player.achievements.push({ id: 'mission_' + m, source: 'mission', week: 1 });
  }
  ge._checkLevelUp();
  assert(state.player.level >= 4, 'Livello per margin 2x deve essere sbloccato, got ' + state.player.level);

  var c = findTradeableCompany(state, { nonPenny: true, maxPrice: 50 });
  var shares = 500;
  var result = ge.buy(c.ticker, shares, { margin: 2 });
  assert(result.success, 'Acquisto con margin 2x deve riuscire: ' + (result.error || ''));

  var pos = state.portfolio.positions[c.id];
  assert(pos, 'Deve esistere posizione long');
  assert(pos.shares === shares, 'Deve avere ' + shares + ' azioni');
}

function testMissionAndAchievement() {
  console.log('  Missioni e achievement');
  var ge = new GameEngine();
  var state = ge.createInitialState('MissionTest', 'normal');
  ge._initMissions();

  var c = findNonPennyCompany(state, { maxPrice: 50 });
  var before = state.player.achievements.length;
  var beforeMissions = ge.getCompletedMissions().length;

  var buyResult = ge.buy(c.ticker, 1, {});
  assert(buyResult.success, 'buy deve avere successo: ' + (buyResult.error || 'ok'));
  assert(state.player.stats.totalTrades >= 1, 'Deve avere almeno un trade');

  ge._checkAchievements();
  ge._checkMissions();

  var foundAchievement = false;
  for (var i = 0; i < state.player.achievements.length; i++) {
    if (state.player.achievements[i].id === 'first_trade') foundAchievement = true;
  }
  assert(foundAchievement, 'Achievement first_trade deve essere sbloccato');
}

function testBankruptcyGameOver() {
  console.log('  Game over per bancarotta');
  var ge = new GameEngine();
  var state = ge.createInitialState('BankruptTest', 'normal');
  var c = findTradeableCompany(state, { nonPenny: true });

  // Apre una posizione enorme con margin per forzare perdita
  state.player.cash = 1000000;
  state.player.netWorth = 1000000;
  state.player.xp = 50000;
  for (var m = 0; m < 40; m++) {
    state.player.achievements.push({ id: 'mission_' + m, source: 'mission', week: 1 });
  }
  ge._checkLevelUp();
  ge.buy(c.ticker, 1000000, { margin: 5 });

  // Prima bancarotta: reset con seconda chance
  state.player.netWorth = -100000;
  state.player.cash = -100000;
  var first = ge._gameOver('bankrupt');
  assert(first === null, 'Prima bancarotta deve dare seconda chance');
  assert(state.player.cash === 10000, 'Cash ripristinato a 10000');

  // Seconda bancarotta: game over definitivo
  state.player.netWorth = -100000;
  state.player.cash = -100000;
  var ending = ge._gameOver('bankrupt');
  assert(ending, 'Deve esserci un ending');
  assert(ending.id === 'fall', 'Ending deve essere fallimento');
}

function testSaveRoundTrip() {
  console.log('  Salvataggio round-trip');
  var ge = new GameEngine();
  var state = ge.createInitialState('SaveTest', 'normal');
  var c = findNonPennyCompany(state, { maxPrice: 50 });
  ge.buy(c.ticker, 10, {});

  var serialized = ge._serializeState();
  var json = JSON.stringify(serialized);
  var parsed = JSON.parse(json);

  var ge2 = new GameEngine();
  var loaded = ge2._deserializeState(parsed);
  ge2.setState(loaded);
  assert(loaded, 'Stato caricato deve esistere');
  assert(Object.keys(loaded.portfolio.positions).length > 0, 'Portafoglio caricato deve avere posizioni');
  assert(loaded.player.cash === state.player.cash, 'Cash deve essere preservato');
}

function testDifficultyConfig() {
  console.log('  Configurazione difficolta');
  var ge = new GameEngine();
  var state = ge.createInitialState('DiffTest', 'hard');
  assert(state.settings.difficulty === 'hard', 'Difficolta deve essere hard');
  assert(state.settings.difficultyConfig.commissionRate > 0, 'Commissione deve essere definita');
}

function run() {
  console.log('\nRunning gameplay tests...');
  testShortSelling();
  testMarginTrading();
  testMissionAndAchievement();
  testBankruptcyGameOver();
  testSaveRoundTrip();
  testDifficultyConfig();
  console.log('\nGameplay tests passed.\n');
}

run();
