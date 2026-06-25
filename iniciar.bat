@echo off
echo ================================================
echo  PrintHub3D — Iniciando sistema...
echo ================================================
echo.

REM ── Verificar MySQL ──────────────────────────────────────────────────────────
echo [1/3] Verificando MySQL...
sc query MySQL80 >nul 2>&1 && (
  echo      MySQL80 detectado. OK
  goto :mysql_ok
)
sc query MySQL >nul 2>&1 && (
  echo      MySQL detectado. OK
  goto :mysql_ok
)
echo.
echo  AVISO: Servico MySQL nao encontrado!
echo  Abra o XAMPP Control Panel e clique START no MySQL antes de continuar.
echo.
pause
:mysql_ok

REM ── Backend ──────────────────────────────────────────────────────────────────
echo.
echo [2/3] Iniciando Backend (porta 3001)...
start "PrintHub3D - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo      Aguardando backend inicializar (5s)...
timeout /t 5 /nobreak >nul

REM ── Frontend ─────────────────────────────────────────────────────────────────
echo.
echo [3/3] Iniciando Frontend (porta 5173)...
start "PrintHub3D - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================
echo  SISTEMA INICIADO!
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3001
echo.
echo  Mantenha as duas janelas abertas.
echo  Fechar uma janela encerra aquele servico.
echo ================================================
echo.
echo  Contas de teste:
echo  Cliente:  cliente@printhub3d.com  /  client123
echo  Maker:    maker1@printhub3d.com   /  maker123
echo  Admin:    admin@printhub3d.com    /  admin123
echo.
pause
