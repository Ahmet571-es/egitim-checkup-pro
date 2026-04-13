@echo off
chcp 65001 >nul
echo ========================================
echo  Git Tamamen Sifirla ve Temiz Push
echo  Tum dosyalar korunur, .git sifirlanir
echo ========================================
echo.

cd /d "%~dp0"

echo [1/8] Sorunlu dosyalar siliniyor...
del /f /q egitim_checkup_8faz_update.py 2>nul
del /f /q egitim_checkup_8faz.py 2>nul
del /f /q git_clean_secrets.bat 2>nul
del /f /q git_clean_secrets.ps1 2>nul
del /f /q git_clean_v2.bat 2>nul
echo   Tamam.
echo.

echo [2/8] .gitignore guncelleniyor...
findstr /C:"egitim_checkup_8faz" .gitignore >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.>> .gitignore
    echo egitim_checkup_8faz_update.py>> .gitignore
    echo egitim_checkup_8faz.py>> .gitignore
)
echo   Tamam.
echo.

echo [3/8] Eski .git klasoru siliniyor...
rmdir /s /q .git
echo   Tamam.
echo.

echo [4/8] Yeni git repo baslatiliyor...
git init
echo   Tamam.
echo.

echo [5/8] Main branch ayarlaniyor...
git branch -m main
echo   Tamam.
echo.

echo [6/8] Remote ekleniyor...
git remote add origin https://github.com/Ahmet571-es/egitim-checkup-pro.git
echo   Tamam.
echo.

echo [7/8] Tum dosyalar commit ediliyor...
git add -A
git commit -m "feat: egitim-checkup-pro - tum fazlar dahil (temiz gecmis)"
echo   Tamam.
echo.

echo [8/8] Force push yapiliyor...
git push origin main --force
if %ERRORLEVEL% neq 0 (
    echo.
    echo HATA: Push basarisiz!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BASARILI! Temiz repo ile push yapildi.
echo ========================================

del /f /q "%~f0" 2>nul
pause
