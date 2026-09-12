import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import EventFilterBar from './components/EventFilterBar';
import EventCard from './components/EventCard';
import EventDetailModal from './components/EventDetailModal';
import ApplicationModal from './components/ApplicationModal';
import MyApplicationsModal from './components/MyApplicationsModal';
import AuthModal from './components/AuthModal';
import HowItWorks from './components/HowItWorks';
import PartnersSection from './components/PartnersSection';
import Footer from './components/Footer';
import AppIcon from './components/AppIcon';
import { INITIAL_EVENTS, INITIAL_APPLICATIONS } from './data/mockEvents';
import {
  checkDatabaseHealth,
  fetchEventsFromDB,
  fetchStudentApplicationsFromDB,
  submitApplicationToDB,
  cancelApplicationInDB,
} from './services/api';

export default function App() {
  // Veritabanı Bağlantı Durumu (Express + MySQL)
  const [dbStatus, setDbStatus] = useState({ connected: false, db: false });

  // Veri Durumları
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('etkinlig_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('etkinlig_apps');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('etkinlig_user');
      return saved
        ? JSON.parse(saved)
        : {
            adSoyad: 'Enes Çalışkan',
            eposta: 'enes.caliskan@student.beykent.edu.tr',
            universite: 'Beykent Üniversitesi',
            bolum: 'Bilgisayar Mühendisliği',
            sinif: 3,
            ortalama: '3.42',
          };
    } catch {
      return null;
    }
  });

  // Filtreler & Sıralama
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliTur, setSeciliTur] = useState(''); // '' | 'konferans' | 'hackathon' | 'sunum'
  const [seciliSehir, setSeciliSehir] = useState('');
  const [seciliSinif, setSeciliSinif] = useState('');
  const [siralama, setSiralama] = useState('yaklasan');
  const [gorunumTuru, setGorunumTuru] = useState('grid');

  // Modallar
  const [detailEvent, setDetailEvent] = useState(null);
  const [applyEvent, setApplyEvent] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'kayit' });

  // Toast Bildirimleri
  const [toasts, setToasts] = useState([]);

  const addToast = (mesaj, tip = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, mesaj, tip }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Veritabanı Sağlık Kontrolü ve Canlı Veri Çekme
  const checkAndLoadDatabase = useCallback(async () => {
    const health = await checkDatabaseHealth();
    setDbStatus(health);

    if (health.db) {
      // MySQL veritabanından güncel etkinlikleri yükle
      const dbEvents = await fetchEventsFromDB();
      if (dbEvents.success && dbEvents.data?.length > 0) {
        setEvents(dbEvents.data);
      }

      // Kullanıcının veritabanındaki kayıtlı başvurularını yükle
      if (user?.eposta) {
        const dbApps = await fetchStudentApplicationsFromDB(user.eposta);
        if (dbApps && dbApps.length > 0) {
          setApplications(dbApps);
        }
      }
    }
  }, [user?.eposta]);

  useEffect(() => {
    checkAndLoadDatabase();
  }, [checkAndLoadDatabase]);

  // Veri değiştikçe localStorage'a da yedekle
  useEffect(() => {
    try {
      localStorage.setItem('etkinlig_events', JSON.stringify(events));
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('etkinlig_apps', JSON.stringify(applications));
    } catch {}
  }, [applications]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('etkinlig_user', JSON.stringify(user));
      else localStorage.removeItem('etkinlig_user');
    } catch {}
  }, [user]);

  // Filtreleme & Sıralama Pipeline
  const filtrelenmisEtkinlikler = useMemo(() => {
    return events
      .filter((item) => {
        // Arama metni kontrolü
        if (aramaMetni.trim()) {
          const query = aramaMetni.toLowerCase();
          const matchesTitle = item.baslik.toLowerCase().includes(query);
          const matchesCompany = item.sirket.toLowerCase().includes(query);
          const matchesCity = item.sehir.toLowerCase().includes(query);
          const matchesDesc = (item.aciklama || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesCompany && !matchesCity && !matchesDesc) return false;
        }

        // Tür filtresi
        if (seciliTur && item.tur !== seciliTur) return false;

        // Şehir filtresi
        if (seciliSehir && item.sehir !== seciliSehir) return false;

        // Sınıf filtresi
        if (seciliSinif !== '' && item.sartlar?.siniflar?.length > 0) {
          if (!item.sartlar.siniflar.includes(Number(seciliSinif))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (siralama === 'yaklasan') {
          return new Date(a.baslangic) - new Date(b.baslangic);
        }
        if (siralama === 'populer') {
          return (b.basvuruSayisi || 0) - (a.basvuruSayisi || 0);
        }
        if (siralama === 'kontenjan') {
          const aKalan = (a.kontenjan || 0) - (a.onayliSayisi || 0);
          const bKalan = (b.kontenjan || 0) - (b.onayliSayisi || 0);
          return bKalan - aKalan;
        }
        if (siralama === 'alfabetik') {
          return a.baslik.localeCompare(b.baslik, 'tr');
        }
        return 0;
      });
  }, [events, aramaMetni, seciliTur, seciliSehir, seciliSinif, siralama]);

  // Başvuru yapma aksiyonu (MySQL Veritabanına Yazar)
  const handleApplySubmit = async (appData) => {
    // 1. MySQL veritabanına kaydet
    const res = await submitApplicationToDB(appData);

    // 2. Yeni başvuru kaydını yerel duruma ekle
    const newApp = {
      id: res.application?.id || Date.now(),
      etkinlikId: appData.etkinlikId,
      etkinlikBaslik: appData.etkinlikBaslik,
      etkinlikTur: appData.etkinlikTur,
      tarih: appData.tarih,
      sehir: appData.sehir,
      yer: appData.yer,
      sirket: appData.sirket,
      durum: 'beklemede',
      basvuruTarihi: new Date().toISOString().slice(0, 16).replace('T', ' '),
      not: 'Ön başvurunuz veritabanına kaydedildi. Organizatör incelemesi bekleniyor.',
    };

    setApplications((prev) => [newApp, ...prev]);

    // 3. Etkinliğin sayaçlarını güncelle
    setEvents((prev) =>
      prev.map((e) =>
        e.id === appData.etkinlikId
          ? {
              ...e,
              basvuruSayisi: (e.basvuruSayisi || 0) + 1,
              onayliSayisi: Math.min(e.kontenjan, (e.onayliSayisi || 0) + 1),
            }
          : e
      )
    );

    setApplyEvent(null);
    addToast(
      res.source === 'mysql'
        ? `"${appData.etkinlikBaslik}" başvurunuz MySQL veritabanına kaydedildi!`
        : `"${appData.etkinlikBaslik}" için başvurunuz başarıyla alındı!`
    );
  };

  // Başvuruyu geri çekme / iptal etme (MySQL'den Siler)
  const handleCancelApplication = async (appId) => {
    const target = applications.find((a) => a.id === appId);
    if (!target) return;

    if (window.confirm(`"${target.etkinlikBaslik}" etkinliği başvurunuzu iptal etmek istiyor musunuz?`)) {
      await cancelApplicationInDB(appId);

      setApplications((prev) => prev.filter((a) => a.id !== appId));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === target.etkinlikId
            ? { ...e, onayliSayisi: Math.max(0, (e.onayliSayisi || 1) - 1) }
            : e
        )
      );
      addToast('Başvurunuz veritabanından iptal edildi.', 'error');
    }
  };

  // Sayfa kaydırma kısayolu
  const handleScrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Üst Gezinme Çubuğu & Canlı DB Rozeti */}
      <Navbar
        user={user}
        applicationCount={applications.length}
        dbStatus={dbStatus}
        onCheckDb={checkAndLoadDatabase}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenApplications={() => setShowApplicationsModal(true)}
        onLogout={() => {
          setUser(null);
          addToast('Çıkış yapıldı.');
        }}
        onScrollToSection={handleScrollToSection}
      />

      {/* 2. Hero Karşılama Alanı */}
      <HeroSection
        stats={{ etkinlik: events.length, basvuru: 1450 + applications.length, universite: 18 }}
        aramaMetni={aramaMetni}
        onAramaDegisti={setAramaMetni}
        seciliTur={seciliTur}
        onTurSec={setSeciliTur}
        onScrollToEvents={() => handleScrollToSection('events-section')}
      />

      {/* 3. Ana Etkinlik Keşif Alanı */}
      <main id="events-section" style={{ flex: 1, padding: '48px 0 72px' }}>
        <div className="container">
          {/* Bölüm Başlığı & DB Bilgisi */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--konferans-deep)',
                }}
              >
                Katalog
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  marginTop: '4px',
                }}
              >
                Aktif ve Yaklaşan Etkinlikler
              </h2>
            </div>

            {dbStatus.db && (
              <span style={{ fontSize: '12px', color: 'var(--sunum-deep)', fontWeight: 600 }}>
                ✓ Veriler MySQL veritabanı ile senkronize
              </span>
            )}
          </div>

          {/* Filtre Barı */}
          <EventFilterBar
            toplamSayi={filtrelenmisEtkinlikler.length}
            seciliTur={seciliTur}
            onTurSec={setSeciliTur}
            seciliSehir={seciliSehir}
            onSehirSec={setSeciliSehir}
            seciliSinif={seciliSinif}
            onSinifSec={setSeciliSinif}
            siralama={siralama}
            onSiralamaSec={setSiralama}
            gorunumTuru={gorunumTuru}
            onGorunumDegis={setGorunumTuru}
          />

          {/* Etkinlik Listesi / Izgara */}
          {filtrelenmisEtkinlikler.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--paper-2)',
                  color: 'var(--ink-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AppIcon ad="ara" boyut={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                Kriterlere uygun etkinlik bulunamadı
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-2)', maxWidth: '400px', margin: '0 auto 18px' }}>
                Arama kelimenizi veya şehir/tür filtrelerini sıfırlayarak tüm etkinlikleri tekrar listeleyebilirsiniz.
              </p>
              <button
                type="button"
                className="btn btn--hayalet"
                onClick={() => {
                  setAramaMetni('');
                  setSeciliTur('');
                  setSeciliSehir('');
                  setSeciliSinif('');
                }}
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : gorunumTuru === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px',
              }}
            >
              {filtrelenmisEtkinlikler.map((item) => (
                <EventCard
                  key={item.id}
                  event={item}
                  hasApplied={applications.some((a) => a.etkinlikId === item.id)}
                  onSelectEvent={(e) => setDetailEvent(e)}
                  onApply={(e) => setApplyEvent(e)}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtrelenmisEtkinlikler.map((item) => (
                <EventCard
                  key={item.id}
                  event={item}
                  hasApplied={applications.some((a) => a.etkinlikId === item.id)}
                  onSelectEvent={(e) => setDetailEvent(e)}
                  onApply={(e) => setApplyEvent(e)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 4. Nasıl Çalışır Bölümü */}
      <HowItWorks />

      {/* 5. Partner Şirketler & Üniversiteler */}
      <PartnersSection />

      {/* 6. Alt Bilgi (Footer) */}
      <Footer
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onScrollToSection={handleScrollToSection}
      />

      {/* MODALLAR */}

      {/* Etkinlik Detay Modalı */}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          hasApplied={applications.some((a) => a.etkinlikId === detailEvent.id)}
          onClose={() => setDetailEvent(null)}
          onApply={(e) => setApplyEvent(e)}
        />
      )}

      {/* Başvuru Modalı (MySQL'e yazar) */}
      {applyEvent && (
        <ApplicationModal
          event={applyEvent}
          user={user}
          onClose={() => setApplyEvent(null)}
          onSubmitApplication={handleApplySubmit}
        />
      )}

      {/* Başvurularım Modalı (MySQL'den listeler) */}
      {showApplicationsModal && (
        <MyApplicationsModal
          applications={applications}
          onClose={() => setShowApplicationsModal(false)}
          onCancelApplication={handleCancelApplication}
          onExploreEvents={() => handleScrollToSection('events-section')}
        />
      )}

      {/* Giriş & Kayıt Modalı (MySQL'e yazar) */}
      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: 'kayit' })}
          onAuthSuccess={(newUser, message) => {
            setUser(newUser);
            addToast(message);
          }}
        />
      )}

      {/* Toast Bildirimleri */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tip}`}>
            <AppIcon ad={t.tip === 'success' ? 'onay' : 'uyari'} boyut={18} />
            <span>{t.mesaj}</span>
          </div>
        ))}
      </div>
    </div>
  );
}