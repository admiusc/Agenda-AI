@echo off
echo Iniciando AgendaAI...
echo.
echo Abriendo servidor backend en puerto 3001...
start "AgendaAI - Servidor" cmd /k "cd /d "%~dp0server" && node server.js"

timeout /t 2 /nobreak > nul

echo Abriendo frontend en puerto 5173...
start "AgendaAI - Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak > nul

echo Abriendo navegador...
start "" "http://localhost:5173"

echo.
echo AgendaAI iniciado. Si el navegador no abre, ve a: http://localhost:5173
