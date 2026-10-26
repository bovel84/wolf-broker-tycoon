# 🐺 Wolf of Wall Street — Broker Tycoon

Gestionale di broker azionario completo e realistico con modalità carriera, assemblee societarie e mercato dinamico.

## Caratteristiche principali

- **Desk giocabile** — dossier settimanali, tre scelte, mandati verificati sulle posizioni reali, compensi, fiducia e resoconto delle conseguenze.
- **Una sola partita** — trading, prezzi, carriera, vita personale, assemblee, notizie e salvataggi condividono lo stato di `GameEngine`.
- **LLM Narrative Engine** — genera in tempo reale personaggi, memorie, relazioni, eventi e notizie narrative; ogni turno produce una storia coerente con lo stato del giocatore
- **Dialoghi dinamici** — i personaggi del Diario possono parlare con voce contestuale, basata su umore, relazioni e memorie
- **Agenti vivi** — ogni agente ha personalità, obiettivi, briefing di mercato, umore e consigli generati dal LLM
- **Istituzioni vive** — anche la società che ti assume (o quella che fondi) può parlarti, ricordare, giudicarti e spingerti in una direzione narrativa
- **Luoghi vivi** — la UI della società e delle assemblee mostra desk, colleghi, management, board e atmosfera della scena
- **Notizie guidate dalla storia** — `LLMNewsEngine` usa il Narrative Engine per generare titoli che non sono numeri isolati ma episodi di una trama finanziaria
- **Mercato dinamico** — oltre 100 società realistiche generate da `MarketEngine`, con prezzi, volatilità, dividendi e trend macro.
- **10 livelli carriera** — da Novizio a Leggenda di Wall Street, con sblocco progressivo di strumenti (limit, short, margin, penny, opzioni, dark pool).
- **Competitor AI** — rivali autonomi che operano, formano alleanze e reagiscono alla posizione del giocatore.
- **World Engine** — simulazione persistente di economia, regioni, governance e ciclo di vita societario.
- **Assemblee societarie** — vota proposte reali (dividendi, buyback, espansioni, split, cambio CEO) con effetti concreti sul titolo.
- **Carriera nel brokeraggio** — sei società con culture diverse; ora il giocatore inizia assunto automaticamente, ma può cambiare, salire di grado o fondare la propria firma.
- **Sistema morale** — etica, reputazione con SEC/clienti/Wall Street e scelte che influenzano finali multipli.
- **Finali multipli** — *Redenzione*, *Il Lupo*, *Vita quotidiana*, *Caduta* in base a patrimonio, livello ed etica.
- **Short selling & margin trading** — operazioni short e leva finanziaria fino a 5x.
- **Salvataggio multi-slot + auto-save** — round-trip JSON con portafoglio, missioni e stato completo.
- **UI responsive** — navigazione desktop con tab e bottom nav ottimizzata per mobile.
- **LLM opzionale** — notizie dinamiche e game master AI via Ollama Cloud proxy; disattivato di default.

## Tecnologia

- **Distribuzione HTML5**: `index.html` e `wolf-broker-tycoon.html` sono due copie dello stesso gioco compilato. `index.html` è pronto per l'hosting statico.
- **Sorgenti separati**: `src/game-shell.html` contiene struttura e stili, `legacy-ui.js` le viste esistenti e gli altri file i motori. Modificare questi sorgenti, poi eseguire la build; non modificare direttamente `index.html`.
- **Build Node.js 24**: `build.js` assembla ogni modulo una sola volta, transpila in ES5 con Babel e attende la minificazione prima di scrivere entrambi gli HTML.
- **Vincoli di compatibilità ES5**:
  - solo `var` (no `let`/`const`)
  - solo function tradizionali (no arrow functions)
  - no template literals
  - no `class`
  - no `async`/`await`
- Dipendenza esterna: Chart.js via CDN.

