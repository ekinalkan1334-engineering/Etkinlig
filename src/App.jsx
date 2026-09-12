import { useState, useMemo } from 'react'
import './App.css'
import logo from './logo.jpg';
import KesifFilterBar from './components/KesifFilterBar';
import KesifEventGrid from './components/KesifEventGrid';
import kesifEventsData from './data/kesifEventsData';

function App() {
  const [formData, setFormData] = useState({
    adSoyad: '',
    email: '',
    sifre: ''
  });

  // Kayıt başarılı olunca true olacak, keşif ekranını gösterecek
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Keşif ekranındaki filtre state'leri
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [activeLocation, setActiveLocation] = useState("Tüm konumlar");
  const [searchValue, setSearchValue] = useState("");

  // Kullanıcı yazdıkça verileri hafızaya alır (Ekrana basmaz)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Kayıt Başarılı! Şifreniz arka planda güvenle hash'lendi.");
        setFormData({ adSoyad: "", email: "", sifre: "" });
        setIsLoggedIn(true);
      } else {
        alert("Kayıt sırasında bir hata oluştu!");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.");
    }
  };

  // Kategori ve konum listelerini veriden otomatik çıkarıyoruz
  const categories = useMemo(
    () => [...new Set(kesifEventsData.map((event) => event.category))],
    []
  );

  const locations = useMemo(
    () => [...new Set(kesifEventsData.map((event) => event.location))],
    []
  );

  // Kategori + konum + arama filtrelerini birlikte uygulayan liste
  const filteredEvents = useMemo(() => {
    return kesifEventsData.filter((event) => {
      const matchesCategory =
        activeCategory === "Tümü" || event.category === activeCategory;

      const matchesLocation =
        activeLocation === "Tüm konumlar" || event.location === activeLocation;

      const matchesSearch =
        searchValue.trim() === "" ||
        event.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        event.location.toLowerCase().includes(searchValue.toLowerCase());

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [activeCategory, activeLocation, searchValue]);

  const handleDetailClick = (event) => {
    console.log("Detayı görüntülenecek etkinlik:", event);
  };

  // Kayıt başarılıysa keşif ekranını göster
  if (isLoggedIn) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <img src={logo} alt="EtkinLig Logo" style={{ height: "40px" }} />
          <h1 style={{ margin: 0 }}>Etkinlikleri keşfet</h1>
        </div>

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

        <KesifEventGrid events={filteredEvents} onDetailClick={handleDetailClick} />
      </div>
    );
  }

  // Kayıt olunmadıysa arkadaşının giriş/kayıt ekranı gösterilir
  return (
    <div className="split-screen">
      {/* SOL TARAF: Logo ve Tanıtım */}
      <div className="left-side">
        <img src={logo} alt="EtkinLig Logo" className="logo" />
        <h1>EtkinLig'e Hoş Geldin!</h1>
        <p>En heyecanlı etkinlikleri kaçırmamak, yerini hemen ayırtmak için kayıt ol.</p>
      </div>

      {/* SAĞ TARAF: Kayıt Formu */}
      <div className="right-side">
        <div className="form-box">
          <h2>Kayıt Ol</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Ad Soyad</label>
              <input 
                type="text" 
                name="adSoyad" 
                value={formData.adSoyad} 
                onChange={handleChange} 
                placeholder="Örn: Enes Çalışkan" 
                required 
              />
            </div>

            <div className="input-group">
              <label>Üniversite E-posta</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="ogrencinumaran@student.beykent.edu.tr" 
                required 
              />
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <input 
                type="password" 
                name="sifre" 
                value={formData.sifre} 
                onChange={handleChange} 
                placeholder="Güçlü bir şifre belirle" 
                required 
              />
            </div>

            <button type="submit" className="submit-btn">ETKİNLİĞE Kayıt Ol</button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default App
