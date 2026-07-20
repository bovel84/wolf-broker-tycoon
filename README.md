# 🐺 Wolf of Wall Street Broker Tycoon

Gestionale di broker azionario completo e realistico con modalità carriera e assemblee societarie.

## Caratteristiche

- **Mercato societario dinamico** — 45 società iniziali, con nuove quotazioni, fusioni, acquisizioni, spin-off e fallimenti
- **10 livelli carriera** da Apprendista a Magnate
- **10 competitor AI** con personalità e strategie diverse
- **LLM Game Master 5.0** — un solo turno AI coerente coordina mondo, aziende, rivali ed eventi societari straordinari
- **Ciclo di vita realistico** — dissesto, ristrutturazione, liquidazione, M&A, IPO e spin-off con validazione economica
- **Conseguenze di mercato** — posizioni convertite o liquidate, short regolati, contagio settoriale, indici e governance aggiornati
- **World Engine persistente** — macroregioni, fondamentali, governance e strategie aziendali evolvono nel tempo
- **Storia di ogni società** — fondazione, sede, missione, tappe storiche e obiettivo pluriennale
- **Amministratori autonomi** — competenza, etica, influenza, lealtà, agenda e carriera personale
- **Soci reali** — fondatori, istituzionali, attivisti, dipendenti e azionisti diffusi con quote e interessi diversi
- **Competitor con memoria** — obiettivi, convinzione, piani, alleanze e rivalità influenzano le operazioni
- **Assemblee globali** — CdA, blocchi rivali e quota del giocatore determinano votazioni ed effetti reali
- **LLM News Engine** — notizie di mercato generate da AI (Ollama Cloud)
- **Assemblee societarie** con votazioni
- **Short selling** e margin trading
- **Salvataggio multi-slot** (3 slot)
- **Sistema morale** e reputazione
- **Prologo interattivo** — nome, origine, promessa e primo segreto del broker
- **Carriera narrativa reattiva** — 8 capitoli originali sbloccati da trade, perdite, assemblee, patrimonio e indagini
- **Scelte persistenti** — etica, nervi, lealtà, ambizione e relazioni cambiano storia e mondo
- **Vita del broker** — salute, stress, credibilità, pressione legale, tenore di vita, leva e picco patrimoniale evolvono ogni settimana
- **Caduta progressiva** — avvisi, crisi di solvibilità e margin call anticipano bancarotta, condanna, crollo fisico o reputazionale
- **Game over narrativo** — causa precisa, statistiche finali, punteggio eredità, epilogo LLM e una sola seconda possibilità quando plausibile
- **Partenza da disoccupato** — il broker deve firmare con una delle sei società prima di poter operare professionalmente
- **Sei società di brokeraggio** — culture, salari, commissioni, target e limiti di rischio diversi
- **Competizione interna IA** — cinque colleghi per desk producono ricavi, scalano classifiche, sottraggono clienti e lottano per bonus e promozioni
- **Mercato del lavoro** — valutazioni quadrisettimanali, promozioni, licenziamenti, dimissioni e offerte dei concorrenti
- **Società del giocatore** — capitale iniziale, affitto, dati, compliance, stipendi, clienti, masse, ricavi, costi e classifica contro le sei imprese
- **Zona grigia** — soffiate, report falsi, ricatti, audit, multe e prove persistenti con conseguenze narrative e legali
- **Portafoglio proprietario** — azioni totali, libere e impegnate, quota percentuale, voto, flottante, valore e costo medio
- **Mercato dei blocchi** — offerte dei soci, premi/sconti, scadenze, ordini del giocatore e compratori IA
- **Assemblee interattive** — voto con qualsiasi quota, incontri con i blocchi, campagne proxy, lobbying e controproposte
- **Capo interattivo** — richieste con scadenze, premi, ordini discutibili, negoziazione, feedback, aumenti e contestazioni
- **Colleghi con memoria** — conversazioni, aiuti, favori, sfide, segnalazioni, rivalità e reazioni LLM opzionali

