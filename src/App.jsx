import { useState, useMemo, useEffect } from 'react';
import './App.css';
import logo from './logo.JPG';
import KesifFilterBar from './components/KesifFilterBar';
import KesifEventGrid from './components/KesifEventGrid';
import kesifEventsData from './data/kesifEventsData';
import { etkinlikleriGetir } from './api';

const sirketLogolari = {
  'technobridge': '/etkinlig/admin/firma_gorselleri/technobridge.webp',
  'papara': '/etkinlig/admin/firma_gorselleri/papara-logo.jpg',
  'aselsan': '/etkinlig/admin/firma_gorselleri/aselsan.png',
  'yıldız': '/etkinlig/admin/firma_gorselleri/yildiz_teknoloji.jpeg',
  'yildiz': '/etkinlig/admin/firma_gorselleri/yildiz_teknoloji.jpeg',
  'stm': '/etkinlig/admin/firma_gorselleri/stm.webp',
  'trendyol': '/etkinlig/admin/firma_gorselleri/trendyol.jpeg',
};

function logoBul(sirketAdi) {
  const ad = (sirketAdi || '').toLowerCase();
  for (const [k, v] of Object.entries(sirketLogolari)) {
    if (ad.includes(k)) return v;
  }
  return '/etkinlig/admin/site_img.jpeg';
}

