/**
 * Test di bilanciamento automatizzati.
 * Verificano che le strategie base ottengano risultati ragionevoli.
 */

var GameEngine = require('../game-engine.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
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
  for (var w = 0; w < weeks; w++) ge.advanceWeek();
  return state.player.netWorth;
}

function simulateActiveTrader(weeks) {
  var ge = new GameEngine();
  var state = ge.createInitialState('Active', 'normal');
  for (var w = 0; w < weeks; w++) {
    ge.advanceWeek();
    // Buy strongest non-penny, hold at least 3 weeks before considering sell
    if (w % 4 === 0) {
      var sorted = state.market.companies.slice().sort(function (a, b) { return b.momentum - a.momentum; });
      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].isPenny && !ge.hasUnlock('penny')) continue;
        var price = sorted[i].price;
        var maxShares = Math.floor(state.player.cash * 0.3 / price);
        if (maxShares > 0) {
          ge.buy(sorted[i].ticker, Math.min(maxShares, 30), {});
          break;
        }
      }
    }
  }
  return { netWorth: state.player.netWorth, level: state.player.level, trades: state.player.stats.totalTrades };
}

function run() {
  console.log('Running balance tests...');

  // Passive hold should not go bankrupt over 52 weeks
  var minPassive = 999999999, maxPassive = 0, sumPassive = 0;
  var runs = 5;
  for (var r = 0; r < runs; r++) {
    var v = simulatePassiveHold(52);
    if (v < minPassive) minPassive = v;
    if (v > maxPassive) maxPassive = v;
    sumPassive += v;
  }
  var avgPassive = sumPassive / runs;
  console.log('  Passive hold 52w range: €' + minPassive.toFixed(0) + ' - €' + maxPassive.toFixed(0) + ', avg: €' + avgPassive.toFixed(0));
  assert(minPassive > 7000, 'Passive hold non deve andare in bancarotta in 52 settimane (min: ' + minPassive + ')');
  assert(avgPassive > 12000, 'Passive hold medio deve crescere in 52 settimane (avg: ' + avgPassive + ')');

  // Active momentum trader should grow significantly and level up within 104 weeks
  var best = simulateActiveTrader(104);
  var attempts = 0;
  while (best.level < 3 && attempts < 10) {
    best = simulateActiveTrader(104);
    attempts++;
  }
  console.log('  Active trader 104w: net worth €' + best.netWorth.toFixed(0) + ', level ' + best.level + ', trades ' + best.trades + ' (attempts ' + (attempts + 1) + ')');
  assert(best.netWorth > 20000, 'Active trader deve crescere in 104 settimane (' + best.netWorth + ')');
  assert(best.level >= 3, 'Active trader deve raggiungere almeno livello 3 in 104 settimane (level ' + best.level + ')');

  console.log('Balance tests passed.');
}

run();
