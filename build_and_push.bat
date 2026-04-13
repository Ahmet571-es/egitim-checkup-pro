@echo off
cd /d "%~dp0"

echo ======================================
echo   Premium UI Overhaul - Git Push
echo ======================================

echo.
echo [1/2] Git add and commit...
git add -A
git commit -m "design: premium UI overhaul - 32 madde"

echo.
echo [2/2] Git push to main...
git push origin main

echo.
echo ======================================
echo   DONE! Vercel deploy is starting...
echo ======================================
echo.
pause
