// Vitrinin tek API kapısı. Oturum çerezle taşınır; yedek olarak jeton başlığı gönderilir
// (bazı barındırmalarda üçüncü taraf çerezleri kısıtlı olabiliyor).
const TEMEL = import.meta.env.VITE_API_URL ?? '/api';
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

  // Bazı barındırmalar (IIS+WebDAV gibi) PUT/PATCH/DELETE'i sunucuya hiç
  // ulaştırmıyor. Bu metotları POST olarak gönderip gerçeğini başlıkta bildiriyoruz.
  let gercekMetot = method;
  if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    basliklar['X-HTTP-Method-Override'] = method;
    gercekMetot = 'POST';
  }

  const yanit = await fetch(`${TEMEL}${yol}${sorgu(params)}`, {
    method: gercekMetot,
    credentials: 'include',
    headers: basliklar,
    body: govde ? JSON.stringify(govde) : undefined,
  });

  if (yanit.status === 204) return null;

  const cevap = await yanit.json().catch(() => null);
  if (!yanit.ok) {
    const h = cevap?.error ?? {};
    // Sunucu JSON döndürmediyse (405, 500 HTML sayfası…) kodu mesaja koy ki
    // "İstek başarısız oldu" gibi boş bir uyarıyla kalmayalım.
    const varsayilan = `Sunucu ${yanit.status} döndürdü`;
    throw new ApiHatasi(yanit.status, h.code ?? `http_${yanit.status}`, h.message ?? varsayilan, h.details);
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

/* --- Profil --- */
export const profilGetir = () => iste('/acik/profil');
export const profilGuncelle = (govde) => iste('/acik/profil', { method: 'PUT', govde });
export const bolumleriGetir = () => iste('/acik/bolumler');

/** Dosya yüklemeleri JSON değil FormData taşır. */
async function dosyaGonder(yol, alan, dosya) {
  const fd = new FormData();
  fd.append(alan, dosya);
  const basliklar = {};
  const jeton = jetonOku();
  if (jeton) basliklar['X-Ogrenci-Token'] = jeton;

  const yanit = await fetch(`${TEMEL}${yol}`, { method: 'POST', credentials: 'include', headers: basliklar, body: fd });
  const cevap = await yanit.json().catch(() => null);
  if (!yanit.ok) {
    const h = cevap?.error ?? {};
    throw new ApiHatasi(yanit.status, h.code ?? `http_${yanit.status}`, h.message ?? `Dosya yüklenemedi (sunucu ${yanit.status})`, h.details);
  }
  return cevap?.data;
}

export const fotoYukle = (dosya) => dosyaGonder('/acik/profil/foto', 'foto', dosya);
export const cvYukle = (dosya) => dosyaGonder('/acik/profil/cv', 'cv', dosya);

/* --- Yoklama --- */
export const yoklamaGonder = (etkinlikId, kod) =>
  iste(`/acik/etkinlikler/${etkinlikId}/yoklama`, { method: 'POST', govde: { kod } });
export const rozetlerimiGetir = () => iste('/acik/rozetlerim');
