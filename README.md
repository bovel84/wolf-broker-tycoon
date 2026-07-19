# 🐺 Wolf of Wall Street Broker Tycoon

Gestionale di broker azionario completo e realistico con modalità carriera e assemblee societarie.

## Caratteristiche

- **8 titoli** con prezzo, capitalizzazione, volatilità, dividendi
- **10 livelli carriera** da Apprendista a Magnate
- **10 competitor AI** con personalità e strategie diverse
- **LLM Game Master 3.0** — un solo turno AI coerente coordina mondo, aziende, rivali ed eventi
- **World Engine persistente** — macroregioni, fondamentali, governance e strategie aziendali evolvono nel tempo
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
| `broker-story.js` | Prologo, identità del broker, capitoli reattivi, relazioni e finali |
| `build_html.py` | Assemblatore finale single-file |
## Configurazione sicura LLM

Le chiavi API non sono incluse nel codice. Inserisci endpoint, modello e chiave dalla schermata **Impostazioni LLM**; i dati restano nel browser tramite localStorage. In produzione è consigliato un proxy server-side che non esponga credenziali al client.

## Flusso settimanale

1. Il motore di mercato aggiorna prezzi ed eventi.
2. L'LLM riceve un contesto compatto con macroregioni, fondamentali, memoria dei rivali e storico recente.
3. Il World Engine valida e limita ogni delta prima di applicarlo.
4. Le decisioni diventano notizie, variazioni fondamentali, piani dei competitor e proposte assembleari.
5. Se l'LLM non è disponibile, il fallback locale mantiene il gioco pienamente funzionante.

## Storia del broker

Una nuova partita apre il prologo **La chiamata delle 6:17**. Il giocatore sceglie il nome del broker, il suo passato e la promessa che guiderà la carriera. I capitoli non avanzano con una sequenza fissa: si sbloccano in base ai risultati reali, alle perdite, ai rivali, alle assemblee e alle indagini. Il profilo narrativo viene incluso nel contesto del World Engine e salvato insieme alla partita.
