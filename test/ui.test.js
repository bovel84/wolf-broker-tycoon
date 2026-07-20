/**
 * Test di UI/UX headless.
 * Verificano che il build HTML includa schermata titolo, bottom nav e CSS responsive.
 */

var fs = require('fs');
var { Window } = require('happy-dom');

var html = fs.readFileSync(__dirname + '/../wolf-broker-tycoon.html', 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run() {
  console.log('Running UI/UX tests...');

  var window = new Window({ url: 'https://localhost' });
  var document = window.document;

  // Fai credere a Chart.js di esistere
  window.Chart = { register: function () {}, defaults: { font: { family: 'sans-serif' } } };

  document.write(html);

  // 1. Schermata titolo presente e accessibile
  var title = document.getElementById('wolfTitleScreen');
  assert(title, 'Schermata titolo mancante');
  assert(title.querySelector('button'), 'Schermata titolo senza pulsanti');

  // 2. Bottom nav mobile presente
  var bottomNav = document.getElementById('bottomNav');
  assert(bottomNav, 'Bottom nav mobile mancante');
  assert(bottomNav.querySelectorAll('button').length >= 4, 'Bottom nav con troppi pochi pulsanti');

  // 3. Menu mobile "Altro" presente
  var moreMenu = document.getElementById('mobileMoreMenu');
  assert(moreMenu, 'Menu mobile Altro mancante');

  // 4. Meta viewport corretta per mobile
  var viewport = document.querySelector('meta[name="viewport"]');
  assert(viewport, 'Meta viewport mancante');
  var content = viewport.getAttribute('content') || '';
  assert(content.indexOf('width=device-width') >= 0, 'Viewport non contiene width=device-width');
  assert(content.indexOf('viewport-fit=cover') >= 0, 'Viewport non ottimizzato per notch');

  // 5. Foglio di stile responsive inline presente
  var style = document.querySelector('style');
  assert(style, 'Tag style mancante');
  assert(style.textContent.indexOf('@media') >= 0, 'CSS senza media query responsive');
  assert(style.textContent.indexOf('bottom-nav') >= 0, 'CSS senza bottom nav');

  // 6. CDN Chart.js
  var scripts = document.querySelectorAll('script[src]');
  var hasChart = false;
  for (var i = 0; i < scripts.length; i++) {
    if ((scripts[i].getAttribute('src') || '').indexOf('chart.js') >= 0) hasChart = true;
  }
  assert(hasChart, 'CDN Chart.js mancante');

  // 7. View principali presenti
  var views = ['dashboard', 'market', 'portfolio', 'assembly', 'news', 'transactions', 'career', 'save', 'settings'];
  for (var v = 0; v < views.length; v++) {
    assert(document.getElementById('view-' + views[v]), 'View ' + views[v] + ' mancante');
  }

  console.log('UI/UX tests passed.');
}

run();
