@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === 1. Installing Vercel packages ===
call npm install @vercel/analytics @vercel/speed-insights --save

echo === 2. Git add all changes ===
git add src/lib/rate-limit.ts
git add src/app/api/reports/generate/route.ts
git add src/app/api/reports/integrated/route.ts
git add src/app/layout.tsx
git add package.json
git add package-lock.json

echo === 3. Git commit ===
git commit -m "fix: rate limiting + Vercel Analytics/SpeedInsights eklendi"

echo === 4. Git push ===
git push origin main

echo.
echo === TAMAMLANDI! Vercel deploy basliyor... ===
echo.
pause
