/**
 * Simulazioni di bilanciamento per Wolf Broker Tycoon.
 * Misura quante settimane/settimane servono per raggiungere i livelli
 * con strategie semplici (buy-and-hold, trading casuale).
 */

var GameEngine = require('../game-engine.js');

function log(msg) {
  console.log('  ' + msg);
}

function simulatePassiveHold(weeks) {
  var ge = new GameEngine();
  var state = ge.createInitialState('Passive', 'normal');
  var cash = state.player.cash;
  var picks = [];
  for (var i = 0; i < state.market.companies.length && picks.length < 5; i++) {
    if (!state.market.companies[i].isPenny) picks.push(state.market.companies[i]);
  }
  var each = cash * 0.95 / picks.length;
  for (var k = 0; k < picks.length; k++) {
    var shares = Math.floor(each / picks[k].price);
    if (shares > 0) ge.buy(picks[k].ticker, shares, {});
  }

  var maxLevel = 1;
  for (var w = 0; w < weeks; w++) {
    ge.advanceWeek();
    if (state.player.level > maxLevel) maxLevel = state.player.level;
  }
  return {
    week: state.player.week,
    year: state.player.year,
    level: state.player.level,
    maxLevel: maxLevel,
    netWorth: state.player.netWorth,
    cash: state.player.cash,
    trades: state.player.stats.totalTrades
  };
}

function simulateRandomTrader(weeks, tradesPerWeek) {
  var ge = new GameEngine();
  var state = ge.createInitialState('Trader', 'normal');
  var maxLevel = 1;

  for (var w = 0; w < weeks; w++) {
    ge.advanceWeek();
    for (var t = 0; t < tradesPerWeek; t++) {
      var idx = Math.floor(Math.random() * state.market.companies.length);
      var c = state.market.companies[idx];
      if (c.isPenny && !ge.hasUnlock('penny')) continue;
      var maxShares = Math.floor(state.player.cash / c.price);
      if (maxShares < 1) continue;
      var shares = Math.min(maxShares, 10 + Math.floor(Math.random() * 50));
      ge.buy(c.ticker, shares, {});
    }
    if (state.player.level > maxLevel) maxLevel = state.player.level;
  }

  return {
    week: state.player.week,
    year: state.player.year,
    level: state.player.level,
    maxLevel: maxLevel,
    netWorth: state.player.netWorth,
    cash: state.player.cash,
    trades: state.player.stats.totalTrades
  };
}

function run() {
  console.log('\nRunning balance simulations...');
  log('Passive hold 52 settimane:');
  var r1 = simulatePassiveHold(52);
  log('  net worth: €' + r1.netWorth.toFixed(0) + ', level: ' + r1.level + ', max: ' + r1.maxLevel + ', trades: ' + r1.trades);

  log('Passive hold 104 settimane:');
  var r2 = simulatePassiveHold(104);
  log('  net worth: €' + r2.netWorth.toFixed(0) + ', level: ' + r2.level + ', max: ' + r2.maxLevel + ', trades: ' + r2.trades);

  log('Random trader 52w, 3 trade/sett:');
  var r3 = simulateRandomTrader(52, 3);
  log('  net worth: €' + r3.netWorth.toFixed(0) + ', level: ' + r3.level + ', max: ' + r3.maxLevel + ', trades: ' + r3.trades);

  log('Random trader 104w, 5 trade/sett:');
  var r4 = simulateRandomTrader(104, 5);
  log('  net worth: €' + r4.netWorth.toFixed(0) + ', level: ' + r4.level + ', max: ' + r4.maxLevel + ', trades: ' + r4.trades);
}

run();
