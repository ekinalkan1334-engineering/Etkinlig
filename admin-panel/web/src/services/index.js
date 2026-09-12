import { http } from './http.js';

/** Model katmanı: API sözleşmesini ViewModel'lerden gizler. */
export const etkinlikService = {
  listele: (filtre) => http.get('/etkinlikler', filtre),
  bul: (id) => http.get(`/etkinlikler/${id}`),
  olustur: (govde) => http.post('/etkinlikler', govde),
  guncelle: (id, govde) => http.put(`/etkinlikler/${id}`, govde),
  durumDegistir: (id, durum) => http.patch(`/etkinlikler/${id}/durum`, { durum }),
  sil: (id) => http.del(`/etkinlikler/${id}`),
  /** Tarayıcı doğrudan bu adrese gider; oturum çerezi isteğe eklenir. */
  raporAdresi: (id) => `${import.meta.env.VITE_API_URL ?? '/api'}/etkinlikler/${id}/katilimcilar.xlsx`,
};

export const gorselService = {
  /** FormData ile yükler; JSON gövdesi olmadığı için http sarmalayıcısını kullanmaz. */
  async yukle(dosya) {
    const govde = new FormData();
    govde.append('gorsel', dosya);
    const temel = import.meta.env.VITE_API_URL ?? '/etkinlig/api';
    const yanit = await fetch(`${temel}/gorseller`, {
      method: 'POST',
      credentials: 'include',
      body: govde,
    });
    const cevap = await yanit.json().catch(() => null);
    if (!yanit.ok) throw new Error(cevap?.error?.message ?? 'Görsel yüklenemedi');
    return cevap.data;
  },
};

export const basvuruService = {
  listele: (filtre) => http.get('/basvurular', filtre),
  durumDegistir: (id, durum) => http.patch(`/basvurular/${id}/durum`, { durum }),
};

export const tanimService = {
  tumu: () => http.get('/tanimlar'),
  sirketEkle: (govde) => http.post('/tanimlar/sirketler', govde),
  bolumEkle: (govde) => http.post('/tanimlar/bolumler', govde),
};

export const istatistikService = {
  panel: () => http.get('/istatistik/panel'),
};

export const oturumService = {
  durum: () => http.get('/oturum/durum'),
  kurulum: (govde) => http.post('/oturum/kurulum', govde),
  giris: (govde) => http.post('/oturum/giris', govde),
  cikis: () => http.post('/oturum/cikis'),
  ben: () => http.get('/oturum/ben'),
  parolaDegistir: (govde) => http.post('/oturum/parola', govde),
};

export const kullaniciService = {
  listele: () => http.get('/kullanicilar'),
  olustur: (govde) => http.post('/kullanicilar', govde),
  guncelle: (id, govde) => http.patch(`/kullanicilar/${id}`, govde),
  parolaSifirla: (id, yeniParola) => http.patch(`/kullanicilar/${id}/parola`, { yeniParola }),
  sil: (id) => http.del(`/kullanicilar/${id}`),
};
