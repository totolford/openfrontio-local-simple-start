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

echo [OpenFront] Demarrage du jeu en mode LAN...
if defined LAN_IP (
  echo [OpenFront] Toi:    http://localhost:9000
  echo [OpenFront] Ami(s): http://%LAN_IP%:9000
  echo [OpenFront] Ouvre le jeu via l'adresse LAN pour partager un lien d'invitation correct.
) else (
  echo [OpenFront] IP LAN non detectee automatiquement. Utilise l'IP locale de ton PC.
)
call npm run dev:lan

echo [OpenFront] Le serveur s'est arrete.
pause
