# Changelog

## [1.3.0] — 2025-06-26

### Aggiunto
- **View Diario (Narrativa)** in `index.html`: pannello con Diario di Bordo, Personaggi, Eventi Recenti e Memorie.
- **Render narrativo** (`renderNarrative`) collegato a `renderAll` e sincronizzato via `ui-bridge.js`.
- **Bottom nav mobile** aggiornata con accesso al Diario nel menu "Altro".
- **Test UI** aggiornato per verificare la presenza della view `narrative`.

### Cambiato
- `ui-bridge.js` esporta `narrative` nello stato legacy `G`, rendendolo disponibile per la UI.

## [1.2.0] — 2025-06-26

### Aggiunto
- **LLM Narrative Engine** (`llm-narrative-engine.js`): genera in tempo reale personaggi, memorie, relazioni, eventi narrativi e notizie coerenti con la storia del giocatore.
- **Character Registry**: ogni cliente, agente, CEO, competitor e NPC fissato diventa un personaggio con tratti, mood, obiettivi e memoria.
- **Memory Bank**: fatti ed eventi vissuti persistono nel salvataggio e influenzano i prompt futuri.
- **Relationship Web**: relazioni tra personaggi e verso il giocatore, con delta e storico.
- **Integrazione con LLMNewsEngine**: le notizie sono ora episodi narrativi generati dal Narrative Engine; fallback statico se LLM disabilitato.
- **Test narrative** (`test/narrative.test.js`): verificano creazione stato, personaggi, memorie, relazioni e fallback.

### Cambiato
- `llm-news-engine.js` delega al Narrative Engine quando disponibile per notizie coerenti con la storia.
- `build.js` include `llm-narrative-engine.js` nel bundle.
- `scripts/lint-es5.js` include `llm-narrative-engine.js` tra i sorgenti controllati.

## [1.1.0] — 2025-06-26

### Aggiunto
- **Build system Node.js**: `build.js` sostituisce `build_html.py`, transpila ES6+ → ES5 con Babel e valida i vincoli.
- **Lint ES5**: `scripts/lint-es5.js` controlla `const`, `let`, `class`, `async/await`, arrow functions, template literals e `for-of`.
- **UI bridge**: `GameEngine` diventa unica fonte di verità mantenendo compatibilità con l'HTML legacy.
- **Test automatici**:
  - `test/integration.test.js` — integrazione motori e bridge
  - `test/gameplay.test.js` — short, margin, missioni, bancarotta, save round-trip
  - `test/balance.test.js` — bilanciamento gameplay con simulazioni
  - `test/ui.test.js` — test headless di UI/UX responsive
  - `test/html-build.test.js` — caricamento e funzionamento dell'HTML compilato
- **CI GitHub Actions**: `.github/workflows/ci.yml` esegue lint, build e test su push/PR.
- **Bilanciamento gameplay**: commissioni e slippage ridotte, requisiti livelli abbassati, salario settimanale, trend macro persistente.
- **Assemblee reali**: 8 tipologie di proposte con voti AI ed effetti concreti (prezzo, dividendo, split, volatilità, payout).
- **Carriera brokeraggio accessibile**: il giocatore inizia automaticamente assunto, evitando blocchi all'avvio.
- **Finali multipli**: Redenzione, Il Lupo, Vita quotidiana, Caduta al raggiungimento del capitolo 10.
- **Bottom navigation mobile**: barra fissa con sync della view attiva.
- **Schermata titolo**: transizione fluida e responsive.

### Cambiato
- `Map()` in `game-engine.js` sostituiti con oggetti plain per salvataggi JSON-serializzabili.
- Requisiti missioni e livelli resi più accessibili.
- README completamente riscritto con istruzioni attuali.

### Rimosso
- Dipendenza da `build_html.py` e da interprete Python locale.

### Deprecato
- `build_html.py` — sostituito da `build.js`.

## [1.0.0] — baseline

- Single-file HTML con mercato, portafoglio, trading, news, assemblee, carriera, LLM e salvataggi.
