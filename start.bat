@echo off
REM Wolf Broker Tycoon - Avvio gioco
REM Apre il file HTML compilato nel browser predefinito

set SCRIPT_DIR=%~dp0

REM Verifica che il build esista, altrimenti lo genera
if not exist "%SCRIPT_DIR%wolf-broker-tycoon.html" (
    echo Build non trovato. Esecuzione di npm run build...
    call npm run build
    if errorlevel 1 (
        echo Errore durante il build!
        pause
        exit /b 1
    )
)

REM Apri il gioco nel browser predefinito
echo Avvio di Wolf Broker Tycoon...
start "" "%SCRIPT_DIR%wolf-broker-tycoon.html"

REM Lascia la finestra aperta per eventuali messaggi di errore
echo.
echo Il gioco e stato avviato nel tuo browser.
echo Chiudi questa finestra quando hai finito.
pause
