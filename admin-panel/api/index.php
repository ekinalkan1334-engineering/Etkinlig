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
    $stmt = $pdo->prepare('SELECT id, ad_soyad, eposta, rol, sirket_id, aktif, son_giris, olusturuldu FROM kullanicilar WHERE id = ?');
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
    
    $stmt = $pdo->prepare('SELECT id, ad_soyad, eposta, parola_hash, rol, sirket_id, aktif, son_giris, olusturuldu FROM kullanicilar WHERE eposta = ?');
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
    
    basariDondur(['kullanici' => $kullanici, 'jeton' => $jeton]);
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
             e.kontenjan, e.basvuruya_acik, e.ilce, e.adres,
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
                                   baslangic, bitis, son_basvuru, kontenjan, sart_ogrenim_duzeyi, sart_min_ortalama,
                                   sart_belge_zorunlu, durum, basvuruya_acik, otomatik_onay, yedek_liste, katilim_belgesi, olusturan_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            ilce = ?, adres = ?, baslangic = ?, bitis = ?, son_basvuru = ?, kontenjan = ?,
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
    if ($u['rol'] !== 'admin') hataDondur(403, 'yetki_yok', 'Bu sayfayı yalnızca yönetici görüntüleyebilir');
    
    $satirlar = $pdo->query('SELECT id, ad_soyad, eposta, rol, sirket_id, aktif, son_giris, olusturuldu FROM kullanicilar ORDER BY ad_soyad')->fetchAll();
    basariDondur(array_map('kullaniciCevir', $satirlar));
}

// Hiçbir rotaya uymadıysa 404
hataDondur(404, 'bulunamadi', "Uç bulunamadı: $method $uri");
