@echo off
chcp 65001 >nul
cd /d "C:\Users\Desktop\Desktop\Egitim_Check"

echo [1/4] Lock dosyalari temizleniyor...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul

echo [2/4] Degisiklikler ekleniyor...
git add src/app/api/reports/generate/route.ts src/app/api/reports/integrated/route.ts "src/app/api/export/[format]/route.ts" next.config.ts

echo [3/4] Commit yapiliyor...
git commit -m "fix(security): API auth kontrolu + HSTS/CSP header eklendi"

echo [4/4] Push yapiliyor...
git push origin main

echo.
echo Sonuc: %ERRORLEVEL%
pause
