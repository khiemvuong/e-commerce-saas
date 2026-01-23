@echo off
REM Auto-start Docker Compose for E-Commerce SaaS
REM This script starts all Docker services automatically

echo ========================================
echo Starting E-Commerce SaaS Services
echo ========================================

REM Check if Docker Desktop is running
echo Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    REM Wait for Docker to start (max 60 seconds)
    set /a counter=0
    :wait_docker
    timeout /t 2 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        set /a counter+=1
        if %counter% lss 30 goto wait_docker
        echo ERROR: Docker failed to start after 60 seconds
        pause
        exit /b 1
    )
    echo Docker Desktop started successfully!
)

REM Navigate to project directory
cd /d "d:\ILAN Shop\e-commerce-saas"

REM Start Docker Compose services
echo.
echo Starting Docker Compose services...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! All services are running:
    echo ========================================
    docker-compose ps
    echo.
    echo Services available at:
    echo - MongoDB: localhost:27017
    echo - Redis: localhost:6379
    echo - Kafka: localhost:9092
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

REM Optional: Start NX dev servers (uncomment if needed)
REM echo.
REM echo Starting NX development servers...
REM start "Auth Service" cmd /k "npm run dev"
REM timeout /t 3 /nobreak >nul
REM start "User UI" cmd /k "npm run user-ui"

echo.
echo Setup complete! You can close this window.
REM Uncomment the line below to keep window open
REM pause
