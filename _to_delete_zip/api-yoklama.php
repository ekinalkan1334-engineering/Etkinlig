// ============================================================
// YOKLAMA — firma 4 haneli kod belirler, katılımcı girer, profilde rozet olur
// ============================================================

(function (PDO $pdo): void {
    try {
        if (!$pdo->query("SHOW COLUMNS FROM etkinlikler LIKE 'yoklama_kodu'")->fetch()) {
            $pdo->exec("ALTER TABLE etkinlikler ADD COLUMN yoklama_kodu VARCHAR(8) NULL");
        }
    } catch (Throwable $e) {}
    foreach ([
        'katildi'        => "ALTER TABLE basvurular ADD COLUMN katildi TINYINT(1) NOT NULL DEFAULT 0",
        'katilim_tarihi' => "ALTER TABLE basvurular ADD COLUMN katilim_tarihi DATETIME NULL",
    ] as $ad => $sql) {
        try {
            if (!$pdo->query("SHOW COLUMNS FROM basvurular LIKE '$ad'")->fetch()) $pdo->exec($sql);
        } catch (Throwable $e) {}
    }
})($pdo);

/** Yoklama, etkinlik başlamadan 2 saat önce açılır ve bitiminden 24 saat sonra kapanır. */
function yoklamaPenceresi(array $e): array {
    $bas = strtotime($e['baslangic']) - 2 * 3600;
    $son = strtotime($e['bitis'] ?: $e['baslangic']) + 24 * 3600;
    $simdi = time();
    return [
        'acik' => $simdi >= $bas && $simdi <= $son,
        'baslangic' => date('Y-m-d H:i:s', $bas),
        'bitis' => date('Y-m-d H:i:s', $son),
    ];
}

