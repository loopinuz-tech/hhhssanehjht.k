@echo off
chcp 65001 >nul
echo 🚀 EduContest Platformasini Deploy Qilish
echo ==========================================
echo.

set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set NC=[0m

echo [INFO] Docker mavjudligini tekshirish...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker topilmadi. Iltimos, Docker Desktop o'rnating.
    pause
    exit /b 1
)

echo [INFO] Docker Compose mavjudligini tekshirish...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose topilmadi. Iltimos, Docker Desktop o'rnating.
    pause
    exit /b 1
)

echo [INFO] Avvalgi containerlarni to'xtatish...
docker-compose down >nul 2>&1

echo [INFO] Docker image'larni build qilish va ishga tushirish...
docker-compose up -d --build

echo [INFO] Containerlarni ishga tushganini kutish...
timeout /t 10 /nobreak >nul

echo [INFO] Servislar holatini tekshirish...
docker-compose ps

echo.
echo [INFO] Health check...
timeout /t 5 /nobreak >nul

REM Asosiy platforma
curl -s -o nul -w "%%{http_code}" http://localhost:8080 | findstr /r "200 301 302" >nul
if not errorlevel 1 (
    echo ✅ Asosiy platforma (port 8080) ishga tushgan
) else (
    echo ❌ Asosiy platforma (port 8080) ishlamayapti
)

REM SAT platforma
curl -s -o nul -w "%%{http_code}" http://localhost:8081 | findstr /r "200 301 302" >nul
if not errorlevel 1 (
    echo ✅ SAT platforma (port 8081) ishga tushgan
) else (
    echo ❌ SAT platforma (port 8081) ishlamayapti
)

REM Nginx
curl -s -o nul -w "%%{http_code}" http://localhost | findstr /r "200 301 302" >nul
if not errorlevel 1 (
    echo ✅ Nginx reverse proxy (port 80) ishga tushgan
) else (
    echo ❌ Nginx reverse proxy (port 80) ishlamayapti
)

echo.
echo 🎉 Deploy muvaffaqiyatli yakunlandi!
echo.
echo 📱 Platformaga quyidagi manzillarda kirishingiz mumkin:
echo    - Asosiy platforma: http://localhost
echo    - Admin panel: http://localhost/admin
echo    - O'quvchi bo'limi: http://localhost/student
echo    - SAT bo'limi: http://localhost/sat
echo.
echo 🛑  To'xtatish uchun: docker-compose down
echo 📊 Loglarni ko'rish uchun: docker-compose logs -f
echo.
pause