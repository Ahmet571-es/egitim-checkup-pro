@echo off
cd /d "%~dp0"
echo === npm run build === > build_output.txt 2>&1
call npm run build >> build_output.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo BUILD HATASI! >> build_output.txt 2>&1
    type build_output.txt
    pause
    exit /b 1
)
echo === Build basarili! === >> build_output.txt 2>&1
echo === Git commit ve push === >> build_output.txt 2>&1
git add -A >> build_output.txt 2>&1
git commit -m "feat(faz4): veli deneyimi & bildirim sistemi" >> build_output.txt 2>&1
git push origin main >> build_output.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PUSH HATASI! >> build_output.txt 2>&1
    type build_output.txt
    pause
    exit /b 1
)
echo === Push basarili! === >> build_output.txt 2>&1
echo 3 dakika bekleniyor... >> build_output.txt 2>&1
type build_output.txt
timeout /t 180 /nobreak
start https://egitim-checkup.com
echo === Tamamlandi! ===
pause
