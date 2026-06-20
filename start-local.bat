@echo off
cd /d "%~dp0"
set PORT=5500
start "" "http://localhost:%PORT%"
node local-server.js
pause
