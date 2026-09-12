# etkinlig — admin panel

Etkinlik yönetim platformunun yönetici arayüzü. Vue 3 (MVVM) + Node/Express API + MySQL.

```
etkinlig/
├── db/            01_schema.sql, 02_seed.sql
├── server/        Express + mysql2 API
└── web/           Vue 3 + Vite admin panel
```

## Kurulum

**1. Veritabanı** — lokalde `etkinlig` database'i zaten var, sadece şemayı yükle:

```bash
mysql -u root -p etkinlig < db/01_schema.sql
mysql -u root -p etkinlig < db/02_seed.sql
```

veya API'nin script'iyle (aynı işi yapar, `.env`'deki bağlantıyı kullanır):

```bash
cd server && cp .env.example .env   # DB_USER / DB_PASSWORD'ü doldur
npm install && npm run db:setup
```

**2. API**

`.env` içinde `JWT_SECRET` doldurulmalı (oturum çerezi bununla imzalanır):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
cd server && npm run dev     # http://localhost:4000/api
```

**3. Arayüz**

```bash
cd web && npm install && npm run dev   # http://localhost:5173
```

Vite `/api` isteklerini 4000'e proxy'ler, ayrıca CORS ayarı gerekmez.

**4. Giriş**

Seed dört hesap açar, hepsinin parolası **Admin1234!** — ilk girişten sonra sol alttaki
hesap menüsünden değiştirin.

| Hesap | Rol | Görebildiği |
|---|---|---|
| `admin@etkinlig.local` | Genel yönetici | Tüm şirketler, tüm başvurular, hesap açma |
| `deniz@technobridge.com.tr` | Şirket yöneticisi | Yalnızca TechnoBridge |
| `selin@papara.com` | Şirket yöneticisi | Yalnızca Papara |
| `kaan@aselsan.com.tr` | Şirket yöneticisi | Yalnızca ASELSAN |

Seed'i yüklemeden (yani `kullanicilar` tablosu boşken) açarsanız giriş ekranı kendini
kurulum ekranına çevirir ve ilk yönetici hesabını orada açarsınız. Bu uç, sistemde
kullanıcı olduğu anda kapanır.

## Veri modeli

| Tablo | İçerik |
|---|---|
| `etkinlikler` | başlık, açıklama, tür (konferans/sunum/hackathon), şirket, şehir, ilçe, adres, başlangıç/bitiş, son başvuru, kontenjan, durum, yayın ayarları |
| `etkinlik_siniflari` | ön katılım şartı: hangi sınıflar (0 hazırlık … 5 mezun) |
| `etkinlik_bolumleri` | ön katılım şartı: hangi bölümler (n-n) |
| `sirketler`, `sehirler`, `bolumler` | tanım tabloları |
| `ogrenciler`, `basvurular` | başvuru akışı |
| `kullanicilar` | panel hesapları: ad, e-posta, bcrypt hash, rol (`admin`/`moderator`), aktiflik, son giriş |
| `v_etkinlik_ozet` | liste ekranının okuduğu görünüm |

Öğrenim düzeyi, asgari ortalama ve öğrenci belgesi zorunluluğu `etkinlikler` üzerinde tekil alanlar; sınıf ve bölüm çoklu olduğu için ayrı tablolarda.

## API

| Uç | Açıklama |
|---|---|
| `GET /api/etkinlikler` | `arama, tur, durum, sehirId, sirketId, siralama, yon, sayfa, limit` |
| `GET /api/etkinlikler/:id` | şartlar ve ayarlar dahil detay |
| `GET /api/etkinlikler/:id/katilimcilar.xlsx` | etkinliğin katılımcı listesi, Excel |
| `POST /api/etkinlikler` | oluştur (kod otomatik: `ETK-2026-0001`) |
| `PUT /api/etkinlikler/:id` | güncelle |
| `PATCH /api/etkinlikler/:id/durum` | taslak ↔ yayında |
| `DELETE /api/etkinlikler/:id` | sil |
| `GET /api/basvurular` | `etkinlikId, durum, sinif` |
| `PATCH /api/basvurular/:id/durum` | onayla / reddet |
| `GET /api/tanimlar` | şehir, bölüm, şirket + enum listeleri (tek çağrı) |
| `POST /api/tanimlar/sirketler` \| `/bolumler` | yeni tanım ekle |
| `GET /api/istatistik/panel` | panel ekranının tüm verisi |

**Oturum ve hesaplar**

| Uç | Yetki | Açıklama |
|---|---|---|
| `GET /api/oturum/durum` | açık | ilk kurulum gerekli mi |
| `POST /api/oturum/kurulum` | açık* | ilk yöneticiyi oluşturur (*yalnızca hiç kullanıcı yokken) |
| `POST /api/oturum/giris` | açık | çerezi yazar |
| `POST /api/oturum/cikis` | açık | çerezi siler |
| `GET /api/oturum/ben` | oturum | oturumdaki kullanıcı |
| `POST /api/oturum/parola` | oturum | kendi parolasını değiştirir |
| `GET/POST /api/kullanicilar` | admin | hesapları listeler / yeni hesap açar |
| `PATCH /api/kullanicilar/:id` | admin | rol veya aktiflik |
| `PATCH /api/kullanicilar/:id/parola` | admin | parola sıfırlama |
| `DELETE /api/kullanicilar/:id` | admin | hesabı siler |

`/api/oturum` ve `/api/saglik` dışındaki tüm uçlar oturum ister; `/api/kullanicilar` ayrıca `admin` rolü ister.

Cevap zarfı her yerde aynı: başarı `{ data, meta? }`, hata `{ error: { code, message, details? } }`.
Hata kodları: `gecersiz_istek`, `kimlik_hatasi`, `yetki_yok`, `hesap_pasif`, `bulunamadi`, `cakisma`, `sunucu_hatasi`.

## Vitrin (öğrenci tarafı)

Kökteki React uygulaması (`~/etkinlig`, port 5173) artık sabit veri yerine API'den besleniyor.
Panelde **Yayınla** denen etkinlik anında orada görünür.

- `GET /api/acik/etkinlikler` — yalnızca `durum='yayinda'` kayıtlar; arama, tür ve şehir filtresi
- `GET /api/acik/etkinlikler/:id` — açıklama, ön katılım şartları, adres
- `GET /api/acik/filtreler` — yalnızca yayında etkinliği olan şehir ve türler

Bu uçlar oturum istemez ama dar tutulur: taslak/iptal etkinlikler, iletişim e-postası,
oluşturan kullanıcı ve başvuran öğrenci bilgileri buradan **asla** dönmez. Vitrin
`vite.config.js` üzerinden `/api` ve `/yuklemeler` isteklerini 4000'e proxy'ler.

Eski kayıt formu silinmedi: `src/KayitFormu.jsx` olarak duruyor, vitrinin sağ üstündeki
"Kayıt ol" düğmesiyle açılıyor. Eski sürümler `src/App.jsx.yedek` ve `src/KayitFormu.css`'te.

## Görseller

`POST /api/gorseller` (oturum gerekli) — form alanı `gorsel`. PNG, JPG veya WEBP, en fazla 2 MB.
Dosya adı istemciden alınmaz: rastgele ad + izinli uzantı üretilir, `server/uploads/` altına yazılır
ve `/yuklemeler/<ad>` yolundan servis edilir. Yol kaçışı, üzerine yazma ve `.svg` gibi
script taşıyabilen türler bu yüzden mümkün değil.

Panelde etkinlik formunun sağ sütununda sürükle-bırak alanı var; yüklenen görsel etkinlik
detayında ve vitrindeki kartta kapak olarak çıkar. Görseli olmayan etkinlik, türüne göre
renkli bir yedek blokla gösterilir.

## Şirket kapsamı (çok kiracılılık)

İki rol var:

- **`admin` — genel yönetici.** Şirkete bağlı değildir; tüm şirketlerin etkinliklerini ve
  başvurularını görür, şirket ve hesap açar.
- **`sirket_admin` — şirket yöneticisi.** Bir şirkete bağlıdır. Kendi şirketi adına etkinlik
  açar/düzenler, kendi başvurularını onaylar, kendi etkinliklerinin Excel raporunu indirir.
  Başka şirketin hiçbir kaydını göremez.

Kapsam tek dosyada toplanır: `server/src/core/kapsam.js`. Her liste sorgusu `filtreyiDarslat`,
her yazma `govdeyiDarslat`, her tekil kayıt `kaydaErisimDogrula` üzerinden geçer — kural
modüllere dağılmadığı için bir uç eklerken kapsamı unutmak zorlaşır.

İki davranış bilinçli:

- Kapsam dışındaki bir kayıt **404** döner, 403 değil. Aksi halde başka şirketin hangi
  id'lerinin var olduğu dışarıdan sayılabilirdi.
- Şirket admini `?sirketId=` ile başka bir şirketi sorgularsa istek **403** ile reddedilir;
  sessizce kendi şirketine döndürülmez — filtrenin çalıştığı yanılgısı yaratmasın.
- Oturumdaki kullanıcı her istekte veritabanından tazelenir, jetondan okunmaz: rolü veya
  şirketi değiştirilen bir hesap eski jetonuyla eski yetkisini kullanamaz.

## Excel raporu

`GET /api/etkinlikler/:id/katilimcilar.xlsx` — etkinlik özelinde katılımcı listesi.
Başlık bloğunda etkinlik adı, şirket, kod, tarih/yer ve başvuru sayıları; altında 13 sütunluk
filtrelenebilir tablo (ad soyad, e-posta, öğrenci no, üniversite, bölüm, düzey, sınıf, ortalama,
başvuru tarihi, durum, karar tarihi, not). Durumlar Türkçeleştirilir ve renklenir; satırlar
onaylı → yedek → beklemede → reddedildi sırasıyla gelir.

Ucu şirket admini de çağırabilir ama yalnızca kendi etkinlikleri için — kapsam kontrolü
dosya üretilmeden önce çalışır. Arayüzde hem etkinlik detayında hem liste satırlarında düğme var.

## Güvenlik notları

- Parolalar bcrypt (cost 10) ile saklanır; hash hiçbir cevapta dışarı çıkmaz.
- Oturum, `httpOnly` + `sameSite=lax` çerezde taşınan JWT ile tutulur; `NODE_ENV=production`
  iken `secure` bayrağı açılır ve `JWT_SECRET` 32 karakterden kısaysa API açılmaz.
- Girişte kullanıcı bulunamasa bile bcrypt karşılaştırması yapılır — "bu e-posta kayıtlı mı"
  sorusu yanıt süresinden okunamaz.
- Son aktif genel yönetici pasifleştirilemez, rolü düşürülemez ve silinemez; kimse kendi
  hesabını silemez veya devre dışı bırakamaz.
- Şirket silinince ona bağlı hesaplar da silinir (`ON DELETE CASCADE`); şemadaki `CHECK`
  kısıtı sayesinde şirketsiz bir `sirket_admin` veya şirkete bağlı bir `admin` satırı
  veritabanına hiç giremez.

## Mimari

**API — katmanlar**

```
routes      → HTTP + zod doğrulama          (etkinlik.routes.js)
service     → iş kuralları + DTO dönüşümü   (etkinlik.service.js)
repository  → SQL                           (etkinlik.repository.js)
core/http   → tek hata tipi, asyncHandler, cevap zarfı
db/pool     → havuz + withTransaction
```

Tekrarı kesen yerler: `asyncHandler` (her controller'da try/catch yok), `withTransaction`
(commit/rollback tek yerde), `kosullar()` (liste ve sayım aynı WHERE'i paylaşır),
`alanlar()` (INSERT ve UPDATE aynı kolon haritasından üretilir), `errorHandler`
(MySQL hata kodları tek yerde Türkçeye çevrilir).

**Arayüz — MVVM**

```
views/         View: yalnızca şablon ve stil
viewmodels/    ViewModel: state, doğrulama, komutlar (useEtkinlikListesi, useEtkinlikForm, …)
services/      Model: API sözleşmesi (http.js tek istek kapısı)
stores/        paylaşılan tanım listeleri (Pinia)
components/ui  tasarım sisteminin kod karşılığı
assets/tokens.css  renk / tipografi değişkenleri — tek kaynak
```

View içinde `fetch` veya iş kuralı yok; her ekran kendi ViewModel'ini çağırır.
`useAsyncKaynak` yükleniyor/hata/veri üçlüsünü tek yerde tutar, `FormAlani`,
`AppRozet`, `DurumMesaji` gibi bileşenler her ekranda aynı davranışı verir.

## Notlar

- `02_seed.sql` içindeki şirket, etkinlik ve öğrenci kayıtları örnek veridir; gerçek veri değildir.
- Parola sıfırlama e-postası yok — yönetici, Kullanıcılar ekranından doğrudan yeni parola atar.
- Vitrindeki "Başvur" düğmesi henüz bağlı değil; öğrenci kaydı ve başvuru akışı yazılmadı.
- Silinen etkinliğin görseli `server/uploads/` içinde kalır; artık kullanılmayan dosyaları
  temizleyen bir iş yok.
