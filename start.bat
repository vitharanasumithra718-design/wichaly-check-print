@echo off
title PW Holdings Cheque Printer Server
cd /d "%~dp0"
echo ========================================================
echo Starting PW Holdings Cheque Printer (http://localhost:8888)...
echo ========================================================
node server.js
pause
