# 🐺 Wolf of Wall Street — Broker Tycoon

Gestionale di broker azionario completo e realistico con modalità carriera, assemblee societarie e mercato dinamico.

## Caratteristiche principali

- **LLM Narrative Engine** — genera in tempo reale personaggi, memorie, relazioni, eventi e notizie narrative; ogni turno produce una storia coerente con lo stato del giocatore
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

- **Single-file HTML5**: `wolf-broker-tycoon.html` contiene tutto il codice.
- **Build Node.js**: `build.js` assembla i moduli JS, li transpila in ES5 con Babel e valida i vincoli.
- **Vincoli di compatibilità ES5**:
  - solo `var` (no `let`/`const`)
  - solo function tradizionali (no arrow functions)
  - no template literals
  - no `class`
  - no `async`/`await`
- Dipendenza esterna: Chart.js via CDN.

## Build e test

```bash
npm install
npm run build      # genera wolf-broker-tycoon.html
npm test           # lint ES5 + test di integrazione + gameplay + bilanciamento + UI + HTML
npm run ci         # lint + build + test completo
```

Il vecchio `build_html.py` è deprecato; la build usa solo Node.js.

## Moduli

| File | Descrizione |
|------|-------------|
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

1. Aggiornamento prezzi, dividendi e report trimestrali.
2. Eventi societari (aziendali, settoriali, macro).
3. Check assemblee e votazioni attive.
4. World Engine e Corporate Lifecycle.
5. Competitor Engine: azioni dei rivali.
6. Processo clienti, agenti e stipendi.
7. Missioni, achievement, chapter progress e SEC raid.
8. Salvataggio automatico.

## Configurazione sicura LLM

Le chiavi API non sono incluse nel codice. Inserisci endpoint, modello e chiave dalla schermata **Impostazioni LLM**; i dati restano nel browser tramite localStorage. L'integrazione LLM è **disattivata di default** e deve essere abilitata esplicitamente.

## Salvataggi

- Auto-save in `localStorage` ad ogni turno.
- Slot manuali gestiti da `GameEngine.saveToSlot()` / `loadFromSlot()`.
- Esporta/importa JSON dalla schermata Salvataggio.

## Compatibilità

Testato su Node.js 18+. L'output HTML è ES5 puro e dovrebbe girare su browser moderni e su ambienti con restrizioni JavaScript severe.
