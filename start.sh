#!/bin/bash
# Wolf Broker Tycoon - Avvio gioco (macOS/Linux)
# Builda se manca il file HTML, poi apre il gioco nel browser

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HTML_FILE="$SCRIPT_DIR/index.html"

# Verifica che il build esista, altrimenti lo genera
if [ ! -f "$HTML_FILE" ]; then
    echo "Build non trovato. Esecuzione di npm run build..."
    cd "$SCRIPT_DIR"
    npm install
    npm run build
fi

# Apri il gioco nel browser predefinito
echo "Avvio di Wolf Broker Tycoon..."
if command -v open >/dev/null 2>&1; then
    open "$HTML_FILE"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$HTML_FILE"
else
    echo "Apri manualmente: $HTML_FILE"
fi
