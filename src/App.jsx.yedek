import { useState } from 'react'
import './App.css'
import logo from './logo.jpg';

function App() {
  const [formData, setFormData] = useState({
    adSoyad: '',
    email: '',
    sifre: ''
  });

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
      } else {
        alert("Kayıt sırasında bir hata oluştu!");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.");
    }
  };

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