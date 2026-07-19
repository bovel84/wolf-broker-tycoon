# 🐺 Wolf of Wall Street Broker Tycoon

Gestionale di broker azionario completo e realistico con modalità carriera e assemblee societarie.

## Caratteristiche

- **8 titoli** con prezzo, capitalizzazione, volatilità, dividendi
- **10 livelli carriera** da Apprendista a Magnate
- **10 competitor AI** con personalità e strategie diverse
- **LLM Game Master** — notizie dinamiche, dialoghi narrativi, eventi mondiali
- **LLM News Engine** — notizie di mercato generate da AI (Ollama Cloud)
- **Assemblee societarie** con votazioni
- **Short selling** e margin trading
- **Salvataggio multi-slot** (3 slot)
- **Sistema morale** e reputazione
- **12 capitoli narrativi** con scelte etiche

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
| `build_html.py` | Assemblatore finale single-file |