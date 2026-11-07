@echo off
chcp 65001 >nul
title EduApp Tests landing - http://localhost:8001
cd /d "%~dp0dist"
echo.
echo   EduApp Tests landing
echo   http://localhost:8001
echo   Do not close this window while you are viewing the site.
echo.
start "" "http://localhost:8001/"
python "%~dp0serve.py" 8001
if errorlevel 1 (
  echo.
  echo   Server did not start: Python is not installed or port 8001 is already in use.
  echo   If the site already opens at http://localhost:8001 - everything is fine.
  pause
)
