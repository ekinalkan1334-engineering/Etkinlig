import React, { useState } from 'react';
import AppIcon from './AppIcon';
import { registerStudentToDB, loginStudentToDB } from '../services/api';

export default function AuthModal({
  initialMode = 'kayit', // 'kayit' | 'giris'
  onClose,
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    adSoyad: '',
    email: '',
    sifre: '',
    universite: 'Beykent Üniversitesi',
  });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    if (mode === 'kayit' && !formData.adSoyad.trim()) {
      setHata('Lütfen ad ve soyadınızı girin.');
      setYukleniyor(false);
      return;
    }

    if (!formData.email.trim() || !formData.sifre) {
      setHata('E-posta ve şifre zorunludur.');
      setYukleniyor(false);
      return;
    }

    try {
      if (mode === 'kayit') {
        const res = await registerStudentToDB({
          adSoyad: formData.adSoyad,
          email: formData.email,
          sifre: formData.sifre,
          universite: formData.universite,
        });

        const userObj = {
          adSoyad: res.user?.adSoyad || formData.adSoyad,
          eposta: res.user?.eposta || formData.email,
          universite: res.user?.universite || formData.universite,
          bolum: 'Bilgisayar Mühendisliği',
          sinif: 3,
          ortalama: '3.20',
        };
        onAuthSuccess(userObj, 'Veritabanına kayıt başarılı! Hoş geldin.');
      } else {
        const res = await loginStudentToDB({
          email: formData.email,
          sifre: formData.sifre,
        });

        const userObj = {
          adSoyad: res.user?.adSoyad || formData.email.split('@')[0],
          eposta: res.user?.eposta || formData.email,
          universite: res.user?.universite || 'Beykent Üniversitesi',
          bolum: res.user?.bolum || 'Bilgisayar Mühendisliği',
          sinif: res.user?.sinif || 3,
          ortalama: res.user?.ortalama || '3.20',
        };
        onAuthSuccess(userObj, 'Veritabanı oturumu açıldı.');
      }

      setYukleniyor(false);
      onClose();
    } catch (err) {
      setHata(err.message || 'Giriş sırasında bir hata oluştu');
      setYukleniyor(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '0' }}
      >
        {/* Üst Bar */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--r-md)',
                background: 'var(--konferans)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon ad="takvim" boyut={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800 }}>
                etkinlig
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                öğrenci portalı
              </div>
            </div>
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
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
              {mode === 'kayit' ? "EtkinLig'e Kayıt Ol" : 'Öğrenci Girişi'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {mode === 'kayit'
                ? 'Üniversite e-postanla kaydol, kontenjanları kaçırma ve etkinlik biletlerini yönet.'
                : 'Kayıtlı üniversite e-postan ve şifrenle oturum aç.'}
            </p>
          </div>

          {hata && (
            <div
              style={{
                padding: '10px 14px',
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

          {mode === 'kayit' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={formData.adSoyad}
                onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                placeholder="Örn: Enes Çalışkan"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '14px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Üniversite E-postası
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ogrencinumarasi@student.edu.tr"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                fontSize: '14px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Şifre
            </label>
            <input
              type="password"
              required
              value={formData.sifre}
              onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
              placeholder="Güçlü bir şifre girin"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                fontSize: '14px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            {mode === 'kayit' && (
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--ink-3)', marginTop: '4px' }}>
                Şifreniz arka planda bcrypt ile geri döndürülemez şekilde hash'lenir.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="btn btn--birincil btn--lg"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {yukleniyor
              ? 'Lütfen bekleyin...'
              : mode === 'kayit'
              ? 'ETKİNLİĞE Kayıt Ol'
              : 'Giriş Yap'}
          </button>

          {/* Mod Değiştirme */}
          <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--ink-2)' }}>
            {mode === 'kayit' ? (
              <>
                Zaten bir hesabın var mı?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHata('');
                    setMode('giris');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--konferans-deep)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Giriş Yap
                </button>
              </>
            ) : (
              <>
                Henüz hesabın yok mu?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHata('');
                    setMode('kayit');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--konferans-deep)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Hemen Kayıt Ol
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
