import React from 'react';
import AppIcon from './AppIcon';

export default function Navbar({
  user,
  applicationCount = 0,
  dbStatus = { connected: false, db: false },
  onCheckDb,
  onOpenAuth,
  onOpenApplications,
  onLogout,
  onScrollToSection,
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(252, 248, 241, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Sol: Logo & DB Durumu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--r-md)',
                background: 'var(--konferans)',
                color: 'var(--paper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(201, 89, 61, 0.28)',
              }}
            >
              <AppIcon ad="takvim" boyut={20} kalinlik={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                }}
              >
                etkinlig
              </span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-3)', letterSpacing: '0.01em' }}>
                öğrenci platformu
              </span>
            </div>
          </div>

          {/* Veritabanı Durum Rozeti */}
          <div
            onClick={onCheckDb}
            title={
              dbStatus.db
                ? 'MySQL Veritabanı (etkinlig) aktif ve bağlı.'
                : 'MySQL API sunucusuna bağlanılamadı. Tıklayarak tekrar deneyin (npm run server:dev).'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: dbStatus.db ? 'var(--sunum-tint)' : 'var(--paper-2)',
              border: `1px solid ${dbStatus.db ? 'var(--sunum-line)' : 'var(--line)'}`,
              color: dbStatus.db ? 'var(--sunum-deep)' : 'var(--ink-3)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dbStatus.db ? 'var(--sunum)' : 'var(--ink-3)',
              }}
            />
            <span>{dbStatus.db ? 'MySQL: Bağlı' : 'MySQL: Çevrimdışı'}</span>
          </div>
        </div>

        {/* Orta: Linkler */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-nav">
          <button
            onClick={() => onScrollToSection('events-section')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink-2)',
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--ink-2)')}
          >
            Etkinlikleri Keşfet
          </button>
          <button
            onClick={() => onScrollToSection('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink-2)',
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--ink-2)')}
          >
            Nasıl Çalışır?
          </button>
          <button
            onClick={() => onScrollToSection('partners')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink-2)',
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--ink-2)')}
          >
            Şirketler & Üniversiteler
          </button>
        </nav>

        {/* Sağ: Aksiyonlar & Hesap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Başvurularım Butonu */}
          <button
            type="button"
            onClick={onOpenApplications}
            className="btn btn--hayalet"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <AppIcon ad="gelen" boyut={17} />
            <span>Başvurularım</span>
            {applicationCount > 0 && (
              <span
                style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '999px',
                  background: 'var(--konferans)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {applicationCount}
              </span>
            )}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px 5px 6px',
                  borderRadius: '999px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                }}
              >
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--hackathon-tint)',
                    border: '1px solid var(--hackathon-line)',
                    color: 'var(--hackathon-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {user.adSoyad
                    ? user.adSoyad
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'ÖG'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {user.adSoyad}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn--sm btn--hayalet"
                title="Çıkış yap"
                style={{ color: 'var(--ink-3)' }}
              >
                <AppIcon ad="capraz" boyut={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn--hayalet btn--sm"
                onClick={() => onOpenAuth('giris')}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className="btn btn--birincil btn--sm"
                onClick={() => onOpenAuth('kayit')}
              >
                Kayıt Ol
              </button>
            </div>
          )}

          {/* Admin Panel Bağlantısı Kısayolu */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            title="Yönetim Paneline Git"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              marginLeft: '4px',
            }}
          >
            <AppIcon ad="ayar" boyut={17} />
          </a>
        </div>
      </div>
    </header>
  );
}

