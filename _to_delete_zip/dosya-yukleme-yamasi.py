#!/usr/bin/env python3
"""dosyaYukle'yi çok hedefli kaydetmeye çevirir (paylaşımlı barındırmada yazma izni sorunu)."""
import pathlib, sys

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding='utf-8')

bas = s.index("/** Tek dosya yükleme yardımcısı: tür ve boyut denetimi, güvenli ad. */")
son = s.index("// --- Profili oku ---")

yeni = '''/** Yüklenen dosyanın aranacağı/kaydedileceği klasörler — ilk yazılabilen kullanılır. */
function yuklemeHedefleri(): array {
    return [
        __DIR__ . '/yuklemeler',
        dirname(__DIR__) . '/yuklemeler',
        dirname(__DIR__) . '/admin/firma_gorselleri',
        sys_get_temp_dir() . '/etkinlig_yuklemeler',
    ];
}

/** Dosyayı adıyla bulur (kaydedildiği klasör barındırmaya göre değişebiliyor). */
function yuklenenDosyaYolu(string $ad): ?string {
    foreach (yuklemeHedefleri() as $klasor) {
        $yol = $klasor . '/' . $ad;
        if (is_file($yol)) return $yol;
    }
    return null;
}

/**
 * Tek dosya yükleme yardımcısı: tür ve boyut denetimi, güvenli ad, çok hedefli kayıt.
 * Paylaşımlı barındırmada api/yuklemeler her zaman yazılabilir olmadığı için
 * sırayla birkaç klasör denenir; hiçbiri olmazsa denenen yollar hatada bildirilir.
 */
function dosyaYukle(array $dosya, array $izinliMime, int $enFazlaBayt, string $onek): array {
    if (($dosya['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $kod = $dosya['error'] ?? UPLOAD_ERR_NO_FILE;
        $mesaj = ($kod === UPLOAD_ERR_INI_SIZE || $kod === UPLOAD_ERR_FORM_SIZE)
            ? 'Dosya çok büyük' : 'Dosya yüklenemedi (kod ' . $kod . ')';
        hataDondur(400, 'gecersiz_dosya', $mesaj);
    }
    if ($dosya['size'] > $enFazlaBayt) {
        hataDondur(400, 'boyut_asimi', 'Dosya en fazla ' . round($enFazlaBayt / 1048576) . ' MB olabilir');
    }

    $mime = null;
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($dosya['tmp_name']);
    } elseif (function_exists('mime_content_type')) {
        $mime = mime_content_type($dosya['tmp_name']);
    }
    $uzanti = $izinliMime[$mime] ?? null;
    if (!$uzanti) {
        // Bazı sunucularda finfo kapalı; uzantıya göre son bir deneme.
        $ham = strtolower(pathinfo((string)($dosya['name'] ?? ''), PATHINFO_EXTENSION));
        $eslesme = ['jpg' => '.jpg', 'jpeg' => '.jpg', 'png' => '.png', 'webp' => '.webp', 'pdf' => '.pdf'];
        $aday = $eslesme[$ham] ?? null;
        if ($aday !== null && in_array($aday, $izinliMime, true)) {
            $uzanti = $aday;
        } else {
            hataDondur(400, 'gecersiz_tur', 'Bu dosya türü kabul edilmiyor', ['algilanan' => $mime]);
        }
    }

    // Ad istemciden alınmaz: yol kaçışı ve çalıştırılabilir uzantı riski kalmasın.
    $ad = $onek . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . $uzanti;

    $denenen = [];
    foreach (yuklemeHedefleri() as $klasor) {
        if (!is_dir($klasor)) @mkdir($klasor, 0777, true);
        if (!is_dir($klasor) || !is_writable($klasor)) {
            $denenen[] = $klasor . ' (yazılamıyor)';
            continue;
        }
        $hedef = $klasor . '/' . $ad;
        if (@move_uploaded_file($dosya['tmp_name'], $hedef) || @copy($dosya['tmp_name'], $hedef)) {
            @chmod($hedef, 0644);
            return ['ad' => $ad, 'mime' => $mime];
        }
        $denenen[] = $klasor . ' (kopyalanamadı)';
    }

    hataDondur(500, 'kaydedilemedi', 'Dosya sunucuya kaydedilemedi', ['denenen' => $denenen]);
}

'''

s = s[:bas] + yeni + s[son:]

# CV indirme ucu da çok hedefli aramaya geçsin
s = s.replace(
    "    $yol = YUKLEME_DIZINI . '/' . $ad;\n    if (!file_exists($yol)) hataDondur(404, 'bulunamadi', 'Dosya sunucuda yok');",
    "    $yol = yuklenenDosyaYolu($ad);\n    if (!$yol) hataDondur(404, 'bulunamadi', 'Dosya sunucuda yok');")

# artık kullanılmayan sabit
s = s.replace("const YUKLEME_DIZINI = __DIR__ . '/yuklemeler';\n\n", "")

p.write_text(s, encoding='utf-8')
print('✓ dosya yükleme çok hedefli hale getirildi')
