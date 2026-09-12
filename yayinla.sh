#!/usr/bin/env bash
# etkinlig — vitrini ve yönetim panelini derleyip cPanel'e atılacak tek klasör üretir.
# Kullanım: bash yayinla.sh
cd "$(dirname "$0")" || exit 1
set -e

renk() { printf "\033[1;36m%s\033[0m\n" "$1"; }

renk "1/4 · Vitrin derleniyor"
npm run build >/dev/null
echo "  ✓ dist/"

renk "2/4 · Yönetim paneli derleniyor"
(cd admin-panel/web && npm run build >/dev/null)
echo "  ✓ admin-panel/web/dist/"

renk "3/4 · yayin/ klasörü hazırlanıyor"
rm -rf yayin
mkdir -p yayin/admin yayin/api
cp -R dist/. yayin/
cp -R admin-panel/web/dist/. yayin/admin/
cp admin-panel/api/index.php admin-panel/api/web.config yayin/api/
mkdir -p yayin/api/yuklemeler
# Sunucudaki mevcut görselleri ezmemek için yalnızca klasörü oluşturuyoruz.
[ -f public/web.config ] && cp public/web.config yayin/web.config
echo "  ✓ yayin/ hazır"

renk "4/4 · Özet"
echo "  yayin/            → public_html/etkinlig/"
echo "  yayin/admin/      → yönetim paneli"
echo "  yayin/api/        → PHP API (yuklemeler klasörünü SİLME, üzerine kopyala)"
echo
echo "  cPanel'de public_html/etkinlig/ içine yayin/ klasörünün İÇERİĞİNİ yükleyin."
echo "  Not: api/yuklemeler içindeki mevcut görseller korunmalı."
du -sh yayin 2>/dev/null | sed 's/^/  boyut: /'
