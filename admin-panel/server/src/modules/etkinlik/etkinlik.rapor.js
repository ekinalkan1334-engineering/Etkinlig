import ExcelJS from 'exceljs';

const DURUM = {
  onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi',
  yedek: 'Yedek', iptal: 'İptal',
};
const DUZEY = {
  on_lisans: 'Ön lisans', lisans: 'Lisans', yuksek_lisans: 'Yüksek lisans', doktora: 'Doktora',
};
const SINIF = { 0: 'Hazırlık', 1: '1. sınıf', 2: '2. sınıf', 3: '3. sınıf', 4: '4. sınıf', 5: 'Mezun' };
const TUR = { konferans: 'Konferans', sunum: 'Sunum', hackathon: 'Hackathon' };

const KIREMIT = 'FFC9593D';
const ZEMIN = 'FFF7F2E8';
const CIZGI = 'FFE4DFD7';

const SUTUNLAR = [
  { header: 'Sıra', key: 'sira', width: 6 },
  { header: 'Ad Soyad', key: 'adSoyad', width: 26 },
  { header: 'E-posta', key: 'eposta', width: 30 },
  { header: 'Öğrenci No', key: 'ogrenciNo', width: 14 },
  { header: 'Üniversite', key: 'universite', width: 30 },
  { header: 'Bölüm', key: 'bolum', width: 30 },
  { header: 'Öğrenim Düzeyi', key: 'duzey', width: 16 },
  { header: 'Sınıf', key: 'sinif', width: 11 },
  { header: 'Not Ort.', key: 'ortalama', width: 10 },
  { header: 'Başvuru Tarihi', key: 'basvuru', width: 18 },
  { header: 'Durum', key: 'durum', width: 13 },
  { header: 'Karar Tarihi', key: 'karar', width: 18 },
  { header: 'Not', key: 'not', width: 28 },
];

/** Dosya adında sorun çıkaran karakterleri temizler, Türkçeyi latinleştirir. */
function dosyaAdiYap(baslik, kod) {
  const harita = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
  const sade = baslik
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => harita[c])
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const bugun = new Date().toISOString().slice(0, 10);
  return `${kod}_${sade}_katilimcilar_${bugun}.xlsx`;
}

/**
 * Bir etkinliğin katılımcı listesini Excel olarak üretir.
 * Veriyi kendisi çekmez: kapsam kontrolü ve sorgu çağıran tarafta yapılır.
 */
export async function katilimciRaporu(etkinlik, satirlar) {
  const kitap = new ExcelJS.Workbook();
  kitap.creator = 'etkinlig';
  kitap.created = new Date();

  const sayfa = kitap.addWorksheet('Katılımcılar', {
    views: [{ state: 'frozen', ySplit: 6 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // --- Başlık bloğu ---
  const sonSutun = SUTUNLAR.length;
  const birlestir = (satir) => sayfa.mergeCells(satir, 1, satir, sonSutun);

  birlestir(1);
  const baslik = sayfa.getCell('A1');
  baslik.value = etkinlik.baslik;
  baslik.font = { size: 15, bold: true, color: { argb: 'FF1F1915' } };
  sayfa.getRow(1).height = 24;

  birlestir(2);
  const altBaslik = sayfa.getCell('A2');
  altBaslik.value = `${etkinlik.sirket.ad} · ${etkinlik.kod} · ${TUR[etkinlik.tur] ?? etkinlik.tur}`;
  altBaslik.font = { size: 10.5, color: { argb: 'FF69625D' } };

  birlestir(3);
  const yerZaman = sayfa.getCell('A3');
  const bas = new Date(String(etkinlik.baslangic).replace(' ', 'T'));
  yerZaman.value = `${bas.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} · ${etkinlik.sehir.ad}${etkinlik.adres ? ` · ${etkinlik.adres}` : ''}`;
  yerZaman.font = { size: 10.5, color: { argb: 'FF69625D' } };

  const onayli = satirlar.filter((s) => s.durum === 'onaylandi').length;
  const bekleyen = satirlar.filter((s) => s.durum === 'beklemede').length;
  birlestir(4);
  const ozet = sayfa.getCell('A4');
  ozet.value = `Toplam başvuru: ${satirlar.length}   ·   Onaylı: ${onayli}   ·   Beklemede: ${bekleyen}   ·   Kontenjan: ${etkinlik.kontenjan}   ·   Rapor: ${new Date().toLocaleString('tr-TR')}`;
  ozet.font = { size: 10, color: { argb: 'FF98918B' } };

  sayfa.getRow(5).height = 6;

  // --- Tablo ---
  sayfa.columns = SUTUNLAR.map((s) => ({ key: s.key, width: s.width }));

  const baslikSatiri = sayfa.getRow(6);
  SUTUNLAR.forEach((s, i) => {
    const h = baslikSatiri.getCell(i + 1);
    h.value = s.header;
    h.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: KIREMIT } };
    h.alignment = { vertical: 'middle', horizontal: 'left' };
    h.border = { bottom: { style: 'thin', color: { argb: CIZGI } } };
  });
  baslikSatiri.height = 20;

  satirlar.forEach((s, i) => {
    const satir = sayfa.addRow({
      sira: i + 1,
      adSoyad: s.ad_soyad,
      eposta: s.eposta,
      ogrenciNo: s.ogrenci_no ?? '',
      universite: s.universite ?? '',
      bolum: s.bolum_adi ?? '',
      duzey: DUZEY[s.ogrenim_duzeyi] ?? s.ogrenim_duzeyi,
      sinif: SINIF[s.sinif] ?? s.sinif,
      ortalama: s.not_ortalamasi === null ? '' : Number(s.not_ortalamasi),
      basvuru: s.basvuru_tarihi ? String(s.basvuru_tarihi).slice(0, 16) : '',
      durum: DURUM[s.durum] ?? s.durum,
      karar: s.karar_tarihi ? String(s.karar_tarihi).slice(0, 16) : '',
      not: s.not_dusuldu ?? '',
    });
    satir.font = { size: 10 };
    satir.alignment = { vertical: 'middle' };
    if (i % 2 === 1) {
      satir.eachCell({ includeEmpty: true }, (h) => {
        h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEMIN } };
      });
    }
    const durumHucresi = satir.getCell('durum');
    const renk = { onaylandi: 'FF00694B', beklemede: 'FF7B4800', reddedildi: 'FF8B3722' }[s.durum];
    if (renk) durumHucresi.font = { size: 10, bold: true, color: { argb: renk } };
    satir.getCell('ortalama').numFmt = '0.00';
  });

  if (satirlar.length) {
    sayfa.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: sonSutun } };
  } else {
    const bos = sayfa.addRow({ adSoyad: 'Bu etkinliğe henüz başvuru yapılmamış.' });
    bos.font = { size: 10, italic: true, color: { argb: 'FF98918B' } };
  }

  const tampon = Buffer.from(await kitap.xlsx.writeBuffer());
  return { dosyaAdi: dosyaAdiYap(etkinlik.baslik, etkinlik.kod), tampon };
}
