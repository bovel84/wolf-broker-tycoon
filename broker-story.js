/*
 * broker-story.js
 * Origin story and reactive career narrative for Wolf Broker Tycoon.
 * Original characters, persistent choices and LLM-assisted scenes.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'wbt_broker_story_v1';
  var VERSION = '1.0.0';
  var installed = false;
  var state = null;
  var originalStart = null;
  var originalLoad = null;
  var originalAdvance = null;
  var pendingChapter = null;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function getGame() {
    try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; }
  }
  function netWorth() {
    try { return typeof computeNetWorth === 'function' ? computeNetWorth() : ((getGame() && getGame().cash) || 0); } catch (e) { return 0; }
  }
  function safe(value, max) {
    return String(value || '').replace(/[<>]/g, '').substring(0, max || 300);
  }
  function save() {
    try { if (global.localStorage && state) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) state = JSON.parse(raw);
    } catch (e) { state = null; }
    if (!state) state = createState();
    return state;
  }
  function createState() {
    return {
      version: VERSION,
      prologueSeen: false,
      name: 'Alex Moretti',
      origin: null,
      vow: null,
      firstChoice: null,
      ethics: 50,
      nerve: 50,
      loyalty: 50,
      ambition: 50,
      act: 0,
      unlocked: {},
      decisions: [],
      journal: [],
      relationships: {
        elena: 50,
        victor: 35,
        iris: 25,
        inspector: 10
      },
      ending: null
    };
  }

  var ORIGINS = {
    analyst: {
      label: 'Analista invisibile',
      description: 'Sai leggere i bilanci meglio delle persone. Nessuno, però, ricorda il tuo nome.',
      ethics: 5,
      nerve: -5,
      ambition: 5,
      gift: 'Occhio per i fondamentali'
    },
    seller: {
      label: 'Venditore nato',
      description: 'Sai trasformare un dubbio in un sì. Il telefono è sempre stato la tua arma.',
      ethics: -3,
      nerve: 8,
      ambition: 7,
      gift: 'Carisma commerciale'
    },
    outsider: {
      label: 'Figlio della periferia',
      description: 'Non hai contatti né protezioni. Hai imparato a sopravvivere osservando chi comandava.',
      ethics: 3,
      nerve: 6,
      loyalty: 7,
      gift: 'Istinto di sopravvivenza'
    }
  };

  var VOWS = {
    family: {
      label: 'Proteggerò la mia famiglia',
      description: 'Il denaro sarà uno scudo, non un padrone.',
      loyalty: 10,
      ethics: 6,
      ambition: 2
    },
    power: {
      label: 'Nessuno mi ignorerà più',
      description: 'Entrerai nella stanza da sconosciuto e ne uscirai da padrone.',
      ambition: 12,
      nerve: 6,
      ethics: -5
    },
    truth: {
      label: 'Scoprirò chi ha distrutto mio padre',
      description: 'Dietro il fallimento c’è un ordine firmato da qualcuno che vive ancora ai piani alti.',
      ambition: 6,
      nerve: 4,
      ethics: 5
    }
  };

  var CHAPTERS = [
    {
      id: 'first_order',
      act: 1,
      title: 'Il primo ordine',
      kicker: 'Una voce dall’altro capo del filo',
      condition: function (g) { return g && g.stats && g.stats.totalTrades >= 1; },
      text: 'La sala operativa non applaude. Cento telefoni continuano a squillare mentre sul monitor compare il tuo primo ordine eseguito. Elena Valli, la collega che ti ha insegnato a non tremare, posa una mano sulla tua scrivania: “Ricordati questa sensazione. Il primo guadagno ti fa credere che il mercato ti conosca. Non è vero.”',
      choices: [
        { id: 'disciplina', label: 'Annota ogni dettaglio', reply: 'Decidi che nessun guadagno sarà mai soltanto fortuna.', effects: { ethics: 5, nerve: 2, ambition: 1, elena: 8 } },
        { id: 'celebra', label: 'Offri da bere alla sala', reply: 'Per una notte sei uno di loro. Domani dovrai dimostrare di meritarlo.', effects: { loyalty: 5, ambition: 3, cash: -250, elena: 2 } },
        { id: 'raddoppia', label: 'Prepara subito il prossimo colpo', reply: 'Non guardi il profitto. Guardi quanto sarebbe potuto essere più grande.', effects: { ambition: 8, nerve: 5, ethics: -3, victor: 4 } }
      ]
    },
    {
      id: 'red_week',
      act: 1,
      title: 'La settimana rossa',
      kicker: 'Il mercato presenta il conto',
      condition: function (g) { return g && (netWorth() < g.startingCash * 0.88 || g.realizedPnL < -1500); },
      text: 'Il rosso sul monitor sembra più acceso del solito. Non è un numero: sono mesi di affitto, telefonate evitate, promesse fatte. Elena ti trova ancora alla scrivania quando le luci del piano si spengono. “Puoi inseguire la perdita,” dice, “oppure capire perché ti ha trovato.”',
      choices: [
        { id: 'accetta', label: 'Chiudi e studia l’errore', reply: 'La perdita resta, ma smette di comandarti.', effects: { ethics: 6, nerve: 6, ambition: -2, elena: 8 } },
        { id: 'rivalsa', label: 'Rischia il doppio', reply: 'Trasformi la paura in carburante. È potente. È anche pericoloso.', effects: { nerve: 10, ambition: 8, ethics: -5, victor: 5 } },
        { id: 'colpa', label: 'Incolpa il mercato', reply: 'Proteggi il tuo orgoglio e perdi una parte della verità.', effects: { nerve: -4, loyalty: -4, ethics: -3, elena: -6 } }
      ]
    },
    {
      id: 'the_rival',
      act: 2,
      title: 'L’uomo al tavolo d’angolo',
      kicker: 'Victor Kane conosce già il tuo nome',
      condition: function (g) { return g && g.week >= 5; },
      text: 'Victor Kane ti aspetta nel ristorante sotto la borsa. Non ordina. Non ne ha bisogno. Sul tavolo c’è una cartella con le tue ultime operazioni, annotate a mano. “Non sei ancora ricco,” dice. “Ma sei interessante. Posso renderti entrambe le cose.” La sua offerta ha una sola clausola: quando chiamerà, dovrai rispondere.',
      choices: [
        { id: 'alleanza', label: 'Accetta il patto', reply: 'Victor sorride senza calore. Hai ottenuto un alleato e forse un creditore.', effects: { ambition: 10, ethics: -8, victor: 18, elena: -5, cash: 2500 } },
        { id: 'rifiuto', label: 'Rifiuta senza abbassare lo sguardo', reply: 'Victor chiude la cartella. Adesso ti considera un avversario.', effects: { nerve: 10, ethics: 7, victor: -15, elena: 5 } },
        { id: 'doppio', label: 'Fingi di accettare', reply: 'Entri nel gioco convinto di poter controllare le regole.', effects: { nerve: 7, ambition: 7, ethics: -10, victor: 5, inspector: 4 } }
      ]
    },
    {
      id: 'boardroom',
      act: 2,
      title: 'La stanza senza finestre',
      kicker: 'Le azioni diventano potere',
      condition: function () {
        var ws = global.WorldEngine && global.WorldEngine.getState ? global.WorldEngine.getState() : null;
        return !!(ws && (ws.openAssembly || (ws.assemblyLog && ws.assemblyLog.length)));
      },
      text: 'Fuori dalla sala del consiglio, il tuo patrimonio è un numero. Dentro, è una voce. Amministratori, fondi e rivali misurano ogni parola in percentuali. Iris Vale, consulente dei grandi azionisti, ti offre i voti necessari per cambiare il destino della società. In cambio vuole un posto nella tua futura holding.',
      choices: [
        { id: 'coalizione', label: 'Costruisci una coalizione trasparente', reply: 'Il potere arriva più lentamente, ma tutti sanno chi sei e cosa difendi.', effects: { ethics: 10, loyalty: 7, iris: 12, ambition: 3 } },
        { id: 'scambio', label: 'Scambia favori in segreto', reply: 'La delibera passa prima ancora che inizi la votazione.', effects: { ethics: -12, ambition: 10, iris: 18, inspector: 6 } },
        { id: 'indipendente', label: 'Vota da solo', reply: 'Potresti perdere oggi. Nessuno potrà dire di averti comprato.', effects: { nerve: 8, ethics: 6, iris: -5 } }
      ]
    },
    {
      id: 'fifty_thousand',
      act: 3,
      title: 'Cinquantamila ragioni',
      kicker: 'La cifra che doveva cambiare tutto',
      condition: function () { return netWorth() >= 50000; },
      text: 'Quando il patrimonio supera cinquantamila, non senti nulla. Nessun tuono, nessuna porta che si apre. Torni a casa e trovi sul tavolo la vecchia lettera di pignoramento di tuo padre. Elena ti chiede se adesso sia abbastanza. Non sai rispondere.',
      choices: [
        { id: 'debito', label: 'Ripaga il vecchio debito', reply: 'Per la prima volta il passato perde interessi.', effects: { cash: -10000, ethics: 12, loyalty: 10, elena: 12 } },
        { id: 'fondo', label: 'Crea il tuo primo fondo', reply: 'Il denaro smette di essere una via d’uscita. Diventa un esercito.', effects: { cash: -5000, ambition: 15, nerve: 5, victor: 6 } },
        { id: 'indagine', label: 'Segui la firma sulla lettera', reply: 'La firma conduce a una società che compare ancora nei registri del mercato.', effects: { ambition: 8, ethics: 5, inspector: 8 } }
      ]
    },
    {
      id: 'investigation',
      act: 3,
      title: 'Il fascicolo grigio',
      kicker: 'Ogni operazione lascia un’ombra',
      condition: function (g) { return g && g.week >= 18 && (state.ethics < 42 || state.relationships.inspector >= 12); },
      text: 'L’ispettore Adrian Cole non alza mai la voce. Fa scorrere sul tavolo date, ordini e coincidenze. “Non devo dimostrare che sei cattivo,” dice. “Devo dimostrare che sapevi.” Fuori dalla stanza Victor aspetta una telefonata. Elena aspetta la verità.',
      choices: [
        { id: 'collabora', label: 'Consegna i registri', reply: 'Salvi una parte di te e perdi la fiducia di chi prosperava nel silenzio.', effects: { ethics: 18, inspector: 20, victor: -18, elena: 8, cash: -5000 } },
        { id: 'silenzio', label: 'Non dire nulla', reply: 'Il silenzio protegge tutti. Per ora.', effects: { loyalty: 10, nerve: 8, ethics: -7, inspector: 10 } },
        { id: 'depista', label: 'Costruisci una versione alternativa', reply: 'La menzogna regge. Il suo costo arriverà più avanti.', effects: { nerve: 10, ambition: 6, ethics: -18, inspector: 18 } }
      ]
    },
    {
      id: 'empire',
      act: 4,
      title: 'Un impero con il tuo nome',
      kicker: 'La vetta è più silenziosa del previsto',
      condition: function () { return netWorth() >= 250000; },
      text: 'Dall’ultimo piano la città sembra un circuito stampato. Le società rispondono alle tue telefonate, i rivali reagiscono alle tue mosse, le assemblee aspettano il tuo voto. Hai costruito ciò che desideravi. Ora devi decidere che cosa diventerà senza di te.',
      choices: [
        { id: 'istituzione', label: 'Costruisci un’istituzione solida', reply: 'Il tuo nome vale meno della fiducia che lasci dietro di te.', effects: { ethics: 15, loyalty: 12, ambition: 4, elena: 8 } },
        { id: 'dominio', label: 'Prendi il controllo del mercato', reply: 'Non vuoi essere ricordato come il migliore. Vuoi essere inevitabile.', effects: { ambition: 18, nerve: 8, ethics: -15, victor: 10 } },
        { id: 'uscita', label: 'Prepara la tua uscita', reply: 'Per la prima volta pianifichi una mossa che non richiede un altro rischio.', effects: { ethics: 8, nerve: 6, loyalty: 6 } }
      ]
    },
    {
      id: 'legacy',
      act: 5,
      title: 'La campana finale',
      kicker: 'Il mercato chiude. La storia resta.',
      condition: function (g) { return g && (g.week >= 52 || netWorth() >= 500000); },
      text: 'Un anno dopo la prima telefonata, torni davanti alla stessa vetrata. La città non ricorda i prezzi di ieri; ricorda chi è rimasto in piedi quando sono crollati. Sul tavolo ci sono tre lettere: una di Elena, una di Victor, una dell’ispettore Cole. Quale aprirai determinerà l’ultima riga della tua storia.',
      choices: [
        { id: 'persone', label: 'Apri la lettera di Elena', reply: 'Scegli le persone che conoscevano il tuo nome prima che valesse qualcosa.', effects: { ethics: 15, loyalty: 18, elena: 20 }, ending: 'custode' },
        { id: 'potere', label: 'Apri la lettera di Victor', reply: 'Il mercato non avrà mai un padrone. Ma continuerai a provarci.', effects: { ambition: 20, ethics: -10, victor: 15 }, ending: 'lupo' },
        { id: 'verita', label: 'Apri la lettera dell’ispettore', reply: 'Decidi che la verità è l’unico patrimonio che non può essere sequestrato.', effects: { ethics: 20, nerve: 12, inspector: 20 }, ending: 'testimone' }
      ]
    }
  ];

  function addJournal(title, text, type) {
    state.journal.unshift({
      week: (getGame() && getGame().week) || 1,
      title: safe(title, 100),
      text: safe(text, 500),
      type: type || 'story'
    });
    state.journal = state.journal.slice(0, 40);
  }

  function applyEffects(effects) {
    var g = getGame();
    effects = effects || {};
    state.ethics = clamp(state.ethics + (effects.ethics || 0), 0, 100);
    state.nerve = clamp(state.nerve + (effects.nerve || 0), 0, 100);
    state.loyalty = clamp(state.loyalty + (effects.loyalty || 0), 0, 100);
    state.ambition = clamp(state.ambition + (effects.ambition || 0), 0, 100);
    if (g && typeof effects.cash === 'number') g.cash = Math.max(0, g.cash + effects.cash);
    var people = ['elena', 'victor', 'iris', 'inspector'];
    for (var i = 0; i < people.length; i++) {
      if (typeof effects[people[i]] === 'number') {
        state.relationships[people[i]] = clamp(state.relationships[people[i]] + effects[people[i]], 0, 100);
      }
    }
  }

  function chooseOrigin(id) {
    var origin = ORIGINS[id] || ORIGINS.outsider;
    state.origin = id;
    applyEffects(origin);
    save();
    renderPrologue(2);
  }
  function chooseVow(id) {
    var vow = VOWS[id] || VOWS.family;
    state.vow = id;
    applyEffects(vow);
    save();
    renderPrologue(3);
  }
  function chooseEnvelope(id) {
    state.firstChoice = id;
    if (id === 'return') applyEffects({ ethics: 10, loyalty: 5, elena: 6 });
    if (id === 'use') applyEffects({ ambition: 10, nerve: 8, ethics: -8, victor: 5 });
    if (id === 'copy') applyEffects({ ambition: 6, nerve: 4, ethics: -2, inspector: 5 });
    addJournal('Prologo — La busta', id === 'return' ? 'Hai restituito la busta senza aprirla.' : (id === 'use' ? 'Hai deciso di usare i nomi contenuti nella busta.' : 'Hai copiato il contenuto prima di restituirla.'), 'prologue');
    save();
    renderPrologue(4);
  }

  function startCareer() {
    var overlay = document.getElementById('broker-prologue');
    if (overlay) overlay.style.display = 'none';
    state.prologueSeen = true;
    state.act = 1;
    state.unlocked.prologue = true;
    addJournal('Prologo — La chiamata delle 6:17', 'Hai attraversato le porte della sala operativa con diecimila euro, un debito di famiglia e una promessa che il mercato metterà alla prova.', 'prologue');
    save();
    if (originalStart) originalStart();
    var g = getGame();
    if (g) {
      g.brokerName = state.name;
      g.storyEthics = state.ethics;
      g.storyAct = state.act;
      saveGameIfPossible();
    }
    renderCareerPanel();
  }

  function saveGameIfPossible() {
    try {
      var g = getGame();
      if (g && state) g.brokerStory = JSON.parse(JSON.stringify(state));
      if (typeof saveAuto === 'function') saveAuto();
    } catch (e) {}
  }

  function showPrologue() {
    load();
    ensureUI();
    var overlay = document.getElementById('broker-prologue');
    if (overlay) overlay.style.display = 'flex';
    renderPrologue(0);
  }

  function renderPrologue(step) {
    var body = document.getElementById('broker-prologue-body');
    if (!body) return;
    var name = safe(state.name || 'Alex Moretti', 40);
    if (step === 0) {
      body.innerHTML = '<div class="broker-eyebrow">PROLOGO · 6:17 DEL MATTINO</div><h1>La chiamata che non doveva arrivare</h1><p>La pioggia trasforma le luci del distretto finanziario in strisce d’oro sporco. Hai diecimila euro sul conto, quarantacinquemila di debiti lasciati da tuo padre e una scatola con tutto ciò che resta del suo ufficio.</p><p>Il telefono squilla. Una voce sconosciuta pronuncia il tuo nome e dice soltanto: “Se vuoi sapere perché è fallito, presentati all’apertura. Porta la busta che non hai ancora trovato.”</p><label class="broker-label">Il nome del tuo broker</label><input id="broker-name-input" class="broker-input" maxlength="32" value="' + name + '"><button class="broker-primary" onclick="BrokerStory.prologueNext()">Rispondi alla chiamata</button>';
      return;
    }
    if (step === 1) {
      body.innerHTML = '<div class="broker-eyebrow">PRIMA DI WALL STREET</div><h1>Chi eri prima che il mercato ti vedesse?</h1><div class="broker-choice-grid">' + originButton('analyst') + originButton('seller') + originButton('outsider') + '</div>';
      return;
    }
    if (step === 2) {
      body.innerHTML = '<div class="broker-eyebrow">LA PROMESSA</div><h1>Davanti alla porta giuri una cosa</h1><p>Tra pochi minuti sarai soltanto un’altra voce in una sala piena di predatori. Scegli ciò che non vuoi perdere.</p><div class="broker-choice-grid">' + vowButton('family') + vowButton('power') + vowButton('truth') + '</div>';
      return;
    }
    if (step === 3) {
      body.innerHTML = '<div class="broker-eyebrow">LA BUSTA</div><h1>Il primo segreto</h1><p>La trovi nel doppio fondo della scatola. Dentro ci sono ordini firmati, nomi di società e una nota: <em>Non è stato il mercato. Qualcuno ha scelto chi doveva cadere.</em></p><div class="broker-choice-grid"><button onclick="BrokerStory.envelope(\'return\')"><strong>Restituiscila chiusa</strong><span>Vuoi risposte, ma non a qualsiasi prezzo.</span></button><button onclick="BrokerStory.envelope(\'use\')"><strong>Usa quei nomi</strong><span>Se sono colpevoli, il loro denaro pagherà il debito.</span></button><button onclick="BrokerStory.envelope(\'copy\')"><strong>Copiala e restituiscila</strong><span>La fiducia è utile. Una copia lo è di più.</span></button></div>';
      return;
    }
    body.innerHTML = '<div class="broker-eyebrow">ATTO I · IL PREZZO DI UN NOME</div><h1>Fuori dalla sala operativa</h1><p>' + safe(state.name, 40) + ', nessuna scrivania porta ancora il tuo nome. Sei disoccupato, hai diecimila euro di risparmi e sei società ricevono candidature. Elena Valli può presentarti a un recruiter. Victor Kane osserva chi è disposto a vendersi pur di entrare. Da qualche parte, l’ispettore Adrian Cole apre un fascicolo ancora senza titolo.</p><p class="broker-quote">“Il mercato non chiede chi sei. Prima devi convincere qualcuno a lasciarti entrare.”</p><button class="broker-primary" onclick="BrokerStory.begin()">Cerca il primo lavoro</button>';
  }

  function originButton(id) {
    var item = ORIGINS[id];
    return '<button onclick="BrokerStory.origin(\'' + id + '\')"><strong>' + item.label + '</strong><span>' + item.description + '</span><em>' + item.gift + '</em></button>';
  }
  function vowButton(id) {
    var item = VOWS[id];
    return '<button onclick="BrokerStory.vow(\'' + id + '\')"><strong>' + item.label + '</strong><span>' + item.description + '</span></button>';
  }
  function prologueNext() {
    var input = document.getElementById('broker-name-input');
    if (input && input.value.trim()) state.name = safe(input.value.trim(), 32);
    save();
    renderPrologue(1);
  }

  function evaluateChapters() {
    var g = getGame();
    if (!state || !state.prologueSeen || !g || pendingChapter) return;
    for (var i = 0; i < CHAPTERS.length; i++) {
      var chapter = CHAPTERS[i];
      if (!state.unlocked[chapter.id] && chapter.condition(g)) {
        pendingChapter = chapter;
        showChapter(chapter);
        return;
      }
    }
  }

  function showChapter(chapter) {
    ensureUI();
    var modal = document.getElementById('broker-chapter-modal');
    var body = document.getElementById('broker-chapter-body');
    if (!modal || !body) return;
    body.innerHTML = '<div class="broker-eyebrow">ATTO ' + chapter.act + ' · ' + safe(chapter.kicker, 100) + '</div><h2>' + safe(chapter.title, 100) + '</h2><p id="broker-chapter-text">' + safe(chapter.text, 800) + '</p><div class="broker-choice-grid">' + chapterChoices(chapter) + '</div>';
    modal.style.display = 'flex';
    enrichChapter(chapter);
  }

  function chapterChoices(chapter) {
    var html = '';
    for (var i = 0; i < chapter.choices.length; i++) {
      var choice = chapter.choices[i];
      html += '<button onclick="BrokerStory.choose(\'' + chapter.id + '\',\'' + choice.id + '\')"><strong>' + safe(choice.label, 80) + '</strong></button>';
    }
    return html;
  }

  function enrichChapter(chapter) {
    if (!global.LLMGameMaster || !global.LLMGameMaster.generateDialogue || !global.LLMGameMaster.isAvailable || !global.LLMGameMaster.isAvailable()) return;
    var g = getGame();
    var world = global.WorldEngine && global.WorldEngine.getState ? global.WorldEngine.getState() : null;
    var context = chapter.text + ' Profilo: ' + JSON.stringify(getContext()) + '. Ultimo evento mondiale: ' + safe(world && world.lastBriefing, 250);
    global.LLMGameMaster.generateDialogue({ name: 'Voce della Citta', role: 'Narratore finanziario' }, context, {
      week: g.week,
      year: g.year || 1987,
      level: g.level || 0,
      reputation: state.ethics,
      netWorth: netWorth()
    }).then(function (result) {
      var text = document.getElementById('broker-chapter-text');
      if (text && pendingChapter && pendingChapter.id === chapter.id && result && result.text) {
        text.innerHTML = safe(chapter.text, 800) + '<br><br><em>' + safe(result.text, 500) + '</em>';
      }
    }).catch(function () {});
  }

  function chooseChapter(chapterId, choiceId) {
    var chapter = null;
    var choice = null;
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (CHAPTERS[i].id === chapterId) chapter = CHAPTERS[i];
    }
    if (!chapter) return;
    for (var j = 0; j < chapter.choices.length; j++) {
      if (chapter.choices[j].id === choiceId) choice = chapter.choices[j];
    }
    if (!choice) return;
    applyEffects(choice.effects);
    state.unlocked[chapter.id] = true;
    state.act = Math.max(state.act, chapter.act);
    if (choice.ending) state.ending = choice.ending;
    state.decisions.push({ week: (getGame() && getGame().week) || 1, chapter: chapter.id, choice: choice.id });
    addJournal(chapter.title, choice.reply, choice.ending ? 'ending' : 'chapter');
    var g = getGame();
    if (g) {
      g.storyEthics = state.ethics;
      g.storyAct = state.act;
    }
    save();
    saveGameIfPossible();
    var modal = document.getElementById('broker-chapter-modal');
    if (modal) modal.style.display = 'none';
    pendingChapter = null;
    renderCareerPanel();
    if (typeof renderAll === 'function') renderAll();
  }

  function getContext() {
    if (!state) load();
    return {
      name: state.name,
      origin: state.origin,
      vow: state.vow,
      firstChoice: state.firstChoice,
      ethics: state.ethics,
      nerve: state.nerve,
      loyalty: state.loyalty,
      ambition: state.ambition,
      act: state.act,
      ending: state.ending,
      latestDecision: state.decisions.length ? state.decisions[state.decisions.length - 1] : null,
      relationships: state.relationships
    };
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('broker-story-style')) {
      var style = document.createElement('style');
      style.id = 'broker-story-style';
      style.textContent = '#broker-prologue,#broker-chapter-modal{position:fixed;inset:0;z-index:10050;background:radial-gradient(circle at 70% 20%,rgba(34,48,78,.96),rgba(4,7,13,.99) 62%);display:none;align-items:center;justify-content:center;padding:18px;color:#e8edf7}.broker-story-shell{width:min(760px,100%);max-height:92vh;overflow:auto;background:linear-gradient(145deg,rgba(19,27,45,.98),rgba(8,12,22,.98));border:1px solid rgba(212,175,55,.45);box-shadow:0 25px 80px rgba(0,0,0,.65);border-radius:14px;padding:clamp(22px,5vw,50px)}.broker-story-shell h1{font-size:clamp(28px,6vw,54px);line-height:1.02;margin:8px 0 22px;color:#f4e5b5}.broker-story-shell h2{font-size:clamp(25px,5vw,40px);color:#f4e5b5}.broker-story-shell p{line-height:1.7;color:#bac5d8;font-size:15px}.broker-eyebrow{font-size:11px;letter-spacing:3px;color:#d4af37;font-weight:800}.broker-label{display:block;margin:24px 0 7px;color:#8f9bb2;font-size:11px;text-transform:uppercase;letter-spacing:1px}.broker-input{width:100%;background:#090e19;border:1px solid #33405a;color:#fff;border-radius:7px;padding:13px;font-size:17px;margin-bottom:14px}.broker-primary{background:linear-gradient(135deg,#d4af37,#ad7c21)!important;color:#070707!important;border:0!important;padding:13px 22px!important;border-radius:7px!important;font-weight:800!important;cursor:pointer}.broker-choice-grid{display:grid;gap:10px;margin-top:22px}.broker-choice-grid button{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:14px 16px;background:#111a2b;border:1px solid #2d3a53;color:#e7edf8;border-radius:9px;cursor:pointer;transition:.18s}.broker-choice-grid button:hover{border-color:#d4af37;transform:translateY(-1px)}.broker-choice-grid button span{font-size:12px;color:#9aa7bd;margin-top:5px;line-height:1.4}.broker-choice-grid button em{font-size:10px;color:#d4af37;margin-top:8px}.broker-quote{border-left:3px solid #d4af37;padding-left:15px;font-style:italic}.story-meter{height:5px;background:#202b3f;border-radius:9px;overflow:hidden;margin-top:4px}.story-meter span{display:block;height:100%;background:linear-gradient(90deg,#3b82f6,#d4af37)}.story-journal-item{padding:8px 0;border-bottom:1px solid var(--border)}@media(max-width:640px){.broker-story-shell{padding:22px 16px;border-radius:0;max-height:100vh;height:100%}}';
      document.head.appendChild(style);
    }
    if (!document.getElementById('broker-prologue')) {
      var prologue = document.createElement('div');
      prologue.id = 'broker-prologue';
      prologue.innerHTML = '<div class="broker-story-shell" id="broker-prologue-body"></div>';
      document.body.appendChild(prologue);
    }
    if (!document.getElementById('broker-chapter-modal')) {
      var modal = document.createElement('div');
      modal.id = 'broker-chapter-modal';
      modal.innerHTML = '<div class="broker-story-shell" id="broker-chapter-body"></div>';
      document.body.appendChild(modal);
    }
  }

  function renderCareerPanel() {
    if (typeof document === 'undefined' || !state) return;
    var view = document.getElementById('view-career');
    if (!view) return;
    var panel = document.getElementById('broker-story-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'broker-story-panel';
      panel.className = 'card';
      view.insertBefore(panel, view.firstChild);
    }
    var origin = ORIGINS[state.origin] || ORIGINS.outsider;
    var vow = VOWS[state.vow] || VOWS.family;
    var html = '<h3>📖 La storia di ' + safe(state.name, 40) + '</h3><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="pill y">Atto ' + state.act + '</span><span class="gray" style="font-size:11px">' + origin.label + ' · ' + vow.label + '</span></div>';
    html += meters();
    html += '<div style="margin-top:12px"><strong style="font-size:12px">Diario</strong>';
    if (!state.journal.length) html += '<div class="gray" style="font-size:11px;margin-top:6px">La tua storia deve ancora cominciare.</div>';
    for (var i = 0; i < state.journal.length && i < 5; i++) {
      html += '<div class="story-journal-item"><div style="font-size:11px;color:#d4af37">Sett. ' + state.journal[i].week + ' · ' + safe(state.journal[i].title, 80) + '</div><div class="gray" style="font-size:11px;margin-top:2px">' + safe(state.journal[i].text, 220) + '</div></div>';
    }
    html += '</div>';
    panel.innerHTML = html;
  }

  function meters() {
    var items = [
      ['Etica', state.ethics],
      ['Nervi', state.nerve],
      ['Lealta', state.loyalty],
      ['Ambizione', state.ambition]
    ];
    var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    for (var i = 0; i < items.length; i++) {
      html += '<div style="font-size:10px;color:var(--text2)"><div style="display:flex;justify-content:space-between"><span>' + items[i][0] + '</span><span>' + items[i][1] + '</span></div><div class="story-meter"><span style="width:' + items[i][1] + '%"></span></div></div>';
    }
    return html + '</div>';
  }

  function install() {
    if (installed) return;
    installed = true;
    load();
    var currentGame = getGame();
    if (currentGame && currentGame.brokerStory) {
      state = currentGame.brokerStory;
      save();
    }
    ensureUI();
    if (typeof wolfStartGame === 'function') {
      originalStart = wolfStartGame;
      global.wolfStartGame = function () {
        state = createState();
        save();
        showPrologue();
      };
    }
    if (typeof wolfLoadGame === 'function') {
      originalLoad = wolfLoadGame;
      global.wolfLoadGame = function () {
        originalLoad();
        var loadedGame = getGame();
        if (loadedGame && loadedGame.brokerStory) {
          state = loadedGame.brokerStory;
          save();
        }
        renderCareerPanel();
        global.setTimeout(evaluateChapters, 100);
      };
    }
    if (typeof advanceTurn === 'function') {
      originalAdvance = advanceTurn;
      global.advanceTurn = function () {
        originalAdvance();
        global.setTimeout(function () {
          evaluateChapters();
          renderCareerPanel();
        }, 50);
      };
    }
    renderCareerPanel();
    if (state.prologueSeen) global.setTimeout(evaluateChapters, 150);
  }

  global.BrokerStory = {
    install: install,
    showPrologue: showPrologue,
    prologueNext: prologueNext,
    origin: chooseOrigin,
    vow: chooseVow,
    envelope: chooseEnvelope,
    begin: startCareer,
    choose: chooseChapter,
    evaluate: evaluateChapters,
    render: renderCareerPanel,
    getContext: getContext,
    adjustTraits: function (effects, reason) {
      applyEffects(effects || {});
      if (reason) addJournal('Conseguenze professionali', reason, 'career');
      save();
      saveGameIfPossible();
      renderCareerPanel();
      return getContext();
    },
    reset: function () {
      try { if (global.localStorage) global.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      state = createState();
      save();
    },
    version: VERSION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.BrokerStory;
  if (typeof document !== 'undefined') global.setTimeout(install, 0);
})(typeof window !== 'undefined' ? window : this);
