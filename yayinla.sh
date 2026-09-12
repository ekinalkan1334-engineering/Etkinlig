#!/usr/bin/env bash
# etkinlig — derle, paketle. Çıktı: etkinlig-yayin.zip (cPanel'e yüklenecek tek dosya)
cd "$(dirname "$0")" || exit 1
set -e

renk() { printf "\033[1;36m%s\033[0m\n" "$1"; }

renk "1/4 · Vitrin derleniyor"
npm run build >/dev/null
echo "  ✓"

renk "2/4 · Yönetim paneli derleniyor"
(cd admin-panel/web && npm run build >/dev/null)
echo "  ✓"

renk "3/4 · Paket hazırlanıyor"
rm -rf yayin
mkdir -p yayin/admin yayin/api
cp -R dist/. yayin/
cp -R admin-panel/web/dist/. yayin/admin/
cp admin-panel/api/index.php admin-panel/api/web.config admin-panel/api/.htaccess yayin/api/
# Yükleme klasörü: yalnızca koruma dosyası paketlenir, içindeki kullanıcı dosyalarına dokunulmaz.
mkdir -p yayin/api/yuklemeler
cp admin-panel/api/yuklemeler/.htaccess yayin/api/yuklemeler/
[ -f public/web.config ] && cp public/web.config yayin/web.config
# yuklemeler klasörü PAKETE KONMAZ — sunucudaki dosyalar (görseller, CV'ler) kazara silinmesin.
echo "  ✓ yayin/"

renk "4/4 · Zip"
rm -f etkinlig-yayin.zip
TMP="${TMPDIR:-/tmp}/etkinlig-yayin-$$.zip"
(cd yayin && zip -qr "$TMP" .)
mv "$TMP" etkinlig-yayin.zip
echo "  ✓ etkinlig-yayin.zip ($(du -h etkinlig-yayin.zip | cut -f1))"

echo
echo "  Şimdi: cPanel → public_html/ → Upload → etkinlig-yayin.zip → Extract"
echo "  api/yuklemeler klasörüne dokunma; pakette yok, sunucudaki dosyalar korunur."