function App() {
  const [etkinlikler, setEtkinlikler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Filtreler
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [activeLocation, setActiveLocation] = useState("Tüm konumlar");
  const [searchValue, setSearchValue] = useState("");

  // Modallar
  const [seciliEtkinlik, setSeciliEtkinlik] = useState(null);
  const [kayitModalAcik, setKayitModalAcik] = useState(false);
  const [kayitBasarili, setKayitBasarili] = useState(false);

  // Kayıt formu state
  const [formData, setFormData] = useState({
    adSoyad: '',
    email: '',
    sifre: ''
  });
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);
  const [kayitHata, setKayitHata] = useState(null);

  // Aktif öğrenci oturumu
  const [ogrenci, setOgrenci] = useState(() => {
    try {
      const kayitli = localStorage.getItem('etkinlig_ogrenci');
      return kayitli ? JSON.parse(kayitli) : null;
    } catch {
      return null;
    }
  });

  // API'den etkinlikleri çek
  useEffect(() => {
    async function yukle() {
      try {
        setYukleniyor(true);
        const veri = await etkinlikleriGetir();
        if (veri && Array.isArray(veri) && veri.length > 0) {
          const cevrilmis = veri.map((e) => ({
            id: e.id,
            kod: e.kod,
            title: e.baslik,
            date: e.baslangic,
            bitis: e.bitis,
            sonBasvuru: e.sonBasvuru,
            location: e.sehir + (e.ilce ? ` · ${e.ilce}` : ''),
            category: e.tur === 'konferans' ? 'Konferans' : e.tur === 'sunum' ? 'Sunum' : 'Hackathon',
            rawTur: e.tur,
            image: e.gorsel || logoBul(e.sirket),
            description: e.aciklama || `${e.sirket} tarafından düzenlenen ${e.tur} etkinliği. Katılımcı kontenjanı sınırlıdır.`,
            sirket: e.sirket,
            kontenjan: e.kontenjan,
            katilimci: e.katilimci,
            kalanKontenjan: e.kalanKontenjan,
            basvuruyaAcik: e.basvuruyaAcik,
          }));
          setEtkinlikler(cevrilmis);
        } else {
          setEtkinlikler(kesifEventsData);
        }
      } catch (err) {
        console.warn('API verisi alınamadı, yedek mock veriler gösteriliyor:', err);
        setEtkinlikler(kesifEventsData);
      } finally {
        setYukleniyor(false);
      }
    }
    yukle();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setKayitYukleniyor(true);
    setKayitHata(null);
    try {
      const response = await fetch("/etkinlig/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data?.data) {
        const profil = { id: data.data.id, adSoyad: data.data.adSoyad, email: data.data.eposta };
        setOgrenci(profil);
        localStorage.setItem('etkinlig_ogrenci', JSON.stringify(profil));
        setKayitBasarili(true);
        setTimeout(() => {
          setKayitModalAcik(false);
          setKayitBasarili(false);
        }, 1500);
      } else {
        setKayitHata(data?.error?.message ?? 'Kayıt sırasında bir hata oluştu');
      }
    } catch {
      // Çevrimdışı / doğrudan simülasyon
      const profil = { id: Date.now(), adSoyad: formData.adSoyad, email: formData.email };
      setOgrenci(profil);
      localStorage.setItem('etkinlig_ogrenci', JSON.stringify(profil));
      setKayitBasarili(true);
      setTimeout(() => {
        setKayitModalAcik(false);
        setKayitBasarili(false);
      }, 1500);
    } finally {
      setKayitYukleniyor(false);
    }
  };

  const cikisYap = () => {
    setOgrenci(null);
    localStorage.removeItem('etkinlig_ogrenci');
  };

  // Kategoriler ve Konumlar
  const categories = useMemo(
    () => [...new Set(etkinlikler.map((event) => event.category))],
    [etkinlikler]
  );

  const locations = useMemo(
    () => [...new Set(etkinlikler.map((event) => event.location))],
    [etkinlikler]
  );

  // Filtrelenmiş liste
  const filteredEvents = useMemo(() => {
    return etkinlikler.filter((event) => {
      const matchesCategory =
        activeCategory === "Tümü" || event.category === activeCategory;

      const matchesLocation =
        activeLocation === "Tüm konumlar" || event.location === activeLocation;

      const matchesSearch =
        searchValue.trim() === "" ||
        event.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        event.location.toLowerCase().includes(searchValue.toLowerCase()) ||
        (event.sirket && event.sirket.toLowerCase().includes(searchValue.toLowerCase()));

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [etkinlikler, activeCategory, activeLocation, searchValue]);

  return (
    <div className="sayfa">
      {/* ÜST ÇUBUK / NAVİGASYON */}
      <header className="ust">
        <a href="/etkinlig/" className="marka">
          <img src={logo} alt="EtkinLig Logo" />
          <span>EtkinLig</span>
        </a>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="/etkinlig/admin/"
            className="cip"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Yönetici Paneli</span>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>↗</span>
          </a>

          {ogrenci ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                👤 {ogrenci.adSoyad}
              </span>
              <button
                type="button"
                onClick={cikisYap}
                className="cip"
                style={{ height: "34px", padding: "0 12px", fontSize: "12.5px" }}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ust__kayit"
              onClick={() => setKayitModalAcik(true)}
            >
              Kayıt Ol / Giriş
            </button>
          )}
        </div>
      </header>

      {/* KAHRAMAN BÖLÜMÜ */}
      <section className="kahraman">
        <span className="kahraman__etiket">🎓 Üniversiteliler İçin Etkinlik Platformu</span>
        <h1>Kariyerini şekillendirecek <em>etkinlikleri</em> hemen keşfet.</h1>
        <p className="kahraman__alt">
          Savunma sanayiinden finteche, yapay zekâ atölyelerinden 48 saatlik hackathonlara kadar
          Türkiye'nin lider teknoloji şirketlerinin kampüs etkinliklerine katıl.
        </p>
      </section>

      {/* FİLTRELEME ÇUBUĞU */}
      <div style={{ padding: "0 clamp(16px, 5vw, 56px) 16px" }}>
        <KesifFilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          locations={locations}
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      {/* ETKİNLİK LİSTESİ */}
      <main className="icerik">
        <div className="icerik__ust">
          <h2>Etkinlikler</h2>
          <span className="icerik__sayi">
            {yukleniyor ? 'Yükleniyor…' : `${filteredEvents.length} etkinlik listeleniyor`}
          </span>
        </div>

        <KesifEventGrid
          events={filteredEvents}
          onDetailClick={(event) => setSeciliEtkinlik(event)}
        />
      </main>

      {/* ETKİNLİK DETAY MODALI */}
      {seciliEtkinlik && (
        <div className="ortu" onClick={() => setSeciliEtkinlik(null)}>
          <div className="pencere" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pencere__kapat"
              onClick={() => setSeciliEtkinlik(null)}
              aria-label="Kapat"
            >
              ×
            </button>

            {seciliEtkinlik.image && (
              <img
                src={seciliEtkinlik.image}
                alt={seciliEtkinlik.title}
                className="pencere__kapak"
              />
            )}

            <div className="pencere__govde">
              <div className="pencere__ust">
                <span className="kesif-event-card__tag" style={{ position: "static" }}>
                  {seciliEtkinlik.category}
                </span>
                {seciliEtkinlik.kod && (
                  <span className="pencere__kod">{seciliEtkinlik.kod}</span>
                )}
              </div>

              <h2>{seciliEtkinlik.title}</h2>
              {seciliEtkinlik.sirket && (
                <p className="pencere__sirket">🏢 {seciliEtkinlik.sirket}</p>
              )}

              <div className="kunye">
                <div>
                  <span>Tarih</span>
                  <strong>{new Date(seciliEtkinlik.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
                <div>
                  <span>Saat</span>
                  <strong>{new Date(seciliEtkinlik.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
                <div>
                  <span>Konum</span>
                  <strong>{seciliEtkinlik.location}</strong>
                </div>
                {seciliEtkinlik.kontenjan && (
                  <div>
                    <span>Kontenjan</span>
                    <strong>{seciliEtkinlik.kalanKontenjan ?? seciliEtkinlik.kontenjan} kişilik yer</strong>
                  </div>
                )}
              </div>

              <div className="pencere__bolum">
                <h3>Etkinlik Hakkında</h3>
                <p className="pencere__aciklama">{seciliEtkinlik.description}</p>
              </div>

              <div className="pencere__dip">
                {seciliEtkinlik.sonBasvuru && (
                  <span className="pencere__sonBasvuru">
                    Son başvuru: {new Date(seciliEtkinlik.sonBasvuru).toLocaleDateString('tr-TR')}
                  </span>
                )}
                <button
                  type="button"
                  className="pencere__katil"
                  onClick={() => {
                    if (!ogrenci) {
                      setKayitModalAcik(true);
                    } else {
                      alert(`Tebrikler ${ogrenci.adSoyad}! "${seciliEtkinlik.title}" etkinliğine başvurunuz başarıyla alındı.`);
                      setSeciliEtkinlik(null);
                    }
                  }}
                >
                  {ogrenci ? 'Hemen Başvur' : 'Başvurmak İçin Giriş Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KAYIT / GİRİŞ MODALI */}
      {kayitModalAcik && (
        <div className="ortu" onClick={() => setKayitModalAcik(false)}>
          <div
            className="pencere"
            style={{ maxWidth: "460px", padding: "32px 28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pencere__kapat"
              onClick={() => setKayitModalAcik(false)}
            >
              ×
            </button>

            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <img src={logo} alt="EtkinLig" style={{ width: "48px", borderRadius: "12px", marginBottom: "10px" }} />
              <h2 style={{ margin: "0 0 6px", fontFamily: "var(--display)", fontSize: "24px" }}>EtkinLig'e Katıl</h2>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: "14px" }}>
                Etkinliklere anında başvurmak için hesabını oluştur veya giriş yap.
              </p>
            </div>

            {kayitBasarili ? (
              <div style={{ padding: "24px", background: "var(--sunum-tint)", border: "1px solid var(--sunum-line)", borderRadius: "12px", textAlign: "center", color: "var(--sunum-deep)" }}>
                <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}>✓ Hoş Geldin!</strong>
                <span>Kayıt başarılı, yönlendiriliyorsunuz…</span>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {kayitHata && (
                  <div style={{ padding: "10px 14px", background: "var(--konferans-tint)", border: "1px solid var(--konferans-line)", borderRadius: "8px", color: "var(--konferans-deep)", fontSize: "13.5px" }}>
                    {kayitHata}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink-2)" }}>Ad Soyad</label>
                  <input
                    type="text"
                    name="adSoyad"
                    value={formData.adSoyad}
                    onChange={handleChange}
                    placeholder="Adınız Soyadınız"
                    required
                    style={{ width: "100%", height: "42px", padding: "0 14px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--surface)", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink-2)" }}>Üniversite E-posta</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@ogrenci.edu.tr"
                    required
                    style={{ width: "100%", height: "42px", padding: "0 14px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--surface)", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink-2)" }}>Şifre</label>
                  <input
                    type="password"
                    name="sifre"
                    value={formData.sifre}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    style={{ width: "100%", height: "42px", padding: "0 14px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--surface)", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={kayitYukleniyor}
                  className="ust__kayit"
                  style={{ width: "100%", height: "44px", marginTop: "8px", fontSize: "15px" }}
                >
                  {kayitYukleniyor ? 'Kaydediliyor…' : 'Giriş Yap / Kayıt Ol'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ALT BİLGİ (FOOTER) */}
      <footer className="alt">
        <span>© 2026 EtkinLig. Tüm hakları saklıdır.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="/etkinlig/admin/" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Yönetici Girişi</a>
          <span>·</span>
          <span>Üniversite Etkinlik Portalı</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
