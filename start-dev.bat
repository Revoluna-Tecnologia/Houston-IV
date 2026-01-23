@echo off
echo ========================================
echo  Houston IV - Iniciando Desenvolvimento
echo ========================================
echo.

echo [1/3] Iniciando PostgreSQL (Docker)...
docker compose up -d postgres
timeout /t 3 >nul

echo.
echo [2/3] Iniciando Backend (NestJS)...
start "Houston Backend" cmd /k "cd apps\api && pnpm dev"
timeout /t 5 >nul

echo.
echo [3/3] Iniciando Frontend (Next.js)...
start "Houston Frontend" cmd /k "cd apps\web && pnpm dev"

echo.
echo ========================================
echo  Servicos iniciados!
echo ========================================
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:3000
echo  Swagger:  http://localhost:3001/api/docs
echo ========================================
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul
start http://localhost:3000
