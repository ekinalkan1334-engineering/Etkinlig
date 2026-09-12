import { useState } from 'react'
import './App.css'

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
    <div className="container">
      <div className="form-box">
        <h2>EtkinLig'e Katıl</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="input-group">
            <label>Ad Soyad</label>
            <input type="text" name="adSoyad" placeholder="Örn: Enes Çalışkan" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Üniversite E-posta</label>
            <input type="email" name="email" placeholder="ogrencinumaran@student.beykent.edu.tr" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Şifre</label>
            {/* type="password" özelliği şifrenin ekranda yıldız/nokta olarak görünmesini sağlar */}
            <input type="password" name="sifre" placeholder="Güçlü bir şifre belirle" onChange={handleChange} required />
          </div>

          <button type="submit" className="btn">ETKİNLİGE Kayıt Ol</button>
        </form>
      </div>
    </div>
  )
}

export default App