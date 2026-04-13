@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ══════════════════════════════════════
echo   Premium UI Overhaul - Build ^& Push
echo ══════════════════════════════════════

echo.
echo [1/5] Stopping dev server if running...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Cleaning .next cache...
rmdir /s /q .next 2>nul
if exist .next (
    echo .next still locked, retrying...
    timeout /t 3 /nobreak >nul
    rmdir /s /q .next 2>nul
)

echo.
echo [3/5] Building project...
call npx next build
if errorlevel 1 (
    echo.
    echo ❌ BUILD FAILED! Check errors above.
    pause
    exit /b 1
)

echo.
echo ✅ BUILD SUCCESS!
echo.
echo [4/5] Git add, commit, push...
git add -A
git commit -m "design: premium UI overhaul — 32 madde (hero animasyon, glassmorphism, scroll-reveal, confetti, count-up, animated sidebar, progress gradients, touch feedback, skeleton loading, reduced-motion)"
git push origin main

echo.
echo [5/5] Done!
echo ══════════════════════════════════════
echo   ✅ TAMAMLANDI! Vercel deploy basliyor...
echo ══════════════════════════════════════
echo.
pause
