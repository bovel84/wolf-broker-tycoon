/**
 * Competitor Engine — Wolf of Wall Street Broker Tycoon
 * Modulo AI per 10 competitor con strategie, OPA, eventi, sfide e dialoghi
 * Vanilla JS, zero dipendenze
 */
(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const COMMISSION_RATE = 0.001; // 0.1% per trade
  const SEC_INVESTIGATION_CHANCE = 0.02;
  const OPA_PREMIUM_MIN = 0.2;
  const OPA_PREMIUM_MAX = 0.5;
  const CHALLENGE_DURATION_WEEKS = 4;
  const MAX_PORTFOLIO_POSITIONS = 12;

  // ============================================================
  // UTILITY
  // ============================================================
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function round2(v) { return Math.round(v * 100) / 100; }
  function weightedRandom(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, w] of Object.entries(weights)) {
      r -= w;
      if (r <= 0) return key;
    }
    return Object.keys(weights)[Object.keys(weights).length - 1];
  }

  // ============================================================
  // DIALOGHI per competitor
  // ============================================================
  const DIALOGUES = {
    squalo: {
      taunt: [
        "Hai visto le mie posizioni? Sto facendo a pezzi il mercato, rookie.",
        "Tu compri, io vendo short. Vediamo chi resta in piedi.",
        "Il tuo portafoglio è così patetico che quasi mi dispiace.",
        "Questa settimana ti ho spazzato via. Riprovaci.",
        "Io non perdo. Mai. Accettalo.",
        "Sei solo un pesce piccolo nel mio oceano.",
        "Stai giocando con i soldi veri? Sembri un bambino all'asilo.",
        "Ho appena shortato tutto quello che hai in portafoglio. Buona fortuna.",
        "La differenza tra me e te? Io ci sono nato, tu ci stai provando.",
        "Pump and dump, baby. Se non lo fai tu, lo faccio io sulle tue posizioni."
      ],
      praise: [
        "Ok, devo ammetterlo. Hai fatto centro. Questa volta mi hai fregato.",
        "Non male per un principiante. Forse hai del potenziale.",
        "Bel colpo. Ma non ti ci abituare.",
        "Rispetto. Hai balls. Ma non basta.",
        "Hai appena guadagnato un po' del mio rispetto. Un po'."
      ],
      challenge: [
        "Ti sfido: chi fa più profitto in 4 settimane? O hai paura?",
        "Scommettiamo 50K chi di noi finisce l'anno con più patrimonio?",
        "Vediamo chi shorta meglio. Prendi una società a caso, chi ci guadagna di più?",
        "Sfida aperta: pump and dump. Chi pompa e vende meglio vince."
      ],
      insider: [
        "Ah, insider trading? Pensavo avessi più fegato. O forse sei solo stupido.",
        "La SEC ti sta guardando. Ma tanto non mi frega, io sono pulito.",
        "Bella mossa da insider. Peccato che l'avevo già fatta io ieri."
      ],
      opa: [
        "Voglio quella società. Vendimela o me la prendo con la forza.",
        "Ti faccio un'offerta che non puoi rifiutare. OPA ostile, preparati.",
        "Ho comprato abbastanza quote per starti sul culo. Vendimi il resto."
      ],
      bankrupt: [
        "È finita. Mi hanno spazzato via. Ma tornerò.",
        "Non è un addio. È un arrivederci. E quando torno, ti faccio secchi."
      ]
    },
    volpe: {
      taunt: [
        "Mentre tu guardi i grafici, io studio le fusioni. Indovina chi vince?",
        "La guerra non si vince con la forza, ma con la strategia. Imparalo.",
        "Ho appena orchestrato un'acquisizione che ti farà piangere.",
        "Tu vedi numeri. Io vedo mosse. Tre passi avanti a te.",
        "Pazienza, caro. La volpe aspetta il momento giusto.",
        "Hai fretta? Sbagliato. I soldi veri li fai aspettando.",
        "Ogni tua mossa è prevedibile. Leggo i tuoi trade come un libro aperto.",
        "Non combatto battaglie che non posso vincere. Tu sì. Ecco la differenza.",
        "Il mercato è una scacchiera. Tu giochi a dama.",
        "Ho appena piazzato le pedine per la mia prossima mossa. Guarda e impara."
      ],
      praise: [
        "Interessante. Hai una visione. Forse possiamo fare affari.",
        "Non me lo aspettavo. Sei più astuto di quanto sembri.",
        "Bella mossa. L'avevo considerata anch'io, ma sei stato più veloce.",
        "Complimenti. Raramente ammiro qualcuno. Ma tu... forse."
      ],
      challenge: [
        "Ti propongo una sfida: chi identifica la prossima fusione prima dell'annuncio?",
        "Giochiamo a chi costruisce il portafoglio più bilanciato in 8 settimane.",
        "Sfida di strategia: chi fa più profitto con operazioni di M&A?"
      ],
      insider: [
        "Se fai insider trading, fallo bene. O lascia perdere. La mediocrità mi offende.",
        "Ho sentito voci su di te e la SEC. Spero per te che siano solo voci.",
        "L'insider trading è un'arte. Tu stai scarabocchiando."
      ],
      opa: [
        "Ho studiato la tua posizione. So esattamente quanto vali. Offro il 30% sopra.",
        "Non voglio distruggerti. Voglio comprarti. A un prezzo equo.",
        "Fusioni e acquisizioni sono il mio campo. Lasciami fare o ti supero."
      ],
      bankrupt: [
        "La volpe cade in piedi. Tornerò con un nuovo piano.",
        "Questa partita è persa. Ma la guerra continua."
      ]
    },
    toro: {
      taunt: [
        "Il mercato sale sempre. Se non ci credi, sei nel posto sbagliato.",
        "Compra e tieni. Semplice. Ma pochi hanno le palle per farlo.",
        "Vendi? Ma che fai? Il mercato è in rialzo! Sei pazzo?",
        "Io guardo al lungo termine. Tu fai trading come un pollo senza testa.",
        "Le blue chip non tradiscono mai. Impara.",
        "Ho comprato quando tutti vendevano. Ora guarda chi ride.",
        "La pazienza paga. Sempre. Ma tu non hai pazienza.",
        "Crisi? Quale crisi? È un'opportunità di acquisto!",
        "Io non vendo mai. I dividendi sono i miei migliori amici.",
        "Il toro carica sempre. Anche quando piove."
      ],
      praise: [
        "Grande! Hai tenuto duro. Questa è la mentalità giusta!",
        "Bravo! Hai visto? Il mercato premia chi crede!",
        "Ecco, questo è lo spirito! Compra e tieni, baby!",
        "Mi piaci. Hai la stessa filosofia. Forza!"
      ],
      challenge: [
        "Sfida: chi tiene una posizione più a lungo senza vendere?",
        "Vediamo chi trova il miglior blue chip del prossimo trimestre.",
        "Sfida dividendi: chi costruisce il portafoglio col miglior rendimento?"
      ],
      insider: [
        "Insider? Ma che schifo. Io vinco pulito o non vinco.",
        "Non serve barare quando il mercato sale da solo. Fai il bravo."
      ],
      opa: [
        "Se vuoi comprare, compra. Ma non venirmi a dire che è un'OPA. È solo business.",
        "Le aziende solide non si vendono. Ma se insisti... trattiamo."
      ],
      bankrupt: [
        "Il toro cade ma si rialza sempre. Tornerò più forte.",
        "Mercato ribassista temporaneo. La ripresa è dietro l'angolo."
      ]
    },
    orso: {
      taunt: [
        "Il mercato sta crollando. E tu stai comprando? Sei matto?",
        "Shorta tutto. Fidati. Il peggio deve ancora venire.",
        "La bolla sta per scoppiare. Io ci guadagno. Tu ci perderai.",
        "Put option. Impara. O affoga.",
        "Ogni rialzo è una trappola. Il trend è ribassista.",
        "Ho appena shortato il tuo titolo preferito. Preparati al rosso.",
        "L'ottimismo è il killer dei portafogli. Io sono realista.",
        "Compra quando c'è sangue nelle strade? No, shorta quando c'è sangue.",
        "Vedi quel grafico? È un death cross. Ciao.",
        "La festa è finita. Io ho già venduto tutto. Tu?"
      ],
      praise: [
        "Hai shortato al momento giusto. Non male per un ottimista.",
        "Ok, hai visto il ribasso. Forse non sei del tutto cieco.",
        "Bella put. Rispetto. Hai fiuto per il disastro.",
        "Anche un orologio rotto dà l'ora giusta due volte al giorno. Ma okay, bel trade."
      ],
      challenge: [
        "Sfida: chi prevede il prossimo crollo?",
        "Vediamo chi fa più soldi con le put in 4 settimane.",
        "Short challenge: chi guadagna di più con posizioni ribassiste?"
      ],
      insider: [
        "Insider? Il mercato è già truccato. Almeno sei onesto nel barare.",
        "Tanto il crollo arriva comunque. Insider o no."
      ],
      opa: [
        "Compri in un mercato che cade? Sei pazzo. Ma se vuoi bruciare soldi...",
        "Offro il 20% sotto il prezzo di mercato. Tanto domani vale meno."
      ],
      bankrupt: [
        "Lo sapevo. Lo sapevo che sarebbe successo. Il mercato è una merda.",
        "Avevo ragione io. Il mercato è crollato. Peccato che ci sia finito dentro."
      ]
    },
    tecnico: {
      taunt: [
        "Hai visto il MACD? No, perché non sai cos'è.",
        "RSI a 30. Punto di ingresso perfetto. Io entro, tu guardi.",
        "Le medie mobili parlano. Tu le sai ascoltare?",
        "Supporto a 45. Se rompe, shorta. Se rimbalza, compra. Semplice.",
        "I pattern non mentono. Quello è un head and shoulders. Ciao.",
        "Il volume conferma il trend. Ma tu guardi solo il prezzo.",
        "Fibonacci dice che il ritracciamento è finito. Io seguo i numeri.",
        "Band di Bollinger strette. Esplosione imminente. Sei pronto?",
        "Io non scommetto. Io analizzo. C'è differenza.",
        "Il grafico non mente. Le tue emozioni sì."
      ],
      praise: [
        "Hai letto il grafico bene. Bel timing.",
        "Rispetto per l'analisi tecnica. Forse sai qualcosa.",
        "Bel breakout. L'avevo visto anch'io, ma sei entrato prima.",
        "Tecnicamente perfetto. Ti meriti un punto."
      ],
      challenge: [
        "Sfida: chi identifica il miglior setup tecnico della settimana?",
        "Vediamo chi fa più profitti col momentum trading in 2 settimane.",
        "Pattern challenge: chi trova il miglior head and shoulders?"
      ],
      insider: [
        "I grafici incorporano già tutte le informazioni. L'insider trading è ridondante.",
        "Se sai leggere i grafici, non ti serve insider. Ma evidentemente non sai."
      ],
      opa: [
        "Analizzando i volumi, qualcuno sta accumulando. Sei tu?",
        "Il prezzo sta testando resistenza. Un'OPA ora sarebbe... interessante."
      ],
      bankrupt: [
        "Il grafico non mentiva. Ho ignorato i segnali. Errore mio.",
        "Tecnicamente, ero spacciato. I pattern erano chiari."
      ]
    },
    valore: {
      taunt: [
        "P/E ratio sotto 10. Dividendo al 4%. Io compro, tu fai rumore.",
        "Il valore non è nell'ultimo trend. È nei bilanci. Impara a leggerli.",
        "Stai pagando 50x earnings per una startup senza profitti? Buona fortuna.",
        "Io compro quando nessuno vuole. Vendo quando tutti comprano.",
        "Book value, free cash flow, debito. Parole che non conosci.",
        "Questa società ha un moat enorme. Ma tu guardi solo il prezzo.",
        "Il mercato è inefficiente. Io sfrutto le inefficienze. Tu le crei.",
        "Warren Buffett non compra meme stock. E tu?",
        "La pazienza è valore. La fretta è perdita.",
        "Stai comprando hype. Io compro sostanza. Vediamo chi vince."
      ],
      praise: [
        "Hai trovato un gioiello sottovalutato. Bel lavoro.",
        "Finalmente qualcuno che guarda i fondamentali. Mi piace.",
        "Ottima valutazione. L'avevo nei radar anch'io.",
        "Questo è value investing. Ben fatto."
      ],
      challenge: [
        "Sfida: chi trova la società più sottovalutata del mercato?",
        "Vediamo chi costruisce il portafoglio col miglior P/E medio.",
        "Value challenge: chi ottiene il miglior rendimento da dividendi?"
      ],
      insider: [
        "L'insider trading distorce il valore reale. Sei parte del problema.",
        "Se conoscessi i fondamentali, non avresti bisogno di insider."
      ],
      opa: [
        "Ho calcolato il valore intrinseco. La tua società vale molto più del prezzo. Offro il 40% sopra.",
        "Un'OPA amichevole è meglio di una ostile. Parliamone."
      ],
      bankrupt: [
        "Avevo sottovalutato i rischi. Il valore era una trappola.",
        "Anche il value investor sbaglia. Ma imparo sempre."
      ]
    },
    speculatore: {
      taunt: [
        "Penny stock, baby! O diventi ricco o perdi tutto. Che adrenalina!",
        "Chi ha bisogno di fondamentali quando hai lo spirito?",
        "1000 azioni a 0.50 cent. Se va a 1$, ho raddoppiato. Facile!",
        "Il rischio è il mio secondo nome. La prudenza è da poveri.",
        "Ho appena messo tutto su una biotech che annuncia domani. YOLO!",
        "Se non tremi quando compri, non è abbastanza rischioso.",
        "Io non diversifico. Concentro. E vinco alla grande.",
        "Leva 5x? Poco. Io vado 10x o niente.",
        "I soldi facili sono i migliori. E io li faccio facili.",
        "Meme stock? Ci sono dentro fino al collo. E tu?"
      ],
      praise: [
        "Grande! Hai fatto il botto! Questa è la mentalità!",
        "Sì! Così si fa! Rischio e reward, baby!",
        "Hai avuto le palle di entrare. E hai vinto. Mitico!",
        "Wow. Hai fatto 10x. Insegnami, maestro!"
      ],
      challenge: [
        "Sfida: chi trova il miglior penny stock della settimana?",
        "Vediamo chi fa più 10x in un mese!",
        "Sfida rischio massimo: chi fa il trade più folle e ci guadagna?"
      ],
      insider: [
        "Insider? Ancora meglio! Così sappiamo tutti dove andare!",
        "Se hai un dritta, condividila! Non essere egoista!"
      ],
      opa: [
        "OPA? Che noia. Meglio un pump and dump ben fatto!",
        "Se vuoi comprare, compra. Ma io vendo prima che tu finisca."
      ],
      bankrupt: [
        "AVEVA TUTTO SU UNA MEME STOCK. È CROLLATA. MA NE VALSA LA PENA!",
        "Rovinato ma felice. Rifarei tutto. Anzi, no. Ma quasi."
      ]
    },
    insider: {
      taunt: [
        "So cose che tu non sai. E ci guadagno. Bella vita.",
        "Ho una fonte dentro l'azienda. Tu hai Google Finance.",
        "L'informazione è potere. Io ho il potere. Tu hai notizie ritardate.",
        "Mentre aspetti il comunicato stampa, io ho già comprato.",
        "La SEC? Se non mi beccano, non è reato. Se mi beccano, ho un buon avvocato.",
        "I soldi veri si fanno con le informazioni vere. Non con i grafici.",
        "Tu giochi a poker. Io so già le carte.",
        "Ho visto i conti del Q3. Fidati, shorta tutto.",
        "Il mio telefono squilla prima del tuo Bloomberg.",
        "Non è barare. È essere più informati."
      ],
      praise: [
        "Bella fonte. Dove l'hai trovata? No, non dirmelo. Ma bella mossa.",
        "Anche tu giochi nel mio mondo. Bene, bene.",
        "Sei pericoloso. Mi piaci.",
        "Hai battuto il mercato con le informazioni giuste. Rispetto."
      ],
      challenge: [
        "Sfida: chi ottiene l'informazione più riservata senza farsi beccare?",
        "Vediamo chi fa più profitti con informazioni privilegiate.",
        "Sfida silenziosa: chi opera meglio nell'ombra?"
      ],
      insider: [
        "Ah, anche tu? Allora siamo sulla stessa barca. Attento ai remi.",
        "Non condivido le mie fonti. Ma posso darti un suggerimento... a pagamento."
      ],
      opa: [
        "So dell'OPA prima che la società lo annunci. Offro il 25% sopra. Affare fatto?",
        "Ho visto i documenti. So quanto vale veramente. E non è quanto chiedi."
      ],
      bankrupt: [
        "La mia fonte mi ha tradito. Informazione sbagliata. Tutto perso.",
        "La SEC mi ha beccato. È stato un bel giro. Ma è finita."
      ]
    },
    fondamentale: {
      taunt: [
        "Hai letto l'ultimo 10-K? No, perché non sai nemmeno cos'è.",
        "Il debito netto sta crescendo. Il free cash flow è negativo. E tu compri?",
        "Margini in calo da 3 trimestri. Io vendo. Tu compri. Grazie dei soldi.",
        "Il ROE è sotto il costo del capitale. Questa azienda distrugge valore.",
        "Ho analizzato 50 aziende questa settimana. Tu quante ne hai analizzate?",
        "I fondamentali non mentono. Il mercato sì. E tu ci caschi.",
        "Revenue growth +20%, ma i costi crescono del 30%. Matematica elementare.",
        "Il rapporto debito/equity è allarmante. Ma tu compri lo stesso.",
        "Ebitda margin in espansione. Questa sì che è una buona notizia.",
        "Non comprare un'azienda che non capisci. E tu non capisci niente."
      ],
      praise: [
        "Hai fatto i compiti. I fondamentali sono solidi. Bel pick.",
        "Analisi impeccabile. Questa società ha fondamentali eccellenti.",
        "Finalmente qualcuno che fa due conti prima di comprare.",
        "Condivido la tua analisi. Ottimo lavoro."
      ],
      challenge: [
        "Sfida: chi scrive il miglior report fondamentale della settimana?",
        "Vediamo chi identifica l'azienda col miglior miglioramento dei fondamentali.",
        "Fundamental challenge: chi trova la società più sottovalutata dai dati?"
      ],
      insider: [
        "I fondamentali sono pubblici. Se sai leggerli, non ti serve insider.",
        "L'insider trading è per pigri che non sanno analizzare un bilancio."
      ],
      opa: [
        "Ho analizzato i fondamentali. La tua società è solida. Offro il 35% sopra.",
        "I numeri dicono che questa OPA ha senso. Parliamone."
      ],
      bankrupt: [
        "Avevo sbagliato i calcoli. I fondamentali erano peggiori del previsto.",
        "Il debito era nascosto. Non l'avevo visto. Errore fatale."
      ]
    },
    contrarian: {
      taunt: [
        "Tutti comprano? Io vendo. Tutti vendono? Io compro. Facile.",
        "Il gregge va al macello. Io vado nella direzione opposta.",
        "Più sei sicuro della tua mossa, più io faccio l'opposto. E vinco.",
        "Il consenso è il miglior controindicatore. Io odio il consenso.",
        "Quando il tuo broker ti dice 'compra', è ora di vendere.",
        "La folla ha sempre torto. Sempre.",
        "Se tutti dicono che è una buona idea, è una pessima idea.",
        "Io compro il panico. Vendo l'euforia. Tu fai il contrario.",
        "Il mercato è un animale strano. Io lo cavalco contropelo.",
        "Non seguire il trend. Il trend segue me."
      ],
      praise: [
        "Hai fatto l'opposto della massa. E hai vinto. Siamo simili.",
        "Contrarian move perfetta. Sei uno di noi.",
        "Hai visto quello che nessuno vedeva. Bel colpo.",
        "La massa piange, tu sorridi. Così si fa."
      ],
      challenge: [
        "Sfida: chi fa la mossa più contrarian della settimana?",
        "Vediamo chi ignora meglio il consenso di Wall Street.",
        "Contrarian challenge: chi compra quando tutti vendono?"
      ],
      insider: [
        "Se tutti fanno insider, io faccio il contrario. Denuncio tutto alla SEC.",
        "L'insider è troppo mainstream. Io opero su informazioni che nessuno vuole."
      ],
      opa: [
        "Tutti vogliono comprare? Allora io vendo. Ma a caro prezzo.",
        "Un'OPA ostile è così... prevedibile. Io faccio proposte che nessuno si aspetta."
      ],
      bankrupt: [
        "Essere contrarian significa anche perdere quando hai ragione troppo presto.",
        "Il mercato è impazzito. Avevo ragione io, ma sono andato in bancarotta lo stesso."
      ]
    }
  };

  // ============================================================
  // COMPETITOR DEFINITIONS
  // ============================================================
  const COMPETITOR_DEFS = [
    {
      id: 'squalo',
      name: 'Ken',
      nickname: 'Lo Squalo',
      avatar: '🦈',
      capitalBase: [2000000, 10000000],
      strategy: 'aggressive',
      personality: 'aggressivo',
      secRep: 30,
      wallStreetRep: 80,
      description: 'Ex trader di Goldman Sachs. Pump and dump, short selling massiccio. Non ha mai perso una notte di sonno per i soldi degli altri.'
    },
    {
      id: 'volpe',
      name: 'Victoria',
      nickname: 'La Volpe',
      avatar: '🦊',
      capitalBase: [3000000, 8000000],
      strategy: 'strategic',
      personality: 'calcolatrice',
      secRep: 60,
      wallStreetRep: 70,
      description: 'Ex banker di JP Morgan specializzata in M&A. Ogni mossa è studiata, ogni trade ha un perché. Non fa mai una mossa senza un piano B.'
    },
    {
      id: 'toro',
      name: 'Marco',
      nickname: 'Il Toro',
      avatar: '🐂',
      capitalBase: [1000000, 5000000],
      strategy: 'bull',
      personality: 'ottimista',
      secRep: 85,
      wallStreetRep: 65,
      description: 'Crede ciecamente nel mercato. Blue chip, buy and hold, dividendi. Niente lo smuove dalla sua convinzione che il mercato salga sempre.'
    },
    {
      id: 'orso',
      name: 'Malcom',
      nickname: 'L\'Orso',
      avatar: '🐻',
      capitalBase: [1500000, 4000000],
      strategy: 'bear',
      personality: 'pessimista',
      secRep: 70,
      wallStreetRep: 45,
      description: 'Vede crisi dappertutto. Shorta tutto quello che si muove. Ha fatto fortuna nel 2008 e aspetta il prossimo crollo.'
    },
    {
      id: 'tecnico',
      name: 'Elena',
      nickname: 'La Tecnica',
      avatar: '📊',
      capitalBase: [500000, 3000000],
      strategy: 'technical',
      personality: 'analitica',
      secRep: 90,
      wallStreetRep: 55,
      description: 'Vive di grafici, pattern, medie mobili e RSI. Ogni decisione è basata su dati tecnici. Non compra niente senza un setup perfetto.'
    },
    {
      id: 'valore',
      name: 'Giovanni',
      nickname: 'Il Valore',
      avatar: '💎',
      capitalBase: [2000000, 6000000],
      strategy: 'value',
      personality: 'paziente',
      secRep: 95,
      wallStreetRep: 60,
      description: 'Discepolo di Buffett. Cerca aziende sottovalutate con fondamentali solidi. Compra quando c\'è sangue nelle strade e tiene per anni.'
    },
    {
      id: 'speculatore',
      name: 'Luca',
      nickname: 'Lo Speculatore',
      avatar: '🎲',
      capitalBase: [100000, 1000000],
      strategy: 'speculative',
      personality: 'spericolato',
      secRep: 20,
      wallStreetRep: 35,
      description: 'Vive di penny stock, opzioni binarie e cripto. YOLO è la sua filosofia. O diventa milionario o perde tutto. Non c\'è via di mezzo.'
    },
    {
      id: 'insider',
      name: 'Dark',
      nickname: 'L\'Insider',
      avatar: '🕵️',
      capitalBase: [3000000, 7000000],
      strategy: 'insider',
      personality: 'misterioso',
      secRep: 10,
      wallStreetRep: 40,
      description: 'Fonti ovunque. Sa i risultati prima che siano pubblicati. Opera nell\'ombra. La SEC lo cerca ma non lo trova mai.'
    },
    {
      id: 'fondamentale',
      name: 'Sophia',
      nickname: 'La Fondamentale',
      avatar: '📋',
      capitalBase: [1000000, 4000000],
      strategy: 'fundamental',
      personality: 'precisa',
      secRep: 95,
      wallStreetRep: 50,
      description: 'Analizza bilanci come altri respirano. ROE, EBITDA, free cash flow, debito. Se non passa i suoi filtri, non compra. Punto.'
    },
    {
      id: 'contrarian',
      name: 'Alex',
      nickname: 'Il Contrarian',
      avatar: '🔄',
      capitalBase: [500000, 2500000],
      strategy: 'contrarian',
      personality: 'ribelle',
      secRep: 65,
      wallStreetRep: 30,
      description: 'Fa sempre l\'opposto della massa. Se tutti comprano, lui vende. Se tutti vendono, lui compra. Odia il consenso.'
    }
  ];

  // ============================================================
  // EVENTI COMPETITOR
  // ============================================================
  const COMPETITOR_EVENTS = [
    {
      id: 'bankruptcy',
      title: 'Bancarotta',
      description: function (c) { return c.nickname + ' ha dichiarato bancarotta! Il mercato è spietato.'; },
      condition: function (c, ctx) { return c.capital < 0 && c.capital < -c.initialCapital * 0.5; },
      effect: function (c, ctx) { c.active = false; c.capital = 0; c.portfolio = []; }
    },
    {
      id: 'sec_arrest',
      title: 'Arresto SEC',
      description: function (c) { return c.nickname + ' è stato arrestato dalla SEC per insider trading!'; },
      condition: function (c, ctx) { return c.secRep < 15 && Math.random() < 0.1; },
      effect: function (c, ctx) { c.active = false; c.capital *= 0.5; c.secRep = 0; }
    },
    {
      id: 'merger',
      title: 'Fusione tra competitor',
      description: function (c1, c2) { return c1.nickname + ' e ' + c2.nickname + ' hanno fuso i loro fondi!'; },
      condition: function (c, ctx) { return false; }, // triggered externally
      effect: function (c1, c2, ctx) {
        c1.capital += c2.capital;
        c1.portfolio = c1.portfolio.concat(c2.portfolio);
        c2.active = false;
      }
    },
    {
      id: 'hedge_fund',
      title: 'Nuovo Hedge Fund',
      description: function (c) { return c.nickname + ' ha lanciato un hedge fund! Il capitale aumenta!'; },
      condition: function (c, ctx) { return c.capital > 5000000 && Math.random() < 0.05; },
      effect: function (c, ctx) { c.capital *= 1.5; }
    },
    {
      id: 'steal_clients',
      title: 'Furto Clienti',
      description: function (c) { return c.nickname + ' ti ha rubato clienti! Perdi reputazione e capitale.'; },
      condition: function (c, ctx) { return c.wallStreetRep > ctx.playerRep && Math.random() < 0.08; },
      effect: function (c, ctx) {
        if (ctx.onStealClients) ctx.onStealClients(c);
      }
    },
    {
      id: 'partnership_offer',
      title: 'Offerta Partnership',
      description: function (c) { return c.nickname + ' ti offre una partnership! Unireste i capitali per un mese.'; },
      condition: function (c, ctx) { return c.relationship === 'alleato' && Math.random() < 0.1; },
      effect: function (c, ctx) {
        if (ctx.onPartnershipOffer) ctx.onPartnershipOffer(c);
      }
    },
    {
      id: 'pump_dump_player',
      title: 'Pump and Dump',
      description: function (c, stock) { return c.nickname + ' ha fatto pump and dump su ' + stock + '! Il prezzo è crollato!'; },
      condition: function (c, ctx) { return c.strategy === 'aggressive' && Math.random() < 0.12; },
      effect: function (c, ctx) {
        if (ctx.onPumpDump) ctx.onPumpDump(c);
      }
    },
    {
      id: 'margin_call',
      title: 'Margin Call',
      description: function (c) { return c.nickname + ' ha ricevuto una margin call! Deve liquidare posizioni.'; },
      condition: function (c, ctx) { return c.capital < c.initialCapital * 0.3 && Math.random() < 0.15; },
      effect: function (c, ctx) {
        // Liquida metà posizioni forzatamente
        const toSell = Math.ceil(c.portfolio.length / 2);
        for (let i = 0; i < toSell && c.portfolio.length > 0; i++) {
          const pos = c.portfolio.shift();
          c.capital += pos.shares * pos.avgPrice * 0.8; // vendita forzata a sconto
        }
      }
    },
    {
      id: 'whale_move',
      title: 'Movimento Balena',
      description: function (c, stock) { return c.nickname + ' sta accumulando ' + stock + ' massicciamente!'; },
      condition: function (c, ctx) { return c.capital > 5000000 && Math.random() < 0.07; },
      effect: function (c, ctx) {
        if (ctx.onWhaleMove) ctx.onWhaleMove(c);
      }
    },
    {
      id: 'sec_fine',
      title: 'Multa SEC',
      description: function (c) { return c.nickname + ' ha preso una multa dalla SEC per manipolazione di mercato!'; },
      condition: function (c, ctx) { return c.secRep < 30 && Math.random() < 0.08; },
      effect: function (c, ctx) { c.capital *= 0.85; c.secRep += 5; }
    },
    {
      id: 'media_scandal',
      title: 'Scandalo Mediatico',
      description: function (c) { return c.nickname + ' è finito sui giornali per uno scandalo finanziario!'; },
      condition: function (c, ctx) { return c.wallStreetRep < 30 && Math.random() < 0.06; },
      effect: function (c, ctx) { c.wallStreetRep -= 10; c.secRep -= 5; }
    },
    {
      id: 'lucky_break',
      title: 'Colpo di Fortuna',
      description: function (c) { return c.nickname + ' ha fatto un colpo fortunato! Un investimento ha reso il 200%!'; },
      condition: function (c, ctx) { return Math.random() < 0.04; },
      effect: function (c, ctx) { c.capital *= 1.15; }
    },
    {
      id: 'bad_beat',
      title: 'Colpo Sfortunato',
      description: function (c) { return c.nickname + ' ha subito una perdita enorme su un trade sbagliato!'; },
      condition: function (c, ctx) { return Math.random() < 0.05; },
      effect: function (c, ctx) { c.capital *= 0.8; }
    },
    {
      id: 'new_investor',
      title: 'Nuovo Investitore',
      description: function (c) { return c.nickname + ' ha trovato un nuovo investitore! Capitali freschi.'; },
      condition: function (c, ctx) { return c.capital < c.initialCapital * 0.5 && Math.random() < 0.06; },
      effect: function (c, ctx) { c.capital += c.initialCapital * 0.3; }
    },
    {
      id: 'ipo_win',
      title: 'IPO Vincente',
      description: function (c) { return c.nickname + ' ha partecipato a un\'IPO andata benissimo!'; },
      condition: function (c, ctx) { return Math.random() < 0.05; },
      effect: function (c, ctx) { c.capital *= 1.1; }
    },
    {
      id: 'investigation',
      title: 'Indagine SEC',
      description: function (c) { return 'La SEC ha aperto un\'indagine su ' + c.nickname + '!'; },
      condition: function (c, ctx) { return c.secRep < 25 && Math.random() < 0.07; },
      effect: function (c, ctx) { c.secRep -= 10; }
    },
    {
      id: 'market_making',
      title: 'Market Making',
      description: function (c) { return c.nickname + ' è diventato market maker su un titolo caldo!'; },
      condition: function (c, ctx) { return c.capital > 3000000 && Math.random() < 0.04; },
      effect: function (c, ctx) { c.wallStreetRep += 5; c.capital *= 1.05; }
    },
    {
      id: 'hostile_takeover',
      title: 'Scalata Ostile',
      description: function (c, target) { return c.nickname + ' sta scalando ' + target + '! OPA ostile imminente!'; },
      condition: function (c, ctx) { return c.strategy === 'aggressive' || c.strategy === 'strategic' && Math.random() < 0.06; },
      effect: function (c, ctx) {
        if (ctx.onHostileTakeover) ctx.onHostileTakeover(c);
      }
    },
    {
      id: 'retirement',
      title: 'Pensionamento',
      description: function (c) { return c.nickname + ' ha annunciato il pensionamento! Si ritira dal mercato.'; },
      condition: function (c, ctx) { return c.capital > 10000000 && Math.random() < 0.02; },
      effect: function (c, ctx) { c.active = false; }
    },
    {
      id: 'comeback',
      title: 'Ritorno',
      description: function (c) { return c.nickname + ' è tornato! Dopo un periodo di pausa, rientra nel mercato!'; },
      condition: function (c, ctx) { return !c.active && ctx.week > c.inactiveSince + 8 && Math.random() < 0.1; },
      effect: function (c, ctx) {
        c.active = true;
        c.capital = c.initialCapital * 0.5;
        c.inactiveSince = null;
      }
    }
  ];

  // ============================================================
  // SFIDE
  // ============================================================
  const CHALLENGE_TEMPLATES = [
    {
      title: 'Sfida Profitto',
      description: function (c) { return c.nickname + ' ti sfida: chi fa più profitto in ' + CHALLENGE_DURATION_WEEKS + ' settimane?'; },
      metric: 'profit',
      duration: CHALLENGE_DURATION_WEEKS,
      reward: { xp: 500, capital: 100000, rep: 10 },
      penalty: { xp: -200, capital: -50000, rep: -5 }
    },
    {
      title: 'Sfida ROI',
      description: function (c) { return c.nickname + ' ti sfida: chi ottiene il ROI più alto in ' + CHALLENGE_DURATION_WEEKS + ' settimane?'; },
      metric: 'roi',
      duration: CHALLENGE_DURATION_WEEKS,
      reward: { xp: 750, capital: 200000, rep: 15 },
      penalty: { xp: -300, capital: -75000, rep: -8 }
    },
    {
      title: 'Sfida Short',
      description: function (c) { return c.nickname + ' ti sfida: chi guadagna di più con posizioni short in ' + CHALLENGE_DURATION_WEEKS + ' settimane?'; },
      metric: 'short_profit',
      duration: CHALLENGE_DURATION_WEEKS,
      reward: { xp: 600, capital: 150000, rep: 12 },
      penalty: { xp: -250, capital: -60000, rep: -6 }
    },
    {
      title: 'Sfida Long',
      description: function (c) { return c.nickname + ' ti sfida: chi tiene la posizione long più a lungo senza vendere?'; },
      metric: 'hold_time',
      duration: 8,
      reward: { xp: 400, capital: 80000, rep: 8 },
      penalty: { xp: -150, capital: -30000, rep: -3 }
    },
    {
      title: 'Sfida Penny Stock',
      description: function (c) { return c.nickname + ' ti sfida: chi trova il penny stock col miglior rendimento in 2 settimane?'; },
      metric: 'penny_profit',
      duration: 2,
      reward: { xp: 800, capital: 50000, rep: 5 },
      penalty: { xp: -350, capital: -25000, rep: -10 }
    }
  ];

  // ============================================================
  // COMPETITOR CLASS
  // ============================================================
  class Competitor {
    constructor(def, marketData) {
      this.id = def.id;
      this.name = def.name;
      this.nickname = def.nickname;
      this.avatar = def.avatar;
      this.description = def.description;
      this.strategy = def.strategy;
      this.personality = def.personality;
      this.secRep = def.secRep;
      this.wallStreetRep = def.wallStreetRep;
      this.initialCapital = rand(def.capitalBase[0], def.capitalBase[1]);
      this.capital = this.initialCapital;
      this.portfolio = [];
      this.tradeHistory = [];
      this.active = true;
      this.inactiveSince = null;
      this.relationship = 'neutro'; // 'alleato' | 'rivale' | 'neutro'
      this.relationshipScore = 0; // -100 (nemico) a +100 (alleato)
      this.weeklyPerformance = 0;
      this.totalPerformance = 0;
      this.lastWeekCapital = this.initialCapital;
      this.challengesIssued = [];
      this.challengesAccepted = [];
      this.activeChallenge = null;
      this.dialogueSet = DIALOGUES[this.id] || DIALOGUES.squalo;
      this.marketData = marketData;
      this.lastTrades = []; // ultimi 5 trade per contesto
    }

    // --- PORTAFOGLIO ---
    getTotalValue() {
      let total = this.capital;
      for (const pos of this.portfolio) {
        const price = this.getStockPrice(pos.symbol);
        total += pos.shares * price;
      }
      return total;
    }

    getStockPrice(symbol) {
      if (!this.marketData || !this.marketData.stocks) return 10;
      const stock = this.marketData.stocks.find(s => s.symbol === symbol);
      return stock ? stock.price : 10;
    }

    getStockInfo(symbol) {
      if (!this.marketData || !this.marketData.stocks) return null;
      return this.marketData.stocks.find(s => s.symbol === symbol) || null;
    }

    getPortfolioValue() {
      let total = 0;
      for (const pos of this.portfolio) {
        total += pos.shares * this.getStockPrice(pos.symbol);
      }
      return total;
    }

    getPosition(symbol) {
      return this.portfolio.find(p => p.symbol === symbol);
    }

    getROI() {
      if (this.initialCapital === 0) return 0;
      return ((this.getTotalValue() - this.initialCapital) / this.initialCapital) * 100;
    }

    getWeeklyROI() {
      if (this.lastWeekCapital === 0) return 0;
      return ((this.getTotalValue() - this.lastWeekCapital) / this.lastWeekCapital) * 100;
    }

    // --- TRADING ---
    buy(symbol, shares, price) {
      const cost = shares * price;
      const commission = cost * COMMISSION_RATE;
      const totalCost = cost + commission;

      if (totalCost > this.capital) return false;

      const existing = this.getPosition(symbol);
      if (existing) {
        const totalShares = existing.shares + shares;
        const totalCostBasis = existing.shares * existing.avgPrice + shares * price;
        existing.shares = totalShares;
        existing.avgPrice = totalCostBasis / totalShares;
      } else {
        this.portfolio.push({ symbol, shares, avgPrice: price });
      }

      this.capital -= totalCost;
      this.recordTrade('BUY', symbol, shares, price, commission);
      return true;
    }

    sell(symbol, shares, price) {
      const pos = this.getPosition(symbol);
      if (!pos || pos.shares < shares) return false;

      const revenue = shares * price;
      const commission = revenue * COMMISSION_RATE;
      const netRevenue = revenue - commission;

      pos.shares -= shares;
      if (pos.shares <= 0) {
        this.portfolio = this.portfolio.filter(p => p.symbol !== symbol);
      }

      this.capital += netRevenue;
      this.recordTrade('SELL', symbol, shares, price, commission);
      return true;
    }

    sellAll(symbol) {
      const pos = this.getPosition(symbol);
      if (!pos) return false;
      return this.sell(symbol, pos.shares, this.getStockPrice(symbol));
    }

    recordTrade(type, symbol, shares, price, commission) {
      const trade = {
        type,
        symbol,
        shares,
        price: round2(price),
        commission: round2(commission),
        total: round2(type === 'BUY' ? -(shares * price + commission) : (shares * price - commission)),
        week: this.marketData ? this.marketData.currentWeek : 0,
        timestamp: Date.now()
      };
      this.tradeHistory.push(trade);
      this.lastTrades.unshift(trade);
      if (this.lastTrades.length > 5) this.lastTrades.pop();
    }

    // --- AI STRATEGIES ---
    executeTurn() {
      if (!this.active) return [];
      if (!this.marketData || !this.marketData.stocks) return [];

      const trades = [];
      this.lastWeekCapital = this.getTotalValue();

      // Aggiorna performance
      this.weeklyPerformance = this.getWeeklyROI();
      this.totalPerformance = this.getROI();

      // Esegui strategia
      const decisions = this.decideTrades();
      for (const decision of decisions) {
        if (decision.action === 'BUY') {
          const success = this.buy(decision.symbol, decision.shares, decision.price);
          if (success) trades.push(decision);
        } else if (decision.action === 'SELL') {
          const success = this.sell(decision.symbol, decision.shares, decision.price);
          if (success) trades.push(decision);
        }
      }

      // Aggiorna challenge attivo
      if (this.activeChallenge) {
        this.activeChallenge.currentValue = this.getTotalValue();
      }

      return trades;
    }

    decideTrades() {
      switch (this.strategy) {
        case 'aggressive': return this.aggressiveStrategy();
        case 'strategic': return this.strategicStrategy();
        case 'bull': return this.bullStrategy();
        case 'bear': return this.bearStrategy();
        case 'technical': return this.technicalStrategy();
        case 'value': return this.valueStrategy();
        case 'speculative': return this.speculativeStrategy();
        case 'insider': return this.insiderStrategy();
        case 'fundamental': return this.fundamentalStrategy();
        case 'contrarian': return this.contrarianStrategy();
        default: return [];
      }
    }

    // --- STRATEGIA: AGGRESSIVA (Squalo) ---
    aggressiveStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Short selling su titoli in rialzo (pump and dump)
      const risingStocks = stocks.filter(s => s.change && s.change > 3);
      for (const stock of risingStocks.slice(0, 2)) {
        if (this.capital > 50000) {
          const shares = Math.floor(this.capital * 0.15 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'SELL', symbol: stock.symbol, shares, price: stock.price, reason: 'short_pump' });
          }
        }
      }

      // Compra titoli in caduta (dopo pump, compra a sconto)
      const fallingStocks = stocks.filter(s => s.change && s.change < -5);
      for (const stock of fallingStocks.slice(0, 1)) {
        if (this.capital > 100000) {
          const shares = Math.floor(this.capital * 0.1 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'buy_dip_aggressive' });
          }
        }
      }

      // Se ha posizioni long con profitto > 15%, vende (pump dump)
      for (const pos of this.portfolio) {
        const price = this.getStockPrice(pos.symbol);
        const profitPct = (price - pos.avgPrice) / pos.avgPrice * 100;
        if (profitPct > 15) {
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: Math.floor(pos.shares * 0.7), price, reason: 'pump_dump' });
        }
      }

      return decisions;
    }

    // --- STRATEGIA: STRATEGICA (Volpe) ---
    strategicStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Cerca titoli con alto volume (possibile fusione/OPA)
      const highVolume = stocks.filter(s => s.volume && s.volume > (s.avgVolume || 1000000) * 1.5);
      for (const stock of highVolume.slice(0, 1)) {
        if (this.capital > 200000 && !this.getPosition(stock.symbol)) {
          const shares = Math.floor(this.capital * 0.2 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'accumulation_detected' });
          }
        }
      }

      // Vende posizioni con profitto > 25% (take profit strategico)
      for (const pos of this.portfolio) {
        const price = this.getStockPrice(pos.symbol);
        const profitPct = (price - pos.avgPrice) / pos.avgPrice * 100;
        if (profitPct > 25) {
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: Math.floor(pos.shares * 0.5), price, reason: 'strategic_take_profit' });
        }
      }

      // Compra settori in crescita
      const sectors = {};
      for (const s of stocks) {
        if (!sectors[s.sector]) sectors[s.sector] = [];
        sectors[s.sector].push(s.change || 0);
      }
      for (const [sector, changes] of Object.entries(sectors)) {
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        if (avgChange > 2 && this.capital > 100000) {
          const sectorStock = stocks.find(s => s.sector === sector && !this.getPosition(s.symbol));
          if (sectorStock) {
            const shares = Math.floor(this.capital * 0.1 / sectorStock.price);
            if (shares > 0) {
              decisions.push({ action: 'BUY', symbol: sectorStock.symbol, shares, price: sectorStock.price, reason: 'sector_momentum' });
            }
          }
        }
      }

      return decisions;
    }

    // --- STRATEGIA: BULL (Toro) ---
    bullStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Compra blue chip (prezzo > 50, settore solido)
      const blueChips = stocks.filter(s => s.price > 50 && s.sector !== 'Penny' && s.sector !== 'Crypto');
      for (const stock of blueChips.slice(0, 2)) {
        if (this.capital > 50000 && !this.getPosition(stock.symbol)) {
          const shares = Math.floor(this.capital * 0.15 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'blue_chip_accumulation' });
          }
        }
      }

      // Compra in caduta (buy the dip)
      const dipStocks = stocks.filter(s => s.change && s.change < -3);
      for (const stock of dipStocks.slice(0, 1)) {
        if (this.capital > 100000) {
          const existing = this.getPosition(stock.symbol);
          if (existing) {
            const shares = Math.floor(this.capital * 0.1 / stock.price);
            if (shares > 0) {
              decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'buy_the_dip' });
            }
          }
        }
      }

      // Non vende mai (hold)
      return decisions;
    }

    // --- STRATEGIA: BEAR (Orso) ---
    bearStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Short su titoli in rialzo
      const overbought = stocks.filter(s => s.change && s.change > 5);
      for (const stock of overbought.slice(0, 2)) {
        if (this.capital > 50000) {
          const shares = Math.floor(this.capital * 0.12 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'SELL', symbol: stock.symbol, shares, price: stock.price, reason: 'bear_short' });
          }
        }
      }

      // Vende tutte le posizioni long se il mercato è positivo (pensa sia una bolla)
      if (this.marketData.marketSentiment && this.marketData.marketSentiment > 0.6) {
        for (const pos of [...this.portfolio]) {
          const price = this.getStockPrice(pos.symbol);
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: pos.shares, price, reason: 'bear_exit' });
        }
      }

      return decisions;
    }

    // --- STRATEGIA: TECNICA (Elena) ---
    technicalStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Simula analisi tecnica: compra titoli con momentum positivo e volume alto
      for (const stock of stocks) {
        if (this.portfolio.length >= MAX_PORTFOLIO_POSITIONS) break;
        if (this.getPosition(stock.symbol)) continue;

        const momentum = stock.change || 0;
        const volumeSpike = stock.volume && stock.avgVolume && (stock.volume / stock.avgVolume) > 1.3;

        if (momentum > 2 && volumeSpike && this.capital > 50000) {
          const shares = Math.floor(this.capital * 0.12 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'technical_breakout' });
          }
        }
      }

      // Vende posizioni con momentum negativo
      for (const pos of [...this.portfolio]) {
        const stock = this.getStockInfo(pos.symbol);
        if (stock && stock.change && stock.change < -5) {
          const price = this.getStockPrice(pos.symbol);
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: Math.floor(pos.shares * 0.5), price, reason: 'technical_stop_loss' });
        }
      }

      return decisions;
    }

    // --- STRATEGIA: VALUE (Giovanni) ---
    valueStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Cerca titoli con P/E basso (simulato)
      for (const stock of stocks) {
        if (this.portfolio.length >= MAX_PORTFOLIO_POSITIONS) break;
        if (this.getPosition(stock.symbol)) continue;

        const pe = stock.pe || 20;
        const priceToBook = stock.priceToBook || 3;

        if (pe < 12 && priceToBook < 1.5 && this.capital > 100000) {
          const shares = Math.floor(this.capital * 0.2 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'value_undervalued' });
          }
        }
      }

      // Vende se il prezzo supera il valore intrinseco stimato
      for (const pos of [...this.portfolio]) {
        const stock = this.getStockInfo(pos.symbol);
        if (stock) {
          const intrinsicValue = (stock.pe || 20) * (stock.eps || 1) * 1.2;
          const price = this.getStockPrice(pos.symbol);
          if (price > intrinsicValue * 1.3) {
            decisions.push({ action: 'SELL', symbol: pos.symbol, shares: pos.shares, price, reason: 'value_overvalued' });
          }
        }
      }

      return decisions;
    }

    // --- STRATEGIA: SPECULATIVA (Luca) ---
    speculativeStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Compra penny stock (prezzo < 5)
      const pennyStocks = stocks.filter(s => s.price < 5 && s.price > 0.1);
      for (const stock of pennyStocks.slice(0, 3)) {
        if (this.capital > 10000 && !this.getPosition(stock.symbol)) {
          const shares = Math.floor(this.capital * 0.25 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'penny_stock_gamble' });
          }
        }
      }

      // Compra titoli con alta volatilità
      const volatile = stocks.filter(s => s.change && Math.abs(s.change) > 8);
      for (const stock of volatile.slice(0, 1)) {
        if (this.capital > 20000) {
          const shares = Math.floor(this.capital * 0.2 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'volatility_play' });
          }
        }
      }

      // Vende penny stock con piccolo profitto
      for (const pos of [...this.portfolio]) {
        const price = this.getStockPrice(pos.symbol);
        const profitPct = (price - pos.avgPrice) / pos.avgPrice * 100;
        if (profitPct > 10 || profitPct < -15) {
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: pos.shares, price, reason: 'speculative_exit' });
        }
      }

      return decisions;
    }

    // --- STRATEGIA: INSIDER (Dark) ---
    insiderStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Simula informazione privilegiata: compra prima di eventi positivi
      const stocksWithNews = stocks.filter(s => s.news && s.news.length > 0);
      for (const stock of stocksWithNews.slice(0, 2)) {
        if (this.capital > 100000 && !this.getPosition(stock.symbol)) {
          const shares = Math.floor(this.capital * 0.2 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'insider_info' });
          }
        }
      }

      // Shorta titoli con notizie negative imminenti
      const badNewsStocks = stocks.filter(s => s.news && s.news.some(n => n.sentiment && n.sentiment < -0.3));
      for (const stock of badNewsStocks.slice(0, 1)) {
        if (this.capital > 100000) {
          const shares = Math.floor(this.capital * 0.15 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'SELL', symbol: stock.symbol, shares, price: stock.price, reason: 'insider_short' });
          }
        }
      }

      // Vende prima di notizie negative
      for (const pos of [...this.portfolio]) {
        const stock = this.getStockInfo(pos.symbol);
        if (stock && stock.news && stock.news.some(n => n.sentiment && n.sentiment < -0.5)) {
          const price = this.getStockPrice(pos.symbol);
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: pos.shares, price, reason: 'insider_exit_before_news' });
        }
      }

      return decisions;
    }

    // --- STRATEGIA: FONDAMENTALE (Sophia) ---
    fundamentalStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Analisi fondamentale: cerca aziende con buoni fondamentali
      for (const stock of stocks) {
        if (this.portfolio.length >= MAX_PORTFOLIO_POSITIONS) break;
        if (this.getPosition(stock.symbol)) continue;

        const revenueGrowth = stock.revenueGrowth || 0;
        const profitMargin = stock.profitMargin || 0;
        const debtEquity = stock.debtEquity || 1;
        const roe = stock.roe || 0;

        if (revenueGrowth > 10 && profitMargin > 5 && debtEquity < 1.5 && roe > 10 && this.capital > 100000) {
          const shares = Math.floor(this.capital * 0.18 / stock.price);
          if (shares > 0) {
            decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'strong_fundamentals' });
          }
        }
      }

      // Vende se i fondamentali peggiorano
      for (const pos of [...this.portfolio]) {
        const stock = this.getStockInfo(pos.symbol);
        if (stock) {
          const revenueGrowth = stock.revenueGrowth || 0;
          const profitMargin = stock.profitMargin || 0;
          if (revenueGrowth < -5 || profitMargin < -2) {
            const price = this.getStockPrice(pos.symbol);
            decisions.push({ action: 'SELL', symbol: pos.symbol, shares: pos.shares, price, reason: 'fundamentals_deteriorating' });
          }
        }
      }

      return decisions;
    }

    // --- STRATEGIA: CONTRARIAN (Alex) ---
    contrarianStrategy() {
      const decisions = [];
      const stocks = this.marketData.stocks;

      // Fa l'opposto del sentiment di mercato
      const sentiment = this.marketData.marketSentiment || 0.5;

      if (sentiment > 0.6) {
        // Troppo ottimismo -> shorta
        const topGainers = stocks.filter(s => s.change && s.change > 5).slice(0, 2);
        for (const stock of topGainers) {
          if (this.capital > 50000) {
            const shares = Math.floor(this.capital * 0.1 / stock.price);
            if (shares > 0) {
              decisions.push({ action: 'SELL', symbol: stock.symbol, shares, price: stock.price, reason: 'contrarian_short_overbought' });
            }
          }
        }
      } else if (sentiment < 0.4) {
        // Troppo pessimismo -> compra
        const topLosers = stocks.filter(s => s.change && s.change < -5).slice(0, 2);
        for (const stock of topLosers) {
          if (this.capital > 50000 && !this.getPosition(stock.symbol)) {
            const shares = Math.floor(this.capital * 0.15 / stock.price);
            if (shares > 0) {
              decisions.push({ action: 'BUY', symbol: stock.symbol, shares, price: stock.price, reason: 'contrarian_buy_oversold' });
            }
          }
        }
      }

      // Vende posizioni che stanno performando bene (contrarian)
      for (const pos of [...this.portfolio]) {
        const price = this.getStockPrice(pos.symbol);
        const profitPct = (price - pos.avgPrice) / pos.avgPrice * 100;
        if (profitPct > 20) {
          decisions.push({ action: 'SELL', symbol: pos.symbol, shares: Math.floor(pos.shares * 0.6), price, reason: 'contrarian_take_profit' });
        }
      }

      return decisions;
    }

    // --- DIALOGHI ---
    getDialogue(type) {
      const set = this.dialogueSet;
      if (!set || !set[type]) return this.getDefaultDialogue(type);
      return pick(set[type]);
    }

    getDefaultDialogue(type) {
      const defaults = {
        taunt: 'Ti sto battendo. Punto.',
        praise: 'Bel colpo. Rispetto.',
        challenge: 'Ti sfido. Accetti?',
        insider: 'Insider trading? Interessante.',
        opa: 'Facciamo un\'offerta.',
        bankrupt: 'È finita. Per ora.'
      };
      return defaults[type] || '...';
    }

    getReactionDialogue(context) {
      const ctx = context || {};
      if (ctx.playerWonBig) return this.getDialogue('praise');
      if (ctx.playerLostBig) return this.getDialogue('taunt');
      if (ctx.playerInsider) return this.getDialogue('insider');
      if (ctx.challenge) return this.getDialogue('challenge');
      if (ctx.opa) return this.getDialogue('opa');
      if (ctx.bankrupt) return this.getDialogue('bankrupt');
      return this.getDialogue('taunt');
    }

    // --- OPA ---
    canLaunchOPA(playerPortfolio) {
      if (!this.active) return false;
      if (this.capital < 500000) return false;

      // Cerca società dove il giocatore ha una quota significativa
      for (const pos of playerPortfolio) {
        const myPos = this.getPosition(pos.symbol);
        const totalShares = pos.shares + (myPos ? myPos.shares : 0);
        if (totalShares > 0) {
          const myPct = myPos ? myPos.shares / totalShares : 0;
          // Se il competitor ha già una quota o vuole comprare
          if (myPos || this.capital > pos.shares * this.getStockPrice(pos.symbol) * 0.5) {
            return { symbol: pos.symbol, targetShares: pos.shares };
          }
        }
      }
      return null;
    }

    launchOPA(symbol, targetShares, playerPrice) {
      const price = this.getStockPrice(symbol);
      const premium = 1 + rand(OPA_PREMIUM_MIN, OPA_PREMIUM_MAX);
      const offerPrice = round2(price * premium);
      const totalCost = targetShares * offerPrice;

      if (totalCost > this.capital * 0.7) return null;

      return {
        competitor: this,
        symbol,
        targetShares,
        offerPrice,
        premium: round2((premium - 1) * 100),
        totalCost: round2(totalCost),
        status: 'pending',
        playerResponse: null
      };
    }

    // --- SFIDE ---
    issueChallenge() {
      if (this.activeChallenge) return null;
      if (!this.active) return null;

      const template = pick(CHALLENGE_TEMPLATES);
      const challenge = {
        id: 'challenge_' + Date.now() + '_' + this.id,
        competitor: this,
        title: template.title,
        description: template.description(this),
        metric: template.metric,
        duration: template.duration,
        startWeek: this.marketData ? this.marketData.currentWeek : 0,
        endWeek: (this.marketData ? this.marketData.currentWeek : 0) + template.duration,
        reward: template.reward,
        penalty: template.penalty,
        status: 'pending', // pending, active, completed, won, lost
        competitorStartValue: this.getTotalValue(),
        playerStartValue: 0,
        competitorEndValue: 0,
        playerEndValue: 0
      };

      this.activeChallenge = challenge;
      return challenge;
    }

    // --- RELAZIONI ---
    modifyRelationship(delta) {
      this.relationshipScore = clamp(this.relationshipScore + delta, -100, 100);
      if (this.relationshipScore > 50) this.relationship = 'alleato';
      else if (this.relationshipScore < -50) this.relationship = 'rivale';
      else this.relationship = 'neutro';
    }

    // --- STATO ---
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        nickname: this.nickname,
        avatar: this.avatar,
        capital: round2(this.capital),
        initialCapital: round2(this.initialCapital),
        totalValue: round2(this.getTotalValue()),
        portfolio: this.portfolio.map(p => ({
          symbol: p.symbol,
          shares: p.shares,
          avgPrice: round2(p.avgPrice),
          currentPrice: round2(this.getStockPrice(p.symbol)),
          value: round2(p.shares * this.getStockPrice(p.symbol)),
          profitPct: round2((this.getStockPrice(p.symbol) - p.avgPrice) / p.avgPrice * 100)
        })),
        roi: round2(this.getROI()),
        weeklyROI: round2(this.getWeeklyROI()),
        active: this.active,
        relationship: this.relationship,
        relationshipScore: this.relationshipScore,
        secRep: this.secRep,
        wallStreetRep: this.wallStreetRep,
        tradeCount: this.tradeHistory.length,
        personality: this.personality,
        strategy: this.strategy
      };
    }
  }

  // ============================================================
  // COMPETITOR ENGINE
  // ============================================================
  class CompetitorEngine {
    constructor() {
      this.competitors = [];
      this.marketData = null;
      this.currentWeek = 0;
      this.events = [];
      this.activeChallenges = [];
      this.completedChallenges = [];
      this.playerPortfolio = [];
      this.playerCapital = 0;
      this.playerRep = 50;
      this.playerXP = 0;
      this.callbacks = {};
      this.initialized = false;
    }

    // --- INIZIALIZZAZIONE ---
    init(marketData) {
      this.marketData = marketData;
      this.competitors = COMPETITOR_DEFS.map(def => new Competitor(def, marketData));
      this.initialized = true;
      return this;
    }

    setMarketData(marketData) {
      this.marketData = marketData;
      for (const c of this.competitors) {
        c.marketData = marketData;
      }
    }

    setPlayerData(portfolio, capital, rep, xp) {
      this.playerPortfolio = portfolio || [];
      this.playerCapital = capital || 0;
      this.playerRep = rep || 50;
      this.playerXP = xp || 0;
    }

    setCallbacks(cbs) {
      this.callbacks = cbs || {};
    }

    // --- TURNO SETTIMANALE ---
    processWeek() {
      if (!this.initialized) return { events: [], trades: [] };
      this.currentWeek = (this.marketData && this.marketData.currentWeek) || (this.currentWeek + 1);
      if (this.marketData) this.marketData.currentWeek = this.currentWeek;

      const allTrades = [];
      const newEvents = [];

      // Ogni competitor esegue il suo turno
      for (const c of this.competitors) {
        if (!c.active) continue;
        const trades = c.executeTurn();
        allTrades.push({ competitor: c, trades });
      }

      // Processa eventi competitor
      for (const c of this.competitors) {
        if (!c.active) continue;
        for (const evt of COMPETITOR_EVENTS) {
          if (evt.condition(c, this.getContext())) {
            const eventData = {
              id: evt.id,
              title: evt.title,
              description: evt.description(c),
              competitor: c,
              week: this.currentWeek
            };
            evt.effect(c, this.getContext());
            newEvents.push(eventData);
            this.events.push(eventData);
          }
        }
      }

      // Aggiorna sfide attive
      this.updateChallenges();

      // Verifica OPA
      for (const c of this.competitors) {
        if (!c.active) continue;
        const opaTarget = c.canLaunchOPA(this.playerPortfolio);
        if (opaTarget && Math.random() < 0.08) {
          const opa = c.launchOPA(opaTarget.symbol, opaTarget.targetShares, 0);
          if (opa) {
            newEvents.push({
              id: 'opa_launched',
              title: 'OPA Ostile!',
              description: c.nickname + ' ha lanciato un\'OPA ostile su ' + opa.symbol + '! Premium del ' + opa.premium + '%!',
              competitor: c,
              opa: opa,
              week: this.currentWeek
            });
            if (this.callbacks.onOPA) this.callbacks.onOPA(opa);
          }
        }
      }

      // Genera sfide casuali
      if (Math.random() < 0.1) {
        const challenger = pick(this.competitors.filter(c => c.active));
        if (challenger && !challenger.activeChallenge) {
          const challenge = challenger.issueChallenge();
          if (challenge) {
            this.activeChallenges.push(challenge);
            newEvents.push({
              id: 'challenge_issued',
              title: 'Sfida Lanciata!',
              description: challenge.description,
              competitor: challenger,
              challenge: challenge,
              week: this.currentWeek
            });
            if (this.callbacks.onChallenge) this.callbacks.onChallenge(challenge);
          }
        }
      }

      // Genera messaggi casuali dai competitor
      const messages = this.generateMessages();

      return {
        week: this.currentWeek,
        trades: allTrades,
        events: newEvents,
        messages: messages,
        rankings: this.getRankings()
      };
    }

    getContext() {
      return {
        week: this.currentWeek,
        playerRep: this.playerRep,
        playerPortfolio: this.playerPortfolio,
        playerCapital: this.playerCapital,
        onStealClients: this.callbacks.onStealClients,
        onPartnershipOffer: this.callbacks.onPartnershipOffer,
        onPumpDump: this.callbacks.onPumpDump,
        onWhaleMove: this.callbacks.onWhaleMove,
        onHostileTakeover: this.callbacks.onHostileTakeover
      };
    }

    // --- MESSAGGI ---
    generateMessages() {
      const messages = [];
      const playerValue = this.playerCapital + this.getPlayerPortfolioValue();

      for (const c of this.competitors) {
        if (!c.active) continue;
        if (Math.random() > 0.3) continue; // 30% chance di messaggio

        const cValue = c.getTotalValue();
        let msgType = 'taunt';

        if (cValue < playerValue * 0.5 && Math.random() < 0.3) {
          msgType = 'praise';
        } else if (c.relationship === 'alleato' && Math.random() < 0.3) {
          msgType = 'praise';
        }

        const text = c.getDialogue(msgType);
        messages.push({
          competitor: c,
          text: text,
          type: msgType,
          week: this.currentWeek
        });
      }

      return messages;
    }

    getPlayerPortfolioValue() {
      if (!this.playerPortfolio) return 0;
      let total = 0;
      for (const pos of this.playerPortfolio) {
        total += pos.shares * (pos.currentPrice || pos.avgPrice || 10);
      }
      return total;
    }

    // --- CLASSIFICHE ---
    getRankings() {
      const all = this.competitors.filter(c => c.active);
      const playerValue = this.playerCapital + this.getPlayerPortfolioValue();
      const playerROI = this.playerCapital > 0 ? ((playerValue - this.playerCapital) / this.playerCapital) * 100 : 0;

      // Per patrimonio totale
      const byWealth = [...all].sort((a, b) => b.getTotalValue() - a.getTotalValue());
      const wealthRanking = byWealth.map((c, i) => ({
        rank: i + 1,
        competitor: c,
        value: round2(c.getTotalValue())
      }));

      // Per performance settimanale
      const byWeekly = [...all].sort((a, b) => b.weeklyPerformance - a.weeklyPerformance);
      const weeklyRanking = byWeekly.map((c, i) => ({
        rank: i + 1,
        competitor: c,
        performance: round2(c.weeklyPerformance)
      }));

      // Per ROI
      const byROI = [...all].sort((a, b) => b.getROI() - a.getROI());
      const roiRanking = byROI.map((c, i) => ({
        rank: i + 1,
        competitor: c,
        roi: round2(c.getROI())
      }));

      // Posizione del giocatore
      const playerWealthRank = all.filter(c => c.getTotalValue() > playerValue).length + 1;
      const playerWeeklyRank = all.filter(c => c.weeklyPerformance > 0).length + 1; // approssimato
      const playerROIRank = all.filter(c => c.getROI() > playerROI).length + 1;

      return {
        wealth: wealthRanking,
        weekly: weeklyRanking,
        roi: roiRanking,
        player: {
          wealthRank: playerWealthRank,
          weeklyRank: playerWeeklyRank,
          roiRank: playerROIRank,
          totalValue: round2(playerValue),
          roi: round2(playerROI),
          totalCompetitors: all.length + 1
        }
      };
    }

    // --- SFIDE ---
    acceptChallenge(challengeId) {
      const challenge = this.activeChallenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      challenge.status = 'active';
      challenge.playerStartValue = this.playerCapital + this.getPlayerPortfolioValue();
      return true;
    }

    rejectChallenge(challengeId) {
      const challenge = this.activeChallenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      challenge.status = 'rejected';
      this.completedChallenges.push(challenge);
      this.activeChallenges = this.activeChallenges.filter(c => c.id !== challengeId);
      challenge.competitor.activeChallenge = null;
      return true;
    }

    updateChallenges() {
      for (const challenge of [...this.activeChallenges]) {
        if (challenge.status !== 'active') continue;
        if (this.currentWeek >= challenge.endWeek) {
          // Determina vincitore
          const cEnd = challenge.competitor.getTotalValue();
          const pEnd = this.playerCapital + this.getPlayerPortfolioValue();

          const cROI = ((cEnd - challenge.competitorStartValue) / challenge.competitorStartValue) * 100;
          const pROI = ((pEnd - challenge.playerStartValue) / challenge.playerStartValue) * 100;

          let playerWon = false;
          switch (challenge.metric) {
            case 'profit':
              playerWon = (pEnd - challenge.playerStartValue) > (cEnd - challenge.competitorStartValue);
              break;
            case 'roi':
              playerWon = pROI > cROI;
              break;
            case 'short_profit':
              playerWon = pROI > cROI; // semplificato
              break;
            case 'hold_time':
              playerWon = pROI > cROI;
              break;
            case 'penny_profit':
              playerWon = pROI > cROI;
              break;
            default:
              playerWon = pROI > cROI;
          }

          challenge.status = playerWon ? 'won' : 'lost';
          challenge.competitorEndValue = cEnd;
          challenge.playerEndValue = pEnd;

          if (playerWon) {
            this.playerXP += challenge.reward.xp;
            this.playerCapital += challenge.reward.capital;
            this.playerRep += challenge.reward.rep;
            challenge.competitor.modifyRelationship(10);
          } else {
            this.playerXP += challenge.penalty.xp;
            this.playerCapital += challenge.penalty.capital;
            this.playerRep += challenge.penalty.rep;
            challenge.competitor.modifyRelationship(-10);
          }

          this.completedChallenges.push(challenge);
          this.activeChallenges = this.activeChallenges.filter(c => c.id !== challenge.id);
          challenge.competitor.activeChallenge = null;

          if (this.callbacks.onChallengeResult) {
            this.callbacks.onChallengeResult(challenge, playerWon);
          }
        }
      }
    }

    // --- OPA ---
    respondToOPA(opa, response) {
      if (!opa || opa.status !== 'pending') return false;

      opa.status = response;
      opa.playerResponse = response;

      switch (response) {
        case 'accept': {
          // Giocatore incassa il premium
          const payout = opa.targetShares * opa.offerPrice;
          this.playerCapital += payout;
          // Rimuovi dal portafoglio giocatore
          this.playerPortfolio = this.playerPortfolio.filter(p => p.symbol !== opa.symbol);
          opa.competitor.capital -= opa.totalCost;
          opa.competitor.portfolio.push({
            symbol: opa.symbol,
            shares: opa.targetShares,
            avgPrice: opa.offerPrice
          });
          opa.competitor.modifyRelationship(5);
          break;
        }
        case 'reject': {
          // Competitor compra comunque se ha abbastanza capitale
          if (opa.competitor.capital >= opa.totalCost) {
            opa.competitor.capital -= opa.totalCost;
            const existing = opa.competitor.getPosition(opa.symbol);
            if (existing) {
              existing.shares += opa.targetShares;
              existing.avgPrice = (existing.shares * existing.avgPrice + opa.targetShares * opa.offerPrice) / (existing.shares + opa.targetShares);
            } else {
              opa.competitor.portfolio.push({
                symbol: opa.symbol,
                shares: opa.targetShares,
                avgPrice: opa.offerPrice
              });
            }
            opa.competitor.modifyRelationship(-15);
          }
          break;
        }
        case 'counter': {
          // Controfferta: il giocatore compra le quote del competitor
          const counterPrice = opa.offerPrice * 1.1;
          const cost = opa.targetShares * counterPrice;
          if (this.playerCapital >= cost) {
            this.playerCapital -= cost;
            const existing = this.playerPortfolio.find(p => p.symbol === opa.symbol);
            if (existing) {
              existing.shares += opa.targetShares;
              existing.avgPrice = (existing.shares * existing.avgPrice + opa.targetShares * counterPrice) / (existing.shares + opa.targetShares);
            } else {
              this.playerPortfolio.push({
                symbol: opa.symbol,
                shares: opa.targetShares,
                avgPrice: counterPrice
              });
            }
            opa.competitor.capital += cost;
            opa.competitor.modifyRelationship(-20);
          }
          break;
        }
      }

      return true;
    }

    // --- EVENTI MANUALI ---
    triggerEvent(eventId, data) {
      const evt = COMPETITOR_EVENTS.find(e => e.id === eventId);
      if (!evt) return null;

      const target = data && data.competitor ? data.competitor : pick(this.competitors.filter(c => c.active));
      if (!target) return null;

      const eventData = {
        id: evt.id,
        title: evt.title,
        description: evt.description(target),
        competitor: target,
        week: this.currentWeek,
        manual: true
      };

      evt.effect(target, this.getContext());
      this.events.push(eventData);
      return eventData;
    }

    triggerMerger(c1, c2) {
      if (!c1.active || !c2.active) return null;
      const evt = COMPETITOR_EVENTS.find(e => e.id === 'merger');
      const eventData = {
        id: 'merger',
        title: 'Fusione tra competitor',
        description: c1.nickname + ' e ' + c2.nickname + ' hanno fuso i loro fondi!',
        competitor: c1,
        target: c2,
        week: this.currentWeek
      };
      evt.effect(c1, c2, this.getContext());
      this.events.push(eventData);
      return eventData;
    }

    // --- GETTERS ---
    getCompetitor(id) {
      return this.competitors.find(c => c.id === id);
    }

    getActiveCompetitors() {
      return this.competitors.filter(c => c.active);
    }

    getCompetitorByRelationship(rel) {
      return this.competitors.filter(c => c.relationship === rel && c.active);
    }

    getEvents(limit) {
      const evts = [...this.events].reverse();
      return limit ? evts.slice(0, limit) : evts;
    }

    getChallenges() {
      return {
        active: this.activeChallenges,
        completed: this.completedChallenges
      };
    }

    // --- STATO COMPLETO ---
    getFullState() {
      return {
        week: this.currentWeek,
        competitors: this.competitors.map(c => c.toJSON()),
        rankings: this.getRankings(),
        activeChallenges: this.activeChallenges.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          competitor: c.competitor.nickname,
          status: c.status,
          startWeek: c.startWeek,
          endWeek: c.endWeek,
          metric: c.metric
        })),
        recentEvents: this.getEvents(10),
        player: {
          capital: round2(this.playerCapital),
          portfolioValue: round2(this.getPlayerPortfolioValue()),
          totalValue: round2(this.playerCapital + this.getPlayerPortfolioValue()),
          rep: this.playerRep,
          xp: this.playerXP
        }
      };
    }

    // --- RESET ---
    reset() {
      this.competitors = [];
      this.events = [];
      this.activeChallenges = [];
      this.completedChallenges = [];
      this.currentWeek = 0;
      this.initialized = false;
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================
  window.CompetitorEngine = CompetitorEngine;
  window.Competitor = Competitor;

  // Esponi anche le definizioni per debug
  window.__COMPETITOR_DEFS = COMPETITOR_DEFS;
  window.__COMPETITOR_EVENTS = COMPETITOR_EVENTS;
  window.__CHALLENGE_TEMPLATES = CHALLENGE_TEMPLATES;
  window.__DIALOGUES = DIALOGUES;

})();