## Avvio rapido

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bat
start.bat
```

Lo script verifica il build e apre il gioco nel browser.

## Build e test

```bash
npm install
npm run build      # genera wolf-broker-tycoon.html (con minificazione se terser/html-minifier-terser installati)
npm test           # lint ES5 + test di integrazione + gameplay + bilanciamento + UI + HTML
npm run ci         # lint + build + test completo
```

Il vecchio `build_html.py` è deprecato; la build usa solo Node.js.

## Moduli

| File | Descrizione |
|------|-------------|
| `desk-director.js` | Mandati, obiettivi, watchlist, riepilogo e coordinamento della chiusura settimana |
| `llm-client.js` | Configurazione condivisa, trasporto OpenAI/Ollama, timeout e annullamento richieste |
| `src/game-shell.html` / `legacy-ui.js` | Sorgenti dell'interfaccia; nessuna copia incorporata dei motori |
| `market-engine.js` | Generazione realistica di società, settori e fondamentali |
| `game-engine.js` | Core: trading, livelli, missioni, achievement, SEC, finali |
| `ui-bridge.js` | Ponte tra `GameEngine` e UI legacy inline |
| `ui-engine.js` | Effetti visivi, dialoghi, toast, achievement pop-up |
| `story-engine.js` | Capitoli, NPC, missioni, sistema morale |
| `llm-news-engine.js` | Notizie AI via Ollama Cloud |
| `llm-game-master.js` | Game Master AI, eventi, competitor |
| `llm-narrative-engine.js` | Narrativa LLM: personaggi, memorie, relazioni, eventi, notizie |
| `competitor-engine.js` | Broker AI con strategie e memoria |
| `world-engine.js` | Simulazione persistente di mondo, società e rivali |
| `corporate-lifecycle.js` | Fallimenti, ristrutturazioni, M&A, IPO, spin-off |
| `broker-story.js` | Prologo e carriera narrativa del broker |
| `player-life.js` | Condizione personale, stress, margin call, game over |
| `brokerage-career.js` | Società di brokeraggio, colleghi IA, contratti, firma propria |
| `stakeholder-interactions.js` | Quote, mercato dei blocchi, relazioni nel desk |
| `build.js` | Build system Node.js + Babel ES5 |
| `scripts/lint-es5.js` | Lint ES5 sui sorgenti |
| `test/*.test.js` | Suite di test automatica |
| `.github/workflows/ci.yml` | CI GitHub Actions |

## Flusso settimanale

1. Il giocatore legge il dossier, sceglie un mandato e conferma le operazioni nel normale trading.
2. `GameEngine` simula ordini, mercato, dividendi, assemblee, rivali e progressione.
3. `DeskDirector` attende gli eventi del mondo e processa carriera, gestione della firma, scadenze dei mandati e vita personale una sola volta.
4. Notizie, memorie e inbox leggono lo stesso stato; gli impatti delle notizie si applicano una sola volta per anno/settimana.
5. Si aggiornano valutazioni, grafico, missioni e resoconto; poi si salva la partita completa e si sblocca il turno successivo.

Il gioco resta utilizzabile senza LLM e senza CDN dei grafici. Un timeout del provider usa contenuti procedurali; le risposte tardive non possono cambiare una nuova partita. Dettagli e verifiche in [docs/game-loop.md](docs/game-loop.md).

## Configurazione LLM

Vedi la [guida completa](docs/llm-setup.md) per configurare Ollama Cloud, Ollama locale o altri provider compatibili OpenAI.

Le chiavi API non sono incluse nel codice. Inserisci endpoint, modello e chiave dalla schermata **Impostazioni LLM**; i dati restano nel browser tramite localStorage. L'integrazione LLM è **disattivata di default** e deve essere abilitata esplicitamente.

## Salvataggi

- Auto-save in `localStorage` ad ogni turno.
- Slot manuali gestiti da `GameEngine.saveToSlot()` / `loadFromSlot()`.
- Esporta/importa JSON dalla schermata Salvataggio.

## Compatibilità

Build e CI usano Node.js 24, come richiesto dalle dipendenze Babel 8. Il codice del gioco viene compilato in ES5.
