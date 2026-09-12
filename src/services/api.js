/**
 * etkinlig — Veritabanı ve API İstemci Servisi (Express + MySQL Bağlantısı)
 */

import { INITIAL_EVENTS, INITIAL_APPLICATIONS } from '../data/mockEvents';

const BASE_URL = '';

/**
 * Backend API ve MySQL veritabanı sağlık kontrolü (Port 4000 Express veya Port 8000 FastAPI)
 */
export async function checkDatabaseHealth() {
  // 1. Önce Vite proxy üzerinden port 4000 (Express) dene
  try {
    const res = await fetch(`${BASE_URL}/api/saglik`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      return {
        connected: true,
        db: json?.data?.db ?? true,
        server: 'Express (Node.js)',
      };
    }
  } catch {}

  // 2. Ardından port 8000 (FastAPI server.py) dene
  try {
    const res = await fetch('http://127.0.0.1:8000/health', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      return {
        connected: true,
        db: json?.connected ?? false,
        server: 'FastAPI (Python)',
      };
    }
  } catch {}

  return { connected: false, db: false };
}


/**
 * Veritabanından etkinlikleri listeleme (GET /api/etkinlikler)
 */
export async function fetchEventsFromDB(filtre = {}) {
  try {
    const params = new URLSearchParams();
    if (filtre.arama) params.set('arama', filtre.arama);
    if (filtre.tur) params.set('tur', filtre.tur);
    if (filtre.sehirId) params.set('sehirId', filtre.sehirId);
    if (filtre.limit) params.set('limit', filtre.limit);

    const res = await fetch(`${BASE_URL}/api/etkinlikler?${params.toString()}`);
    if (!res.ok) throw new Error('API yanıt vermedi');
    const json = await res.json();
    if (Array.isArray(json.data) && json.data.length > 0) {
      // API'den gelen veriyi frontend formatına uyumlu dönüştürelim
      return {
        success: true,
        source: 'mysql',
        data: json.data.map((item) => ({
          id: item.id,
          kod: item.kod,
          baslik: item.baslik,
          tur: item.tur,
          sirket: item.sirket?.ad || 'Organizatör Şirket',
          sirketId: item.sirket?.id || 1,
          sehir: item.sehir?.ad || 'Ankara',
          sehirId: item.sehir?.id || 2,
          ilce: item.ilce || '',
          adres: item.adres || 'Etkinlik Salonu',
          baslangic: item.baslangic,
          bitis: item.bitis,
          sonBasvuru: item.sonBasvuru,
          kontenjan: item.kontenjan || 100,
          onayliSayisi: item.onayliSayisi || 0,
          basvuruSayisi: item.basvuruSayisi || 0,
          durum: item.durum || 'yayinda',
          katilimBelgesi: true,
          aciklama: item.aciklama || 'Etkinlik açıklaması ve katılım detayları.',
          sartlar: item.sartlar || {
            ogrenimDuzeyi: 'Lisans',
            siniflar: [1, 2, 3, 4],
            bolumler: [],
          },
        })),
      };
    }
    return { success: true, source: 'seed', data: INITIAL_EVENTS };
  } catch (err) {
    console.warn('Veritabanı API bağlantısı kurulamadı, yerel veri kullanılıyor:', err.message);
    return { success: false, source: 'local', data: INITIAL_EVENTS };
  }
}

/**
 * Öğrenci kaydı (POST /api/ogrenci/kayit veya http://127.0.0.1:8000/register)
 */
export async function registerStudentToDB(formData) {
  // 1. Express (port 4000) dene
  try {
    const res = await fetch(`${BASE_URL}/api/ogrenci/kayit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, user: json.data, source: 'mysql' };
    }
  } catch {}

  // 2. FastAPI server.py (port 8000) dene
  try {
    const res = await fetch('http://127.0.0.1:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adSoyad: formData.adSoyad,
        email: formData.email,
        sifre: formData.sifre,
        universite: formData.universite,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, user: json.data || json.user, source: 'mysql' };
    }
  } catch {}

  // 3. Fallback
  return {
    success: true,
    source: 'local',
    user: {
      adSoyad: formData.adSoyad,
      eposta: formData.email,
      universite: formData.universite || 'Beykent Üniversitesi',
      sinif: formData.sinif || 1,
    },
  };
}

/**
 * Öğrenci girişi (POST /api/ogrenci/giris veya http://127.0.0.1:8000/login)
 */
export async function loginStudentToDB(credentials) {
  // 1. Express dene
  try {
    const res = await fetch(`${BASE_URL}/api/ogrenci/giris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, user: json.data, source: 'mysql' };
    }
  } catch {}

  // 2. FastAPI dene
  try {
    const res = await fetch('http://127.0.0.1:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, user: json.data, source: 'mysql' };
    }
  } catch {}

  return {
    success: true,
    user: {
      adSoyad: credentials.email.split('@')[0],
      eposta: credentials.email,
    },
    source: 'local',
  };
}

/**
 * Etkinliğe başvuru gönderme (POST /api/ogrenci/basvuru veya http://127.0.0.1:8000/apply)
 */
export async function submitApplicationToDB(applicationData) {
  // 1. Express dene
  try {
    const res = await fetch(`${BASE_URL}/api/ogrenci/basvuru`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, application: json.data, source: 'mysql' };
    }
  } catch {}

  // 2. FastAPI dene
  try {
    const res = await fetch('http://127.0.0.1:8000/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, application: json.data, source: 'mysql' };
    }
  } catch {}

  return {
    success: true,
    source: 'local',
    application: {
      id: Date.now(),
      etkinlikId: applicationData.etkinlikId,
      durum: 'beklemede',
      basvuruTarihi: new Date().toISOString(),
    },
  };
}


/**
 * Öğrencinin veritabanındaki başvurularını çekme (GET /api/ogrenci/basvurular)
 */
export async function fetchStudentApplicationsFromDB(eposta) {
  if (!eposta) return INITIAL_APPLICATIONS;
  try {
    const res = await fetch(`${BASE_URL}/api/ogrenci/basvurular?eposta=${encodeURIComponent(eposta)}`);
    if (!res.ok) throw new Error('Başvurular çekilemedi');
    const json = await res.json();
    if (Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return INITIAL_APPLICATIONS;
  } catch (err) {
    console.warn('Veritabanından başvurular çekilemedi:', err.message);
    return INITIAL_APPLICATIONS;
  }
}

/**
 * Başvuru iptal etme (DELETE /api/ogrenci/basvurular/:id)
 */
export async function cancelApplicationInDB(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/ogrenci/basvurular/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
