@echo off
setlocal

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [OpenFront] npm est introuvable. Installe Node.js puis reessaie.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [OpenFront] Dependances absentes. Installation en cours...
  call npm run inst
  if errorlevel 1 (
    echo [OpenFront] Echec de l'installation des dependances.
    pause
    exit /b 1
  )
)

set "LAN_IP="
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "LAN_IP=%%i"

echo [OpenFront] Demarrage du jeu en mode PUBLIC (sans configuration admin)...
if defined LAN_IP (
  echo [OpenFront] Local:  http://localhost:9000
  echo [OpenFront] LAN:    http://%LAN_IP%:9000
  echo [OpenFront] Public: une URL https://*.trycloudflare.com (ou https://*.loca.lt) sera affichee dans la console.
) else (
  echo [OpenFront] IP LAN non detectee automatiquement.
  echo [OpenFront] Public: une URL https://*.trycloudflare.com (ou https://*.loca.lt) sera affichee dans la console.
)
call npm run dev:public

echo [OpenFront] Le serveur s'est arrete.
pause
