#!/bin/bash

# EduContest Platformasi uchun Deploy Script
# Bu script reverse proxy va barcha servislarni ishga tushiradi

set -e

echo "🚀 EduContest Platformasini Deploy Qilish"
echo "=========================================="

# Rangsiz chiqish
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funksiyalar
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 topilmadi. Iltimos, $1 o'rnating."
        exit 1
    fi
}

# Kerakli buyruqlarni tekshirish
log_info "Kerakli dasturlarni tekshirish..."
check_command docker
check_command docker-compose

# Docker holatini tekshirish
log_info "Docker daemon holatini tekshirish..."
if ! docker info &> /dev/null; then
    log_error "Docker daemon ishga tushmagan. Iltimos, Docker ni ishga tushiring."
    exit 1
fi

# Avvalgi containerlarni to'xtatish
log_info "Avvalgi containerlarni to'xtatish..."
docker-compose down 2>/dev/null || true

# Eski image'larni tozalash (ixtiyoriy)
if [ "$1" == "--clean" ]; then
    log_warn "Eski Docker image'larni tozalash..."
    docker system prune -f
fi

# Yangi image'larni build qilish va ishga tushirish
log_info "Docker image'larni build qilish va ishga tushirish..."
docker-compose up -d --build

# Containerlarni ishga tushganini kutish
log_info "Containerlarni ishga tushganini kutish..."
sleep 10

# Holatni tekshirish
log_info "Servislar holatini tekshirish..."
docker-compose ps

# Portlarni tekshirish
log_info "Portlarni tekshirish..."
if netstat -tuln | grep -q ":80\b"; then
    log_info "✅ Port 80 (HTTP) ochiq"
else
    log_warn "⚠️  Port 80 (HTTP) ochiq emas"
fi

if netstat -tuln | grep -q ":443\b"; then
    log_info "✅ Port 443 (HTTPS) ochiq"
else
    log_warn "⚠️  Port 443 (HTTPS) ochiq emas (SSL sozlanmagan)"
fi

# Health check
log_info "Health check..."
sleep 5

# Asosiy platforma
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
    log_info "✅ Asosiy platforma (port 8080) ishga tushgan"
else
    log_error "❌ Asosiy platforma (port 8080) ishlamayapti"
fi

# SAT platforma
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 | grep -q "200\|301\|302"; then
    log_info "✅ SAT platforma (port 8081) ishga tushgan"
else
    log_error "❌ SAT platforma (port 8081) ishlamayapti"
fi

# Nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    log_info "✅ Nginx reverse proxy (port 80) ishga tushgan"
else
    log_error "❌ Nginx reverse proxy (port 80) ishlamayapti"
fi

echo ""
log_info "🎉 Deploy muvaffaqiyatli yakunlandi!"
echo ""
echo "📱 Platformaga quyidagi manzillarda kirishingiz mumkin:"
echo "   - Asosiy platforma: http://localhost"
echo "   - Admin panel: http://localhost/admin"
echo "   - O'quvchi bo'limi: http://localhost/student"
echo "   - SAT bo'limi: http://localhost/sat"
echo ""
echo "🛑  To'xtatish uchun: docker-compose down"
echo "📊 Loglarni ko'rish uchun: docker-compose logs -f"
echo ""