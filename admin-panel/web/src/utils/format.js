const TR_TARIH = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
const TR_TARIH_UZUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
const TR_SAAT = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const TR_SAYI = new Intl.NumberFormat('tr-TR');

const tarihNesnesi = (deger) => (deger instanceof Date ? deger : new Date(String(deger).replace(' ', 'T')));

export const tarih = (v) => (v ? TR_TARIH.format(tarihNesnesi(v)) : '—');
export const tarihUzun = (v) => (v ? TR_TARIH_UZUN.format(tarihNesnesi(v)) : '—');
export const saat = (v) => (v ? TR_SAAT.format(tarihNesnesi(v)) : '—');
export const sayi = (v) => TR_SAYI.format(Number(v ?? 0));

/** <input type="datetime-local"> ile DB DATETIME arasında çeviri. */
export const girdiyeDatetime = (v) => (v ? String(v).replace(' ', 'T').slice(0, 16) : '');
export const apiyeDatetime = (v) => (v ? `${String(v).replace('T', ' ').slice(0, 16)}:00` : null);

export const SINIF_ETIKETI = { 0: 'Hazırlık', 1: '1. sınıf', 2: '2. sınıf', 3: '3. sınıf', 4: '4. sınıf', 5: 'Mezun' };
export const sinifEtiketi = (s) => SINIF_ETIKETI[s] ?? `${s}. sınıf`;

export const TUR_ETIKETI = { konferans: 'Konferans', sunum: 'Sunum', hackathon: 'Hackathon' };
export const DURUM_ETIKETI = {
  taslak: 'Taslak', yayinda: 'Yayında', doldu: 'Doldu', iptal: 'İptal', tamamlandi: 'Tamamlandı',
};
export const BASVURU_DURUM_ETIKETI = {
  beklemede: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', yedek: 'Yedek', iptal: 'İptal',
};
