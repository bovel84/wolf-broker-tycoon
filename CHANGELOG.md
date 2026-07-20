# Changelog

## [1.6.0] — 2025-06-26

### Aggiunto
- **La società che ti assume ora è un personaggio vivo**:
  - compare nel registro narrativo come `firm:*`
  - ha mood, agenda, memoria e relazione col giocatore
  - può inviarti messaggi contestuali generati dal LLM
- **Voce della società** nella schermata `Società`:
  - ultimo messaggio del desk/direzione
  - stato emotivo istituzionale
  - richiesta implicita di colloquio (`asksMeeting`)
  - accesso diretto al personaggio nel Diario
- **Persistenza memoria societaria** nel sistema carriera (`messages`, `employerMood`, `employerAgenda`).
- **Prompt LLM dedicato alla società**: il datore di lavoro ricorda risultati, audit, fiducia, reputazione e incidenti recenti.

### Cambiato
- Il mondo narrativo non contiene più solo NPC individuali: anche le istituzioni hanno voce, memoria e intenzione.
- Il Diario ora può mostrare anche personaggi di namespace `firm`.

## [1.5.0] — 2025-06-26

### Aggiunto
- **Agenti vivi e LLM-driven**:
  - personalità, ambizione, etica, visione di mercato, obiettivo personale
  - briefing narrativi generati dal LLM ogni turno
  - richieste implicite di incontro (`wantsMeeting`)
  - memorie di gameplay legate a crescita, tradimenti, successi ed errori
- **Character Modal esteso per agenti**: mostra briefing, visione di mercato, consiglio, obiettivo personale, personalità e livello di lealtà.
- **Dialogue engine on-demand**: i personaggi nel Diario possono generare una risposta contestuale in tempo reale senza dipendere da frasi statiche.
- **Memorie competitor persistite** con roster riversato nello stato di gioco.
- **Memorie societarie** per delibere assembleari approvate.

### Cambiato
- `llm-narrative-engine.js` usa fino a 6 chiamate per turno per sostenere anche briefing e dialoghi.
- Gli agenti non sono più solo workforce numerica: diventano un canale narrativo e cognitivo sul mercato.

## [1.4.0] — 2025-06-26

### Aggiunto
- **Dialoghi dinamici NPC**: `story-engine.js` supporta `getDynamicDialogue()` usando `LLMNarrativeEngine` quando disponibile.
- **Character modal** nella UI: ogni personaggio del Diario può essere aperto, mostrare tratti, backstory, memorie e una risposta generata in tempo reale.
- **Memorie di gameplay** per clienti, agenti e competitor:
  - nuovi clienti diventano eventi narrativi
  - clienti reagiscono a forti guadagni/perdite
  - agenti traditori o in crescita lasciano tracce narrative
  - competitor registrano operazioni significative nel diario
- **Roster competitor persistito nello stato** per alimentare il Narrative Engine.
- **Memorie societarie**: le delibere approvate in assemblea generano tracce narrative legate al CEO/board.

### Cambiato
- La UI narrativa non è più solo lettura: ora è un primo livello di interazione col mondo vivo.

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
