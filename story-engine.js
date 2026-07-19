/**
 * Stock Broker Game - Story Engine
 * Sistema narrativo completo stile "The Wolf of Wall Street"
 * Vanilla JS, esportabile come window.StoryEngine
 * Lingua: Italiano
 */

(function (global) {
  'use strict';

  // ============================================================
  // UTILITY
  // ============================================================
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return 'id_' + Math.random().toString(36).substr(2, 9); }

  // ============================================================
  // NPC E DIALOGHI
  // ============================================================
  var NPCS = {
    jordan: {
      name: 'Jordan Belfort',
      role: 'Mentore cinico',
      bio: 'Fondatore della Stratton Oakmont. Genio delle vendite, anima in vendita. Ti insegna i segreti della strada ma non si fida di nessuno.',
      portrait: 'jordan.png',
      dialogues: [
        'Senti, questo non è un gioco per ragazzini. La gente viene qui per fare soldi, non per fare amicizia. Se vuoi un amico, comprati un cane.',
        'La regola numero uno: non farti fregare. I clienti sono pecore, noi siamo i pastori. Ma le pecore devono amare il pastore, altrimenti scappano.',
        'Hai mai venduto una penna? No? Allora non sai un cazzo. Il prodotto non importa, importa come lo vendi. La vendita è seduzione.',
        'Ascolta bene: ogni telefono è un arena. Quando alzi la cornetta sei un gladiatore. Il cliente è il leone. Vince chi ha piu fegato.',
        'Io non vendo azioni. Vendo sogni. La gente non compra titoli, compra la speranza di essere qualcuno. Capisci questo e sei a cavallo.',
        'Ti dico un segreto: il mercato è una bugia organizzata. Tutti mentono, dal broker al CEO al giornale. Chi mente meglio vince. Ma non farti beccare.',
        'La differenza tra me e gli altri? Io ci credo. Quando vendo una schifezza, ci credo come se fosse oro. La convinzione è tutto.',
        'Mai mostrare paura al telefono. Il cliente la sente, come un cane sente la paura. Se tremi, hai già perso.',
        'Hai fatto centro oggi? Bene. Domani rifallo. Non cè gloria nel ieri, solo nel prossimo colpo.',
        'La SEC? Un branco di burocrati con la paura. Li tieni occupati con scartoffie e mentre dormono tu fai il botto.',
        'Donnie è leale ma non è un genio. Tu hai cervello, lui ha stomaco. Insieme siete perfetti. Non metterti contro di lui.',
        'I soldi non ti comprano la felicità, ma comprano uno yacht enorme dove puoi essere triste in stile. Ricordatelo.',
        'Quando il cliente dice "ci penso", hai già perso. Deve dire "sì" prima di riagganciare. Sempre.',
        'Un broker senza ambizione è un cassiere. Tu non sei un cassiere, vero? Dimostramelo.',
        'La fedeltà si compra. Non con i soldi, con la paura di perderti. Fai in modo che tutti abbiano bisogno di te.',
        'Ricordati: la prigione è piena di broker che pensavano di essere più furbi di tutti. Sii furbo abbastanza da sapere quando fermarti.',
        'Ogni mattina mi guardo allo specchio e dico: "Oggi farò qualcosa che gli altri non hanno il coraggio di fare." E lo faccio.',
        'La vita è corta. Il mercato è lungo. Ma se non vivi ora, quando? Fai i soldi, divertiti, paga le conseguenze dopo.',
        'Il segreto della vendita: non chiedere, guida. "Vuole comprare?" è da perdenti. "Le mando le azioni oggi?" è da vincenti.',
        'Non tradire mai chi ti è leale. Donnie, Naomi, te stesso. Gli altri sono clienti, dipendenti, estranei. Ma il tuo cerchio interno è sacro.',
        'Un giorno questa storia finirà. Il mercato crolla, la SEC bussa, la moglie se va. Ma i racconti rimangono. Diventa una leggenda.'
      ]
    },
    naomi: {
      name: 'Naomi',
      role: 'Moglie, voce della ragione',
      bio: 'Ti ama ma non è cieca. Vede il baratro prima di te. Ti tiene ancorato quando tutto va a rotoli, ma ha un limite.',
      portrait: 'naomi.png',
      dialogues: [
        'Jordan, stai lavorando fino a mezzanotte di nuovo? I soldi non ti tengono compagnia la notte. Io sì.',
        'Ho visto come guardi quel telefono. È la tua amante, lo sai? Io sono la seconda. Da quando va avanti?',
        'Non mi importa dello yacht, dei vestiti, dell oro. Mi importa che torni a casa e sia ancora tu. Ma succede sempre meno spesso.',
        'Sai cosa mi fa paura? Non la SEC, non i rivali. Il fatto che ti riconosco sempre meno. Luomo che ho sposato sta sparendo.',
        'Ieri nostra figlia ti ha cercato. Eri al telefono con un cliente. Non se lo ricorderà, lei sì. Ricorderà che non ceri.',
        'Fai quello che vuoi con i tuoi soldi. Ma non toccare i fondi dell istruzione. Quelli sono sacri. Se lo fai, non torno.',
        'Tua madre mi ha chiamato. Dice che sei diventato irriconoscibile. Le ho detto che sei "ambizioso". Non mi ha creduto.',
        'Vuoi sapere la verità? Non sei il primo broker di Wall Street, non sarai l ultimo. Ma potresti essere il primo che si salva. O no.',
        'A volte penso che ami il rischio più di me. Quando hai perso il conto ieri, sorridevi. Quando litighiamo, soffri. Non è normale.',
        'Donnie è un bambino viziato e tu lo incoraggi. Un giorno ti trascinerà in un guaio. Ricorda queste parole.',
        'Ho parlato con un avvocato. Non per divorziare, per capire. Mi ha detto che quello che fate alla Stratton è... complicato. Lo sapevi?',
        'Quando porti i soldi a casa, li metti nel cassetto come se fossero sporchi. Lo sono? Non me lo dici mai.',
        'La prossima volta che porti i clienti a casa, non qui. Portali in ufficio. Mia figlia non è parte del tuo show.',
        'Sai cosa mi ha detto la moglie di un altro broker? "Prega che non lo beccano." Io non voglio pregare. Voglio sapere che sei pulito.',
        'Jordan, ti amo. Ma l amore ha un limite. Se crolli tutto, ci sono io. Se mi tradisci, non cè più niente.',
        'Ho sognato che ti portavano via in manette. Mi sono svegliata e tu non ceri. Eri in ufficio. Non so quale versione fosse peggio.',
        'Non ti chiedo di fermarti. Ti chiedo di sapere quando fermarti. Cè una differenza enorme.',
        'Quegli orologi, quelle macchine, quei vestiti... un giorno li guarderai e ti chiederai cosa ne è stato di te.',
        'Se collabori con la SEC, ti rispetto. Se scappi, ti perdoni. Ma se menti a me, non mi rivedrai.',
        'Sai perché ti sto ancora qui? Perché sotto tutto questo casino, vedo ancora l uomo che eri. Spero che esista ancora.',
        'La bambina ha disegnato la casa. Ci ha messo te, me, lei e un ometto in giacca. Lometto non aveva faccia. Cosa ti dice?'
      ]
    },
    donnie: {
      name: 'Donnie Azoff',
      role: 'Amico leale, trader aggressivo',
      bio: 'Ti ha seguito dopo aver visto la tua macchina. Leale fino alla morte ma impulsivo. Se dice "facciamo un botto", preoccupati.',
      portrait: 'donnie.png',
      dialogues: [
        'Capo, hai visto la macchina nuova? Mi sono permesso. Si vive una volta sola, no? La facciamo franca, tranquillo.',
        'Ho un presentimento su questa penny stock. Non chiedermi perché, lo sento. Quando lo sento, è oro. Fidati.',
        'I ragazzi della sala sono pronti. Dici "vai" e pompiamo tutto. Il volume parte, i retail entrano, noi usciamo. Bello.',
        'Senti, non dico di fregare i clienti. Dico di... guidarli. Verso titoli che ci conviene vendere. È diverso, no?',
        'Jordan, la SEC ha chiamato oggi. Ho detto che eri fuori. Non mi hanno creduto. Quando torni, forse è meglio se chiami un avvocato.',
        'Ho reclutato tre nuovi ragazzi. Uno è un figlio di puttana incredibile al telefono. Gli altri due sono normali. Ma quel primo... oro.',
        'Ascolta, so che Naomi non è felice. Ma tu sei il capo, non puoi fermarti ora. Quando sei in cima, tutti ti tirano giù. Tutti.',
        'Ieri ho fatto trecentomila in un ora. Trecentomila. Mi sono comprato un orologio che vale più della casa di mio padre. Ridiamo.',
        'Non guardarmi così. Lo so che il pump and dump è illegale. Ma anche guidare a 200 è illegale e tutti lo fanno. Siamo solo... più bravi.',
        'Brad mi ha passato un informazione. Domani annunciano l acquisizione. Se compriamo oggi, domani facciamo il triplo. Che facciamo?',
        'Senti, capo, non dirmi di rallentare. L ho fatto una volta e ho perso sei mesi. Adesso vado forte. Se crollo, crollo con stile.',
        'Ho messo i soldi in contanti, non in banca. Se viene la SEC, non trovano niente. Ho imparato da te. Sei orgoglioso?',
        'Patrick del SEC è un rompipalle ma è onesto. Questo lo rende pericoloso. I corrotti si comprano, gli onesti si aspettano.',
        'I ragazzi vogliono una serata. Dico strip club, champagne, tutto. Sei dei nostri o sei diventato noioso?',
        'Ken sta facendo terra bruciata. Ha chiamato tre nostri clienti. Due sono restati, uno è andato. Dobbiamo fargli capire.',
        'Lo so che esagero. Ma se non esagero, non mi diverto. E se non mi diverto, perché faccio questo lavoro?',
        'Jordan, ascoltami: qualsiasi cosa succeda, io ci sono. Se crolla tutto, se la SEC ti prende, se Naomi se va. Io non vado da nessuna parte.',
        'Oggi ho visto un ragazzo vendere come un pazzo. Mi ha ricordato te all inizio. L ho assunto. Forse è il prossimo te. O il prossimo disastro.',
        'Sai cosa mi ha detto mia madre? "Stai attento con quei soldi." Le ho detto: "Mamma, i soldi sono il meno. È la vita che è pericolosa."',
        'Quando finirà tutto, e finirà, apriamo un altra cosa. Una legale questa volta. Ma fino ad allora, andiamo forte. Andiamo fortissimo.'
      ]
    },
    patrick: {
      name: 'Patrick Combs',
      role: 'Commissario SEC',
      bio: 'Investigatore tenace. Crede nella giustizia dei mercati. Non si fa comprare, non si fa intimidire. Ti tiene d occhio da mesi.',
      portrait: 'patrick.png',
      dialogues: [
        'Signor Belfort, le dispiace rispondere a qualche domanda? È solo una conversazione informale. Per ora.',
        'Sa cosa mi sorprende di voi broker? Pensate di essere invisibili. Ma ogni transazione lascia una traccia. Ogni singola transazione.',
        'Non la sto accusando di niente. Ma i pattern nei suoi volumi di trading sono... curiosi. Molto curiosi. Come se qualcuno guidasse il mercato.',
        'La SEC non dorme. Forse pensa di sì, ma non è così. Abbiamo tempo, signor Belfort. Tutto il tempo che serve.',
        'Le consiglio un avvocato. Non perché gliene serve uno, ma perché quando si parla con me senza avvocato, di solito finisce male. Per chi parla.',
        'Ho visto aziende crollare per meno di quello che fate alla Stratton Oakmont. Non sottovaluti la mia pazienza.',
        'Le dirò una cosa off the record: qualcuno nella sua azienda parla. Non mi chieda chi, non glielo dico. Ma il cerchio si stringe.',
        'Io non la odio, signor Belfort. Non la odio. Ma il mio lavoro è proteggere gli investitori. Se li sta fregando, la fermo.',
        'Sa quanti casi ho risolto? Centoventisette. Sa quanti si sono dichiarati innocenti fino all ultimo? Tutti. Sa quanti lo erano? Nessuno.',
        'I suoi clienti la amano. Interessante. Di solito le vittime di una truffa odiano il truffatore. Ma lei è bravo. Questo la rende più pericoloso.',
        'Una citazione per lei: "Chi fa l angelo fa la bestia." Lo tenga presente quando va a dormire stanotte.',
        'Non minaccio. Documento. Ogni chiamata sospetta, ogni ordine anomalo, ogni coincidenza troppo perfetta. Cè un fascicolo con il suo nome. Cresce ogni giorno.',
        'Le do un consiglio da essere umano: se ha fatto qualcosa di sbagliato, cè un momento per fermarsi. Quel momento non è mai troppo tardi. Ma a volte è troppo tardi.',
        'Il Congresso ci dà risorse limitate, ma la mia determinazione non lo è. Se lei è pulito, dimostri. Se non lo è, sappia che arrivo.',
        'Ho parlato con i suoi ex clienti. Alcuni la lodano, altri la maledicono. Sa qual è la differenza? Quelli che la lodano non hanno ancora capito cosa è successo.',
        'Brad Bodnick. Conosce questo nome? Certo che lo conosce. Sappiamo che è il suo contatto per informazioni riservate. Non mi serve che confermi, so già.',
        'La avverto: la prossima volta che la chiamo, sarà con un mandato. Non con un invito a chiacchierare. Lo tenga presente.',
        'Sa cosa mi affascina? Lei è intelligente. Poteva fare soldi legalmente, ma non abbastanza in fretta. L impazienza è la sua condanna.',
        'I suoi collaboratori parlano. Non tutti, ma alcuni. La lealtà è bello dirla, ma quando il carcere è reale, la lealtà sparisce. Lo sa vero?',
        'Le offro un accordo. Collaborazione piena, dimezza la pena. Non è un offerta eterna. Ha tempo fino a fine mese. Poi il fascicolo va al procuratore.',
        'Un ultima cosa: la sua famiglia. Non sono il mostro che pensa. Se collabora, tengo sua moglie e sua figlia fuori. Se non lo fa, non prometto niente.'
      ]
    },
    ken: {
      name: 'Ken Savage',
      role: 'Rivale',
      bio: 'Fondatore della Savage & Co. Altrettanto spietato, meno leale. Vuole la tua quota di mercato e i tuoi clienti.',
      portrait: 'ken.png',
      dialogues: [
        'Jordan, Jordan, Jordan. Senti l odore? È paura. La tua. La senti anche tu, vero?',
        'Sto offrendo ai tuoi clienti il 2% in meno sulle commissioni. Due percento. Sai quanto vale la lealtà quando ci sono i soldi in mezzo? Zero.',
        'La Stratton Oakmont è una bomba a orologeria. Quando esplode, io sarò lì a raccogliere i pezzi. E i clienti.',
        'Ti ho visto ieri al ristorante. Lo champagne, i vestiti, lo show. Ma dentro sei vuoto. Lo so perché lo sono anch io. La differenza è che io lo ammetto.',
        'Ho assunto tre dei tuoi migliori broker. Offro il doppio. Tieni gli altri se ci riesci. La lealtà ha un prezzo, e io lo pago.',
        'Sai perché sono migliore di te? Non perché vendo meglio. Perché non mi fido di nessuno. Neanche del mio socio. Tu ti fidi di Donnie. Errore.',
        'La SEC vi sta addosso. Lo so perché hanno parlato con me prima di voi. Ho dato loro niente, ma ho capito dove guardano. Siete fottuti.',
        'Vuoi una guerra? Va bene. Porto via i clienti, i broker, i fornitori. Quando finisco, la Stratton è un guscio vuoto. Scegli: scontri o cedi.',
        'Ho sentito che Naomi non è felice. Se mai avesse bisogno di una spalla... sto scherzando. O no?',
        'Il penny stock pump è roba da dilettanti. Io lavoro con fusioni, acquisizioni, roba seria. Voi siete i pirati, io sono la marina. E la marina vince sempre.',
        'Jordan, ti propongo un affare. Mi dai i tuoi clienti istituzionali, io ti lascio i retail. I retail sono il tuo pubblico, no? Le pecore.',
        'Sai cosa mi ha detto un tuo ex cliente? "Ken è noioso ma non mi ha fregato." Pensaci. "Noioso ma onesto" contro "divertente ma disonesto". Chi vince alla lunga?',
        'Sto lanciando un OPV ostile su una delle tue aziende clienti. Quando la prendo, il tuo rapporto con loro è morto. Preparati.',
        'I tuoi broker parlano. I miei ascoltano. So esattamente cosa state facendo con le penny stock. Se la SEC non vi prende, mi occupo io di avvisarli.',
        'Hai perso tre clienti oggi. Li ho chiamati io. "Cambiamento" dicono. Significa: ho offerto di più. Il mercato è crudele, Jordan.',
        'Una volta ti ammiravo. Davvero. Eri il migliore. Ma il migliore diventa arrogante, e l arroganza è debolezza. Sei debole adesso.',
        'Se crolli, comprerò la Stratton Oakmont per un dollaro. Lo incornicerò. Mi ricorderà che l arroganza ha un prezzo.',
        'Non odiarmi. Sono solo il messaggero del mercato. Il mercato non ha cuore, non ha pietà. Io almeno sorrido mentre ti distruggo.',
        'Ti propongo una tregua. Lasciami il settore tecnologico, ti lascio il farmaceutico. Così non ci distruggiamo a vicenda. Pensaci.',
        'Un giorno uno di noi cadrà. Se cado io, ridi. Se cadi tu, io rido. Ma se cadiamo entrambi, la SEC ride. Scegli bene.'
      ]
    },
    brad: {
      name: 'Brad Bodnick',
      role: 'Contatto insider',
      bio: 'Vende informazioni riservate. Sa tutto di tutti. È l anello debole di ogni catena ma troppo utile per tagliarlo fuori.',
      portrait: 'brad.png',
      dialogues: [
        'Ehi, Jordan, ho qualcosa per te. Ma non al telefono. Mai al telefono. Ci vediamo al solito posto, mezz ora.',
        'Domani la FoodTech annuncia l acquisizione di NutriCorp. Compra oggi, vendi domani al triplo. Ma mi devi il 10% del profitto. Come sempre.',
        'Senti, le informazioni costano. Non in soldi, in favori. Un giorno ti chiedo qualcosa e non puoi dire no. È il patto. Lo accetti?',
        'Non parlarmi mai dove ci sono microfoni. Non scherzo. Il mio ultimo contatto è dentro per colpa di un nastro. Non farmi fare la stessa fine.',
        'Ti ho dato sei dritte quest anno. Cinque sono andate bene. Una no. Ma cinque su sei è meglio di qualsiasi broker legale.',
        'Ascolta, la SEC mi segue. Non mi hanno ancora beccato ma ci sono vicino. Se mi prendono, non mi conoscono. Capito? Non mi conoscono.',
        'Vuoi sapere chi compra azioni prima degli annunci? Tutti. Ma io so chi sa prima degli altri. È la catena dell informazione. Io sono l ultimo anello prima di te.',
        'Brad non è il mio vero nome. Non importa quale sia. Quello che importa è che quando parlo, i soldi piovono. Se mi tradisci, la pioggia si ferma.',
        'Ho un informazione sulla centrale elettrica. Cambio di normativa venerdì. Se compri i titoli giusti giovedì, venerdì fai il botto. 500k minimo.',
        'Sai perché lo faccio? Non per i soldi, ne ho abbastanza. Per il potere. Quando so qualcosa che gli altri non sanno, sono dio. Mi piace essere dio.',
        'Jordan, ti do un consiglio: non fare l insider trading con i tuoi soldi. Usa conti prestanome. Se ti beccano, è il loro nome sulla carta, non il tuo.',
        'Un mio contatto alla PharmaPlus dice che il farmaco non passa la FDA. Vendi allo scoperto oggi, domani il titolo crolla. 30% minimo.',
        'Le informazioni sono come il pesce: fresche valgono oro, vecchie valgono niente. Se ti dico "adesso", significa adesso. Non domani, non tra un ora. Adesso.',
        'Sai cosa mi fa paura? Non la prigione. La noia. Senza questo gioco, senza queste informazioni, sono nessuno. Nessuno. Capisci?',
        'Ti voglio leale, Jordan. Se mi tradisci, non mi arrabbio. Smetto solo di parlarti. E senza le mie informazioni, sei un broker come tutti gli altri.',
        'Ieri ho visto Patrick della SEC davanti a casa mia. Non mi ha fermato, ma mi ha guardato. Mi ha guardato. Sta costruendo qualcosa.',
        'Sai qual è il bello dell insider trading? Tutti sanno che esiste, nessuno lo prova. È il crimine perfetto. Finché qualcuno parla.',
        'Ho un amico al dipartimento fusioni. Mi passa i nomi prima che siano pubblici. Ti do i nomi, tu compri, dividiamo. Ma niente impronte digitali.',
        'Jordan, un ultima cosa: se crollo, non ti trascino con me. Ma se mi tradisci, ti trascino eccome. Siamo soci. I soci si proteggono.',
        'L informazione di oggi vale milioni. Quella di domani vale niente. Vivi nel presente, muori nel passato. È il motto della casa.'
      ]
    }
  };

  // ============================================================
  // CAPITOLI
  // ============================================================
  var CHAPTERS = [
    {
      id: 1,
      title: 'Primi Passi',
      era: '1987',
      intro: 'Sei un giovane di 22 anni che arriva a Wall Street con niente: un diploma, un vestito preso in prestito e un sogno. Hai trovato lavoro come tirocinante alla LF Rothschild. Il mondo dei broker ti appare enorme, crudele e seducente. Il tuo primo giorno ti cambia per sempre: vedi un broker lanciare un telefono contro il muro, poi chiudere un ordine da un milione. Vuoi essere lui.',
      mainMission: 'first_steps',
      npc: 'jordan',
      moralChoice: 'chapter_1_choice'
    },
    {
      id: 2,
      title: 'Il Botto',
      era: 'Lunedì Nero, Ottobre 1987',
      intro: 'Il mercato crolla del 22% in un giorno. Il caos è totale. LF Rothschild chiude. Ti ritrovi per strada senza lavoro, senza soldi, senza niente. Ma hai imparato la lezione più importante: il mercato non perdona. In un centro scommesse locale scopri le penny stock: azioni da due soldi, commissioni altissime, nessuna regolamentazione. È lì che capisci il tuo futuro.',
      mainMission: 'the_crash',
      npc: 'jordan',
      moralChoice: 'chapter_2_choice'
    },
    {
      id: 3,
      title: 'Penny Stocks',
      era: '1988-1989',
      intro: 'Hai aperto la tua prima azienda in un garage con Donnie. Vendete penny stock al telefono. Commissioni al 50%. I clienti non sanno cosa comprano, voi non glielo spiegate. Fa schifo ma fa soldi. Tantissimi soldi. Da un garage a un ufficio, da un ufficio a un piano intero. La Stratton Oakmont è nata.',
      mainMission: 'penny_stocks',
      npc: 'donnie',
      moralChoice: 'chapter_3_choice'
    },
    {
      id: 4,
      title: 'La Firma',
      era: '1990-1991',
      intro: 'La Stratton Oakmont cresce. Hai cento broker, un ufficio a Wall Street, e un nome che inizia a contare. Ma crescere costa: devi trovare capitale, reclutare talenti, e tenere a bada i regolatori. La firma è la tua creatura, il tuo esercito. Ogni broker è un soldato, ogni telefono è un arma.',
      mainMission: 'the_firm',
      npc: 'donnie',
      moralChoice: 'chapter_4_choice'
    },
    {
      id: 5,
      title: 'IPO Mania',
      era: '1991-1992',
      intro: 'Hai scoperto le IPO. Prendi un azienda sconosciuta, la impacchetti, la lanci sul mercato. Tu compri a 2, il pubblico a 20. La differenza è tua. Le IPO della Stratton diventano eventi: gente che festeggia, champagne, soldi che piovono. Ma dietro ogni IPO cè un gioco sporco che nessuno deve sapere.',
      mainMission: 'ipo_mania',
      npc: 'jordan',
      moralChoice: 'chapter_5_choice'
    },
    {
      id: 6,
      title: 'Vite Veloci',
      era: '1992-1993',
      intro: 'I soldi sono ovunque. Yacht, Ferrari, case, orologi, feste che durano giorni. La vita è un film e tu sei il protagonista. Ma la velocità ha un prezzo: Naomi ti aspetta a casa, la bambina cresce senza di te, e ogni notte di eccesso è una notte che non recuperi. Stai bruciando la candela da entrambe le parti.',
      mainMission: 'fast_lives',
      npc: 'naomi',
      moralChoice: 'chapter_6_choice'
    },
    {
      id: 7,
      title: 'Prezzo del Successo',
      era: '1993',
      intro: 'Tutto ha un prezzo. La SEC ha aperto un indagine formale. Patrick Combs ti segue ovunque. Matrimoni di amici in crisi, dipendenti che parlano, e la sensazione che il cerchio si stringa. Più soldi fai, più sei visibile. L oro che ti ha costruito il trono sta diventando la gabbia.',
      mainMission: 'price_success',
      npc: 'patrick',
      moralChoice: 'chapter_7_choice'
    },
    {
      id: 8,
      title: 'Assemblee di Guerra',
      era: '1993-1994',
      intro: 'I clienti reclamano. Hanno perso soldi sulle tue IPO. Gli avvocati fiutano il sangue. Ken Savage ti attacca da fuori. Dentro, i broker vogliono più soldi, i dirigenti vogliono più potenza. Le assemblee della Stratton diventano arene: si urla, si minaccia, si promette. Tu devi tenere insieme tutto con la voce, con la paura, con la promessa del prossimo botto.',
      mainMission: 'war_meetings',
      npc: 'jordan',
      moralChoice: 'chapter_8_choice'
    },
    {
      id: 9,
      title: 'Crash',
      era: '1994-1995',
      intro: 'Il cerchio si chiude. La SEC ha abbastanza prove. Brad parla. Donnie è sotto pressione. I clienti ritirano i soldi. Il titolo della Stratton crolla. Tutto quello che hai costruito sta cadendo come un castello di carte. E per la prima volta, non hai un piano.',
      mainMission: 'the_fall',
      npc: 'patrick',
      moralChoice: 'chapter_9_choice'
    },
    {
      id: 10,
      title: 'Redenzione',
      era: '1995-1996',
      intro: 'Hai due strade: collaborare con la SEC e ricostruire qualcosa di legale, o scappare e perdere tutto. Naomi ti dice di collaborare. Donnie ti dice di scappare. Jordan ti dice di combattere. Scegli tu. Questa è la decisione che definisce chi sei.',
      mainMission: 'redemption',
      npc: 'naomi',
      moralChoice: 'chapter_10_choice'
    },
    {
      id: 11,
      title: 'Il Ritorno',
      era: '1996-1997',
      intro: 'Hai pagato il tuo debito. Multa, carcere, o collaborazione totale. Ora devi ricostruire. Ma il mondo è cambiato: Internet, nuovi broker, nuove regole. Puoi rifare tutto in modo legale o tornare ai vecchi trucchi. Il mercato ti chiama di nuovo.',
      mainMission: 'the_return',
      npc: 'jordan',
      moralChoice: 'chapter_11_choice'
    },
    {
      id: 12,
      title: 'Leggenda',
      era: '1998-Oggi',
      intro: 'Sei diventato una leggenda. Non per i soldi, ma per la storia. La gente racconta di te come di un mito: il broker che ha sfidato Wall Street, che ha vinto e perso, che è risorto. Ora scrivi l ultimo capitolo. Come finisce? Dipende da cosa hai seminato.',
      mainMission: 'legend',
      npc: 'jordan',
      moralChoice: 'chapter_12_choice'
    }
  ];

  // ============================================================
  // MISSIONI PRINCIPALI (12)
  // ============================================================
  var MAIN_MISSIONS = {
    first_steps: {
      title: 'Primi Passi',
      description: 'Impara i fondamentali del mestiere. Chiudi il tuo primo ordine al telefono sotto la guida di Jordan.',
      objective: 'chiudi_1_ordine',
      reward: { capital: 2000, ethics: 0, reputation: { wallStreet: 5 } },
      chapter: 1
    },
    the_crash: {
      title: 'Lunedì Nero',
      description: 'Sopravvivi al crollo del 1987. Non perdere tutto. Trova un opportunità nel disastro.',
      objective: 'sopravvivi_crash_1987',
      reward: { capital: 5000, ethics: 0, reputation: { clients: -5 } },
      chapter: 2
    },
    penny_stocks: {
      title: 'Regno delle Penny Stocks',
      description: 'Apri la Stratton Oakmont. Vendi 100.000$ in penny stock in una settimana.',
      objective: 'vendi_100k_penny',
      reward: { capital: 50000, ethics: -10, reputation: { wallStreet: 10, sec: -10 } },
      chapter: 3
    },
    the_firm: {
      title: 'Costruisci la Firma',
      description: 'Recluta 50 broker e porta la Stratton a un fatturato di 1 milione al mese.',
      objective: 'fatturato_1m_mese',
      reward: { capital: 200000, ethics: -5, reputation: { wallStreet: 15, employees: 20 } },
      chapter: 4
    },
    ipo_mania: {
      title: 'Lancio IPO',
      description: 'Lancia la prima IPO della Stratton. Raccolti almeno 20 milioni.',
      objective: 'ipo_20m',
      reward: { capital: 500000, ethics: -15, reputation: { wallStreet: 25, sec: -20, clients: -10 } },
      chapter: 5
    },
    fast_lives: {
      title: 'Vite Veloci',
      description: 'Mantieni la famiglia mentre il business esplode. Non far crollare i rapporti con Naomi.',
      objective: 'mantieni_rapporti_naomi',
      reward: { capital: 0, ethics: 5, reputation: { clients: 0, employees: 0 } },
      chapter: 6
    },
    price_success: {
      title: 'Sotto Indagine',
      description: 'Gestisci l indagine SEC senza farti beccare. Niente prove, niente confessioni.',
      objective: 'evita_prove_sec',
      reward: { capital: 0, ethics: -10, reputation: { sec: -15 } },
      chapter: 7
    },
    war_meetings: {
      title: 'Assemblea Generale',
      description: 'Tieni l assemblea della Stratton. Mantieni il morale dei broker sopra il 70%.',
      objective: 'morale_70',
      reward: { capital: 100000, ethics: 0, reputation: { employees: 15, clients: 5 } },
      chapter: 8
    },
    the_fall: {
      title: 'La Caduta',
      description: 'Il crollo è arrivato. Limita i danni: non perdere più del 60% del capitale.',
      objective: 'limita_perdita_60',
      reward: { capital: -100000, ethics: 5, reputation: { wallStreet: -20, sec: 10 } },
      chapter: 9
    },
    redemption: {
      title: 'La Svolta',
      description: 'Decidi: collaborare con la SEC o scappare. La scelta definisce il finale.',
      objective: 'decisione_finale',
      reward: { capital: 0, ethics: 20, reputation: { sec: 20, clients: 10 } },
      chapter: 10
    },
    the_return: {
      title: 'Nuovo Inizio',
      description: 'Ricostruisci un business legale. Raggiungi 500.000$ di capitale con metodi puliti.',
      objective: 'capitale_500k_legale',
      reward: { capital: 500000, ethics: 15, reputation: { wallStreet: 10, sec: 15, clients: 15 } },
      chapter: 11
    },
    legend: {
      title: 'Diventa Leggenda',
      description: 'Scrivi la tua storia. Il finale dipende dalla tua Etica totale.',
      objective: 'finale',
      reward: { capital: 0, ethics: 0, reputation: {} },
      chapter: 12
    }
  };

  // ============================================================
  // MISSIONI SECONDARIE (18)
  // ============================================================
  var SIDE_MISSIONS = {
    side_1: {
      title: 'Fai il 20% in una settimana',
      description: 'Usa il tuo capitale personale per fare il 20% in 5 giorni di trading.',
      objective: 'roi_20_5giorni',
      reward: { capital: 0, ethics: 0, reputation: { wallStreet: 5 } },
      chapter: 3
    },
    side_2: {
      title: 'Compra Penny Stock Sconosciuta',
      description: 'Identifica una penny stock con potenziale e compra prima del pump.',
      objective: 'compra_penny_pre_pump',
      reward: { capital: 30000, ethics: -10, reputation: { wallStreet: 5 } },
      chapter: 3
    },
    side_3: {
      title: 'Sopravvivi al Crash',
      description: 'Durante un crollo di mercato del 15%, non perdere più del 10% del capitale.',
      objective: 'sopravvivi_crash_10',
      reward: { capital: 50000, ethics: 5, reputation: { clients: 10 } },
      chapter: 5
    },
    side_4: {
      title: 'Tre Assemblee',
      description: 'Tieni tre assemblee motivazionali in una settimana. Il morale deve restare sopra 75%.',
      objective: 'tre_assemblee_settimana',
      reward: { capital: 20000, ethics: 0, reputation: { employees: 15 } },
      chapter: 4
    },
    side_5: {
      title: 'Short Sell con Successo',
      description: 'Vendi allo scoperto un titolo che crolla del 30% in tre giorni.',
      objective: 'short_30_3giorni',
      reward: { capital: 100000, ethics: -5, reputation: { wallStreet: 10 } },
      chapter: 5
    },
    side_6: {
      title: 'Recluta un Top Broker',
      description: 'Trova e recluta un broker che chiude almeno 500k in ordini al mese.',
      objective: 'recluta_top_broker',
      reward: { capital: 0, ethics: 0, reputation: { employees: 10, wallStreet: 5 } },
      chapter: 4
    },
    side_7: {
      title: 'Pump and Dump',
      description: 'Pompa un titolo del 200% e vendi prima del crollo. Schema classico.',
      objective: 'pump_dump_200',
      reward: { capital: 200000, ethics: -25, reputation: { sec: -20, clients: -15 } },
      chapter: 5
    },
    side_8: {
      title: 'Insider Tip da Brad',
      description: 'Usa un informazione riservata di Brad per chiudere un trade da almeno 500k.',
      objective: 'insider_trade_500k',
      reward: { capital: 500000, ethics: -30, reputation: { sec: -25, wallStreet: 5 } },
      chapter: 6
    },
    side_9: {
      title: 'Front Running',
      description: 'Compra un titolo prima di un grande ordine cliente. Vendi dopo il rialzo.',
      objective: 'front_running_1',
      reward: { capital: 100000, ethics: -20, reputation: { sec: -15, clients: -10 } },
      chapter: 4
    },
    side_10: {
      title: 'Donazione di Carità',
      description: 'Dona 100.000$ a un associazione. Migliora la tua immagine pubblica.',
      objective: 'dona_100k',
      reward: { capital: -100000, ethics: 20, reputation: { clients: 15, sec: 5, wallStreet: 5 } },
      chapter: 6
    },
    side_11: {
      title: 'Investimento Etico',
      description: 'Investi in un azienda con valori sociali e ambientali. Rendimento minore ma etica alta.',
      objective: 'investi_etico',
      reward: { capital: 20000, ethics: 15, reputation: { clients: 10, sec: 10 } },
      chapter: 7
    },
    side_12: {
      title: 'Collabora con la SEC',
      description: 'Fornisci informazioni volontariamente alla SEC su un broker sleale.',
      objective: 'collabora_sec',
      reward: { capital: 0, ethics: 25, reputation: { sec: 25, employees: -10 } },
      chapter: 7
    },
    side_13: {
      title: 'Tangente a un Funzionario',
      description: 'Paga un funzionario per avere informazioni su un indagine.',
      objective: 'tangente_funzionario',
      reward: { capital: -50000, ethics: -20, reputation: { sec: -10 } },
      chapter: 8
    },
    side_14: {
      title: 'Acquisizione Ostile',
      description: 'Lancia un OPV ostile su un azienda rivale. Richiede capitale e fegato.',
      objective: 'opv_ostile',
      reward: { capital: 300000, ethics: -10, reputation: { wallStreet: 20, clients: -5 } },
      chapter: 5
    },
    side_15: {
      title: 'Fuggire all Estero',
      description: 'Trasferisci fondi all estero in caso di indagine. Piano di emergenza.',
      objective: 'trasferisci_estero',
      reward: { capital: -200000, ethics: -15, reputation: { sec: -20 } },
      chapter: 9
    },
    side_16: {
      title: 'Ricetta un Cliente Insoddisfatto',
      description: 'Un cliente minaccia di fare causa. Conviene o intimorisci. Scegli tu.',
      objective: 'ricetta_cliente',
      reward: { capital: -30000, ethics: -10, reputation: { clients: -10 } },
      chapter: 8
    },
    side_17: {
      title: 'Forma Nuovi Broker',
      description: 'Addestra 20 nuovi broker. Investi tempo per costruire il futuro.',
      objective: 'addestra_20_broker',
      reward: { capital: -10000, ethics: 10, reputation: { employees: 20, wallStreet: 5 } },
      chapter: 4
    },
    side_18: {
      title: 'Scrivi la Tua Storia',
      description: 'Pubblica un libro o un documentary. Racconta la tua versione.',
      objective: 'scrivi_libro',
      reward: { capital: 50000, ethics: 5, reputation: { wallStreet: 10, clients: 5 } },
      chapter: 12
    }
  };

  // ============================================================
  // SCELTE MORALI (36 = 3 x 12 capitoli)
  // ============================================================
  var MORAL_CHOICES = {
    chapter_1_choice: [
      {
        id: 'c1_a',
        text: 'Vendi il titolo raccomandato dal cliente anche se sai che è sbagliato per lui. La commissione è la commissione.',
        consequences: { ethics: -5, capital: 1000, reputation: { clients: -5 }, event: null }
      },
      {
        id: 'c1_b',
        text: 'Spieghi onestamente che il titolo è rischioso e suggerisci un alternativa più sicura.',
        consequences: { ethics: 10, capital: 200, reputation: { clients: 10 }, event: null }
      },
      {
        id: 'c1_c',
        text: 'Rifiuti l ordine e perdi il cliente. Ma dormi tranquillo.',
        consequences: { ethics: 15, capital: -500, reputation: { clients: -5, wallStreet: 5 }, event: 'cliente_perso_onesta' }
      }
    ],
    chapter_2_choice: [
      {
        id: 'c2_a',
        text: 'Usa il panico del crash per comprare titoli svalutati di aziende solide. Investimento legale.',
        consequences: { ethics: 5, capital: 20000, reputation: { wallStreet: 10 }, event: null }
      },
      {
        id: 'c2_b',
        text: 'Vendi allo scoperto titoli di aziende in difficoltà. Guadagni dal disastro altrui.',
        consequences: { ethics: -10, capital: 50000, reputation: { wallStreet: 5, clients: -10 }, event: null }
      },
      {
        id: 'c2_c',
        text: 'Aiuta ex colleghi licenziati offrendo loro un lavoro nella tua nuova azienda.',
        consequences: { ethics: 15, capital: -5000, reputation: { employees: 15 }, event: 'ex_colleghi_riconoscenti' }
      }
    ],
    chapter_3_choice: [
      {
        id: 'c3_a',
        text: 'Pompa una penny stock con i tuoi broker, vendi al picco, lascia crollare. Profitto enorme.',
        consequences: { ethics: -25, capital: 100000, reputation: { sec: -15, clients: -20 }, event: 'pump_dump_inizio' }
      },
      {
        id: 'c3_b',
        text: 'Vendi penny stock ma almeno scegli aziende con qualche fundamentals. Menti di meno.',
        consequences: { ethics: -10, capital: 50000, reputation: { sec: -5, clients: -5 }, event: null }
      },
      {
        id: 'c3_c',
        text: 'Rifiuti le penny stock. Ti concentri su titoli legittimi. Meno soldi, meno rischi.',
        consequences: { ethics: 15, capital: 10000, reputation: { sec: 10, clients: 10 }, event: 'stratton_etica_alta' }
      }
    ],
    chapter_4_choice: [
      {
        id: 'c4_a',
        text: 'Recluta broker spietati che vendono qualsiasi cosa a chiunque. Volume sopra tutto.',
        consequences: { ethics: -15, capital: 50000, reputation: { employees: 10, clients: -10, sec: -10 }, event: null }
      },
      {
        id: 'c4_b',
        text: 'Recluta broker competenti ma imponi regole etiche. Più lento ma sostenibile.',
        consequences: { ethics: 10, capital: 20000, reputation: { employees: 5, clients: 10, sec: 5 }, event: null }
      },
      {
        id: 'c4_c',
        text: 'Fai front running: compra titoli per te prima degli ordini dei clienti.',
        consequences: { ethics: -20, capital: 80000, reputation: { sec: -20, clients: -15 }, event: 'front_running_rilevato' }
      }
    ],
    chapter_5_choice: [
      {
        id: 'c5_a',
        text: 'Lancia l IPO a un prezzo gonfiato, vendi le tue quote al picco, lascia crollare.',
        consequences: { ethics: -25, capital: 500000, reputation: { sec: -25, clients: -20, wallStreet: 10 }, event: 'ipo_pump_dump' }
      },
      {
        id: 'c5_b',
        text: 'Lancia l IPO a un prezzo onesto. Meno profitto ma sostenibile nel tempo.',
        consequences: { ethics: 10, capital: 100000, reputation: { sec: 10, clients: 15, wallStreet: 5 }, event: null }
      },
      {
        id: 'c5_c',
        text: 'Usa informazioni insider di Brad per lanciare l IPO al momento perfetto.',
        consequences: { ethics: -30, capital: 300000, reputation: { sec: -30, wallStreet: 5 }, event: 'brad_insider_ipo' }
      }
    ],
    chapter_6_choice: [
      {
        id: 'c6_a',
        text: 'Spendi tutto in yacht, feste e lusso. La vita è breve, goditela.',
        consequences: { ethics: -5, capital: -200000, reputation: { wallStreet: 5, clients: -5 }, event: 'festa_pazza' }
      },
      {
        id: 'c6_b',
        text: 'Dona 100.000$ in beneficenza. Migliora la tua immagine.',
        consequences: { ethics: 20, capital: -100000, reputation: { clients: 15, sec: 10, wallStreet: 5 }, event: 'donazione_pubblica' }
      },
      {
        id: 'c6_c',
        text: 'Investi nella famiglia: casa, istruzione, futuro. Naomi approva.',
        consequences: { ethics: 15, capital: -150000, reputation: { clients: 0, employees: 5 }, event: 'naomi_felice' }
      }
    ],
    chapter_7_choice: [
      {
        id: 'c7_a',
        text: 'Distruggi documenti, cancella email, intimidisci testimoni. Copri le tracce.',
        consequences: { ethics: -20, capital: -20000, reputation: { sec: -30, employees: -10 }, event: 'distruzione_prove' }
      },
      {
        id: 'c7_b',
        text: 'Coopera parzialmente: dai informazioni minori, tieni nascosto il grosso.',
        consequences: { ethics: -5, capital: 0, reputation: { sec: 5, employees: -5 }, event: null }
      },
      {
        id: 'c7_c',
        text: 'Coopera pienamente con Patrick. Confessa tutto.',
        consequences: { ethics: 25, capital: -100000, reputation: { sec: 30, employees: -20, clients: -10 }, event: 'cooperazione_piena' }
      }
    ],
    chapter_8_choice: [
      {
        id: 'c8_a',
        text: 'Minaccia i clienti che vogliono ritirare i fondi. Non se ne va nessuno.',
        consequences: { ethics: -15, capital: 0, reputation: { clients: -20, sec: -10 }, event: 'clienti_minacciati' }
      },
      {
        id: 'c8_b',
        text: 'Offri condizioni migliori ai clienti per trattenerli. Trattative leali.',
        consequences: { ethics: 5, capital: -30000, reputation: { clients: 15 }, event: null }
      },
      {
        id: 'c8_c',
        text: 'Accetta che alcuni clienti se vadano. Mantieni la dignità.',
        consequences: { ethics: 10, capital: -80000, reputation: { clients: 5, sec: 5 }, event: 'clienti_rispettano_uscita' }
      }
    ],
    chapter_9_choice: [
      {
        id: 'c9_a',
        text: 'Scappa all estero con i soldi che ti restano. Ricomincia da zero.',
        consequences: { ethics: -20, capital: -500000, reputation: { sec: -40, clients: -30, wallStreet: -20 }, event: 'fuga_estero' }
      },
      {
        id: 'c9_b',
        text: 'Paga la multa e accetta le conseguenze. Non scappare.',
        consequences: { ethics: 10, capital: -300000, reputation: { sec: 20, clients: 5, wallStreet: -10 }, event: 'multa_accettata' }
      },
      {
        id: 'c9_c',
        text: 'Vendi tutto e lascia il paese segretamente. Torna tra anni.',
        consequences: { ethics: -15, capital: -400000, reputation: { sec: -30, clients: -20, wallStreet: -15 }, event: 'vendita_tutto' }
      }
    ],
    chapter_10_choice: [
      {
        id: 'c10_a',
        text: 'Collabora pienamente con la SEC. Testimonia contro ex colleghi.',
        consequences: { ethics: 30, capital: -200000, reputation: { sec: 40, employees: -30, clients: 10 }, event: 'testimonianza_sec' }
      },
      {
        id: 'c10_b',
        text: 'Collabora ma senza nominare nessuno. Proteggi i tuoi amici.',
        consequences: { ethics: 15, capital: -150000, reputation: { sec: 20, employees: 5, clients: 5 }, event: 'collaborazione_silenziosa' }
      },
      {
        id: 'c10_c',
        text: 'Rifiuta l accordo. Affronta il processo. Tieni la bocca chiusa.',
        consequences: { ethics: 5, capital: -500000, reputation: { sec: -10, employees: 20, wallStreet: 5 }, event: 'processo_imminente' }
      }
    ],
    chapter_11_choice: [
      {
        id: 'c11_a',
        text: 'Ricostruisci con metodi legali. Più lento ma pulito. Leale al patto.',
        consequences: { ethics: 20, capital: 100000, reputation: { sec: 20, clients: 15, wallStreet: 10 }, event: 'rinascita_legale' }
      },
      {
        id: 'c11_b',
        text: 'Torna ai vecchi trucchi. Le abitudini non cambiano. Stavolta più attento.',
        consequences: { ethics: -25, capital: 300000, reputation: { sec: -30, clients: -10, wallStreet: 15 }, event: 'relapse_vecchi_trucchi' }
      },
      {
        id: 'c11_c',
        text: 'Lascia Wall Street. Diventa insegnante di vendita. Trasmetti senza distruggere.',
        consequences: { ethics: 25, capital: -50000, reputation: { sec: 10, clients: 10, wallStreet: -10 }, event: 'insegnante_vendita' }
      }
    ],
    chapter_12_choice: [
      {
        id: 'c12_a',
        text: 'Scrivi un libro. Racconta tutto, senza filtri. La verità come redenzione.',
        consequences: { ethics: 15, capital: 100000, reputation: { wallStreet: 15, clients: 10, sec: 5 }, event: 'libro_pubblicato' }
      },
      {
        id: 'c12_b',
        text: 'Sparisci. Nessun libro, nessuna intervista. Lascia che la leggenda parli da sola.',
        consequences: { ethics: 0, capital: 0, reputation: { wallStreet: 5, clients: 0, sec: 0 }, event: 'sparizione_leggenda' }
      },
      {
        id: 'c12_c',
        text: 'Torna a Wall Street un ultima volta. Fai il colpo finale. Tanto per dimostrare che ci sei ancora.',
        consequences: { ethics: -20, capital: 500000, reputation: { sec: -25, clients: -15, wallStreet: 20 }, event: 'ultimo_colpo' }
      }
    ]
  };

  // ============================================================
  // SCHEMI OSCURI
  // ============================================================
  var DARK_SCHEMES = {
    pump_dump: {
      id: 'pump_dump',
      name: 'Pump and Dump',
      description: 'Pompa artificialmente il prezzo di un titolo tramite raccomandazioni aggressive, poi vendi le tue quote al picco prima del crollo.',
      risk: 'alto',
      potentialProfit: 300000,
      ethicsCost: -25,
      secRisk: 30,
      requirements: { capital: 50000, brokers: 10 },
      steps: [
        'Seleziona un titolo a basso prezzo e basso volume.',
        'Metti i tuoi broker a chiamare clienti per raccomandare il titolo.',
        'Il prezzo sale per il volume artificiale.',
        'Vendi le tue quote al picco.',
        'Il titolo crolla. I clienti perdono. Tu guadagni.'
      ]
    },
    insider_trading: {
      id: 'insider_trading',
      name: 'Insider Trading',
      description: 'Usa informazioni riservate fornite da Brad per comprare o vendere prima di annunci pubblici.',
      risk: 'estremo',
      potentialProfit: 500000,
      ethicsCost: -30,
      secRisk: 40,
      requirements: { capital: 100000, contact: 'brad' },
      steps: [
        'Ricevi un informazione riservata da Brad.',
        'Compra o vendi attraverso conti prestanome.',
        'Aspetta l annuncio pubblico.',
        'Il prezzo si muove come previsto.',
        'Chiudi la posizione e dividi i profitti con Brad.'
      ]
    },
    front_running: {
      id: 'front_running',
      name: 'Front Running',
      description: 'Esegui ordini per tuo conto prima di eseguire grandi ordini dei clienti, approfittando del movimento di prezzo che l ordine cliente creerà.',
      risk: 'medio',
      potentialProfit: 100000,
      ethicsCost: -20,
      secRisk: 25,
      requirements: { capital: 200000, brokers: 5 },
      steps: [
        'Ricevi un grande ordine da un cliente.',
        'Compra lo stesso titolo per tuo conto prima.',
        'Esegui l ordine del cliente: il prezzo sale.',
        'Vendi le tue quote al nuovo prezzo.',
        'Profitto garantito dal movimento del cliente.'
      ]
    },
    wash_trading: {
      id: 'wash_trading',
      name: 'Wash Trading',
      description: 'Compra e vendi lo stesso titolo tra conti controllati per creare volume artificiale e attirare investitori.',
      risk: 'medio',
      potentialProfit: 150000,
      ethicsCost: -15,
      secRisk: 20,
      requirements: { capital: 100000, brokers: 8 },
      steps: [
        'Crea conti di trading controllati.',
        'Compra e vendi lo stesso titolo tra i conti.',
        'Il volume apparente attira investitori reali.',
        'Gli investitori comprano, il prezzo sale.',
        'Vendi le tue quote reali al nuovo prezzo.'
      ]
    },
    churning: {
      id: 'churning',
      name: 'Churning',
      description: 'Esegui un numero eccessivo di operazioni sui conti dei clienti per massimizzare le commissioni, ignorando i loro interessi.',
      risk: 'medio-alto',
      potentialProfit: 80000,
      ethicsCost: -20,
      secRisk: 15,
      requirements: { capital: 0, brokers: 5, clients: 20 },
      steps: [
        'Identifica clienti che non controllano i conti.',
        'Esegui operazioni continue sui loro conti.',
        'Raccogli commissioni su ogni operazione.',
        'I clienti perdono per le commissioni eccessive.',
        'Tu guadagni sulle commissioni.'
      ]
    },
    bribery: {
      id: 'bribery',
      name: 'Corruzione Funzionario',
      description: 'Paga un funzionario per ottenere informazioni su indagini in corso o per rallentare procedure.',
      risk: 'alto',
      potentialProfit: 0,
      ethicsCost: -20,
      secRisk: 10,
      requirements: { capital: 100000 },
      steps: [
        'Identifica un funzionario vulnerabile.',
        'Offri una tangente in contanti.',
        'Ricevi informazioni sull indagine.',
        'Usa le informazioni per coprire le tracce.',
        'Mantieni il funzionario sotto controllo.'
      ]
    }
  };

  // ============================================================
  // SISTEMA REPUTAZIONE
  // ============================================================
  var REPUTATION_SYSTEM = {
    categories: {
      sec: { name: 'SEC', description: 'Reputazione con la commissione di controllo. Bassa = indagini e multe.', min: 0, max: 100, start: 50 },
      clients: { name: 'Clienti', description: 'Reputazione con la clientela. Alta = più capitale e fiducia.', min: 0, max: 100, start: 50 },
      wallStreet: { name: 'Wall Street', description: 'Reputazione nella comunità finanziaria. Alta = rispetto e opportunità.', min: 0, max: 100, start: 30 },
      employees: { name: 'Dipendenti', description: 'Reputazione con i tuoi broker. Alta = lealtà e produttività.', min: 0, max: 100, start: 60 }
    },
    thresholds: {
      sec: {
        critical: 15,
        low: 30,
        medium: 50,
        high: 70
      },
      clients: {
        critical: 15,
        low: 30,
        medium: 50,
        high: 70
      },
      wallStreet: {
        critical: 15,
        low: 30,
        medium: 50,
        high: 70
      },
      employees: {
        critical: 20,
        low: 35,
        medium: 50,
        high: 70
      }
    },
    effects: {
      sec_low: {
        events: ['sec_raid', 'sec_multa_50k', 'sec_multa_200k', 'sec_sospensione'],
        description: 'La SEC ti sta addosso. Rischi raid, multe e sospensioni.'
      },
      sec_high: {
        events: ['sec_riconoscimento'],
        description: 'La SEC ti rispetta. Meno controlli, più fiducia.'
      },
      clients_low: {
        events: ['clienti_fuga', 'clienti_causa'],
        description: 'I clienti se ne vanno. Alcuni fanno causa.'
      },
      clients_high: {
        events: ['clienti_afflusso', 'clienti_capitale_extra'],
        description: 'I clienti arrivano. Più capitale, più commissioni.'
      },
      wallStreet_low: {
        events: ['wallstreet_isolamento', 'rival_attacco'],
        description: 'Wall Street ti isola. I rivali ne approfittano.'
      },
      wallStreet_high: {
        events: ['wallstreet_rispetto', 'nuove_opportunita'],
        description: 'Wall Street ti rispetta. Nuove opportunità.'
      },
      employees_low: {
        events: ['dipendenti_fuga', 'dipendenti_tradimento'],
        description: 'I broker se ne vanno. Qualcuno parla con la SEC.'
      },
      employees_high: {
        events: ['dipendenti_lealta', 'dipendenti_produzione'],
        description: 'I broker sono leali. Produzione al massimo.'
      }
    }
  };

  // ============================================================
  // 50 EVENTI RANDOM
  // ============================================================
  var RANDOM_EVENTS = [
    {
      id: 'ev_1',
      title: 'Cliente Minaccia',
      description: 'Un cliente ha perso 50.000$ sulle tue raccomandazioni. Chiama e minaccia di fare causa.',
      trigger: { reputation: { clients: '<30' } },
      options: [
        { text: 'Offri un rimborso parziale per calmarlo.', effects: { capital: -15000, ethics: 5, reputation: { clients: 10 } } },
        { text: 'Minaccia di controsue se non ritira.', effects: { capital: 0, ethics: -15, reputation: { clients: -15, sec: -5 } } },
        { text: 'Ignoralo. Scompare da solo.', effects: { capital: 0, ethics: -5, reputation: { clients: -10 }, event: 'causa_imminente' } }
      ]
    },
    {
      id: 'ev_2',
      title: 'Giornalista alla Porta',
      description: 'Un giornalista del Wall Street Journal vuole intervistarti. Sente voci sulla Stratton.',
      trigger: { reputation: { sec: '<40' } },
      options: [
        { text: 'Rilascia l intervista. Neghi tutto con stile.', effects: { capital: 0, ethics: -5, reputation: { wallStreet: 10, sec: -5 } } },
        { text: 'Rifiuta. Nessun commento.', effects: { capital: 0, ethics: 0, reputation: { wallStreet: -5 }, event: null } },
        { text: 'Offri un tour dell azienda. Incanta il giornalista.', effects: { capital: -5000, ethics: -10, reputation: { wallStreet: 15, clients: 5 } } }
      ]
    },
    {
      id: 'ev_3',
      title: 'Dipendente Insider',
      description: 'Un broker junior ha visto troppi documenti. Sta facendo domande. Potrebbe parlare.',
      trigger: { reputation: { employees: '<40' } },
      options: [
        { text: 'Licenzialo immediatamente. Non rischiare.', effects: { capital: 0, ethics: -10, reputation: { employees: -15, sec: -5 } } },
        { text: 'Promuovilo. Compra il suo silenzio.', effects: { capital: 20000, ethics: -15, reputation: { employees: 10 } } },
        { text: 'Parlagli. Spiegagli come funziona il gioco.', effects: { capital: 0, ethics: 5, reputation: { employees: 10 }, event: null } }
      ]
    },
    {
      id: 'ev_4',
      title: 'SEC Perquisizione',
      description: 'La SEC si presenta in ufficio con un mandato. Vogliono documenti.',
      trigger: { reputation: { sec: '<20' } },
      options: [
        { text: 'Collabora. Consegna tutto.', effects: { capital: 0, ethics: 10, reputation: { sec: 15 } } },
        { text: 'Manda i documenti nel trituratore. Guadagna tempo.', effects: { capital: -5000, ethics: -20, reputation: { sec: -20 }, event: 'distruzione_documenti' } },
        { text: 'Chiama l avvocato. Temporeggia.', effects: { capital: -20000, ethics: 0, reputation: { sec: -5 }, event: null } }
      ]
    },
    {
      id: 'ev_5',
      title: 'Familiare Chiede Soldi',
      description: 'Tuo cugino ha saputo dei tuoi successi. Vuole 50.000$ per aprire un ristorante.',
      trigger: {},
      options: [
        { text: 'Dagli i soldi. È famiglia.', effects: { capital: -50000, ethics: 10, reputation: { employees: 5 } } },
        { text: 'Rifiuta gentilmente. Non mischiare famiglia e soldi.', effects: { capital: 0, ethics: 0, reputation: {}, event: null } },
        { text: 'Offrigli un lavoro alla Stratton invece.', effects: { capital: 0, ethics: 5, reputation: { employees: -5 } } }
      ]
    },
    {
      id: 'ev_6',
      title: 'Rivale OPV Ostile',
      description: 'Ken Savage lancia un OPV ostile su una delle tue aziende clienti.',
      trigger: { reputation: { wallStreet: '<40' } },
      options: [
        { text: 'Contrattacco: compra azioni per bloccare l OPV.', effects: { capital: -200000, ethics: -5, reputation: { wallStreet: 10, clients: 15 } } },
        { text: 'Lascia che se la prenda. Trova nuovi clienti.', effects: { capital: 0, ethics: 0, reputation: { clients: -15, wallStreet: -10 } } },
        { text: 'Negozia con Ken. Cedi qualcosa per fermarlo.', effects: { capital: -100000, ethics: -10, reputation: { wallStreet: 5, clients: -5 } } }
      ]
    },
    {
      id: 'ev_7',
      title: 'Broker Stella se Ne Va',
      description: 'Il tuo miglior broker riceve un offerta da Ken. Vuole andarsene.',
      trigger: { reputation: { employees: '<50' } },
      options: [
        { text: 'Raddoppia lo stipendio. Non perderlo.', effects: { capital: -100000, ethics: 0, reputation: { employees: 15, wallStreet: -5 } } },
        { text: 'Lascialo andare. Nessuno è insostituibile.', effects: { capital: 0, ethics: 0, reputation: { employees: -10, wallStreet: -5 } } },
        { text: 'Minaccia di rovinarlo se se va.', effects: { capital: 0, ethics: -15, reputation: { employees: -20, sec: -10 } } }
      ]
    },
    {
      id: 'ev_8',
      title: 'Cliente VIP Arriva',
      description: 'Un investitore con 10 milioni di capitale vuole lavorare con te.',
      trigger: { reputation: { clients: '>60' } },
      options: [
        { text: 'Vendi titoli legittimi. Costruiamo fiducia.', effects: { capital: 50000, ethics: 10, reputation: { clients: 15, wallStreet: 5 } } },
        { text: 'Vendi penny stock. Massimizza le commissioni.', effects: { capital: 200000, ethics: -15, reputation: { clients: -10, sec: -5 } } },
        { text: 'Rifiuta. Troppi rischi con clienti grandi.', effects: { capital: 0, ethics: 5, reputation: { clients: -5 } } }
      ]
    },
    {
      id: 'ev_9',
      title: 'Sogno Premonitore',
      description: 'Sogni il crollo del mercato. Ti svegli in un bagno di sudore.',
      trigger: {},
      options: [
        { text: 'Vendi tutto il giorno dopo. Prevenzione.', effects: { capital: -50000, ethics: 0, reputation: { wallStreet: -5 } } },
        { text: 'Ignora il sogno. Solo un incubo.', effects: { capital: 0, ethics: 0, reputation: {}, event: null } },
        { text: 'Compra put options come assicurazione.', effects: { capital: -20000, ethics: 5, reputation: { wallStreet: 5 } } }
      ]
    },
    {
      id: 'ev_10',
      title: 'Naomi Scopre Soldi',
      description: 'Naomi trova 500.000$ in contanti nel cassetto. Vuole risposte.',
      trigger: { ethics: '<40' },
      options: [
        { text: 'Spiega tutto. Deve sapere la verità.', effects: { capital: 0, ethics: 10, reputation: { clients: 0 }, event: 'naomi_verita' } },
        { text: 'Menti. Sono risparmi per la pensione.', effects: { capital: 0, ethics: -10, reputation: {}, event: 'naomi_sospetta' } },
        { text: 'Dille che sono soldi di un cliente. Non fare domande.', effects: { capital: 0, ethics: -15, reputation: {}, event: 'naomi_disgustata' } }
      ]
    },
    {
      id: 'ev_11',
      title: 'Avviso di Multa SEC',
      description: 'La SEC ti multa per 250.000$ per pratiche di vendita irregolari.',
      trigger: { reputation: { sec: '<25' } },
      options: [
        { text: 'Paga la multa. Chiudi la questione.', effects: { capital: -250000, ethics: 5, reputation: { sec: 15 } } },
        { text: 'Contesta la multa. Fai ricorso.', effects: { capital: -50000, ethics: 0, reputation: { sec: -10 }, event: 'ricorso_sec' } },
        { text: 'Paga in contanti. Senza traccia.', effects: { capital: -260000, ethics: -10, reputation: { sec: 5 } } }
      ]
    },
    {
      id: 'ev_12',
      title: 'Festa in Ufficio',
      description: 'I broker vogliono una festa. Il morale è basso.',
      trigger: { reputation: { employees: '<45' } },
      options: [
        { text: 'Organizza una festa enorme. Champagne, cibo, musica.', effects: { capital: -30000, ethics: -5, reputation: { employees: 20 } } },
        { text: 'Organizza una cena sobria. Professionale.', effects: { capital: -5000, ethics: 5, reputation: { employees: 10 } } },
        { text: 'Niente festa. Si lavora.', effects: { capital: 0, ethics: 0, reputation: { employees: -15 } } }
      ]
    },
    {
      id: 'ev_13',
      title: 'Penny Stock Rilevata',
      description: 'Una delle tue penny stock ha attratto l attenzione della SEC. Volume sospetto.',
      trigger: { ethics: '<35' },
      options: [
        { text: 'Ferma il pump. Vendi gradualmente.', effects: { capital: 50000, ethics: -5, reputation: { sec: 5 } } },
        { text: 'Continua. Non si ferma un treno in corsa.', effects: { capital: 150000, ethics: -15, reputation: { sec: -20 }, event: 'sec_indaga_penny' } },
        { text: 'Brucia il titolo. Chiudi tutto e sparisci.', effects: { capital: 20000, ethics: -20, reputation: { sec: -10, clients: -10 } } }
      ]
    },
    {
      id: 'ev_14',
      title: 'Donnie Fa una Cazzata',
      description: 'Donnie ha investito i soldi dell azienda in un titolo senza dirti. Ha perso 300.000$.',
      trigger: {},
      options: [
        { text: 'Copri tu la perdita. Proteggi Donnie.', effects: { capital: -300000, ethics: 5, reputation: { employees: 15 } } },
        { text: 'Licenzia Donnie. Basta errori.', effects: { capital: 0, ethics: -10, reputation: { employees: -25, wallStreet: -5 } } },
        { text: 'Lo rimproveri ma lo tieni. Una seconda chance.', effects: { capital: 0, ethics: 5, reputation: { employees: 10 }, event: 'donnie_grato' } }
      ]
    },
    {
      id: 'ev_15',
      title: 'Offerta di Corruzione',
      description: 'Un broker rivale ti offre 100.000$ per informazioni sui tuoi clienti.',
      trigger: {},
      options: [
        { text: 'Accetta. Soldi facili.', effects: { capital: 100000, ethics: -25, reputation: { clients: -15, sec: -10 } } },
        { text: 'Rifiuta. Non vendo i miei clienti.', effects: { capital: 0, ethics: 15, reputation: { clients: 10, wallStreet: 5 } } },
        { text: 'Rifiuta e reportalo alla SEC.', effects: { capital: 0, ethics: 20, reputation: { sec: 15, wallStreet: -5 } } }
      ]
    },
    {
      id: 'ev_16',
      title: 'Audit Improvviso',
      description: 'Un audit improvviso arriva in ufficio. I conti non tornano perfettamente.',
      trigger: { reputation: { sec: '<35' } },
      options: [
        { text: 'Fai vedere tutto. Trasparenza totale.', effects: { capital: -10000, ethics: 10, reputation: { sec: 15 } } },
        { text: 'Mostra solo i conti puliti. Nascondi il resto.', effects: { capital: -5000, ethics: -15, reputation: { sec: -10 } } },
        { text: 'Temporeggia. Manda l audit a casa tua.', effects: { capital: -20000, ethics: -10, reputation: { sec: -5 } } }
      ]
    },
    {
      id: 'ev_17',
      title: 'Broker si Suicide',
      description: 'Un broker della Stratton ha perso tutto sui suoi trade personali. Sta male.',
      trigger: { ethics: '<30' },
      options: [
        { text: 'Pagagli le perdite. Prenditi cura dei tuoi.', effects: { capital: -80000, ethics: 15, reputation: { employees: 20 } } },
        { text: 'Licenzialo. Non possiamo tenere tutti.', effects: { capital: 0, ethics: -10, reputation: { employees: -20 } } },
        { text: 'Mandalo in terapia. Paghi tu.', effects: { capital: -20000, ethics: 20, reputation: { employees: 15, sec: 5 } } }
      ]
    },
    {
      id: 'ev_18',
      title: 'Media Storm',
      description: 'La stampa ti attacca. Titoli: "Stratton Oakmont: Truffa o Genio?"',
      trigger: { reputation: { sec: '<30' } },
      options: [
        { text: 'Ingaggi un PR. Rispondi con stile.', effects: { capital: -30000, ethics: 0, reputation: { wallStreet: 10, clients: 5 } } },
        { text: 'Ignora. La notizia passa in fretta.', effects: { capital: 0, ethics: 0, reputation: { wallStreet: -10, clients: -10 } } },
        { text: 'Fai una conferenza stampa. Attacca i giornalisti.', effects: { capital: -10000, ethics: -10, reputation: { wallStreet: -5, sec: -5 } } }
      ]
    },
    {
      id: 'ev_19',
      title: 'Investitore Istituzionale',
      description: 'Un fondo pensione vuole investire 50 milioni con te. Ma vuole trasparenza.',
      trigger: { reputation: { clients: '>55' } },
      options: [
        { text: 'Accetta. Fai tutto in regola. Meno profitti ma sicuro.', effects: { capital: 100000, ethics: 15, reputation: { clients: 20, sec: 15, wallStreet: 10 } } },
        { text: 'Accetta ma nascondi alcune commissioni.', effects: { capital: 300000, ethics: -15, reputation: { clients: -10, sec: -15 } } },
        { text: 'Rifiuta. Troppa attenzione.', effects: { capital: 0, ethics: 5, reputation: { clients: -5 } } }
      ]
    },
    {
      id: 'ev_20',
      title: 'Brad Viene Arrestato',
      description: 'Brad è stato fermato dalla SEC. Potrebbe parlare.',
      trigger: { ethics: '<40' },
      options: [
        { text: 'Chiama un avvocato per Brad. Paghi tu.', effects: { capital: -50000, ethics: -5, reputation: { sec: -5 }, event: 'brad_silenzioso' } },
        { text: 'Taglia i ponti. Non lo conosci.', effects: { capital: 0, ethics: -20, reputation: { sec: 5 }, event: 'brad_parla' } },
        { text: 'Fuggi. Se Brad parla, sei fottuto.', effects: { capital: -300000, ethics: -15, reputation: { sec: -30, wallStreet: -15 }, event: 'fuga_panico' } }
      ]
    },
    {
      id: 'ev_21',
      title: 'Concorrente Fallisce',
      description: 'Un broker rivale fallisce. I suoi clienti cercano un nuovo broker.',
      trigger: { reputation: { clients: '>40' } },
      options: [
        { text: 'Acquisisci i clienti. Offri condizioni ottimali.', effects: { capital: 100000, ethics: 10, reputation: { clients: 15, wallStreet: 10 } } },
        { text: 'Acquisisci i clienti ma con commissioni alte.', effects: { capital: 200000, ethics: -10, reputation: { clients: 5, sec: -5 } } },
        { text: 'Lasciali ad altri. Non hai bisogno di loro.', effects: { capital: 0, ethics: 0, reputation: { clients: -5 } } }
      ]
    },
    {
      id: 'ev_22',
      title: 'Moglie di un Cliente',
      description: 'La moglie di un cliente chiama. Ha scoperto che avete perso i loro risparmi.',
      trigger: { reputation: { clients: '<40' } },
      options: [
        { text: 'Spiega la situazione con rispetto. Offri un piano di recupero.', effects: { capital: -20000, ethics: 15, reputation: { clients: 15 } } },
        { text: 'Menti. Dille che i soldi sono al sicuro.', effects: { capital: 0, ethics: -20, reputation: { clients: -10, sec: -5 } } },
        { text: 'Passa il telefono a un collega. Non è il tuo problema.', effects: { capital: 0, ethics: -15, reputation: { clients: -15 } } }
      ]
    },
    {
      id: 'ev_23',
      title: 'Offerta FBI',
      description: 'L FBI ti contatta. Vogliono informazioni su un broker rivale. In cambio, protezione.',
      trigger: { reputation: { sec: '<40' } },
      options: [
        { text: 'Collabora. Dai informazioni. Protezione garantita.', effects: { capital: 0, ethics: 10, reputation: { sec: 20, wallStreet: -10 } } },
        { text: 'Rifiuta. Non fare la spia.', effects: { capital: 0, ethics: 5, reputation: { sec: -5 } } },
        { text: 'Accetta ma dai informazioni false.', effects: { capital: 0, ethics: -25, reputation: { sec: -30 }, event: 'fbi_scopre_menzogna' } }
      ]
    },
    {
      id: 'ev_24',
      title: 'Yacht Party',
      description: 'Vuoi organizzare una festa sullo yacht. Tutta la Stratton è invitata.',
      trigger: { capital: '>500000' },
      options: [
        { text: 'Festa leggendaria. Champagne, cibo, musica. Spendi senza limite.', effects: { capital: -150000, ethics: -10, reputation: { employees: 25, wallStreet: 5 } } },
        { text: 'Festa sobria. Qualche drink, niente eccessi.', effects: { capital: -20000, ethics: 0, reputation: { employees: 10 } } },
        { text: 'Rinuncia. Investi i soldi in azienda.', effects: { capital: -10000, ethics: 10, reputation: { employees: -5, clients: 5 } } }
      ]
    },
    {
      id: 'ev_25',
      title: 'Figlia a Scuola',
      description: 'La maestra di tua figlia chiama. Tua figlia dice che il papà "vende bugie".',
      trigger: { ethics: '<30' },
      options: [
        { text: 'Vai a scuola. Spiega che è un lavoro normale.', effects: { capital: 0, ethics: 10, reputation: { clients: 5 }, event: 'figlia_spiega' } },
        { text: 'Manda Naomi. Tu sei troppo occupato.', effects: { capital: 0, ethics: -5, reputation: {}, event: 'naomi_delusa' } },
        { text: 'Ignora. Passerà.', effects: { capital: 0, ethics: -10, reputation: {}, event: 'figlia_dimentica' } }
      ]
    },
    {
      id: 'ev_26',
      title: 'Broker si Pente',
      description: 'Un broker confessa di non sentirsi a posto con le vendite ingannevoli.',
      trigger: { ethics: '<40' },
      options: [
        { text: 'Lo rassicuri. È il gioco. Tutti lo fanno.', effects: { capital: 0, ethics: -10, reputation: { employees: 5 } } },
        { text: 'Lo ascolti. Cambia il suo incarico su titoli legittimi.', effects: { capital: -10000, ethics: 15, reputation: { employees: 15, sec: 5 } } },
        { text: 'Lo licenzi. Non ti serve qualcuno che esita.', effects: { capital: 0, ethics: -15, reputation: { employees: -10, sec: -5 } } }
      ]
    },
    {
      id: 'ev_27',
      title: 'Offerta di Compravendita',
      description: 'Una grande banca vuole comprare la Stratton Oakmont per 50 milioni.',
      trigger: { reputation: { wallStreet: '>55' } },
      options: [
        { text: 'Vendi. Prendi i soldi e ricomincia.', effects: { capital: 5000000, ethics: 5, reputation: { wallStreet: 20, clients: 10 }, event: 'vendita_stratton' } },
        { text: 'Rifiuta. La Stratton è la tua creatura.', effects: { capital: 0, ethics: 0, reputation: { wallStreet: -5 }, event: null } },
        { text: 'Negozia. Chiedi il doppio.', effects: { capital: 0, ethics: 0, reputation: { wallStreet: 10 }, event: 'negoziazione_banca' } }
      ]
    },
    {
      id: 'ev_28',
      title: 'Crash di Mercato',
      description: 'Il mercato crolla del 10% in un giorno. I clienti panico.',
      trigger: {},
      options: [
        { text: 'Chiama tutti i clienti. Rassicurali.', effects: { capital: 0, ethics: 15, reputation: { clients: 20 } } },
        { text: 'Compra titoli svalutati per i clienti.', effects: { capital: -50000, ethics: 10, reputation: { clients: 15, wallStreet: 5 } } },
        { text: 'Vendi tutto per tuo conto. Lascia i clienti a loro stessi.', effects: { capital: 100000, ethics: -20, reputation: { clients: -25 } } }
      ]
    },
    {
      id: 'ev_29',
      title: 'Gara di Vendite',
      description: 'Indici una gara di vendite. Il vincitore riceve un orologio d oro da 50.000$.',
      trigger: { capital: '>200000' },
      options: [
        { text: 'Fai la gara. Il morale alle stelle.', effects: { capital: -50000, ethics: 0, reputation: { employees: 20, wallStreet: 5 } } },
        { text: 'Sostituisci l orologio con una bonus in contanti.', effects: { capital: -20000, ethics: 5, reputation: { employees: 15 } } },
        { text: 'Niente gara. Tutti devono vendere, punto.', effects: { capital: 0, ethics: 0, reputation: { employees: -10 } } }
      ]
    },
    {
      id: 'ev_30',
      title: 'Multa Antiriciclaggio',
      description: 'La SEC ti multa per violazioni antiriciclaggio. 500.000$.',
      trigger: { reputation: { sec: '<30' } },
      options: [
        { text: 'Paga. Sistema i processi.', effects: { capital: -500000, ethics: 5, reputation: { sec: 10 } } },
        { text: 'Contesta. Ingaggi avvocati costosi.', effects: { capital: -100000, ethics: 0, reputation: { sec: -10 }, event: 'causa_antiriciclaggio' } },
        { text: 'Paga tramite un prestanome. Senza traccia.', effects: { capital: -520000, ethics: -15, reputation: { sec: 0 } } }
      ]
    },
    {
      id: 'ev_31',
      title: 'Ex Collega in Prigione',
      description: 'Un ex broker della Stratton è in prigione. Scrive una lettera.',
      trigger: { ethics: '<35' },
      options: [
        { text: 'Vai a trovarlo. Porta solidarietà.', effects: { capital: -5000, ethics: 15, reputation: { employees: 10 } } },
        { text: 'Ignora. Non lo conosci più.', effects: { capital: 0, ethics: -5, reputation: { employees: -5 } } },
        { text: 'Mandagli soldi per l avvocato.', effects: { capital: -50000, ethics: 10, reputation: { employees: 15 } } }
      ]
    },
    {
      id: 'ev_32',
      title: 'Nuovo Titolo Caldo',
      description: 'Un azienda biotech sta per annunciare un farmaco rivoluzionario.',
      trigger: {},
      options: [
        { text: 'Compra subito. Fai il botto.', effects: { capital: 200000, ethics: 0, reputation: { wallStreet: 5 } } },
        { text: 'Chiama Brad. Verifica prima di comprare.', effects: { capital: 0, ethics: -10, reputation: { sec: -5 }, event: 'brad_verifica_biotech' } },
        { text: 'Aspetta l annuncio. Compra dopo.', effects: { capital: 50000, ethics: 5, reputation: { wallStreet: 0 } } }
      ]
    },
    {
      id: 'ev_33',
      title: 'Dipendente Ruba',
      description: 'Un broker ha rubato 200.000$ dai conti clienti. È scoperto.',
      trigger: { reputation: { employees: '<40' } },
      options: [
        { text: 'Ripaga i clienti di tasca tua. Zittisci tutto.', effects: { capital: -200000, ethics: 5, reputation: { clients: 10, employees: -5 } } },
        { text: 'Denuncialo. Collabora con la SEC.', effects: { capital: 0, ethics: 15, reputation: { sec: 15, employees: -10 } } },
        { text: 'Copri lui e minaccia i clienti se parlano.', effects: { capital: -50000, ethics: -25, reputation: { sec: -20, clients: -15 } } }
      ]
    },
    {
      id: 'ev_34',
      title: 'Sogno di Naomi',
      description: 'Naomi ti dice che ha sognato il vostro divorzio. Vuole rassicurazioni.',
      trigger: {},
      options: [
        { text: 'Rassicurala. Le prometti di cambiare.', effects: { capital: 0, ethics: 10, reputation: {}, event: 'naomi_rassicurata' } },
        { text: 'Le dici che è solo un sogno. Non pensarci.', effects: { capital: 0, ethics: -5, reputation: {}, event: 'naomi_ignorata' } },
        { text: 'Le compri un regalo costoso. I soldi risolvono tutto.', effects: { capital: -30000, ethics: -5, reputation: {}, event: 'naomi_regalo' } }
      ]
    },
    {
      id: 'ev_35',
      title: 'Nuovo Broker Geniale',
      description: 'Un ragazzo di 24 anni vende come un matto. 1 milione in una settimana.',
      trigger: { reputation: { employees: '>50' } },
      options: [
        { text: 'Promuovilo. Dagli una squadra.', effects: { capital: 0, ethics: 5, reputation: { employees: 15, wallStreet: 10 } } },
        { text: 'Tagliagli le commissioni. Guadagna troppo.', effects: { capital: 50000, ethics: -10, reputation: { employees: -15 } } },
        { text: 'Insegnagli i trucchi sporchi. Fallo diventare una macchina.', effects: { capital: 0, ethics: -15, reputation: { employees: 5, sec: -10 } } }
      ]
    },
    {
      id: 'ev_36',
      title: 'Tangente Riprende',
      description: 'Il funzionario che hai corrotto vuole altri soldi. Altrimenti parla.',
      trigger: { ethics: '<30' },
      options: [
        { text: 'Paga di nuovo. Ti tiene per le palle.', effects: { capital: -50000, ethics: -10, reputation: { sec: -5 } } },
        { text: 'Rifiuta. Minaccialo di denunciarlo.', effects: { capital: 0, ethics: -15, reputation: { sec: -10 }, event: 'funzionario_parla' } },
        { text: 'Pagagli ma registralo. Hai una prova.', effects: { capital: -50000, ethics: -5, reputation: { sec: 0 }, event: 'registrazione_funzionario' } }
      ]
    },
    {
      id: 'ev_37',
      title: 'Bambina Malata',
      description: 'Tua figlia ha la febbre alta. Naomi è sola e ti chiede di tornare.',
      trigger: {},
      options: [
        { text: 'Vai a casa subito. La famiglia prima.', effects: { capital: 0, ethics: 15, reputation: { employees: -5 }, event: 'naomi_grata' } },
        { text: 'Finisci l ultima chiamata. Poi vai.', effects: { capital: 10000, ethics: -10, reputation: { employees: 5 }, event: 'naomi_solita' } },
        { text: 'Manda un medico a casa. Tu rimani.', effects: { capital: -5000, ethics: -5, reputation: {}, event: 'naomi_arrabbiata' } }
      ]
    },
    {
      id: 'ev_38',
      title: 'IPO Fallita',
      description: 'La tua ultima IPO è un disastro. Il titolo crolla del 60% il primo giorno.',
      trigger: { ethics: '<40' },
      options: [
        { text: 'Rimborsa i clienti. Assumiti la responsabilità.', effects: { capital: -500000, ethics: 20, reputation: { clients: 20, sec: 10 } } },
        { text: 'Dai la colpa al mercato. Non è colpa tua.', effects: { capital: 0, ethics: -10, reputation: { clients: -15, wallStreet: -10 } } },
        { text: 'Pompa il titolo per limitare i danni.', effects: { capital: -100000, ethics: -20, reputation: { sec: -20, clients: -10 } } }
      ]
    },
    {
      id: 'ev_39',
      title: 'Avvocato Consiglia Patteggiamento',
      description: 'Il tuo avvocato dice che la SEC ha un caso forte. Consiglia di patteggiare.',
      trigger: { reputation: { sec: '<25' } },
      options: [
        { text: 'Segui il consiglio. Patteggiare.', effects: { capital: -1000000, ethics: 15, reputation: { sec: 20, wallStreet: -15 }, event: 'patteggiamento' } },
        { text: 'Rifiuta. Combatti fino in fondo.', effects: { capital: -200000, ethics: 0, reputation: { sec: -15 }, event: 'processo' } },
        { text: 'Cambia avvocato. Ne vuoi uno più aggressivo.', effects: { capital: -50000, ethics: -5, reputation: { sec: -10 } } }
      ]
    },
    {
      id: 'ev_40',
      title: 'Donnie e la Droga',
      description: 'Donnie è crollato in ufficio. Ha preso troppo. I broker mormorano.',
      trigger: {},
      options: [
        { text: 'Mandalo in rehab. Paghi tu tutto.', effects: { capital: -100000, ethics: 15, reputation: { employees: 15 } } },
        { text: 'Ignora. Donnie sa il fatto suo.', effects: { capital: 0, ethics: -10, reputation: { employees: -10 }, event: 'donnie_peggiora' } },
        { text: 'Sospendilo per una settimana. Senza stipendio.', effects: { capital: 0, ethics: 0, reputation: { employees: -5 } } }
      ]
    },
    {
      id: 'ev_41',
      title: 'Email Sospetta',
      description: 'Hai ricevuto un email da un broker che dice: "Non ce la faccio più."',
      trigger: {},
      options: [
        { text: 'Vai subito a parlargli. Subito.', effects: { capital: 0, ethics: 20, reputation: { employees: 20 } } },
        { text: 'Rispondi via email. "Calmati."', effects: { capital: 0, ethics: -5, reputation: { employees: -5 }, event: 'broker_crash' } },
        { text: 'Manda qualcuno a controllare.', effects: { capital: 0, ethics: 10, reputation: { employees: 10 } } }
      ]
    },
    {
      id: 'ev_42',
      title: 'Concorrenza Aggressiva',
      description: 'Tre nuovi broker sono arrivati in città. Offrono commissioni vicine allo zero.',
      trigger: { reputation: { wallStreet: '<50' } },
      options: [
        { text: 'Taglia le tue commissioni. Guerra di prezzo.', effects: { capital: -100000, ethics: 0, reputation: { clients: 10, wallStreet: 5 } } },
        { text: 'Migliora il servizio. Offri valore, non prezzo.', effects: { capital: -20000, ethics: 10, reputation: { clients: 15, wallStreet: 10 } } },
        { text: 'Compra uno dei nuovi broker. Assimilalo.', effects: { capital: -300000, ethics: -5, reputation: { wallStreet: 20, employees: 10 } } }
      ]
    },
    {
      id: 'ev_43',
      title: 'Test di Droga',
      description: 'Un broker viene trovato positivo al test antidroga di routine.',
      trigger: {},
      options: [
        { text: 'Licenzialo. Zero tolleranza.', effects: { capital: 0, ethics: 5, reputation: { employees: -10, sec: 5 } } },
        { text: 'Mandalo in rehab. Dagli una seconda chance.', effects: { capital: -30000, ethics: 15, reputation: { employees: 20 } } },
        { text: 'Ignora. Tutti fanno feste. Non importa.', effects: { capital: 0, ethics: -10, reputation: { employees: 5, sec: -10 } } }
      ]
    },
    {
      id: 'ev_44',
      title: 'Regolatore Amico',
      description: 'Un vecchio amico di università ora lavora alla SEC.',
      trigger: { reputation: { sec: '<40' } },
      options: [
        { text: 'Invitalo a cena. Coltiva l amicizia.', effects: { capital: -5000, ethics: -10, reputation: { sec: 10 } } },
        { text: 'Chiedigli informazioni sull indagine. Con discrezione.', effects: { capital: -2000, ethics: -20, reputation: { sec: -5 }, event: 'amico_sec_info' } },
        { text: 'Mantieni le distanze. Non mischiare amicizia e lavoro.', effects: { capital: 0, ethics: 10, reputation: { sec: 0 } } }
      ]
    },
    {
      id: 'ev_45',
      title: 'Crollo di Donnie',
      description: 'Donnie ha un crollo nervoso in ufficio. Urla, piange, rompe cose.',
      trigger: { ethics: '<40' },
      options: [
        { text: 'Fermalo. Abbraccialo. Lo capisci.', effects: { capital: 0, ethics: 20, reputation: { employees: 20 }, event: 'donnie_calmo' } },
        { text: 'Mandalo via. Riprenditi dopo.', effects: { capital: 0, ethics: -5, reputation: { employees: -10 }, event: 'donnie_andato' } },
        { text: 'Chiama un medico. Subito.', effects: { capital: -10000, ethics: 15, reputation: { employees: 15 } } }
      ]
    },
    {
      id: 'ev_46',
      title: 'Promessa a Naomi',
      description: 'Naomi ti chiede di promettere: niente più segreti.',
      trigger: {},
      options: [
        { text: 'Prometti. E mantieni.', effects: { capital: 0, ethics: 15, reputation: {}, event: 'promessa_mantenuta' } },
        { text: 'Prometti. Ma già sai che non manterrai.', effects: { capital: 0, ethics: -15, reputation: {}, event: 'promessa_infranta' } },
        { text: 'Rifiuta di promettere. Sii onesto sulla tua onestà.', effects: { capital: 0, ethics: 5, reputation: {}, event: 'naomi_apprezza_onesta' } }
      ]
    },
    {
      id: 'ev_47',
      title: 'Bonus ai Broker',
      description: 'I broker vogliono un bonus di fine anno. Si aspettano molto.',
      trigger: { capital: '>300000' },
      options: [
        { text: 'Bonus enorme. Champagne per tutti.', effects: { capital: -200000, ethics: 0, reputation: { employees: 25, wallStreet: 5 } } },
        { text: 'Bonus moderato. Proporzionale ai risultati.', effects: { capital: -80000, ethics: 5, reputation: { employees: 15 } } },
        { text: 'Niente bonus. L anno prossimo.', effects: { capital: 0, ethics: -5, reputation: { employees: -25 } } }
      ]
    },
    {
      id: 'ev_48',
      title: 'Ricatto',
      description: 'Qualcuno ha delle foto compromettenti di te a una festa. Vuole 200.000$.',
      trigger: { ethics: '<35' },
      options: [
        { text: 'Paga. Non fare scandali.', effects: { capital: -200000, ethics: -5, reputation: { wallStreet: -5 } } },
        { text: 'Rifiuta. Pubblichino pure. Non mi importa.', effects: { capital: 0, ethics: 5, reputation: { wallStreet: -10, clients: -10 }, event: 'foto_pubblicate' } },
        { text: 'Ingaggi un investigatore. Trova il ricattatore.', effects: { capital: -30000, ethics: 0, reputation: { wallStreet: 0 }, event: 'investigatore_ricatto' } }
      ]
    },
    {
      id: 'ev_49',
      title: 'Donazione Politica',
      description: 'Un senatore ti chiede una donazione per la sua campagna. In cambio, leggi favorevoli.',
      trigger: { capital: '>500000' },
      options: [
        { text: 'Dona 100.000$. Coltiva il politico.', effects: { capital: -100000, ethics: -15, reputation: { sec: -5, wallStreet: 10 } } },
        { text: 'Rifiuta. Non mischiare politica e soldi.', effects: { capital: 0, ethics: 10, reputation: { wallStreet: -5 } } },
        { text: 'Dona tramite un prestanome. Senza traccia.', effects: { capital: -100000, ethics: -20, reputation: { sec: -10 } } }
      ]
    },
    {
      id: 'ev_50',
      title: 'Riconoscimento Wall Street',
      description: 'Wall Street ti elegge "Broker dell Anno". Un onore prestigioso.',
      trigger: { reputation: { wallStreet: '>65' } },
      options: [
        { text: 'Accetta con umiltà. Ringrazia la squadra.', effects: { capital: 0, ethics: 10, reputation: { wallStreet: 15, employees: 15, clients: 10 } } },
        { text: 'Accetta ma usa l occasione per autocelebrazione.', effects: { capital: -20000, ethics: -10, reputation: { wallStreet: 5, employees: -5 } } },
        { text: 'Rifiuta. Non hai bisogno di un premio.', effects: { capital: 0, ethics: 5, reputation: { wallStreet: -10 } } }
      ]
    }
  ];

  // ============================================================
  // SISTEMA MORALE (Etica 0-100)
  // ============================================================
  var MORALE_SYSTEM = {
    level: 50,
    min: 0,
    max: 100,

    applyAction: function (action) {
      var changes = {
        insider_trading: -30,
        pump_dump: -25,
        front_running: -20,
        churning: -20,
        bribery: -20,
        fraud: -25,
        wash_trading: -15,
        donation: 20,
        ethical_invest: 15,
        sec_cooperation: 25,
        honest_advice: 10,
        employee_care: 15,
        client_refund: 15,
        family_priority: 15,
        lie_to_client: -10,
        lie_to_naomi: -15,
        threat_client: -15,
        destroy_evidence: -20,
        flee_country: -20,
        help_colleague: 10,
        write_book: 5
      };
      if (changes[action] !== undefined) {
        this.level = clamp(this.level + changes[action], this.min, this.max);
      }
      return this.level;
    },

    getLabel: function (v) {
      if (v === undefined) v = this.level;
      if (v >= 80) return 'Santo';
      if (v >= 60) return 'Onesto';
      if (v >= 40) return 'Ambiguo';
      if (v >= 20) return 'Corrotto';
      return 'Criminale';
    },

    getEnding: function (v) {
      if (v === undefined) v = this.level;
      if (v >= 80) {
        return {
          title: 'Redenzione Completa',
          text: 'Hai scelto l onesta quando nessuno lo faceva. I soldi sono venuti più lentamente, ma sono rimasti. I tuoi clienti ti rispettano, la tua famiglia ti ama, e quando guardi allo specchio vedi ancora te stesso. Non il broker più ricco di Wall Street, ma forse l unico che può dormire la notte. La leggenda non parla dei tuoi soldi, ma della tua integrità. E questo, alla fine, vale più di qualsiasi IPO.'
        };
      }
      if (v >= 60) {
        return {
          title: 'Vita Equilibrata',
          text: 'Hai camminato sul filo. Qualche scorciatoia, qualche rimorso. Ma nel complesso hai costruito qualcosa di duraturo. Non sei un santo, ma non sei un mostro. Sei un broker che ha imparato la lezione: i soldi sono importanti, ma non sono tutto. La tua storia è quella di un uomo che ha sfiorato il baratro e ne è uscito con qualche cicatrice e molta saggezza.'
        };
      }
      if (v >= 40) {
        return {
          title: 'Zona Grigia',
          text: 'Non sei nè santo nè demonio. Hai fatto soldi, hai perso amici, hai rimediato. La tua storia è quella di Wall Street stessa: ambizione, eccesso, rimorso, ripartenza. Qualcuno ti odia, qualcuno ti ammira. Tutti ti ricordano. La tua leggenda è ambigua, come lo sei stato tu. Ma sei ancora in piedi, e questo a Wall Street è già una vittoria.'
        };
      }
      if (v >= 20) {
        return {
          title: 'Caduta Eroica',
          text: 'Hai avuto tutto e hai perso tutto. I soldi, la famiglia, la libertà. Ma sei caduto in piedi, o quasi. La tua storia è quella di un uomo che ha sfidato il sistema, ha perso, e ha raccontato tutto. La leggenda parla dei tuoi eccessi, dei tuoi errori, della tua capacità di cadere e rialzarti. Non sei un esempio, sei un avvertimento. Ma un avvertimento affascinante.'
        };
      }
      return {
        title: 'Criminale Leggendario',
        text: 'Hai scelto il profitto sopra tutto. Amicizie distrutte, famiglia perduta, libertà compromessa. Ma i soldi... i soldi sono ancora lì. Da qualche parte. La tua storia è quella del criminale più affascinante di Wall Street: brillante, spietato, inarrestabile. La leggenda ti teme e ti ammira. Sei il lupo che ha divorato Wall Street. Ma i lupi, alla fine, cacciano da soli.'
      };
    }
  };

  // ============================================================
  // FINALI (basati su Etica + reputazione)
  // ============================================================
  var ENDINGS = {
    santo: {
      id: 'santo',
      title: 'Redenzione Completa',
      conditions: { ethicsMin: 80 },
      text: 'Hai scelto l onesta quando nessuno lo faceva. I soldi sono venuti più lentamente, ma sono rimasti. I tuoi clienti ti rispettano, la tua famiglia ti ama, e quando guardi allo specchio vedi ancora te stesso. Non il broker più ricco di Wall Street, ma forse l unico che può dormire la notte. La leggenda non parla dei tuoi soldi, ma della tua integrità. E questo, alla fine, vale più di qualsiasi IPO.'
    },
    onesto: {
      id: 'onesto',
      title: 'Vita Equilibrata',
      conditions: { ethicsMin: 60, ethicsMax: 79 },
      text: 'Hai camminato sul filo. Qualche scorciatoia, qualche rimorso. Ma nel complesso hai costruito qualcosa di duraturo. Non sei un santo, ma non sei un mostro. Sei un broker che ha imparato la lezione: i soldi sono importanti, ma non sono tutto. La tua storia è quella di un uomo che ha sfiorato il baratro e ne è uscito con qualche cicatrice e molta saggezza.'
    },
    ambiguo: {
      id: 'ambiguo',
      title: 'Zona Grigia',
      conditions: { ethicsMin: 40, ethicsMax: 59 },
      text: 'Non sei ne santo ne demonio. Hai fatto soldi, hai perso amici, hai rimediato. La tua storia è quella di Wall Street stessa: ambizione, eccesso, rimorso, ripartenza. Qualcuno ti odia, qualcuno ti ammira. Tutti ti ricordano. La tua leggenda è ambigua, come lo sei stato tu. Ma sei ancora in piedi, e questo a Wall Street è già una vittoria.'
    },
    caduta: {
      id: 'caduta',
      title: 'Caduta Eroica',
      conditions: { ethicsMin: 20, ethicsMax: 39 },
      text: 'Hai avuto tutto e hai perso tutto. I soldi, la famiglia, la libertà. Ma sei caduto in piedi, o quasi. La tua storia è quella di un uomo che ha sfidato il sistema, ha perso, e ha raccontato tutto. La leggenda parla dei tuoi eccessi, dei tuoi errori, della tua capacità di cadere e rialzarti. Non sei un esempio, sei un avvertimento. Ma un avvertimento affascinante.'
    },
    criminale: {
      id: 'criminale',
      title: 'Criminale Leggendario',
      conditions: { ethicsMin: 0, ethicsMax: 19 },
      text: 'Hai scelto il profitto sopra tutto. Amicizie distrutte, famiglia perduta, libertà compromessa. Ma i soldi... i soldi sono ancora li. Da qualche parte. La tua storia è quella del criminale più affascinante di Wall Street: brillante, spietato, inarrestabile. La leggenda ti teme e ti ammira. Sei il lupo che ha divorato Wall Street. Ma i lupi, alla fine, cacciano da soli.'
    }
  };

  // ============================================================
  // STORY ENGINE - CLASSE PRINCIPALE
  // ============================================================
  function StoryEngine() {
    this.version = '1.0.0';
    this.currentChapter = 0;
    this.ethics = 50;
    this.capital = 10000;
    this.reputation = {
      sec: 50,
      clients: 50,
      wallStreet: 30,
      employees: 60
    };
    this.completedMissions = [];
    this.activeMissions = [];
    this.missionState = {};
    this.choiceHistory = [];
    this.eventHistory = [];
    this.dialogueState = {};
    this.gameOver = false;
    this.flags = {};
  }

  StoryEngine.prototype.getNPC = function (id) {
    return NPCS[id] || null;
  };

  StoryEngine.prototype.getDialogue = function (npcId, index) {
    var npc = NPCS[npcId];
    if (!npc || !npc.dialogues) return null;
    if (index === undefined) return pick(npc.dialogues);
    return npc.dialogues[index] || null;
  };

  StoryEngine.prototype.getChapter = function (id) {
    return CHAPTERS[id - 1] || null;
  };

  StoryEngine.prototype.getCurrentChapter = function () {
    return CHAPTERS[this.currentChapter] || null;
  };

  StoryEngine.prototype.advanceChapter = function () {
    if (this.currentChapter < CHAPTERS.length) {
      this.currentChapter++;
      var ch = this.getCurrentChapter();
      if (ch) this.activeMissions.push(ch.mainMission);
      return this.getCurrentChapter();
    }
    return null;
  };

  StoryEngine.prototype.getMission = function (id) {
    return MAIN_MISSIONS[id] || SIDE_MISSIONS[id] || null;
  };

  StoryEngine.prototype.getAllMissions = function () {
    var all = {};
    var k;
    for (k in MAIN_MISSIONS) { all[k] = MAIN_MISSIONS[k]; }
    for (k in SIDE_MISSIONS) { all[k] = SIDE_MISSIONS[k]; }
    return all;
  };

  StoryEngine.prototype.completeMission = function (id) {
    var mission = this.getMission(id);
    if (!mission) return false;
    this.completedMissions.push(id);
    var idx = this.activeMissions.indexOf(id);
    if (idx >= 0) this.activeMissions.splice(idx, 1);
    if (mission.reward) {
      if (mission.reward.capital) this.capital += mission.reward.capital;
      if (mission.reward.ethics) this.ethics = clamp(this.ethics + mission.reward.ethics, 0, 100);
      if (mission.reward.reputation) {
        var r;
        for (r in mission.reward.reputation) {
          if (this.reputation[r] !== undefined) {
            this.reputation[r] = clamp(this.reputation[r] + mission.reward.reputation[r], 0, 100);
          }
        }
      }
    }
    return true;
  };

  StoryEngine.prototype.getMoralChoices = function (chapterId) {
    var key = 'chapter_' + chapterId + '_choice';
    return MORAL_CHOICES[key] || null;
  };

  StoryEngine.prototype.makeChoice = function (chapterId, choiceIndex) {
    var choices = this.getMoralChoices(chapterId);
    if (!choices || !choices[choiceIndex]) return null;
    var choice = choices[choiceIndex];
    var c = choice.consequences;
    if (c.ethics) this.ethics = clamp(this.ethics + c.ethics, 0, 100);
    if (c.capital) this.capital += c.capital;
    if (c.reputation) {
      var r;
      for (r in c.reputation) {
        if (this.reputation[r] !== undefined) {
          this.reputation[r] = clamp(this.reputation[r] + c.reputation[r], 0, 100);
        }
      }
    }
    this.choiceHistory.push({ chapter: chapterId, choiceId: choice.id, consequences: c });
    if (c.event) this.flags[c.event] = true;
    return choice;
  };

  StoryEngine.prototype.getDarkScheme = function (id) {
    return DARK_SCHEMES[id] || null;
  };

  StoryEngine.prototype.getAllDarkSchemes = function () {
    return DARK_SCHEMES;
  };

  StoryEngine.prototype.applyDarkScheme = function (id) {
    var scheme = DARK_SCHEMES[id];
    if (!scheme) return false;
    if (scheme.requirements) {
      if (scheme.requirements.capital && this.capital < scheme.requirements.capital) return false;
      if (scheme.requirements.brokers && (this.reputation.employees < 40)) return false;
    }
    this.capital += scheme.potentialProfit;
    this.ethics = clamp(this.ethics + scheme.ethicsCost, 0, 100);
    this.reputation.sec = clamp(this.reputation.sec - scheme.secRisk, 0, 100);
    this.flags['scheme_' + id] = true;
    return true;
  };

  StoryEngine.prototype.getReputation = function (category) {
    if (category) return this.reputation[category] !== undefined ? this.reputation[category] : null;
    return this.reputation;
  };

  StoryEngine.prototype.getReputationLabel = function (category) {
    var val = this.reputation[category];
    if (val === undefined) return null;
    if (val >= 70) return 'Ottima';
    if (val >= 50) return 'Media';
    if (val >= 30) return 'Bassa';
    return 'Critica';
  };

  StoryEngine.prototype.getRandomEvent = function () {
    var eligible = RANDOM_EVENTS.filter(function (ev) {
      if (!ev.trigger) return true;
      var t = ev.trigger;
      if (t.reputation) {
        var cat;
        for (cat in t.reputation) {
          var cond = t.reputation[cat];
          var val = this.reputation[cat] || 0;
          if (typeof cond === 'number') return false;
          if (cond.charAt(0) === '<' && val >= parseInt(cond.substr(1))) return false;
          if (cond.charAt(0) === '>' && val <= parseInt(cond.substr(1))) return false;
        }
      }
      if (t.ethics !== undefined) {
        if (typeof t.ethics === 'number') {
          if (this.ethics !== t.ethics) return false;
        }
      }
      if (t.capital !== undefined) {
        if (typeof t.capital === 'number' && this.capital < t.capital) return false;
      }
      return true;
    }, this);
    if (eligible.length === 0) eligible = RANDOM_EVENTS;
    return pick(eligible);
  };

  StoryEngine.prototype.resolveEvent = function (eventId, optionIndex) {
    var ev = RANDOM_EVENTS.find(function (e) { return e.id === eventId; });
    if (!ev || !ev.options || !ev.options[optionIndex]) return null;
    var opt = ev.options[optionIndex];
    if (opt.effects) {
      if (opt.effects.capital) this.capital += opt.effects.capital;
      if (opt.effects.ethics) this.ethics = clamp(this.ethics + opt.effects.ethics, 0, 100);
      if (opt.effects.reputation) {
        var r;
        for (r in opt.effects.reputation) {
          if (this.reputation[r] !== undefined) {
            this.reputation[r] = clamp(this.reputation[r] + opt.effects.reputation[r], 0, 100);
          }
        }
      }
    }
    this.eventHistory.push({ eventId: eventId, optionIndex: optionIndex, effects: opt.effects });
    if (opt.event) this.flags[opt.event] = true;
    return opt;
  };

  StoryEngine.prototype.getEnding = function () {
    if (this.ethics >= 80) return ENDINGS.santo;
    if (this.ethics >= 60) return ENDINGS.onesto;
    if (this.ethics >= 40) return ENDINGS.ambiguo;
    if (this.ethics >= 20) return ENDINGS.caduta;
    return ENDINGS.criminale;
  };

  StoryEngine.prototype.getState = function () {
    return {
      chapter: this.currentChapter,
      ethics: this.ethics,
      ethicsLabel: MORALE_SYSTEM.getLabel(this.ethics),
      capital: this.capital,
      reputation: this.reputation,
      completedMissions: this.completedMissions.slice(),
      activeMissions: this.activeMissions.slice(),
      choiceHistory: this.choiceHistory.slice(),
      eventHistory: this.eventHistory.slice(),
      flags: Object.assign({}, this.flags),
      gameOver: this.gameOver
    };
  };

  StoryEngine.prototype.setState = function (state) {
    if (!state) return false;
    this.currentChapter = state.chapter || 0;
    this.ethics = state.ethics !== undefined ? state.ethics : 50;
    this.capital = state.capital !== undefined ? state.capital : 10000;
    this.reputation = state.reputation || { sec: 50, clients: 50, wallStreet: 30, employees: 60 };
    this.completedMissions = state.completedMissions || [];
    this.activeMissions = state.activeMissions || [];
    this.choiceHistory = state.choiceHistory || [];
    this.eventHistory = state.eventHistory || [];
    this.flags = state.flags || {};
    this.gameOver = state.gameOver || false;
    return true;
  };

  StoryEngine.prototype.toJSON = function () {
    return JSON.stringify(this.getState());
  };

  StoryEngine.prototype.fromJSON = function (json) {
    try {
      var state = JSON.parse(json);
      return this.setState(state);
    } catch (e) {
      return false;
    }
  };

  StoryEngine.prototype.reset = function () {
    this.currentChapter = 0;
    this.ethics = 50;
    this.capital = 10000;
    this.reputation = { sec: 50, clients: 50, wallStreet: 30, employees: 60 };
    this.completedMissions = [];
    this.activeMissions = [];
    this.missionState = {};
    this.choiceHistory = [];
    this.eventHistory = [];
    this.dialogueState = {};
    this.gameOver = false;
    this.flags = {};
  };

  StoryEngine.prototype.getChapterIntro = function (chapterId) {
    var ch = this.getChapter(chapterId);
    return ch ? ch.intro : null;
  };

  StoryEngine.prototype.startChapter = function (chapterId) {
    var ch = this.getChapter(chapterId);
    if (!ch) return null;
    this.currentChapter = chapterId - 1;
    if (this.activeMissions.indexOf(ch.mainMission) < 0) {
      this.activeMissions.push(ch.mainMission);
    }
    return {
      intro: ch.intro,
      title: ch.title,
      era: ch.era,
      mission: MAIN_MISSIONS[ch.mainMission],
      npc: NPCS[ch.npc],
      moralChoices: this.getMoralChoices(chapterId)
    };
  };

  StoryEngine.prototype.checkReputationEvent = function () {
    var result = [];
    var rep = this.reputation;
    if (rep.sec < 20) result.push(REPUTATION_SYSTEM.effects.sec_low);
    if (rep.sec > 70) result.push(REPUTATION_SYSTEM.effects.sec_high);
    if (rep.clients < 20) result.push(REPUTATION_SYSTEM.effects.clients_low);
    if (rep.clients > 70) result.push(REPUTATION_SYSTEM.effects.clients_high);
    if (rep.wallStreet < 20) result.push(REPUTATION_SYSTEM.effects.wallStreet_low);
    if (rep.wallStreet > 70) result.push(REPUTATION_SYSTEM.effects.wallStreet_high);
    if (rep.employees < 20) result.push(REPUTATION_SYSTEM.effects.employees_low);
    if (rep.employees > 70) result.push(REPUTATION_SYSTEM.effects.employees_high);
    return result;
  };

  StoryEngine.prototype.getNPCDialogue = function (npcId, dialogueIndex) {
    return this.getDialogue(npcId, dialogueIndex);
  };

  StoryEngine.prototype.getAllNPCs = function () {
    return NPCS;
  };

  StoryEngine.prototype.getChapters = function () {
    return CHAPTERS;
  };

  StoryEngine.prototype.getRandomEvents = function () {
    return RANDOM_EVENTS;
  };

  StoryEngine.prototype.getEndings = function () {
    return ENDINGS;
  };

  StoryEngine.prototype.applyConsequence = function (ethicsDelta, capitalDelta, reputationDeltas) {
    if (ethicsDelta) this.ethics = clamp(this.ethics + ethicsDelta, 0, 100);
    if (capitalDelta) this.capital += capitalDelta;
    if (reputationDeltas) {
      var r;
      for (r in reputationDeltas) {
        if (this.reputation[r] !== undefined) {
          this.reputation[r] = clamp(this.reputation[r] + reputationDeltas[r], 0, 100);
        }
      }
    }
  };

  // Esporta
  global.StoryEngine = StoryEngine;
  global.StoryEngineData = {
    NPCS: NPCS,
    CHAPTERS: CHAPTERS,
    MAIN_MISSIONS: MAIN_MISSIONS,
    SIDE_MISSIONS: SIDE_MISSIONS,
    MORAL_CHOICES: MORAL_CHOICES,
    DARK_SCHEMES: DARK_SCHEMES,
    REPUTATION_SYSTEM: REPUTATION_SYSTEM,
    RANDOM_EVENTS: RANDOM_EVENTS,
    MORALE_SYSTEM: MORALE_SYSTEM,
    ENDINGS: ENDINGS
  };

})(typeof window !== 'undefined' ? window : this);
