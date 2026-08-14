# Configurazione LLM — Wolf of Wall Street: Broker Tycoon

Questa guida spiega come configurare un LLM per generare notizie narrative, dialoghi e eventi dinamici nel gioco.

## 1. Avviare un'istanza LLM

Il gioco supporta qualsiasi endpoint compatibile con l'API OpenAI (formato `/v1/chat/completions`).

### Opzione A: Ollama Cloud (consigliato)

1. Vai su [ollama.com](https://ollama.com) e crea un account.
2. Genera una chiave API dalla dashboard.
3. L'endpoint sarà `https://ollama.com/v1/chat/completions`.
4. Scegli un modello (es. `glm-5.2`, `qwen3.5`, `deepseek-v4-pro`).

### Opzione B: Ollama locale

1. Installa [Ollama](https://ollama.com/download).
2. Avvia un modello: `ollama run glm-5.2`.
3. L'endpoint sarà `http://localhost:11434/v1/chat/completions`.
4. La chiave API può essere qualsiasi stringa (es. `ollama`).

### Opzione C: Altri provider compatibili OpenAI

1. Usa qualsiasi provider che esponga un endpoint `/v1/chat/completions`.
2. Annota endpoint, modello e chiave API.

## 2. Configurare il gioco

1. Apri `wolf-broker-tycoon.html` nel browser.
2. Vai su **Impostazioni LLM** (icona ⚙️ o tab Impostazioni).
3. Inserisci:
   - **Endpoint**: URL del provider (es. `https://ollama.com/v1/chat/completions`)
   - **Modello**: nome del modello (es. `glm-5.2`)
   - **Chiave API**: la tua chiave
4. Attiva l'integrazione LLM con il toggle.
5. Le notizie narrative e i dialoghi dinamici saranno generati dal LLM.

> **Nota**: I dati restano nel browser tramite `localStorage`. Nessuna chiave viene inviata a server esterni se non al provider LLM scelto.

## 3. Esempio di configurazione

| Campo | Valore |
|-------|--------|
| Endpoint | `https://ollama.com/v1/chat/completions` |
| Modello | `glm-5.2` |
| Chiave API | `6cfac3...` (la tua chiave) |

## 4. Troubleshooting

### Il LLM non risponde
- Verifica che l'endpoint sia raggiungibile (`curl -X POST <endpoint> -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"model":"glm-5.2","messages":[{"role":"user","content":"test"}]}'`).
- Controlla che la chiave API sia corretta.
- Se usi Ollama locale, assicurati che il server sia in esecuzione (`ollama serve`).

### Notizie ripetitive o vuote
- Prova un modello più grande (es. `glm-5.2` invece di `glm-5.1`).
- Aumenta la temperatura nelle impostazioni avanzate (se disponibile).
- Verifica che il gioco abbia abbastanza contesto (almeno 10 turni giocati).

### Rate limit
- Ollama Cloud ha limiti sulle richieste al minuto.
- Il gioco cache le risposte e riduce le chiamate quando possibile.
- Se il rate limit è un problema, considera Ollama locale.

### LLM disattivato
- L'integrazione LLM è **disattivata di default** per sicurezza.
- Puoi giocare senza LLM: le notizie usano il motore procedurale integrato.
- Attiva il LLM solo quando vuoi notizie narrative e dialoghi dinamici.