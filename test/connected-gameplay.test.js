/* Regression tests across the actual built UI, market, management and LLM. */
var assert = require('assert');
var fs = require('fs');
var Window = require('happy-dom').Window;
var GameEngine = require('../game-engine.js');

function boot() {
  var html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  assert.strictEqual(html, fs.readFileSync(__dirname + '/../wolf-broker-tycoon.html', 'utf8'), 'Both entrypoints use the same build');
  assert.strictEqual((html.match(/function GameEngine\(/g) || []).length, 1, 'One core engine in bundle');
  var window = new Window({ url: 'https://wolf.test/', width: 1280, height: 900 });
  window.Chart = function () { this.destroy = function () {}; this.update = function () {}; };
  window.Chart.defaults = {}; window.Chart.register = function () {};
  window.document.documentElement.innerHTML = html.replace(/^<!DOCTYPE[^>]*>/i, '');
  window.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  return window;
}
function closeEnough(actual, expected, label) { assert(Math.abs(actual - expected) < 0.001, label + ': ' + actual + ' vs ' + expected); }
function coreRegressions() {
  var e = new GameEngine(); var s = e.createInitialState('Test', 'normal');
  var c = s.market.companies.filter(function (c) { return !c.isPenny; })[0];
  [0, -3, NaN, Infinity, 1.5].forEach(function (shares) {
    assert(!e.buy(c.ticker, shares).success, 'Reject invalid buys');
    assert(!e.sell(c.ticker, shares).success, 'Reject invalid sells');
  });
  s.player.level = 3; s.player.cash = 100000;
  var price = c.price; e.buy(c.ticker, 2, { short: true });
  closeEnough(s.player.netWorth, s.player.cash, 'Short opening preserves equity');
  c.price = price * 2; e.buy(c.ticker, 2, { short: true });
  closeEnough(s.portfolio.positions[c.id + '_short'].avgPrice, price * 1.5, 'Weighted short entry');
  c.price = price; e._updateUnrealizedPnL();
  closeEnough(s.player.netWorth, s.player.cash + price * 2, 'Short gains included once');
  var restored = new GameEngine(); restored.setState(restored._deserializeState(JSON.parse(JSON.stringify(e._serializeState()))));
  assert(restored.getActiveMissions().every(function (m) { return typeof m.check === 'function'; }), 'Active mission rules are rehydrated');
  restored.buy(c.ticker, 1); assert(restored.getCompletedMissions().some(function (m) { return m.id === 'first_trade'; }), 'Missions remain executable after load');
  var split = new GameEngine(); var splitState = split.createInitialState('Split', 'normal');
  var splitCompany = splitState.market.companies.filter(function (company) { return !company.isPenny; })[0];
  splitCompany.price = 100; splitState.player.level = 3; splitState.player.cash = 100000;
  split.buy(splitCompany.ticker, 4); split.buy(splitCompany.ticker, 2, { short: true });
  var equity = splitState.player.netWorth;
  split._applyAssemblyEffect(splitCompany, { name: 'Split', impact: { type: 'split', factor: 2 } }); split._updateUnrealizedPnL();
  closeEnough(splitState.player.netWorth, equity, 'Split preserves net worth for long and short');
  assert.strictEqual(splitState.portfolio.positions[splitCompany.id].avgPrice, 50, 'Split adjusts cost basis');
  split.sell(splitCompany.ticker, 2, { limit: true, limitPrice: 55 });
  assert.strictEqual(splitState.market.pendingOrders.length, 1, 'Limit sell queued');
  splitCompany.price = 56; split._processPendingOrders();
  assert.strictEqual(splitState.portfolio.positions[splitCompany.id].shares, 6, 'Limit sell executes through engine');
  console.log('  Accounting, input validation and mission rehydration');
}
async function run() {
  coreRegressions();
  var w = boot();
  try {
    w.newGame();
    var e = w.wolfBridge.getEngine(); var s = e.getState();
    assert.strictEqual(w.document.querySelectorAll('#wolfTitleScreen').length, 1, 'One title screen');
    assert.strictEqual(w.document.querySelectorAll('#bottomNav').length, 1, 'One mobile navigation');
    assert(s.market.companies.length >= 100, 'Full stock universe is playable');
    assert(w.G.companies.every(function (c) { return Number.isFinite(c.vol); }), 'Stock volatility available to UI');
    w.G.cash -= 37; closeEnough(s.player.cash, 9963, 'Career cash writes are canonical');
    w.G.playerLife.stress = 23;
    assert(w.DeskDirector.choose('balanced'), 'Accept a mandate');
    assert(!w.DeskDirector.choose('conviction'), 'A decision is one-shot');
    var ticker = s.desk.opportunity.ticker;
    w.DeskDirector.inspect(ticker); w.executeTrade();
    var c = e.getCompany(ticker);
    assert(s.portfolio.positions[c.id], 'UI trade updates canonical portfolio');
    assert.strictEqual(s.player.stats.totalTrades, 1, 'One UI action is one trade');
    var careerWeeks = w.G.brokerCareer.careerWeeks;
    var worldPrice = c.price;
    var result = w.advanceTurn();
    assert(w.DeskDirector.isBusy(), 'Turn stays locked until all engines finish');
    assert.strictEqual(w.advanceTurn(), result, 'Repeated clicks reuse in-flight turn');
    await result.completion;
    assert(!w.DeskDirector.isBusy(), 'Turn released');
    assert.strictEqual(w.G.week, 2, 'Exactly one week advances');
    assert.strictEqual(w.G.brokerCareer.careerWeeks, careerWeeks + 1, 'Career advances once');
    assert.strictEqual(s.desk.contracts[0].status, 'completed', 'Actual holdings fulfill the mandate');
    assert(c.price !== worldPrice, 'Market prices advance');
    closeEnough(w.G.companies.filter(function (x) { return x.ticker === ticker; })[0].price, c.price, 'UI and engine share stock price');
    closeEnough(w.computeNetWorth(), s.player.netWorth, 'UI and engine share net worth');
    assert(s.desk.recap && s.netWorthHistory.length > 1, 'Recap and chart persist');
    var priceAfterNews = c.price;
    await w.LLMNewsEngine.processNewsTurn(s);
    closeEnough(c.price, priceAfterNews, 'News impact only applied once per year/week');
    console.log('  Mandate -> real order -> one weekly turn -> salary, risk and recap');

    w.saveSlot(1); var saved = JSON.parse(w.localStorage.getItem('sbt_save_1'));
    assert(saved.legacyData.brokerCareer, 'Career included in save');
    assert(saved.legacyData.playerLife, 'Personal state included in save');
    assert(saved.legacyData.worldState, 'World included in save');
    assert(saved.desk.contracts.length, 'Decisions included in save');
    var savedCash = s.player.cash;
    w.newGame(); w.loadSlot(1); s = e.getState();
    closeEnough(s.player.cash, savedCash, 'Full state restored');
    assert.strictEqual(w.G.week, 2, 'Week restored');
    assert.strictEqual(w.WorldEngine.getState().week, 2, 'World rebound to loaded slot');
    assert.strictEqual(s.desk.contracts[0].status, 'completed', 'Mandates restored');
    var assemblyCompany = e.getCompany(ticker);
    assemblyCompany.assemblyScheduled = true;
    assemblyCompany.assemblyVotes = { for: 0, against: 0, abstain: 0 };
    assemblyCompany.assemblyProposals = [{ id: 'test_buyback', name: 'Test buyback', desc: 'Repurchase', impact: { type: 'buyback', price: 1.02 }, voteNeed: 0.1,
      aiFor: assemblyCompany.sharesOutstanding * 0.7, aiAgainst: 0, aiAbstain: 0, playerVoted: false, resolved: false }];
    w.wolfBridge.sync(); w.renderAll(); w.openAssemblyModal(ticker);
    assert(w.document.getElementById('assembly-modal-body').textContent.indexOf('Test buyback') >= 0, 'Canonical proposal renders in UI');
    w.castVote(ticker, 0, 1);
    assert(assemblyCompany.assemblyProposals[0].playerVoted, 'UI vote updates canonical proposal');
    w.resolveAssembly(ticker);
    assert(!assemblyCompany.assemblyScheduled, 'UI resolves canonical assembly');
    assert(!w.G.pendingAssemblies.length, 'Resolved assembly leaves UI');
    console.log('  Save/load keeps world, employment, personal life and decisions together');

    var calls = [];
    w.fetch = function (url, options) {
      var body = JSON.parse(options.body); calls.push({ url: url, body: body });
      var prompt = body.messages[1].content;
      var packet = prompt.indexOf('Personaggi ammessi') >= 0 ? { messages: [] } : prompt.indexOf('Descrivi una settimana') >= 0 ? { news: [{ title: 'Dossier ' + ticker, content: 'Il mercato rivaluta il dossier del desk.', company: ticker, impact: 'positive', priceChangePct: 1 }], notes: [], events: [] } : { briefing: 'Il mondo osserva il tuo mandato.', companies: [], competitors: [], corporateEvents: [] };
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ choices: [{ message: { content: JSON.stringify(packet) } }] }); } });
    };
    w.WolfLLM.saveSettings({ enabled: true, endpoint: 'https://model.test/v1/chat/completions', model: 'test-model', apiKey: '', timeoutMs: 1000 });
    await w.advanceTurn().completion;
    assert(calls.length >= 2 && calls.length <= 3, 'One world packet, one narrative packet, one inbox packet');
    calls.forEach(function (call) { assert(call.body.max_tokens > 0, 'OpenAI token parameter'); assert(!call.body.options, 'Native Ollama options not sent to OpenAI'); });
    assert(s.notifications.some(function (n) { return n.title === 'Dossier ' + ticker; }), 'LLM news reaches canonical state');
    assert(w.G.news.some(function (n) { return n.title === 'Dossier ' + ticker; }), 'LLM news reaches visible news feed');
    assert.strictEqual(w.LLMNarrativeEngine.getSettings().model, 'test-model', 'Shared settings reach narrative');
    assert.strictEqual(w.WolfLLM.getSettings().enabled, true, 'Settings remain enabled');
    console.log('  Mocked OpenAI provider -> shared configuration -> visible AI news');

    w.WolfLLM.saveSettings({ enabled: true, endpoint: 'http://localhost:11434/api/chat', timeoutMs: 100 });
    await w.WolfLLM.request('Test', 'Test');
    assert(calls[calls.length - 1].body.options.num_predict > 0, 'Ollama native token parameter');
    w.fetch = function () { return new Promise(function () {}); };
    var stalled = w.advanceTurn();
    await stalled.completion;
    assert(!w.DeskDirector.isBusy(), 'An unresponsive provider cannot freeze the game');
    assert(w.WolfLLM.status().error, 'Provider failure is reported');
    console.log('  Native Ollama format and timeout fallback');

    var oldTurn = w.advanceTurn();
    w.newGame(); var fresh = e.getState();
    await oldTurn.completion;
    assert.strictEqual(e.getState(), fresh, 'Late completion cannot replace new game');
    assert.strictEqual(w.G.week, 1, 'Late completion cannot advance new game');
    assert.strictEqual(fresh.desk.contracts.length, 0, 'No old mandates leak into new game');
    console.log('  New game isolates late provider responses');
    w.localStorage.setItem('sbt_autosave', JSON.stringify({ week: 8, year: 1, level: 0, cash: 0, positions: { OLDX: { shares: 10, avgCost: 20 } },
      companies: [{ ticker: 'OLDX', name: 'Legacy Holdings', sector: 'finance', price: 25, cap: 40000, vol: 0.02, div: 3 }], shorts: [], transactions: [], brokerCareer: { status: 'employed', employerId: 'meridian' } }));
    assert(w.loadAuto(), 'Legacy save migrates');
    assert.strictEqual(e.getState().player.cash, 0, 'Zero cash survives migration');
    assert(e.getState().portfolio.positions.OLDX, 'Legacy ticker holdings survive migration');
    closeEnough(e.getState().player.netWorth, 250, 'Legacy net worth restored');
    assert.strictEqual(e.getCompany('OLDX').sector, 'FIN', 'Legacy sector normalized');
    console.log('  Legacy saves retain zero cash and stocks outside the new universe');
    w.WolfLLM.saveSettings({ enabled: false });
    var migrated = e.getState(); migrated.player.week = 52;
    await w.LLMNarrativeEngine.processTurn(migrated);
    migrated.player.year = 2; migrated.player.week = 1;
    assert(await w.LLMNarrativeEngine.processTurn(migrated), 'Narrative continues after year rollover');
    console.log('  Narrative deduplication includes year as well as week');
  } finally {
    w.WolfLLM.cancel(); await w.happyDOM.abort(); w.close();
  }
  console.log('Connected gameplay tests passed.');
}
run().catch(function (error) { console.error(error); process.exit(1); });
