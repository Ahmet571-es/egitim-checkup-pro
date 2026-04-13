@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set LOG=%~dp0qa-build-push.log
echo ============================================================ > "%LOG%"
echo QA FIX 7/7 — BUILD + COMMIT + PUSH >> "%LOG%"
echo Started: %DATE% %TIME% >> "%LOG%"
echo ============================================================ >> "%LOG%"

echo [1/4] npm run build ... >> "%LOG%"
echo ------------------------------------------------------------ >> "%LOG%"
call npm run build >> "%LOG%" 2>&1
set BUILD_ERR=%ERRORLEVEL%
echo ------------------------------------------------------------ >> "%LOG%"
echo npm run build exit code: %BUILD_ERR% >> "%LOG%"

if %BUILD_ERR% NEQ 0 (
  echo BUILD FAILED - commit/push skipped. >> "%LOG%"
  echo Finished: %DATE% %TIME% >> "%LOG%"
  exit /b 1
)

echo [2/4] git add . >> "%LOG%"
git add . >> "%LOG%" 2>&1

echo [3/4] git commit >> "%LOG%"
git commit -m "fix(qa): 7 QA düzeltmesi — karakter limiti, debounce, boşluk şifre, mobil, offline, RBAC sıkılaştırma, autosave" >> "%LOG%" 2>&1
set COMMIT_ERR=%ERRORLEVEL%
echo git commit exit code: %COMMIT_ERR% >> "%LOG%"

echo [4/4] git push origin main >> "%LOG%"
git push origin main >> "%LOG%" 2>&1
set PUSH_ERR=%ERRORLEVEL%
echo git push exit code: %PUSH_ERR% >> "%LOG%"

echo ============================================================ >> "%LOG%"
echo Finished: %DATE% %TIME% >> "%LOG%"
echo DONE >> "%LOG%"
exit /b 0
