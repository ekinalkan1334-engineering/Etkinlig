import React, { useState, useEffect } from 'react';
import AppIcon from './AppIcon';
import { BOLUMLER, SINIFLAR } from '../data/mockEvents';

export default function ApplicationModal({
  event,
  user,
  onClose,
  onSubmitApplication,
}) {
  const [formData, setFormData] = useState({
    adSoyad: user?.adSoyad || '',
    eposta: user?.eposta || '',
    universite: user?.universite || 'Beykent Üniversitesi',
    bolum: user?.bolum || 'Bilgisayar Mühendisliği',
    sinif: user?.sinif !== undefined ? user.sinif : 3,
    ortalama: user?.ortalama || '3.20',
    belgeLink: '',
    not: '',
  });

  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        adSoyad: user.adSoyad || prev.adSoyad,
        eposta: user.eposta || prev.eposta,
        universite: user.universite || prev.universite,
        bolum: user.bolum || prev.bolum,
      }));
    }
  }, [user]);

  if (!event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setHata('');

    if (!formData.adSoyad.trim() || !formData.eposta.trim()) {
      setHata('Lütfen ad soyad ve e-posta alanlarını doldurun.');
      return;
    }

    if (event.sartlar?.minOrtalama) {
      const gpa = parseFloat(formData.ortalama);
      if (isNaN(gpa) || gpa < event.sartlar.minOrtalama) {
        setHata(
          `Bu etkinlik için asgari genel not ortalaması ${event.sartlar.minOrtalama.toFixed(2)} olarak belirlenmiştir.`
        );
        return;
      }
    }

    setGonderiliyor(true);
    setTimeout(() => {
      onSubmitApplication({
        etkinlikId: event.id,
        etkinlikBaslik: event.baslik,
        etkinlikTur: event.tur,
        tarih: event.baslangic,
        sehir: event.sehir,
        yer: event.adres,
        sirket: event.sirket,
        ogrenciAdSoyad: formData.adSoyad,
        ogrenciEposta: formData.eposta,
        universite: formData.universite,
        bolum: formData.bolum,
        sinif: formData.sinif,
        ortalama: formData.ortalama,
        belgeLink: formData.belgeLink,
      });
      setGonderiliyor(false);
    }, 450);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', padding: '0' }}
      >
        {/* Başlık */}
        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--konferans-deep)' }}>
              Etkinlik Başvurusu
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: 'var(--ink)' }}>
              {event.baslik}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--hayalet btn--sm"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <AppIcon ad="capraz" boyut={18} />
          </button>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hata && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                background: 'var(--konferans-tint)',
                border: '1px solid var(--konferans-line)',
                color: 'var(--konferans-deep)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {hata}
            </div>
          )}

          {/* Ad Soyad & E-posta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Ad Soyad <span style={{ color: 'var(--konferans)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.adSoyad}
                onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                placeholder="Örn: Enes Çalışkan"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Üniversite E-postası <span style={{ color: 'var(--konferans)' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.eposta}
                onChange={(e) => setFormData({ ...formData, eposta: e.target.value })}
                placeholder="ogrenci@student.edu.tr"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Üniversite & Bölüm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Üniversite
              </label>
              <input
                type="text"
                required
                value={formData.universite}
                onChange={(e) => setFormData({ ...formData, universite: e.target.value })}
                placeholder="Örn: ODTÜ, Beykent, İTÜ"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Bölüm
              </label>
              <select
                value={formData.bolum}
                onChange={(e) => setFormData({ ...formData, bolum: e.target.value })}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              >
                {BOLUMLER.map((b) => (
                  <option key={b.id} value={b.ad}>
                    {b.ad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sınıf & Ortalama */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Sınıf
              </label>
              <select
                value={formData.sinif}
                onChange={(e) => setFormData({ ...formData, sinif: Number(e.target.value) })}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              >
                {SINIFLAR.map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Genel Not Ortalaması (GPA)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={formData.ortalama}
                onChange={(e) => setFormData({ ...formData, ortalama: e.target.value })}
                placeholder="Örn: 3.20"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Belge & GitHub Linki */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              {event.sartlar?.belgeZorunlu ? 'Öğrenci Belgesi / Doğrulama Kodu *' : 'GitHub / LinkedIn / CV Bağlantısı'}
            </label>
            <input
              type="text"
              required={event.sartlar?.belgeZorunlu}
              value={formData.belgeLink}
              onChange={(e) => setFormData({ ...formData, belgeLink: e.target.value })}
              placeholder={
                event.sartlar?.belgeZorunlu
                  ? 'e-Devlet belge barkod numarası veya doğrulama linki'
                  : 'https://github.com/kullaniciadi veya portfolyo linkiniz'
              }
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                fontSize: '13.5px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>

          {/* Bilgilendirme Notu */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              fontSize: '12.5px',
              color: 'var(--ink-2)',
              lineHeight: 1.45,
            }}
          >
            ✦ Başvurunuz alındıktan sonra etkinlik organizatörü tarafından incelenecek ve onaylandığında tarafınıza SMS/e-posta ile giriş karekodu gönderilecektir.
          </div>

          {/* Aksiyon Butonları */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn--hayalet">
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={gonderiliyor}
              className="btn btn--birincil"
              style={{ minWidth: '160px' }}
            >
              {gonderiliyor ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
