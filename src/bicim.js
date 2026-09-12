const TARIH = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_KISA = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' });
const GUN = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });
const SAAT = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

const nesne = (v) => new Date(String(v).replace(' ', 'T'));

export const tarih = (v) => (v ? TARIH.format(nesne(v)) : '');
export const gun = (v) => (v ? GUN.format(nesne(v)) : '');
export const saat = (v) => (v ? SAAT.format(nesne(v)) : '');
export const gunNo = (v) => (v ? TARIH_KISA.format(nesne(v)).split(' ')[0] : '');
export const ayKisa = (v) => (v ? TARIH_KISA.format(nesne(v)).split(' ')[1] : '');

export const TUR = { konferans: 'Konferans', sunum: 'Sunum', hackathon: 'Hackathon' };
export const DUZEY = {
  on_lisans: 'Ön lisans', lisans: 'Lisans', yuksek_lisans: 'Yüksek lisans', doktora: 'Doktora',
};
export const SINIF = {
  0: 'Hazırlık', 1: '1. sınıf', 2: '2. sınıf', 3: '3. sınıf', 4: '4. sınıf', 5: 'Mezun',
};
export const BASVURU_DURUM = {
  beklemede: 'Onay bekliyor', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi',
  yedek: 'Yedek listede', iptal: 'İptal edildi',
};
export const DURUM_TONU = {
  beklemede: 'uyari', onaylandi: 'sunum', reddedildi: 'konferans', yedek: 'hackathon', iptal: 'notr',
};

export function kalanGun(v) {
  if (!v) return '';
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const hedef = nesne(v); hedef.setHours(0, 0, 0, 0);
  const fark = Math.round((hedef - bugun) / 86400000);
  if (fark < 0) return 'Geçti';
  if (fark === 0) return 'Bugün';
  if (fark === 1) return 'Yarın';
  if (fark < 30) return `${fark} gün kaldı`;
  return `${Math.round(fark / 30)} ay kaldı`;
}

/** "2 saat önce", "3 gün önce" — yorum zamanları için. */
export function gecenSure(v) {
  if (!v) return '';
  const saniye = Math.max(0, Math.round((Date.now() - nesne(v).getTime()) / 1000));
  if (saniye < 60) return 'az önce';
  const dakika = Math.round(saniye / 60);
  if (dakika < 60) return `${dakika} dakika önce`;
  const sa = Math.round(dakika / 60);
  if (sa < 24) return `${sa} saat önce`;
  const g = Math.round(sa / 24);
  if (g < 30) return `${g} gün önce`;
  return tarih(v);
}

export const basHarfler = (ad) =>
  (ad ?? '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR');
