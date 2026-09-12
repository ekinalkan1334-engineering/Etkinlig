#!/usr/bin/env bash
# etkinlig admin panel — kur ve localhost'ta çalıştır
cd "$(dirname "$0")" || exit 1

renk() { printf "\033[1;36m%s\033[0m\n" "$1"; }
hata() { printf "\033[1;31m%s\033[0m\n" "$1"; }

renk "1/4 · Bağımlılıklar"
(cd server && npm install --silent) || { hata "server npm install başarısız"; exit 1; }
(cd web && npm install --silent)    || { hata "web npm install başarısız"; exit 1; }
echo "  ✓ tamam"

renk "2/4 · MySQL 127.0.0.1:3306"
# nc her makinede yok; node ile dene
node -e '
const net=require("net"),s=net.connect({host:"127.0.0.1",port:3306});
s.setTimeout(2500);
s.on("connect",()=>{s.destroy();process.exit(0)});
s.on("error",e=>{console.error("  "+e.code);process.exit(1)});
s.on("timeout",()=>{console.error("  zaman aşımı");s.destroy();process.exit(1)});
'
if [ $? -ne 0 ]; then
  hata "  MySQL'e bağlanılamadı."
  echo "  Workbench'ten başlatın ya da:"
  echo "    sudo /usr/local/mysql/support-files/mysql.server start"
  echo "  Sonra bu betiği tekrar çalıştırın."
  exit 1
fi
echo "  ✓ ayakta"

renk "3/4 · Şema ve örnek veri"
echo "  ! Bu adım etkinlig veritabanındaki tabloları SIFIRLAR."
printf "  Yüklensin mi? (e/H) "
read -r yanit
case "$yanit" in
  e|E)
    (cd server && npm run --silent db:setup) || { hata "  db:setup başarısız — yukarıdaki hataya bakın"; exit 1; }
    ;;
  *) echo "  atlandı" ;;
esac

renk "4/4 · Sunucular"
mkdir -p .loglar
pkill -f 'node --watch src/server.js' 2>/dev/null
pkill -f 'admin-panel/web.*vite' 2>/dev/null
(cd server && nohup npm run dev > ../.loglar/api.log 2>&1 &)
(cd web    && nohup npm run dev > ../.loglar/web.log 2>&1 &)

sleep 5
if node -e 'fetch("http://localhost:4000/api/saglik").then(r=>r.json()).then(j=>{console.log("  API:",JSON.stringify(j.data));process.exit(j.data.db?0:1)}).catch(e=>{console.error("  API yanıt vermedi");process.exit(1)})'; then
  echo "  ✓ API ve veritabanı çalışıyor"
else
  hata "  API sorunlu — .loglar/api.log dosyasına bakın"
fi

echo
echo "  Panel → http://localhost:5174     (vitrin 5173'te ayrı çalışır)"
echo "  Giriş → admin@etkinlig.local / Admin1234!"
echo
echo "  Loglar: admin-panel/.loglar/"
echo "  Durdur: pkill -f 'node --watch src/server.js'; pkill -f vite"
