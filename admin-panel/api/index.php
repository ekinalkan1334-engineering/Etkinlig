<?php
/**
 * etkinlig — Tek Dosya PHP API Köprüsü
 * Plesk / IIS / Apache / Nginx uyumlu, PHP 8.0+
 */
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

// CORS ve JSON Başlıkları
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Veritabanı Yapılandırması
const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_NAME = 'musta282_etkinlig_db';
const DB_USER = 'musta282_etkinlig_user';
const DB_PASS = 'euudxW0%4p1J@qOd';
const JWT_SECRET = '4fc366e3d1fd67219c72a1f212d771a8753f0956e06b8c4b37976f2caba57633cb2cd6e84affb471c36b5551936546d3';
const CEREZ_ADI = 'etkinlig_oturum';

// Yardımcı Fonksiyonlar
function hataDondur(int $status, string $kod, string $mesaj, $detay = null): void {
    http_response_code($status);
    echo json_encode([
        'error' => [
            'code' => $kod,
            'message' => $mesaj,
            'details' => $detay
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function basariDondur($data, $meta = null, int $status = 200): void {
    http_response_code($status);
    $cevap = ['data' => $data];
    if ($meta !== null) $cevap['meta'] = $meta;
    echo json_encode($cevap, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    hataDondur(503, 'veritabani_baglanti_hatasi', 'Veritabanına bağlanılamadı: ' . $e->getMessage());
}

set_exception_handler(function(Throwable $e) {
    hataDondur(500, 'sunucu_hatasi', $e->getMessage(), [
        'dosya' => basename($e->getFile()),
        'satir' => $e->getLine()
    ]);
});

// Otomatik şema uyumluluğu
try {
    $col = $pdo->query("SHOW COLUMNS FROM kullanicilar LIKE 'sirket_id'")->fetch();
    if (!$col) {
        $pdo->exec("ALTER TABLE kullanicilar ADD COLUMN sirket_id INT UNSIGNED NULL DEFAULT NULL");
    }
} catch (Throwable $e) {}

try {
    $pdo->exec("ALTER TABLE kullanicilar MODIFY COLUMN rol VARCHAR(32) NOT NULL DEFAULT 'moderator'");
} catch (Throwable $e) {}

// Şirket yöneticilerini otomatik tohumla (seed)
try {
    $ornekler = [
        ['ad_soyad' => 'Deniz Aksoy',    'eposta' => 'deniz@technobridge.com.tr', 'sirket_id' => 1],
        ['ad_soyad' => 'Selin Korkmaz',  'eposta' => 'selin@papara.com',         'sirket_id' => 2],
        ['ad_soyad' => 'Kaan Erdem',     'eposta' => 'kaan@aselsan.com.tr',       'sirket_id' => 3],
        ['ad_soyad' => 'Yıldız Yönetici','eposta' => 'yildiz@yildiztek.com.tr',   'sirket_id' => 4],
        ['ad_soyad' => 'STM Yönetici',   'eposta' => 'stm@stm.com.tr',            'sirket_id' => 5],
        ['ad_soyad' => 'Trendyol Yönetici','eposta' => 'trendyol@trendyol.com',  'sirket_id' => 6],
    ];
    $varsayilanHash = '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS'; // Admin1234!
    $stmtVar = $pdo->prepare('SELECT id FROM kullanicilar WHERE eposta = ?');
    $stmtEkle = $pdo->prepare('INSERT INTO kullanicilar (ad_soyad, eposta, parola_hash, rol, sirket_id, aktif) VALUES (?, ?, ?, ?, ?, 1)');
    foreach ($ornekler as $o) {
        $stmtVar->execute([$o['eposta']]);
        if (!$stmtVar->fetch()) {
            $stmtEkle->execute([$o['ad_soyad'], $o['eposta'], $varsayilanHash, 'sirket_admin', $o['sirket_id']]);
        }
    }
} catch (Throwable $e) {}

function b64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwtUret(array $kullanici): string {
    $payload = [
        'sub' => (int)$kullanici['id'],
        'rol' => $kullanici['rol'],
        'sirketId' => $kullanici['sirketId'] ?? null,
        'exp' => time() + (8 * 3600)
    ];
    $h = b64UrlEncode((string)json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $b = b64UrlEncode((string)json_encode($payload));
    $s = b64UrlEncode(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
    return "$h.$b.$s";
}

function jwtCoz(?string $jeton): ?array {
    if (!$jeton) return null;
    $p = explode('.', $jeton);
    if (count($p) !== 3) return null;
    [$h, $b, $s] = $p;
    $dogru = b64UrlEncode(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
    if (!hash_equals($dogru, $s)) return null;
    $data = json_decode(b64UrlDecode($b), true);
    if (!$data || ($data['exp'] ?? 0) < time()) return null;
    return $data;
}

function kullaniciCevir(array $r): array {
    return [
        'id' => (int)$r['id'],
        'adSoyad' => $r['ad_soyad'],
        'eposta' => $r['eposta'],
        'rol' => $r['rol'],
        'sirketId' => isset($r['sirket_id']) && $r['sirket_id'] !== null ? (int)$r['sirket_id'] : null,
        'sirketAdi' => $r['sirket_adi'] ?? null,
        'aktif' => (bool)$r['aktif'],
        'sonGiris' => $r['son_giris'] ?? null,
        'olusturuldu' => $r['olusturuldu'] ?? null,
    ];
}

function istekKullanicisi(PDO $pdo): ?array {
    $jeton = $_COOKIE[CEREZ_ADI] ?? null;
    if (!$jeton) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if (!$auth && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }
        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
            $jeton = $m[1];
        }
    }
    $veri = jwtCoz($jeton);
    if (!$veri) return null;
    $stmt = $pdo->prepare('
        SELECT k.id, k.ad_soyad, k.eposta, k.rol, k.sirket_id, k.aktif, k.son_giris, k.olusturuldu,
               s.ad AS sirket_adi
        FROM kullanicilar k
        LEFT JOIN sirketler s ON s.id = k.sirket_id
        WHERE k.id = ?
    ');
    $stmt->execute([(int)$veri['sub']]);
    $u = $stmt->fetch();
    return $u ? kullaniciCevir($u) : null;
}

function girisZorunlu(PDO $pdo): array {
    $u = istekKullanicisi($pdo);
    if (!$u) hataDondur(401, 'kimlik_hatasi', 'Bu işlem için giriş yapmalısınız');
    if (!$u['aktif']) hataDondur(403, 'hesap_pasif', 'Bu hesap devre dışı bırakılmış');
    return $u;
}

// JSON İstek Gövdesini Oku
$girdi = json_decode(file_get_contents('php://input'), true) ?? [];

// Rota Çözümleme
$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$rawPath = parse_url($rawUri, PHP_URL_PATH) ?? '/';
$clean = preg_replace('#^/(etkinlig/)?api(/index\.php)?#i', '', $rawPath);
$uri = '/' . trim($clean, '/');
$method = $_SERVER['REQUEST_METHOD'];

// ================= ROTALAR =================

// 1. Sağlık Kontrolü & API Kök
if ($method === 'GET' && ($uri === '/' || $uri === '/saglik')) {
    basariDondur([
        'api' => true,
        'db' => true,
        'durum' => 'Etkinlig API Aktif',
        'zaman' => date('Y-m-d H:i:s')
    ]);
}

// 2. Oturum Durumu (Kurulum Gerekli mi?)
if ($method === 'GET' && $uri === '/oturum/durum') {
    $stmt = $pdo->query('SELECT COUNT(*) as sayi FROM kullanicilar');
    $sayi = (int)$stmt->fetchColumn();
    basariDondur(['kurulumGerekli' => ($sayi === 0)]);
}

// 3. Giriş Yap
if ($method === 'POST' && $uri === '/oturum/giris') {
    $eposta = trim((string)($girdi['eposta'] ?? ''));
    $parola = (string)($girdi['parola'] ?? '');
    
    $stmt = $pdo->prepare('
        SELECT k.id, k.ad_soyad, k.eposta, k.parola_hash, k.rol, k.sirket_id, k.aktif, k.son_giris, k.olusturuldu,
               s.ad AS sirket_adi
        FROM kullanicilar k
        LEFT JOIN sirketler s ON s.id = k.sirket_id
        WHERE k.eposta = ?
    ');
    $stmt->execute([$eposta]);
    $u = $stmt->fetch();
    
    if (!$u || !password_verify($parola, $u['parola_hash'])) {
        hataDondur(401, 'kimlik_hatasi', 'E-posta veya parola hatalı');
    }
    if (!$u['aktif']) {
        hataDondur(403, 'hesap_pasif', 'Bu hesap devre dışı bırakılmış');
    }
    
    $pdo->prepare('UPDATE kullanicilar SET son_giris = NOW() WHERE id = ?')->execute([(int)$u['id']]);
    $kullanici = kullaniciCevir($u);
    $jeton = jwtUret($kullanici);
    
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    setcookie(CEREZ_ADI, $jeton, [
        'expires' => time() + (8 * 3600),
        'path' => '/',
        'httponly' => true,
        'secure' => $isHttps,
        'samesite' => 'Lax'
    ]);
    
    basariDondur($kullanici);
}

// 4. Ben (Oturumdaki Kullanıcı)
if ($method === 'GET' && $uri === '/oturum/ben') {
    $u = girisZorunlu($pdo);
    basariDondur($u);
}

// 5. Çıkış Yap
if ($method === 'POST' && $uri === '/oturum/cikis') {
    setcookie(CEREZ_ADI, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    basariDondur(true);
}

// 6. Tanımlar (81 İl, Bölümler, Şirketler, Enumlar)
if ($method === 'GET' && $uri === '/tanimlar') {
    girisZorunlu($pdo);
    
    $sehirler = $pdo->query('SELECT id, ad, plaka_kodu AS plakaKodu FROM sehirler ORDER BY ad')->fetchAll();
    // Türkçe sıralama
    usort($sehirler, fn($a, $b) => strcoll($a['ad'], $b['ad']));
    
    $bolumler = $pdo->query('SELECT id, ad, fakulte FROM bolumler ORDER BY ad')->fetchAll();
    $sirketler = $pdo->query('SELECT id, ad, eposta FROM sirketler ORDER BY ad')->fetchAll();
    
    basariDondur([
        'sehirler' => $sehirler,
        'bolumler' => $bolumler,
        'sirketler' => $sirketler,
        'turler' => [
            ['deger' => 'konferans', 'etiket' => 'Konferans', 'aciklama' => 'Çok oturumlu tam gün etkinlik'],
            ['deger' => 'sunum', 'etiket' => 'Sunum', 'aciklama' => 'Tek konuşmacılı seminer veya tanıtım'],
            ['deger' => 'hackathon', 'etiket' => 'Hackathon', 'aciklama' => 'Takım bazlı yarışma formatı'],
        ],
        'ogrenimDuzeyleri' => [
            ['deger' => 'on_lisans', 'etiket' => 'Ön lisans'],
            ['deger' => 'lisans', 'etiket' => 'Lisans'],
            ['deger' => 'yuksek_lisans', 'etiket' => 'Yüksek lisans'],
            ['deger' => 'doktora', 'etiket' => 'Doktora'],
        ],
        'siniflar' => [
            ['deger' => 0, 'etiket' => 'Hazırlık'],
            ['deger' => 1, 'etiket' => '1. sınıf'],
            ['deger' => 2, 'etiket' => '2. sınıf'],
            ['deger' => 3, 'etiket' => '3. sınıf'],
            ['deger' => 4, 'etiket' => '4. sınıf'],
            ['deger' => 5, 'etiket' => 'Mezun'],
        ],
        'durumlar' => [
            ['deger' => 'taslak', 'etiket' => 'Taslak'],
            ['deger' => 'yayinda', 'etiket' => 'Yayında'],
            ['deger' => 'doldu', 'etiket' => 'Dolu'],
            ['deger' => 'tamamlandi', 'etiket' => 'Tamamlandı'],
            ['deger' => 'iptal', 'etiket' => 'İptal'],
        ]
    ]);
}

// 7. Etkinlikler Listesi
if ($method === 'GET' && $uri === '/etkinlikler') {
    girisZorunlu($pdo);
    
    $where = [];
    $params = [];
    
    if (!empty($_GET['arama'])) {
        $where[] = '(e.baslik LIKE ? OR s.ad LIKE ? OR e.kod LIKE ?)';
        $arama = '%' . $_GET['arama'] . '%';
        $params[] = $arama; $params[] = $arama; $params[] = $arama;
    }
    if (!empty($_GET['tur'])) {
        $where[] = 'e.tur = ?';
        $params[] = $_GET['tur'];
    }
    if (!empty($_GET['durum'])) {
        $where[] = 'e.durum = ?';
        $params[] = $_GET['durum'];
    }
    if (!empty($_GET['sehirId'])) {
        $where[] = 'e.sehir_id = ?';
        $params[] = (int)$_GET['sehirId'];
    }
    if (!empty($_GET['sirketId'])) {
        $where[] = 'e.sirket_id = ?';
        $params[] = (int)$_GET['sirketId'];
    }
    
    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $sayfa = max(1, (int)($_GET['sayfa'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
    $offset = ($sayfa - 1) * $limit;
    
    // Toplam sayım
    $stmtSayim = $pdo->prepare("SELECT COUNT(*) FROM etkinlikler e JOIN sirketler s ON s.id = e.sirket_id $whereSql");
    $stmtSayim->execute($params);
    $toplam = (int)$stmtSayim->fetchColumn();
    
    $sql = "
      SELECT e.id, e.kod, e.baslik, e.tur, e.durum, e.baslangic, e.bitis, e.son_basvuru,
             e.kontenjan, e.kapak_gorseli, e.basvuruya_acik, e.ilce, e.adres,
             s.id AS sirket_id, s.ad AS sirket_adi,
             c.id AS sehir_id,  c.ad AS sehir_adi,
             COALESCE(b.toplam, 0) AS basvuru_sayisi,
             COALESCE(b.onayli, 0) AS onayli_sayisi
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN (
        SELECT etkinlik_id, COUNT(*) AS toplam, SUM(durum = 'onaylandi') AS onayli
        FROM basvurular GROUP BY etkinlik_id
      ) b ON b.etkinlik_id = e.id
      $whereSql
      ORDER BY e.baslangic ASC
      LIMIT $limit OFFSET $offset
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $satirlar = $stmt->fetchAll();
    
    $kayitlar = array_map(function($r) {
        $kontenjan = (int)$r['kontenjan'];
        $onayli = (int)$r['onayli_sayisi'];
        return [
            'id' => (int)$r['id'],
            'kod' => $r['kod'],
            'baslik' => $r['baslik'],
            'tur' => $r['tur'],
            'durum' => $r['durum'],
            'baslangic' => $r['baslangic'],
            'bitis' => $r['bitis'],
            'sonBasvuru' => $r['son_basvuru'],
            'kontenjan' => $kontenjan,
            'kapakGorseli' => $r['kapak_gorseli'],
            'basvuruyaAcik' => (bool)$r['basvuruya_acik'],
            'sirket' => ['id' => (int)$r['sirket_id'], 'ad' => $r['sirket_adi']],
            'sehir' => ['id' => (int)$r['sehir_id'], 'ad' => $r['sehir_adi']],
            'basvuruSayisi' => (int)$r['basvuru_sayisi'],
            'onayliSayisi' => $onayli,
            'doluluk' => $kontenjan > 0 ? (int)round(($onayli / $kontenjan) * 100) : 0,
        ];
    }, $satirlar);
    
    basariDondur($kayitlar, [
        'toplam' => $toplam,
        'sayfa' => $sayfa,
        'limit' => $limit,
        'sayfaSayisi' => (int)ceil($toplam / $limit)
    ]);
}

// 8. Tekil Etkinlik Detayı
if ($method === 'GET' && preg_match('#^/etkinlikler/(\d+)$#', $uri, $m)) {
    girisZorunlu($pdo);
    $id = (int)$m[1];
    
    $stmt = $pdo->prepare("
      SELECT e.*, s.id AS sirket_id, s.ad AS sirket_adi, c.id AS sehir_id, c.ad AS sehir_adi,
             COALESCE(b.toplam, 0) AS basvuru_sayisi, COALESCE(b.onayli, 0) AS onayli_sayisi
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN (
        SELECT etkinlik_id, COUNT(*) AS toplam, SUM(durum = 'onaylandi') AS onayli
        FROM basvurular GROUP BY etkinlik_id
      ) b ON b.etkinlik_id = e.id
      WHERE e.id = ?
    ");
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    if (!$r) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    
    // Şart sınıfları
    $stmtSinif = $pdo->prepare('SELECT sinif FROM etkinlik_siniflari WHERE etkinlik_id = ? ORDER BY sinif');
    $stmtSinif->execute([$id]);
    $siniflar = array_map('intval', $stmtSinif->fetchAll(PDO::FETCH_COLUMN));
    
    // Şart bölümleri
    $stmtBolum = $pdo->prepare('SELECT b.id, b.ad, b.fakulte FROM etkinlik_bolumleri eb JOIN bolumler b ON b.id = eb.bolum_id WHERE eb.etkinlik_id = ?');
    $stmtBolum->execute([$id]);
    $bolumler = $stmtBolum->fetchAll();
    
    $kontenjan = (int)$r['kontenjan'];
    $onayli = (int)$r['onayli_sayisi'];
    
    basariDondur([
        'id' => (int)$r['id'],
        'kod' => $r['kod'],
        'baslik' => $r['baslik'],
        'aciklama' => $r['aciklama'],
        'tur' => $r['tur'],
        'durum' => $r['durum'],
        'iletisimEpostasi' => $r['iletisim_epostasi'],
        'baslangic' => $r['baslangic'],
        'bitis' => $r['bitis'],
        'sonBasvuru' => $r['son_basvuru'],
        'kontenjan' => $kontenjan,
        'basvuruyaAcik' => (bool)$r['basvuruya_acik'],
        'ilce' => $r['ilce'],
        'adres' => $r['adres'],
        'kapakGorseli' => $r['kapak_gorseli'],
        'sirket' => ['id' => (int)$r['sirket_id'], 'ad' => $r['sirket_adi']],
        'sehir' => ['id' => (int)$r['sehir_id'], 'ad' => $r['sehir_adi']],
        'sartlar' => [
            'ogrenimDuzeyi' => $r['sart_ogrenim_duzeyi'],
            'siniflar' => $siniflar,
            'bolumler' => $bolumler,
            'minOrtalama' => $r['sart_min_ortalama'] !== null ? (float)$r['sart_min_ortalama'] : null,
            'belgeZorunlu' => (bool)$r['sart_belge_zorunlu'],
        ],
        'ayarlar' => [
            'otomatikOnay' => (bool)$r['otomatik_onay'],
            'yedekListe' => (bool)$r['yedek_liste'],
            'katilimBelgesi' => (bool)$r['katilim_belgesi'],
        ],
        'basvuruSayisi' => (int)$r['basvuru_sayisi'],
        'onayliSayisi' => $onayli,
        'doluluk' => $kontenjan > 0 ? (int)round(($onayli / $kontenjan) * 100) : 0,
        'olusturuldu' => $r['olusturuldu'],
        'guncellendi' => $r['guncellendi']
    ]);
}

// 9. Yeni Etkinlik Oluştur
if ($method === 'POST' && $uri === '/etkinlikler') {
    $u = girisZorunlu($pdo);
    
    // Şirket kullanıcısı ise kendi şirketini zorunlu kıl
    $sirketId = ($u['rol'] !== 'admin' && $u['sirketId']) ? $u['sirketId'] : (int)($girdi['sirketId'] ?? 0);
    if (!$sirketId) hataDondur(400, 'gecersiz_istek', 'Şirket seçimi zorunlu');
    
    $yil = substr($girdi['baslangic'] ?? date('Y'), 0, 4);
    $stmtSira = $pdo->prepare("SELECT MAX(CAST(SUBSTRING_INDEX(kod, '-', -1) AS UNSIGNED)) FROM etkinlikler WHERE kod LIKE ?");
    $stmtSira->execute(["ETK-$yil-%"]);
    $sonSira = (int)$stmtSira->fetchColumn();
    $kod = sprintf("ETK-%s-%04d", $yil, $sonSira + 1);
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
          INSERT INTO etkinlikler (kod, baslik, aciklama, tur, sirket_id, iletisim_epostasi, sehir_id, ilce, adres,
                                   baslangic, bitis, son_basvuru, kontenjan, kapak_gorseli, sart_ogrenim_duzeyi, sart_min_ortalama,
                                   sart_belge_zorunlu, durum, basvuruya_acik, otomatik_onay, yedek_liste, katilim_belgesi, olusturan_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $kod,
            trim((string)$girdi['baslik']),
            $girdi['aciklama'] ?? null,
            $girdi['tur'] ?? 'konferans',
            $sirketId,
            $girdi['iletisimEpostasi'] ?? null,
            (int)$girdi['sehirId'],
            $girdi['ilce'] ?? null,
            $girdi['adres'] ?? null,
            $girdi['baslangic'],
            $girdi['bitis'] ?: null,
            $girdi['sonBasvuru'] ?: null,
            (int)($girdi['kontenjan'] ?? 100),
            $girdi['kapakGorseli'] ?? null,
            $girdi['sartOgrenimDuzeyi'] ?? 'lisans',
            $girdi['sartMinOrtalama'] !== null && $girdi['sartMinOrtalama'] !== '' ? (float)$girdi['sartMinOrtalama'] : null,
            !empty($girdi['sartBelgeZorunlu']) ? 1 : 0,
            $girdi['durum'] ?? 'taslak',
            !empty($girdi['basvuruyaAcik']) ? 1 : 0,
            !empty($girdi['otomatikOnay']) ? 1 : 0,
            !empty($girdi['yedekListe']) ? 1 : 0,
            !empty($girdi['katilimBelgesi']) ? 1 : 0,
            $u['id']
        ]);
        $etkinlikId = (int)$pdo->lastInsertId();
        
        // Sınıflar
        if (!empty($girdi['sartSiniflar']) && is_array($girdi['sartSiniflar'])) {
            $stmtSinif = $pdo->prepare('INSERT INTO etkinlik_siniflari (etkinlik_id, sinif) VALUES (?, ?)');
            foreach ($girdi['sartSiniflar'] as $snf) {
                $stmtSinif->execute([$etkinlikId, (int)$snf]);
            }
        }
        // Bölümler
        if (!empty($girdi['sartBolumIdleri']) && is_array($girdi['sartBolumIdleri'])) {
            $stmtBolum = $pdo->prepare('INSERT INTO etkinlik_bolumleri (etkinlik_id, bolum_id) VALUES (?, ?)');
            foreach ($girdi['sartBolumIdleri'] as $bid) {
                $stmtBolum->execute([$etkinlikId, (int)$bid]);
            }
        }
        $pdo->commit();
        basariDondur(['id' => $etkinlikId, 'kod' => $kod], null, 201);
    } catch (Exception $ex) {
        $pdo->rollBack();
        hataDondur(500, 'kayit_hatasi', $ex->getMessage());
    }
}

// 10. Etkinlik Güncelle
if ($method === 'PUT' && preg_match('#^/etkinlikler/(\d+)$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    $id = (int)$m[1];
    
    // Yetki kontrolü: Başka şirketin etkinliği ise engelle
    $stmtE = $pdo->prepare('SELECT sirket_id FROM etkinlikler WHERE id = ?');
    $stmtE->execute([$id]);
    $mevcutSirketId = (int)$stmtE->fetchColumn();
    if (!$mevcutSirketId) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    if ($u['rol'] !== 'admin' && $u['sirketId'] && $mevcutSirketId !== $u['sirketId']) {
        hataDondur(403, 'yetki_yok', 'Başka bir şirkete ait etkinliği düzenleyemezsiniz');
    }
    
    $sirketId = ($u['rol'] !== 'admin' && $u['sirketId']) ? $u['sirketId'] : (int)($girdi['sirketId'] ?? $mevcutSirketId);
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
          UPDATE etkinlikler SET
            baslik = ?, aciklama = ?, tur = ?, sirket_id = ?, iletisim_epostasi = ?, sehir_id = ?,
            ilce = ?, adres = ?, baslangic = ?, bitis = ?, son_basvuru = ?, kontenjan = ?, kapak_gorseli = ?,
            sart_ogrenim_duzeyi = ?, sart_min_ortalama = ?, sart_belge_zorunlu = ?,
            durum = ?, basvuruya_acik = ?, otomatik_onay = ?, yedek_liste = ?, katilim_belgesi = ?
          WHERE id = ?
        ");
        $stmt->execute([
            trim((string)$girdi['baslik']),
            $girdi['aciklama'] ?? null,
            $girdi['tur'] ?? 'konferans',
            $sirketId,
            $girdi['iletisimEpostasi'] ?? null,
            (int)$girdi['sehirId'],
            $girdi['ilce'] ?? null,
            $girdi['adres'] ?? null,
            $girdi['baslangic'],
            $girdi['bitis'] ?: null,
            $girdi['sonBasvuru'] ?: null,
            (int)($girdi['kontenjan'] ?? 100),
            $girdi['kapakGorseli'] ?? null,
            $girdi['sartOgrenimDuzeyi'] ?? 'lisans',
            $girdi['sartMinOrtalama'] !== null && $girdi['sartMinOrtalama'] !== '' ? (float)$girdi['sartMinOrtalama'] : null,
            !empty($girdi['sartBelgeZorunlu']) ? 1 : 0,
            $girdi['durum'] ?? 'taslak',
            !empty($girdi['basvuruyaAcik']) ? 1 : 0,
            !empty($girdi['otomatikOnay']) ? 1 : 0,
            !empty($girdi['yedekListe']) ? 1 : 0,
            !empty($girdi['katilimBelgesi']) ? 1 : 0,
            $id
        ]);
        
        $pdo->prepare('DELETE FROM etkinlik_siniflari WHERE etkinlik_id = ?')->execute([$id]);
        if (!empty($girdi['sartSiniflar']) && is_array($girdi['sartSiniflar'])) {
            $stmtSinif = $pdo->prepare('INSERT INTO etkinlik_siniflari (etkinlik_id, sinif) VALUES (?, ?)');
            foreach ($girdi['sartSiniflar'] as $snf) {
                $stmtSinif->execute([$id, (int)$snf]);
            }
        }
        
        $pdo->prepare('DELETE FROM etkinlik_bolumleri WHERE etkinlik_id = ?')->execute([$id]);
        if (!empty($girdi['sartBolumIdleri']) && is_array($girdi['sartBolumIdleri'])) {
            $stmtBolum = $pdo->prepare('INSERT INTO etkinlik_bolumleri (etkinlik_id, bolum_id) VALUES (?, ?)');
            foreach ($girdi['sartBolumIdleri'] as $bid) {
                $stmtBolum->execute([$id, (int)$bid]);
            }
        }
        $pdo->commit();
        basariDondur(['id' => $id]);
    } catch (Exception $ex) {
        $pdo->rollBack();
        hataDondur(500, 'guncelleme_hatasi', $ex->getMessage());
    }
}

// 11. Etkinlik Durumu Değiştir
if ($method === 'PATCH' && preg_match('#^/etkinlikler/(\d+)/durum$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    $id = (int)$m[1];
    
    $stmtE = $pdo->prepare('SELECT sirket_id FROM etkinlikler WHERE id = ?');
    $stmtE->execute([$id]);
    $mevcutSirketId = (int)$stmtE->fetchColumn();
    if (!$mevcutSirketId) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    if ($u['rol'] !== 'admin' && $u['sirketId'] && $mevcutSirketId !== $u['sirketId']) {
        hataDondur(403, 'yetki_yok', 'Başka bir şirkete ait etkinliği güncelleyemezsiniz');
    }
    
    $durum = $girdi['durum'] ?? 'taslak';
    $pdo->prepare('UPDATE etkinlikler SET durum = ? WHERE id = ?')->execute([$durum, $id]);
    basariDondur(['id' => $id, 'durum' => $durum]);
}

// 12. Etkinlik Sil
if ($method === 'DELETE' && preg_match('#^/etkinlikler/(\d+)$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    $id = (int)$m[1];
    
    $stmtE = $pdo->prepare('SELECT sirket_id FROM etkinlikler WHERE id = ?');
    $stmtE->execute([$id]);
    $mevcutSirketId = (int)$stmtE->fetchColumn();
    if (!$mevcutSirketId) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    if ($u['rol'] !== 'admin' && $u['sirketId'] && $mevcutSirketId !== $u['sirketId']) {
        hataDondur(403, 'yetki_yok', 'Başka bir şirkete ait etkinliği silemezsiniz');
    }
    
    $pdo->prepare('DELETE FROM etkinlikler WHERE id = ?')->execute([$id]);
    http_response_code(204);
    exit;
}

// 12.1 Katılımcılar Excel / CSV Raporu
if ($method === 'GET' && preg_match('#^/etkinlikler/(\d+)/katilimcilar(\.(xlsx|csv|xls))?$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    $id = (int)$m[1];
    
    // Etkinlik ve yetki kontrolü
    $stmtE = $pdo->prepare('SELECT e.id, e.kod, e.baslik, e.sirket_id, s.ad AS sirket_adi FROM etkinlikler e JOIN sirketler s ON s.id = e.sirket_id WHERE e.id = ?');
    $stmtE->execute([$id]);
    $etkinlik = $stmtE->fetch();
    if (!$etkinlik) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    
    if ($u['rol'] !== 'admin' && $u['sirketId'] && (int)$etkinlik['sirket_id'] !== (int)$u['sirketId']) {
        hataDondur(403, 'yetki_yok', 'Başka bir şirkete ait etkinliğin raporunu indiremezsiniz');
    }
    
    // Katılımcıları çek
    $stmtK = $pdo->prepare("
      SELECT b.id, b.durum, b.basvuru_tarihi, b.karar_tarihi, b.notlar,
             o.ad_soyad, o.eposta, o.ogrenci_no, o.universite, o.ogrenim_duzeyi, o.sinif, o.not_ortalamasi,
             bl.ad AS bolum_adi
      FROM basvurular b
      JOIN ogrenciler o ON o.id = b.ogrenci_id
      LEFT JOIN bolumler bl ON bl.id = o.bolum_id
      WHERE b.etkinlik_id = ?
      ORDER BY b.basvuru_tarihi ASC
    ");
    $stmtK->execute([$id]);
    $katilimcilar = $stmtK->fetchAll();
    
    $durumlar = [
        'onaylandi' => 'Onaylandı',
        'beklemede' => 'Beklemede',
        'reddedildi' => 'Reddedildi',
        'yedek' => 'Yedek',
        'iptal' => 'İptal'
    ];
    $siniflar = [
        0 => 'Hazırlık', 1 => '1. sınıf', 2 => '2. sınıf', 3 => '3. sınıf', 4 => '4. sınıf', 5 => 'Mezun'
    ];
    $duzeyler = [
        'on_lisans' => 'Ön lisans', 'lisans' => 'Lisans', 'yuksek_lisans' => 'Yüksek lisans', 'doktora' => 'Doktora'
    ];

    $harita = ['ç'=>'c','Ç'=>'C','ğ'=>'g','Ğ'=>'G','ı'=>'i','İ'=>'I','ö'=>'o','Ö'=>'O','ş'=>'s','Ş'=>'S','ü'=>'u','Ü'=>'U'];
    $sadeBaslik = preg_replace('/[^a-zA-Z0-9]+/', '-', strtr($etkinlik['baslik'], $harita));
    $sadeBaslik = trim($sadeBaslik, '-');
    $dosyaAdi = sprintf("%s_%s_katilimcilar_%s.xlsx", $etkinlik['kod'], substr($sadeBaslik, 0, 40), date('Y-m-d'));

    // Sütun başlıkları
    $basliklar = [
        'Sıra', 'Ad Soyad', 'E-posta', 'Öğrenci No', 'Üniversite', 'Bölüm',
        'Öğrenim Düzeyi', 'Sınıf', 'Not Ortalaması', 'Başvuru Tarihi', 'Durum', 'Karar Tarihi', 'Notlar'
    ];
    
    $satirlar = [];
    $sira = 1;
    foreach ($katilimcilar as $k) {
        $satirlar[] = [
            $sira++,
            $k['ad_soyad'],
            $k['eposta'],
            $k['ogrenci_no'] ?? '-',
            $k['universite'] ?? '-',
            $k['bolum_adi'] ?? '-',
            $duzeyler[$k['ogrenim_duzeyi']] ?? ($k['ogrenim_duzeyi'] ?? '-'),
            $siniflar[$k['sinif']] ?? ($k['sinif'] !== null ? $k['sinif'] . '. sınıf' : '-'),
            $k['not_ortalamasi'] !== null ? number_format((float)$k['not_ortalamasi'], 2) : '-',
            $k['basvuru_tarihi'] ? date('d.m.Y H:i', strtotime($k['basvuru_tarihi'])) : '-',
            $durumlar[$k['durum']] ?? $k['durum'],
            $k['karar_tarihi'] ? date('d.m.Y H:i', strtotime($k['karar_tarihi'])) : '-',
            $k['notlar'] ?? ''
        ];
    }
    
    // ZipArchive ile gerçek XLSX üret
    if (class_exists('ZipArchive')) {
        $tmpZip = tempnam(sys_get_temp_dir(), 'xlsx_');
        $zip = new ZipArchive();
        if ($zip->open($tmpZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>');

            $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>');

            $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>');

            $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Katilimcilar" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>');

            $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC9593D"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellXfs count="2">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>');

            $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n";
            $sheetXml .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
            $sheetXml .= '<row r="1">';
            foreach ($basliklar as $cIdx => $b) {
                $colLetter = chr(65 + $cIdx);
                $escaped = htmlspecialchars((string)$b, ENT_XML1, 'UTF-8');
                $sheetXml .= '<c r="' . $colLetter . '1" t="inlineStr" s="1"><is><t>' . $escaped . '</t></is></c>';
            }
            $sheetXml .= '</row>';
            
            $rowNum = 2;
            foreach ($satirlar as $row) {
                $sheetXml .= '<row r="' . $rowNum . '">';
                foreach ($row as $cIdx => $val) {
                    $colLetter = chr(65 + $cIdx);
                    $escaped = htmlspecialchars((string)$val, ENT_XML1, 'UTF-8');
                    $sheetXml .= '<c r="' . $colLetter . $rowNum . '" t="inlineStr"><is><t>' . $escaped . '</t></is></c>';
                }
                $sheetXml .= '</row>';
                $rowNum++;
            }
            $sheetXml .= '</sheetData></worksheet>';
            $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
            $zip->close();
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $dosyaAdi . '"');
            header('Content-Length: ' . filesize($tmpZip));
            header('Cache-Control: no-cache, no-store, must-revalidate');
            readfile($tmpZip);
            @unlink($tmpZip);
            exit;
        }
    }
    
    // Fallback: CSV with UTF-8 BOM
    $csvAdi = str_replace('.xlsx', '.csv', $dosyaAdi);
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $csvAdi . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    fputcsv($out, $basliklar, ';');
    foreach ($satirlar as $row) {
        fputcsv($out, $row, ';');
    }
    fclose($out);
    exit;
}

// 13. İstatistik Paneli
if ($method === 'GET' && $uri === '/istatistik/panel') {
    $u = girisZorunlu($pdo);
    $sirketId = ($u['rol'] !== 'admin') ? $u['sirketId'] : null;
    
    $params = [];
    $sSuzgec = '';
    if ($sirketId !== null) {
        $sSuzgec = 'AND e.sirket_id = ?';
        $params[] = $sirketId;
    }
    
    // Kartlar
    $stmtKart = $pdo->prepare("
      SELECT
        (SELECT COUNT(*) FROM etkinlikler e WHERE e.durum = 'yayinda' $sSuzgec) AS aktifEtkinlik,
        (SELECT COUNT(*) FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id WHERE b.durum = 'beklemede' $sSuzgec) AS bekleyenBasvuru,
        (SELECT COUNT(*) FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id WHERE b.durum = 'onaylandi' $sSuzgec) AS onayliKatilimci,
        (SELECT COUNT(*) FROM sirketler) AS kayitliSirket
    ");
    $stmtKart->execute(array_merge($params, $params, $params));
    $kartlar = $stmtKart->fetch();
    
    // Yaklaşan etkinlikler
    $stmtYaklasan = $pdo->prepare("
      SELECT e.id, e.baslik, e.tur, e.baslangic, e.kontenjan,
             s.ad AS sirket_adi, c.ad AS sehir_adi,
             COALESCE(SUM(b.durum = 'onaylandi'), 0) AS onayli
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN basvurular b ON b.etkinlik_id = e.id
      WHERE e.baslangic >= NOW() AND e.durum IN ('yayinda','doldu') $sSuzgec
      GROUP BY e.id
      ORDER BY e.baslangic ASC
      LIMIT 5
    ");
    $stmtYaklasan->execute($params);
    $yaklasan = $stmtYaklasan->fetchAll();
    
    // Son başvurular
    $stmtSonBasvuru = $pdo->prepare("
      SELECT b.id, b.basvuru_tarihi AS basvuruTarihi, o.ad_soyad AS adSoyad, o.sinif, bl.ad AS bolumAdi, e.baslik AS etkinlikBasligi
      FROM basvurular b
      JOIN ogrenciler o ON o.id = b.ogrenci_id
      JOIN etkinlikler e ON e.id = b.etkinlik_id
      LEFT JOIN bolumler bl ON bl.id = o.bolum_id
      WHERE 1=1 $sSuzgec
      ORDER BY b.basvuru_tarihi DESC
      LIMIT 6
    ");
    $stmtSonBasvuru->execute($params);
    $sonBasvurular = $stmtSonBasvuru->fetchAll();
    
    basariDondur([
        'kartlar' => [
            'aktifEtkinlik' => (int)($kartlar['aktifEtkinlik'] ?? 0),
            'bekleyenBasvuru' => (int)($kartlar['bekleyenBasvuru'] ?? 0),
            'onayliKatilimci' => (int)($kartlar['onayliKatilimci'] ?? 0),
            'kayitliSirket' => (int)($kartlar['kayitliSirket'] ?? 0),
        ],
        'yaklasan' => $yaklasan,
        'sonBasvurular' => $sonBasvurular,
        'aylik' => [],
        'sehirDagilimi' => []
    ]);
}

// 14. Başvurular
if ($method === 'GET' && $uri === '/basvurular') {
    $u = girisZorunlu($pdo);
    $sirketId = ($u['rol'] !== 'admin') ? $u['sirketId'] : ($_GET['sirketId'] ?? null);
    
    $where = [];
    $params = [];
    if ($sirketId) { $where[] = 'e.sirket_id = ?'; $params[] = (int)$sirketId; }
    if (!empty($_GET['etkinlikId'])) { $where[] = 'b.etkinlik_id = ?'; $params[] = (int)$_GET['etkinlikId']; }
    if (!empty($_GET['durum'])) { $where[] = 'b.durum = ?'; $params[] = $_GET['durum']; }
    if (isset($_GET['sinif']) && $_GET['sinif'] !== '') { $where[] = 'o.sinif = ?'; $params[] = (int)$_GET['sinif']; }
    
    $wSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $stmt = $pdo->prepare("
      SELECT b.id, b.durum, b.basvuru_tarihi, b.karar_tarihi, b.etkinlik_id,
             e.baslik AS etkinlik_basligi, e.sirket_id, s.ad AS sirket_adi,
             o.id AS ogrenci_id, o.ad_soyad, o.sinif, o.ogrenim_duzeyi, o.not_ortalamasi,
             bl.ad AS bolum_adi
      FROM basvurular b
      JOIN etkinlikler e ON e.id = b.etkinlik_id
      JOIN sirketler   s ON s.id = e.sirket_id
      JOIN ogrenciler  o ON o.id = b.ogrenci_id
      LEFT JOIN bolumler bl ON bl.id = o.bolum_id
      $wSql
      ORDER BY b.basvuru_tarihi DESC
      LIMIT 100
    ");
    $stmt->execute($params);
    $satirlar = $stmt->fetchAll();
    
    $sonuc = array_map(function($r) {
        return [
            'id' => (int)$r['id'],
            'durum' => $r['durum'],
            'basvuruTarihi' => $r['basvuru_tarihi'],
            'kararTarihi' => $r['karar_tarihi'],
            'etkinlik' => ['id' => (int)$r['etkinlik_id'], 'baslik' => $r['etkinlik_basligi']],
            'sirket' => ['id' => (int)$r['sirket_id'], 'ad' => $r['sirket_adi']],
            'ogrenci' => [
                'id' => (int)$r['ogrenci_id'],
                'adSoyad' => $r['ad_soyad'],
                'bolum' => $r['bolum_adi'],
                'sinif' => (int)$r['sinif'],
                'ogrenimDuzeyi' => $r['ogrenim_duzeyi'],
                'notOrtalamasi' => $r['not_ortalamasi'] !== null ? (float)$r['not_ortalamasi'] : null,
            ]
        ];
    }, $satirlar);
    
    basariDondur($sonuc);
}

// 15. Başvuru Durumu Değiştir
if ($method === 'PATCH' && preg_match('#^/basvurular/(\d+)/durum$#', $uri, $m)) {
    girisZorunlu($pdo);
    $id = (int)$m[1];
    $durum = $girdi['durum'] ?? 'onaylandi';
    $pdo->prepare('UPDATE basvurular SET durum = ?, karar_tarihi = NOW() WHERE id = ?')->execute([$durum, $id]);
    basariDondur(['id' => $id, 'durum' => $durum]);
}

// 16. Kullanıcılar Listesi
if ($method === 'GET' && $uri === '/kullanicilar') {
    $u = girisZorunlu($pdo);
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Bu sayfayı yalnızca genel yönetici görüntüleyebilir');
    
    $satirlar = $pdo->query('
        SELECT k.id, k.ad_soyad, k.eposta, k.rol, k.sirket_id, k.aktif, k.son_giris, k.olusturuldu,
               s.ad AS sirket_adi
        FROM kullanicilar k
        LEFT JOIN sirketler s ON s.id = k.sirket_id
        ORDER BY k.ad_soyad
    ')->fetchAll();
    
    $sonuc = array_map(function($r) {
        $k = kullaniciCevir($r);
        $k['sirketAdi'] = $r['sirket_adi'] ?? null;
        return $k;
    }, $satirlar);
    
    basariDondur($sonuc);
}

// 17. Yeni Kullanıcı Oluştur
if ($method === 'POST' && $uri === '/kullanicilar') {
    $u = girisZorunlu($pdo);
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Yalnızca genel yönetici yeni kullanıcı ekleyebilir');
    
    $adSoyad = trim((string)($girdi['adSoyad'] ?? ''));
    $eposta = trim((string)($girdi['eposta'] ?? ''));
    $parola = (string)($girdi['parola'] ?? '');
    $rol = ($girdi['rol'] ?? 'sirket_admin') === 'admin' ? 'admin' : 'sirket_admin';
    $sirketId = ($rol === 'sirket_admin') ? (int)($girdi['sirketId'] ?? 0) : null;
    
    if (!$adSoyad || !$eposta || strlen($parola) < 6) {
        hataDondur(400, 'dogrulama_hatasi', 'Ad soyad, geçerli e-posta ve en az 6 karakter parola zorunludur');
    }
    if ($rol === 'sirket_admin' && !$sirketId) {
        hataDondur(400, 'dogrulama_hatasi', 'Şirket yöneticisi için bir şirket seçmelisiniz');
    }
    
    $stmtEposta = $pdo->prepare('SELECT id FROM kullanicilar WHERE eposta = ?');
    $stmtEposta->execute([$eposta]);
    if ($stmtEposta->fetch()) {
        hataDondur(409, 'kayit_mevcut', 'Bu e-posta adresi zaten kullanımda');
    }
    
    $parolaHash = password_hash($parola, PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare('INSERT INTO kullanicilar (ad_soyad, eposta, parola_hash, rol, sirket_id, aktif) VALUES (?, ?, ?, ?, ?, 1)');
    $stmtInsert->execute([$adSoyad, $eposta, $parolaHash, $rol, $sirketId]);
    $yeniId = (int)$pdo->lastInsertId();
    
    basariDondur(['id' => $yeniId, 'adSoyad' => $adSoyad, 'eposta' => $eposta, 'rol' => $rol, 'sirketId' => $sirketId], null, 201);
}

// 18. Kullanıcı Güncelle (Aktiflik, Ad vb.)
if ($method === 'PATCH' && preg_match('#^/kullanicilar/(\d+)$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Yalnızca genel yönetici kullanıcı güncelleyebilir');
    $id = (int)$m[1];
    
    $set = [];
    $params = [];
    if (isset($girdi['aktif'])) {
        $set[] = 'aktif = ?';
        $params[] = (int)$girdi['aktif'];
    }
    if (isset($girdi['adSoyad'])) {
        $set[] = 'ad_soyad = ?';
        $params[] = trim((string)$girdi['adSoyad']);
    }
    if (isset($girdi['rol'])) {
        $set[] = 'rol = ?';
        $params[] = ($girdi['rol'] === 'admin') ? 'admin' : 'sirket_admin';
    }
    if (isset($girdi['sirketId'])) {
        $set[] = 'sirket_id = ?';
        $params[] = $girdi['sirketId'] ? (int)$girdi['sirketId'] : null;
    }
    
    if ($set) {
        $params[] = $id;
        $pdo->prepare('UPDATE kullanicilar SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($params);
    }
    basariDondur(['id' => $id, 'guncellendi' => true]);
}

// 19. Kullanıcı Parola Sıfırla
if ($method === 'PATCH' && preg_match('#^/kullanicilar/(\d+)/parola$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Yalnızca genel yönetici parola sıfırlayabilir');
    $id = (int)$m[1];
    $yeniParola = (string)($girdi['yeniParola'] ?? '');
    if (strlen($yeniParola) < 6) {
        hataDondur(400, 'gecersiz_parola', 'Parola en az 6 karakter olmalıdır');
    }
    $hash = password_hash($yeniParola, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE kullanicilar SET parola_hash = ? WHERE id = ?')->execute([$hash, $id]);
    basariDondur(['id' => $id, 'parolaGuncellendi' => true]);
}

// 20. Kullanıcı Sil
if ($method === 'DELETE' && preg_match('#^/kullanicilar/(\d+)$#', $uri, $m)) {
    $u = girisZorunlu($pdo);
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Yalnızca genel yönetici kullanıcı silebilir');
    $id = (int)$m[1];
    if ($id === $u['id']) {
        hataDondur(400, 'kendini_silemez', 'Oturum açıkken kendi hesabınızı silemezsiniz');
    }
    $pdo->prepare('DELETE FROM kullanicilar WHERE id = ?')->execute([$id]);
    basariDondur(['id' => $id, 'silindi' => true]);
}

// 21. Görsel Yükleme (POST /gorseller)
if ($method === 'POST' && $uri === '/gorseller') {
    girisZorunlu($pdo);
    
    if (empty($_FILES['gorsel']) || $_FILES['gorsel']['error'] !== UPLOAD_ERR_OK) {
        $kod = $_FILES['gorsel']['error'] ?? 'yok';
        $mesaj = ($kod === UPLOAD_ERR_INI_SIZE || $kod === UPLOAD_ERR_FORM_SIZE)
            ? 'Görsel dosya boyutu çok büyük (en fazla 5 MB)'
            : 'Görsel dosyası yüklenemedi';
        hataDondur(400, 'gecersiz_dosya', $mesaj);
    }
    
    $dosya = $_FILES['gorsel'];
    if ($dosya['size'] > 5 * 1024 * 1024) {
        hataDondur(400, 'boyut_asimi', 'Görsel en fazla 5 MB olabilir');
    }
    
    $mime = null;
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($dosya['tmp_name']);
    } elseif (function_exists('mime_content_type')) {
        $mime = mime_content_type($dosya['tmp_name']);
    }
    
    $uzantilar = [
        'image/jpeg' => '.jpg',
        'image/pjpeg' => '.jpg',
        'image/png'  => '.png',
        'image/webp' => '.webp',
        'image/gif'  => '.gif',
    ];
    
    $uzanti = $uzantilar[$mime] ?? null;
    if (!$uzanti) {
        $orijinalUzanti = strtolower(pathinfo((string)$dosya['name'], PATHINFO_EXTENSION));
        if (in_array($orijinalUzanti, ['jpg', 'jpeg', 'png', 'webp'])) {
            $uzanti = '.' . ($orijinalUzanti === 'jpeg' ? 'jpg' : $orijinalUzanti);
            $mime = 'image/' . ($uzanti === '.jpg' ? 'jpeg' : substr($uzanti, 1));
        } else {
            hataDondur(400, 'gecersiz_tur', 'Yalnızca JPEG, PNG veya WEBP görseli yükleyebilirsiniz');
        }
    }
    
    $dosyaAdi = date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . $uzanti;
    
    // Olası kayıt hedefleri (öncelik sırasına göre)
    $adayKlasorler = [
        [
            'dizin' => __DIR__ . '/yuklemeler',
            'url' => '/etkinlig/api/gorseller/' . $dosyaAdi
        ],
        [
            'dizin' => dirname(__DIR__) . '/admin/firma_gorselleri',
            'url' => '/etkinlig/admin/firma_gorselleri/' . $dosyaAdi
        ],
        [
            'dizin' => dirname(__DIR__) . '/yuklemeler',
            'url' => '/etkinlig/yuklemeler/' . $dosyaAdi
        ],
        [
            'dizin' => sys_get_temp_dir() . '/etkinlig_yuklemeler',
            'url' => '/etkinlig/api/gorseller/' . $dosyaAdi
        ],
    ];
    
    $kaydedildi = false;
    $sonucUrl = '';
    $denenenler = [];
    
    foreach ($adayKlasorler as $aday) {
        $klasor = $aday['dizin'];
        if (!is_dir($klasor)) {
            @mkdir($klasor, 0777, true);
        }
        $hedef = $klasor . '/' . $dosyaAdi;
        if (@copy($dosya['tmp_name'], $hedef) || @move_uploaded_file($dosya['tmp_name'], $hedef)) {
            $kaydedildi = true;
            $sonucUrl = $aday['url'];
            break;
        } else {
            $denenenler[] = $klasor;
        }
    }
    
    if (!$kaydedildi) {
        hataDondur(500, 'kayit_hatasi', 'Görsel sunucuya kaydedilemedi', $denenenler);
    }
    
    basariDondur([
        'yol' => $sonucUrl,
        'boyut' => $dosya['size'],
        'tip' => $mime,
    ], null, 201);
}

// 22. Görsel Sunma (GET /gorseller/{dosyaAdi})
if ($method === 'GET' && preg_match('#^/gorseller/([^/]+)$#', $uri, $m)) {
    $dosyaAdi = basename($m[1]);
    $adayYollar = [
        __DIR__ . '/yuklemeler/' . $dosyaAdi,
        dirname(__DIR__) . '/admin/firma_gorselleri/' . $dosyaAdi,
        dirname(__DIR__) . '/yuklemeler/' . $dosyaAdi,
        sys_get_temp_dir() . '/etkinlig_yuklemeler/' . $dosyaAdi,
    ];
    
    $bulundu = null;
    foreach ($adayYollar as $yol) {
        if (file_exists($yol)) {
            $bulundu = $yol;
            break;
        }
    }
    
    if (!$bulundu) {
        hataDondur(404, 'bulunamadi', 'Görsel bulunamadı');
    }
    
    $uzanti = strtolower(pathinfo($bulundu, PATHINFO_EXTENSION));
    $tipler = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif'
    ];
    $tip = $tipler[$uzanti] ?? 'application/octet-stream';
    
    header('Content-Type: ' . $tip);
    header('Content-Length: ' . filesize($bulundu));
    header('Cache-Control: public, max-age=31536000');
    readfile($bulundu);
    exit;
}

// 23. Açık Vitrin - Etkinlikler Listesi (GET /acik/etkinlikler)
if ($method === 'GET' && $uri === '/acik/etkinlikler') {
    $where = ["e.durum = 'yayinda'"];
    $params = [];
    
    if (!empty($_GET['arama'])) {
        $where[] = '(e.baslik LIKE ? OR s.ad LIKE ? OR e.kod LIKE ?)';
        $arama = '%' . $_GET['arama'] . '%';
        $params[] = $arama; $params[] = $arama; $params[] = $arama;
    }
    if (!empty($_GET['tur'])) {
        $where[] = 'e.tur = ?';
        $params[] = $_GET['tur'];
    }
    if (!empty($_GET['sehir'])) {
        $where[] = 'c.ad = ?';
        $params[] = $_GET['sehir'];
    }
    
    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 24)));
    
    $sql = "
      SELECT e.id, e.kod, e.baslik, e.tur, e.baslangic, e.bitis, e.son_basvuru,
             e.ilce, e.adres, e.kontenjan, e.kapak_gorseli, e.basvuruya_acik,
             s.ad AS sirket_adi, c.ad AS sehir_adi,
             COALESCE(b.onayli, 0) AS onayli
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN (
        SELECT etkinlik_id, SUM(durum = 'onaylandi') AS onayli
        FROM basvurular GROUP BY etkinlik_id
      ) b ON b.etkinlik_id = e.id
      $whereSql
      ORDER BY e.baslangic ASC
      LIMIT $limit
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $satirlar = $stmt->fetchAll();
    
    $kayitlar = array_map(function($r) {
        $kontenjan = (int)$r['kontenjan'];
        $onayli = (int)$r['onayli'];
        $kalan = max(0, $kontenjan - $onayli);
        return [
            'id' => (int)$r['id'],
            'kod' => $r['kod'],
            'baslik' => $r['baslik'],
            'tur' => $r['tur'],
            'baslangic' => $r['baslangic'],
            'bitis' => $r['bitis'],
            'sonBasvuru' => $r['son_basvuru'],
            'sirket' => $r['sirket_adi'],
            'sehir' => $r['sehir_adi'],
            'ilce' => $r['ilce'],
            'gorsel' => $r['kapak_gorseli'],
            'kontenjan' => $kontenjan,
            'katilimci' => $onayli,
            'kalanKontenjan' => $kalan,
            'basvuruyaAcik' => (bool)$r['basvuruya_acik'] && $kalan > 0,
        ];
    }, $satirlar);
    
    basariDondur($kayitlar);
}

// 24. Açık Vitrin - Tekil Etkinlik Detayı (GET /acik/etkinlikler/{id})
if ($method === 'GET' && preg_match('#^/acik/etkinlikler/(\d+)$#', $uri, $m)) {
    $id = (int)$m[1];
    $stmt = $pdo->prepare("
      SELECT e.id, e.kod, e.baslik, e.aciklama, e.tur, e.baslangic, e.bitis, e.son_basvuru,
             e.ilce, e.adres, e.kontenjan, e.kapak_gorseli, e.basvuruya_acik,
             e.sart_ogrenim_duzeyi, e.sart_min_ortalama, e.sart_belge_zorunlu,
             s.ad AS sirket_adi, c.ad AS sehir_adi,
             COALESCE(b.onayli, 0) AS onayli
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN (
        SELECT etkinlik_id, SUM(durum = 'onaylandi') AS onayli
        FROM basvurular GROUP BY etkinlik_id
      ) b ON b.etkinlik_id = e.id
      WHERE e.id = ? AND e.durum = 'yayinda'
    ");
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    if (!$r) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı veya henüz yayında değil');
    
    $stmtSinif = $pdo->prepare('SELECT sinif FROM etkinlik_siniflari WHERE etkinlik_id = ? ORDER BY sinif');
    $stmtSinif->execute([$id]);
    $siniflar = array_map('intval', $stmtSinif->fetchAll(PDO::FETCH_COLUMN));
    
    $stmtBolum = $pdo->prepare('SELECT b.ad FROM etkinlik_bolumleri eb JOIN bolumler b ON b.id = eb.bolum_id WHERE eb.etkinlik_id = ?');
    $stmtBolum->execute([$id]);
    $bolumler = $stmtBolum->fetchAll(PDO::FETCH_COLUMN);
    
    $kontenjan = (int)$r['kontenjan'];
    $onayli = (int)$r['onayli'];
    $kalan = max(0, $kontenjan - $onayli);
    
    basariDondur([
        'id' => (int)$r['id'],
        'kod' => $r['kod'],
        'baslik' => $r['baslik'],
        'aciklama' => $r['aciklama'],
        'tur' => $r['tur'],
        'baslangic' => $r['baslangic'],
        'bitis' => $r['bitis'],
        'sonBasvuru' => $r['son_basvuru'],
        'sirket' => $r['sirket_adi'],
        'sehir' => $r['sehir_adi'],
        'ilce' => $r['ilce'],
        'adres' => $r['adres'],
        'gorsel' => $r['kapak_gorseli'],
        'kontenjan' => $kontenjan,
        'katilimci' => $onayli,
        'kalanKontenjan' => $kalan,
        'basvuruyaAcik' => (bool)$r['basvuruya_acik'] && $kalan > 0,
        'sartlar' => [
            'ogrenimDuzeyi' => $r['sart_ogrenim_duzeyi'],
            'siniflar' => $siniflar,
            'bolumler' => $bolumler,
            'minOrtalama' => $r['sart_min_ortalama'] !== null ? (float)$r['sart_min_ortalama'] : null,
            'belgeZorunlu' => (bool)$r['sart_belge_zorunlu'],
        ]
    ]);
}

// 25. Açık Vitrin - Filtreler (GET /acik/filtreler)
if ($method === 'GET' && $uri === '/acik/filtreler') {
    $stmtSehir = $pdo->query("
      SELECT c.ad, COUNT(*) AS adet
      FROM etkinlikler e
      JOIN sehirler c ON c.id = e.sehir_id
      WHERE e.durum = 'yayinda'
      GROUP BY c.id
      ORDER BY adet DESC, c.ad ASC
    ");
    $sehirler = array_map(fn($s) => ['ad' => $s['ad'], 'adet' => (int)$s['adet']], $stmtSehir->fetchAll());
    
    $stmtTur = $pdo->query("
      SELECT e.tur, COUNT(*) AS adet
      FROM etkinlikler e
      WHERE e.durum = 'yayinda'
      GROUP BY e.tur
      ORDER BY e.tur ASC
    ");
    $turler = array_map(fn($t) => ['deger' => $t['tur'], 'adet' => (int)$t['adet']], $stmtTur->fetchAll());
    
    basariDondur([
        'sehirler' => $sehirler,
        'turler' => $turler,
    ]);
}

// 26. Açık Vitrin - Öğrenci Kaydı (POST /acik/kayit veya POST /register)
if ($method === 'POST' && ($uri === '/acik/kayit' || $uri === '/register')) {
    $adSoyad = trim((string)($girdi['adSoyad'] ?? ''));
    $eposta = trim((string)($girdi['email'] ?? $girdi['eposta'] ?? ''));
    $sifre = (string)($girdi['sifre'] ?? $girdi['parola'] ?? '');
    
    if (!$adSoyad || !$eposta) {
        hataDondur(400, 'eksik_alan', 'Ad soyad ve e-posta zorunludur');
    }
    
    $stmtKontrol = $pdo->prepare('SELECT id FROM ogrenciler WHERE eposta = ?');
    $stmtKontrol->execute([$eposta]);
    $mevcutId = $stmtKontrol->fetchColumn();
    
    if ($mevcutId) {
        basariDondur(['id' => (int)$mevcutId, 'adSoyad' => $adSoyad, 'eposta' => $eposta, 'mesaj' => 'Giriş başarılı']);
    } else {
        $stmt = $pdo->prepare('INSERT INTO ogrenciler (ad_soyad, eposta) VALUES (?, ?)');
        $stmt->execute([$adSoyad, $eposta]);
        $yeniId = (int)$pdo->lastInsertId();
        basariDondur(['id' => $yeniId, 'adSoyad' => $adSoyad, 'eposta' => $eposta, 'mesaj' => 'Kayıt başarılı'], null, 201);
    }
}

// Hiçbir rotaya uymadıysa 404
hataDondur(404, 'bulunamadi', "Uç bulunamadı: $method $uri");
