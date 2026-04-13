@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo [1/5] npm install
echo ============================================
call npm install
if errorlevel 1 (
    echo npm install HATA!
    pause
    exit /b 1
)

echo.
echo ============================================
echo [2/5] Eski .next siliniyor...
echo ============================================
if exist .next rmdir /s /q .next

echo.
echo ============================================
echo [3/5] npm run build
echo ============================================
call npm run build
if errorlevel 1 (
    echo BUILD HATA! Hata mesajini oku.
    pause
    exit /b 1
)

echo.
echo ============================================
echo [4/5] git add, commit, push
echo ============================================
git add -A
git commit -m "fix: build kontrol ve package.json duzeltme" 2>nul
git push origin main
if errorlevel 1 (
    echo GIT PUSH HATA!
    pause
    exit /b 1
)

echo.
echo ============================================
echo TAMAMLANDI! Build basarili, push yapildi.
echo ============================================
pause
