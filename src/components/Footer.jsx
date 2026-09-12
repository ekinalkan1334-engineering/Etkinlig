import React from 'react';
import AppIcon from './AppIcon';

export default function Footer({ onOpenAuth, onScrollToSection }) {
  return (
    <footer
      style={{
        background: 'var(--paper-2)',
        borderTop: '1px solid var(--line)',
        padding: '56px 0 32px',
        color: 'var(--ink-2)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '48px',
          }}
        >
          {/* Marka & Tanıtım */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--konferans)',
                  color: 'var(--paper)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon ad="takvim" boyut={18} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  letterSpacing: '-0.025em',
                }}
              >
                etkinlig
              </span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: '280px' }}>
              Üniversite öğrencileri ve teknoloji toplulukları için modern, şeffaf ve resmi etkinlik yönetim platformu.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="btn btn--sm"
                style={{ fontSize: '12px' }}
              >
                <AppIcon ad="panel" boyut={14} />
                <span>Yönetici Paneli</span>
              </a>
            </div>
          </div>

          {/* Etkinlik Türleri */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Etkinlikler
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('events')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Tüm Etkinlikler
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('events')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Yapay Zeka & Konferanslar
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('events')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Fintech & Kodlama Hackathonları
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('events')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Savunma Sanayii Kariyer Sunumları
                </button>
              </li>
            </ul>
          </div>

          {/* Öğrenci Portalı */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Öğrenci Portalı
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('kayit')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Öğrenci Kaydı Aç
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('giris')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Giriş Yap
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('how-it-works')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Ön Katılım Şartları Rehberi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('how-it-works')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}
                >
                  Katılım Sertifikası Alma
                </button>
              </li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform & Güvenlik
            </h4>
            <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--ink-3)' }}>
              Parolalar arka planda tek yönlü bcrypt (cost 10) algoritmasıyla korunur. Katılımcı verileri yalnızca etkinlik organizasyonu amacıyla işlenir.
            </p>
            <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--ink-3)' }}>
              Node/Express & Vue 3 & React 19 Mimari
            </div>
          </div>
        </div>

        {/* Alt Çizgi & Telif */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px',
            color: 'var(--ink-3)',
          }}
        >
          <div>
            © {new Date().getFullYear()} etkinlig. Tüm hakları saklıdır.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Kullanım Koşulları</span>
            <span>Gizlilik Politikası</span>
            <span>KVKK Aydınlatma Metni</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
