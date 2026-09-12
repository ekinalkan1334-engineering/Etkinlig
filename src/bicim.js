const TARIH = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_KISA = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' });
const GUN = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });
const SAAT = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

const nesne = (v) => new Date(String(v).replace(' ', 'T'));

export const tarih = (v) => (v ? TARIH.format(nesne(v)) : '');
export const tarihKisa = (v) => (v ? TARIH_KISA.format(nesne(v)) : '');
export const gun = (v) => (v ? GUN.format(nesne(v)) : '');
export const saat = (v) => (v ? SAAT.format(nesne(v)) : '');

export const TUR_ETIKETI = { konferans: 'Konferans', sunum: 'Sunum', hackathon: 'Hackathon' };
export const DUZEY_ETIKETI = {
  on_lisans: 'Ön lisans', lisans: 'Lisans', yuksek_lisans: 'Yüksek lisans', doktora: 'Doktora',
};
export const SINIF_ETIKETI = {
  0: 'Hazırlık', 1: '1. sınıf', 2: '2. sınıf', 3: '3. sınıf', 4: '4. sınıf', 5: 'Mezun',
};

/** Etkinliğe kaç gün kaldı — "bugün", "yarın", "5 gün sonra". */
export function kalanGun(v) {
  if (!v) return '';
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const hedef = nesne(v);
  hedef.setHours(0, 0, 0, 0);
  const fark = Math.round((hedef - bugun) / 86400000);
  if (fark < 0) return 'geçti';
  if (fark === 0) return 'bugün';
  if (fark === 1) return 'yarın';
  return `${fark} gün sonra`;
}