## Tecnologia

- Single-file HTML5 (nessuna dipendenza esterna tranne Chart.js CDN)
- Vanilla JS con restrizioni di compatibilità:
  - Solo apici singoli con concatenazione (no template literals)
  - Solo function tradizionali (no arrow functions)
  - Solo `var` (no `let`/`const`)
  - Solo Promise `.then/.catch` (no `async/await`)
- LLM integration via Ollama Cloud proxy (Vercel)

## Build

```bash
python3 build_html.py
```

Genera `wolf-broker-tycoon.html` single-file giocabile.

## Moduli

| File | Descrizione |
|------|-------------|
| `market-engine.js` | Motore di mercato, prezzi, volatilità |
| `game-engine.js` | Motore core, livelli, achievement, SEC |
| `ui-engine.js` | UI, dialoghi, notizie, effetti visivi |
| `story-engine.js` | 12 capitoli, NPC, missioni, sistema morale |
| `llm-news-engine.js` | Notizie AI via Ollama Cloud |
| `llm-game-master.js` | Game Master AI, eventi, competitor |
| `competitor-engine.js` | 10 broker AI con OPA e sfide |
| `world-engine.js` | Simulazione persistente di mondo, società, rivali e assemblee |
| `corporate-lifecycle.js` | Fallimenti, ristrutturazioni, fusioni, acquisizioni, IPO e spin-off |
| `broker-story.js` | Prologo, identità del broker, capitoli reattivi, relazioni e finali |
| `player-life.js` | Condizione personale, spese, rischio, margin call, game over e riscatto |
| `brokerage-career.js` | Disoccupazione, sei datori, colleghi IA, contratti, società propria e illeciti |
| `stakeholder-interactions.js` | Quote, mercato dei blocchi, assemblee, capo e relazioni nel desk |
| `build_html.py` | Assemblatore finale single-file |
## Configurazione sicura LLM

Le chiavi API non sono incluse nel codice. Inserisci endpoint, modello e chiave dalla schermata **Impostazioni LLM**; i dati restano nel browser tramite localStorage. In produzione è consigliato un proxy server-side che non esponga credenziali al client.

L'integrazione LLM è disattivata per impostazione predefinita. Il giocatore deve inserire consapevolmente un endpoint e abilitarla: solo da quel momento contesto di gioco, portafoglio e carriera possono essere inviati al servizio configurato.

## Flusso settimanale

1. Il motore di mercato aggiorna prezzi ed eventi.
2. L'LLM riceve a rotazione società complete con storia, obiettivi, amministratori, soci, macroregioni e memoria dei rivali.
3. Il World Engine valida e limita ogni delta prima di applicarlo.
4. Il Corporate Lifecycle verifica la salute finanziaria e applica operazioni straordinarie solo a società ammissibili.
5. Fallimenti e operazioni M&A modificano titoli, portafoglio, short, peer di settore, indici, notizie e storie societarie.
6. Se l'LLM non è disponibile, il fallback locale mantiene il gioco pienamente funzionante e può generare eventi societari coerenti.

## Storia del broker

Una nuova partita apre il prologo **La chiamata delle 6:17**. Il giocatore sceglie il nome del broker, il suo passato e la promessa che guiderà la carriera. I capitoli non avanzano con una sequenza fissa: si sbloccano in base ai risultati reali, alle perdite, ai rivali, alle assemblee e alle indagini. Il profilo narrativo viene incluso nel contesto del World Engine e salvato insieme alla partita.

## Governance societaria AI

Ogni settimana l'LLM gestisce un gruppo a rotazione di società. Gli amministratori possono sostenere o ostacolare il piano, perdere influenza, cambiare condotta, essere sospesi o dimettersi. I blocchi azionari modificano fiducia e posizione in base ai risultati. Nelle assemblee il voto deriva da CdA, soci reali, competitor e quota posseduta dal giocatore. Tutti i valori prodotti dall'LLM vengono limitati e validati dal World Engine prima dell'applicazione.
