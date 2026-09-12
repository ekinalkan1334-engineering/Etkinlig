// Vitrinin tek API kapısı. Oturum çerezle taşınır; yedek olarak jeton başlığı gönderilir
// (bazı barındırmalarda üçüncü taraf çerezleri kısıtlı olabiliyor).
const TEMEL = import.meta.env.VITE_API_URL ?? '/etkinlig/api';
const JETON_ANAHTARI = 'etkinlig_ogrenci_jeton';

export const jetonOku = () => {
  try { return localStorage.getItem(JETON_ANAHTARI); } catch { return null; }
};
export const jetonYaz = (j) => {
  try { j ? localStorage.setItem(JETON_ANAHTARI, j) : localStorage.removeItem(JETON_ANAHTARI); } catch { /* yoksay */ }
};

export class ApiHatasi extends Error {
  constructor(status, kod, mesaj, detay) {
    super(mesaj);
    this.status = status;
    this.kod = kod;
    this.detay = detay ?? null;
  }
}

const sorgu = (params) => {
  const a = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === '') continue;
    a.set(k, String(v));
  }
  const s = a.toString();
  return s ? `?${s}` : '';
};

async function iste(yol, { method = 'GET', govde, params } = {}) {
  const basliklar = {};
  if (govde) basliklar['Content-Type'] = 'application/json';
  const jeton = jetonOku();
  if (jeton) basliklar['X-Ogrenci-Token'] = jeton;

  const yanit = await fetch(`${TEMEL}${yol}${sorgu(params)}`, {
    method,
    credentials: 'include',
    headers: basliklar,
    body: govde ? JSON.stringify(govde) : undefined,
  });

  if (yanit.status === 204) return null;

  const cevap = await yanit.json().catch(() => null);
  if (!yanit.ok) {
    const h = cevap?.error ?? {};
    throw new ApiHatasi(yanit.status, h.code ?? 'bilinmeyen', h.message ?? 'İstek başarısız oldu', h.details);
  }
  return cevap?.data;
}

/* --- Etkinlikler --- */
export const etkinlikleriGetir = (filtre) => iste('/acik/etkinlikler', { params: filtre });
export const etkinligiGetir = (id) => iste(`/acik/etkinlikler/${id}`);
export const filtreleriGetir = () => iste('/acik/filtreler');

/* --- Öğrenci oturumu --- */
export const kayitOl = (govde) => iste('/acik/kayit', { method: 'POST', govde });
export const girisYap = (govde) => iste('/acik/giris', { method: 'POST', govde });
export const cikisYap = () => iste('/acik/cikis', { method: 'POST' });
export const beniGetir = () => iste('/acik/ben');

/* --- Başvurular --- */
export const basvuruYap = (etkinlikId) => iste(`/acik/etkinlikler/${etkinlikId}/basvuru`, { method: 'POST' });
export const basvurularimiGetir = () => iste('/acik/basvurularim');

/* --- Yorumlar --- */
export const yorumlariGetir = (etkinlikId) => iste(`/acik/etkinlikler/${etkinlikId}/yorumlar`);
export const yorumEkle = (etkinlikId, metin) =>
  iste(`/acik/etkinlikler/${etkinlikId}/yorumlar`, { method: 'POST', govde: { metin } });
export const yorumSil = (yorumId) => iste(`/acik/yorumlar/${yorumId}`, { method: 'DELETE' });
