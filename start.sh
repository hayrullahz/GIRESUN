#!/bin/bash
# ==============================================================================
# 🏔️ ISOMETRIC GIRESUN — macOS Çift Tıklanabilir Başlatma Betiği
# Port Kontrollü Otomatik Başlatıcı
# ==============================================================================

# Scriptin bulunduğu dizine geç (Finder'dan çift tıklandığında doğru dizini bulur)
cd "$(dirname "$0")" || exit 1

PORT=5173
HOST="localhost"
URL="http://${HOST}:${PORT}/"

# Renk tanımları
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_BLUE="\033[34m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_CYAN="\033[36m"

echo -e "${C_CYAN}${C_BOLD}"
echo "========================================================"
echo "    🏔️  ISOMETRIC GIRESUN (İzometrik Giresun 3B)       "
echo "========================================================"
echo -e "${C_RESET}"

# 1. PORT KONTROLÜ
echo -e "${C_BLUE}🔍 [1/4] Port ${PORT} kontrol ediliyor...${C_RESET}"
PID=$(lsof -ti :${PORT} 2>/dev/null)

if [ -n "$PID" ]; then
    PROC_NAME=$(ps -p "$PID" -o comm= 2>/dev/null)
    echo -e "${C_YELLOW}⚠️  Port ${PORT} zaten kullanımda! (PID: ${PID}, Süreç: ${PROC_NAME})${C_RESET}"
    echo -e "${C_YELLOW}🔄 Eski süreç sonlandırılıyor ve port temizleniyor...${C_RESET}"
    
    # Süreci nazikçe sonlandır, gerekirse zorla kapat
    kill -15 "$PID" 2>/dev/null
    sleep 1
    if kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
    fi
    echo -e "${C_GREEN}✅ Port ${PORT} başarıyla serbest bırakıldı.${C_RESET}"
else
    echo -e "${C_GREEN}✅ Port ${PORT} müsait.${C_RESET}"
fi

# 2. BAĞIMLILIK KONTROLÜ
echo -e "${C_BLUE}📦 [2/4] Bağımlılıklar (node_modules) kontrol ediliyor...${C_RESET}"
if [ ! -d "node_modules" ]; then
    echo -e "${C_YELLOW}⚠️  node_modules bulunamadı! 'npm install' çalıştırılıyor...${C_RESET}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${C_RED}❌ npm install başarısız oldu! Lütfen internet bağlantınızı ve Node.js kurulumunuzu kontrol edin.${C_RESET}"
        read -p "Çıkmak için Enter'a basın..."
        exit 1
    fi
    echo -e "${C_GREEN}✅ Bağımlılıklar yüklendi.${C_RESET}"
else
    echo -e "${C_GREEN}✅ Bağımlılıklar hazır.${C_RESET}"
fi

# 3. TARAYICIYI AÇ
echo -e "${C_BLUE}🌐 [3/4] Tarayıcı hazırlanıyor: ${URL}${C_RESET}"
(sleep 2 && open "${URL}" 2>/dev/null || xdg-open "${URL}" 2>/dev/null) &

# 4. VITE DEV SUNUCUSUNU BAŞLAT
echo -e "${C_GREEN}${C_BOLD}🚀 [4/4] İzometrik Giresun Sunucusu Başlatılıyor...${C_RESET}"
echo -e "${C_CYAN}👉 Adres: ${URL}${C_RESET}"
echo -e "${C_YELLOW}Durdurmak için pencereyi kapatabilir veya [CTRL + C] yapabilirsiniz.${C_RESET}"
echo ""

# Ctrl+C ile çıkış yapıldığında temizle
trap 'echo -e "\n${C_RED}🛑 Sunucu kapatıldı.${C_RESET}"; exit 0' INT TERM

npm run dev -- --port ${PORT} --host
