import { useState } from 'react';
import './KayitFormu.css';
import logo from './logo.JPG';

/** Önceki kayıt ekranı — vitrinden "Kayıt ol" ile açılır. */
export default function KayitFormu({ onGeri }) {
  const [formData, setFormData] = useState({ adSoyad: '', email: '', sifre: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      await response.json();
      if (response.ok) {
        alert("Kayıt Başarılı! Şifreniz arka planda güvenle hash'lendi.");
        setFormData({ adSoyad: '', email: '', sifre: '' });
      } else {
        alert('Kayıt sırasında bir hata oluştu!');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.');
    }
  };

  return (
    <div className="split-screen">
      <div className="left-side">
        {onGeri && (
          <button type="button" className="geri-dugmesi" onClick={onGeri}>← Etkinliklere dön</button>
        )}
        <img src={logo} alt="EtkinLig Logo" className="logo" />
        <h1>EtkinLig&apos;e Hoş Geldin!</h1>
        <p>En heyecanlı etkinlikleri kaçırmamak, yerini hemen ayırtmak için kayıt ol.</p>
      </div>

      <div className="right-side">
        <div className="form-box">
          <h2>Kayıt Ol</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Ad Soyad</label>
              <input
                type="text" name="adSoyad" value={formData.adSoyad}
                onChange={handleChange} placeholder="Örn: Enes Çalışkan" required
              />
            </div>

            <div className="input-group">
              <label>Üniversite E-posta</label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="ogrencinumaran@student.beykent.edu.tr" required
              />
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <input
                type="password" name="sifre" value={formData.sifre}
                onChange={handleChange} placeholder="Güçlü bir şifre belirle" required
              />
            </div>

            <button type="submit" className="submit-btn">ETKİNLİĞE Kayıt Ol</button>
          </form>
        </div>
      </div>
    </div>
  );
}