/** Öğrencinin katılım rozetleri — profilde ve aday sayfasında gösterilir. */
function katilimRozetleri(PDO $pdo, int $ogrenciId): array {
    $stmt = $pdo->prepare("
        SELECT e.tur, COUNT(*) AS adet
        FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id
        WHERE b.ogrenci_id = ? AND b.katildi = 1
        GROUP BY e.tur
    ");
    $stmt->execute([$ogrenciId]);
    $turler = [];
    $toplam = 0;
    foreach ($stmt->fetchAll() as $r) {
        $turler[$r['tur']] = (int)$r['adet'];
        $toplam += (int)$r['adet'];
    }
    return ['toplam' => $toplam, 'turler' => $turler];
}

// --- Firma: yoklama kodunu oku ---
if ($method === 'GET' && preg_match('#^/etkinlikler/(\d+)/yoklama-kodu$#', $uri, $m)) {
    $y = girisZorunlu($pdo);
    $etkinlikId = (int)$m[1];

    $stmt = $pdo->prepare('SELECT id, sirket_id, yoklama_kodu, baslangic, bitis FROM etkinlikler WHERE id = ?');
    $stmt->execute([$etkinlikId]);
    $e = $stmt->fetch();
    if (!$e) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    if ($y['rol'] !== 'admin' && (int)$e['sirket_id'] !== (int)$y['sirketId']) {
        hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    }

    $sayim = $pdo->prepare('SELECT COUNT(*) FROM basvurular WHERE etkinlik_id = ? AND katildi = 1');
    $sayim->execute([$etkinlikId]);

    basariDondur([
        'kod' => $e['yoklama_kodu'],
        'pencere' => yoklamaPenceresi($e),
        'katilanSayisi' => (int)$sayim->fetchColumn(),
    ]);
}

// --- Firma: yoklama kodu üret / değiştir ---
if ($method === 'POST' && preg_match('#^/etkinlikler/(\d+)/yoklama-kodu$#', $uri, $m)) {
    $y = girisZorunlu($pdo);
    $etkinlikId = (int)$m[1];

    $stmt = $pdo->prepare('SELECT id, sirket_id, baslangic, bitis FROM etkinlikler WHERE id = ?');
    $stmt->execute([$etkinlikId]);
    $e = $stmt->fetch();
    if (!$e) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    if ($y['rol'] !== 'admin' && (int)$e['sirket_id'] !== (int)$y['sirketId']) {
        hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');
    }

    // Firma kendi kodunu yazabilir; yazmazsa rastgele 4 hane üretilir.
    $istenen = trim((string)($girdi['kod'] ?? ''));
    if ($istenen !== '') {
        if (!preg_match('/^\d{4}$/', $istenen)) {
            hataDondur(400, 'gecersiz_istek', 'Yoklama kodu 4 rakamdan oluşmalı');
        }
        $kod = $istenen;
    } else {
        $kod = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    $pdo->prepare('UPDATE etkinlikler SET yoklama_kodu = ? WHERE id = ?')->execute([$kod, $etkinlikId]);
    basariDondur(['kod' => $kod, 'pencere' => yoklamaPenceresi($e)]);
}

// --- Öğrenci: yoklama kodunu gir ---
if ($method === 'POST' && preg_match('#^/acik/etkinlikler/(\d+)/yoklama$#', $uri, $m)) {
    $o = ogrenciGirisZorunlu($pdo);
    $etkinlikId = (int)$m[1];
    $kod = trim((string)($girdi['kod'] ?? ''));

    if (!preg_match('/^\d{4}$/', $kod)) {
        hataDondur(400, 'gecersiz_istek', 'Kod 4 rakamdan oluşmalı');
    }

    $stmt = $pdo->prepare('SELECT id, baslik, yoklama_kodu, baslangic, bitis FROM etkinlikler WHERE id = ?');
    $stmt->execute([$etkinlikId]);
    $e = $stmt->fetch();
    if (!$e) hataDondur(404, 'bulunamadi', 'Etkinlik bulunamadı');

    $b = $pdo->prepare('SELECT id, durum, katildi FROM basvurular WHERE etkinlik_id = ? AND ogrenci_id = ?');
    $b->execute([$etkinlikId, $o['id']]);
    $basvuru = $b->fetch();
    if (!$basvuru) hataDondur(403, 'basvuru_yok', 'Bu etkinliğe başvurunuz yok');
    if ($basvuru['durum'] !== 'onaylandi') {
        hataDondur(403, 'onay_yok', 'Yoklamaya yalnızca başvurusu onaylanmış katılımcılar girebilir');
    }
    if ((int)$basvuru['katildi'] === 1) {
        hataDondur(409, 'zaten_katildi', 'Yoklamanız zaten alınmış');
    }
    if (empty($e['yoklama_kodu'])) {
        hataDondur(409, 'kod_yok', 'Bu etkinlik için henüz yoklama kodu tanımlanmamış');
    }

    $pencere = yoklamaPenceresi($e);
    if (!$pencere['acik']) {
        hataDondur(409, 'pencere_kapali', 'Yoklama yalnızca etkinlik saatinde açık olur');
    }
    // hash_equals: kodu deneme yanılmayla bulmayı zamanlamadan okumayı engeller.
    if (!hash_equals((string)$e['yoklama_kodu'], $kod)) {
        hataDondur(400, 'kod_yanlis', 'Kod hatalı. Etkinlik görevlisinden doğrulayın.');
    }

    $pdo->prepare('UPDATE basvurular SET katildi = 1, katilim_tarihi = NOW() WHERE id = ?')
        ->execute([(int)$basvuru['id']]);

    basariDondur([
        'katildi' => true,
        'etkinlik' => $e['baslik'],
        'rozetler' => katilimRozetleri($pdo, $o['id']),
        'mesaj' => 'Katılımınız doğrulandı. Profilinizde rozet olarak görünecek.',
    ]);
}

// --- Öğrenci: rozetlerim ---
if ($method === 'GET' && $uri === '/acik/rozetlerim') {
    $o = ogrenciGirisZorunlu($pdo);
    basariDondur(katilimRozetleri($pdo, $o['id']));
}

