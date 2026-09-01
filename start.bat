@echo off
title Wycherley International School Cheque Printer Server
cd /d "%~dp0"
echo ========================================================
echo Starting Wycherley International School Cheque Printer (http://localhost:8888)...
echo ========================================================
node server.js
pause
