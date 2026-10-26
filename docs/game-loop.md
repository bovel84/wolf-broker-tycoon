# Partita condivisa e ciclo del desk

## Comportamento

Il prologo conduce a un impiego junior presso Meridian. Il desk presenta una società reale del mercato della partita e tre scelte: mandato prudente, mandato concentrato o rinuncia. Accettare non compra azioni: il pulsante prepara un ordine, che il giocatore deve controllare e confermare.

Alla chiusura della settimana il mandato verifica il costo delle posizioni ancora aperte rispetto al patrimonio registrato all'accettazione. I limiti e le conseguenze sono visibili prima della scelta. Il compenso remunera il rispetto del mandato, indipendentemente dal rendimento del titolo. Il resoconto distingue la variazione del patrimonio dal movimento del mercato e dal contributo dei titoli detenuti.

## Confini dei moduli

- `GameEngine` possiede la liquidità, le posizioni, il registro operazioni e le società.
- `wolfBridge` espone alle viste precedenti proprietà collegate a quel medesimo stato. Prima di salvare riconcilia modifiche strutturali come vendite di blocchi, liquidazioni, conversioni e nuove quotazioni.
- `legacyData` conserva carriera, vita personale, storia del broker, stakeholder e mondo. È inclusa in slot, autosave e JSON esportato.
- `DeskDirector` coordina il completamento asincrono di un turno. `advanceTurn()` restituisce subito il risultato e una Promise `completion`, che termina dopo tutti i moduli. Clic ripetuti restituiscono il turno in corso; gli ordini non possono essere eseguiti durante questa elaborazione.
- I moduli legacy mantengono l'avvio autonomo per gli usi precedenti, ma nel bundle gestito non aggiungono altri wrapper o timer settimanali.
- L'identità narrativa del giocatore è `player:broker`, anche se cambia nome.

## LLM e disponibilità

Tutti i moduli usano `sbt_llm_settings`. La vecchia configurazione narrativa viene recuperata se manca quella condivisa. L'avvio non modifica il toggle scelto dall'utente.

Il trasporto distingue l'API Ollama `/api/chat` da un endpoint OpenAI compatibile. Gestisce anche endpoint locali senza chiave, timeout e cancellazione delle richieste. I tre pacchetti principali sono mondo, narrazione e inbox; le chiamate narrative per notizie, note e avvenimenti sono state unite. I dialoghi richiesti dal giocatore o dai capitoli restano separati.

Il narratore riceve portafoglio, titoli seguiti, dossier, decisioni recenti, personaggi e memorie. Gli impatti aggiuntivi delle notizie sono limitati al 3% e registrati per anno/settimana per evitarne l'applicazione ripetuta. Il mercato procedurale resta attivo quando il modello non è disponibile.

## Build

`src/game-shell.html` e `legacy-ui.js` sono i sorgenti delle viste. `build.js` li unisce ai moduli una sola volta e genera sia `index.html` sia `wolf-broker-tycoon.html`. Quest'ultimo è un output locale escluso da git; la CI lo pubblica come artefatto. Non reincorporare il bundle nei sorgenti.

## Verifiche

`npm run ci` esegue lint ES5, build e otto suite. Le regressioni aggiunte usano l'HTML effettivamente compilato e coprono:

- acquisto dal desk, posizione nel motore, chiusura del mandato e singolo avanzamento;
- prezzi e patrimonio condivisi, contabilità short, split e ordini limite;
- proposte e voti assembleari attraverso la UI;
- caricamento di carriera, condizioni personali, mondo, mandati e regole delle missioni;
- migrazione di salvataggi legacy, anche con liquidità zero e vecchi ticker;
- provider OpenAI/Ollama simulati, notizie visibili, timeout e isolamento delle risposte tardive;
- assenza di motori o elementi di navigazione duplicati nel bundle.

La verifica manuale in Chromium ha seguito i pulsanti dal prologo al primo ordine e alla chiusura del mandato, senza Chart.js disponibile. Le viste a 1365×1000 e 412×915 non hanno prodotto errori JavaScript o overflow orizzontale. L'integrazione LLM è verificata con risposte simulate: per provare un provider reale servono le impostazioni del giocatore nel suo browser.
