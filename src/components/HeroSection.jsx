import React from 'react';
import AppIcon from './AppIcon';

export default function HeroSection({
  stats = { etkinlik: 24, basvuru: 1450, universite: 18 },
  aramaMetni,
  onAramaDegisti,
  seciliTur,
  onTurSec,
  onScrollToEvents,
}) {
  return (
    <section
      style={{
        paddingTop: '64px',
        paddingBottom: '56px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--line)',
        background: 'linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%)',
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Üst Rozet */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--konferans-tint)',
              border: '1px solid var(--konferans-line)',
              color: 'var(--konferans-deep)',
              fontSize: '12.5px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--konferans)',
              }}
            />
            2026–2027 Üniversite & Teknoloji Etkinlik Takvimi
          </span>
        </div>

        {/* Ana Başlık */}
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5.5vw, 58px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              color: 'var(--ink)',
              marginBottom: '20px',
            }}
          >
            Geleceğini şekillendiren üniversite etkinlikleri,{' '}
            <span style={{ color: 'var(--konferans)' }}>tek platformda.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              maxWidth: '640px',
              margin: '0 auto 36px',
            }}
          >
            Konferanslar, ödüllü hackathonlar ve savunma sanayii kariyer sunumları.
            Bölümüne ve sınıfına özel kontenjanları keşfet, yerini anında ayırt.
          </p>

          {/* Arama & Hızlı Filtre Kutusu */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              padding: '12px 14px',
              boxShadow: 'var(--shadow-md)',
              maxWidth: '680px',
              margin: '0 auto 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--ink-3)', display: 'flex', alignItems: 'center', paddingLeft: '6px' }}>
                <AppIcon ad="ara" boyut={20} />
              </div>
              <input
                type="text"
                value={aramaMetni}
                onChange={(e) => onAramaDegisti(e.target.value)}
                placeholder="Etkinlik, şirket adı veya konu ara (örn: Yapay Zeka, Papara, ASELSAN)..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: 'var(--ink)',
                }}
              />
              <button
                type="button"
                onClick={onScrollToEvents}
                className="btn btn--birincil btn--sm"
                style={{ height: '38px', padding: '0 20px', flexShrink: 0 }}
              >
                Keşfet
              </button>
            </div>

            {/* Hızlı Tür Filtreleri */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderTop: '1px solid var(--line)',
                paddingTop: '10px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginRight: '4px' }}>
                Kategori:
              </span>
              <button
                type="button"
                className={`chip ${seciliTur === '' ? 'chip--active' : ''}`}
                onClick={() => onTurSec('')}
                style={{ height: '28px', fontSize: '12px', padding: '0 12px' }}
              >
                Tümü
              </button>
              <button
                type="button"
                className={`chip ${seciliTur === 'konferans' ? 'chip--active' : ''}`}
                onClick={() => onTurSec('konferans')}
                style={{ height: '28px', fontSize: '12px', padding: '0 12px' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--konferans)' }} />
                Konferans
              </button>
              <button
                type="button"
                className={`chip ${seciliTur === 'hackathon' ? 'chip--active' : ''}`}
                onClick={() => onTurSec('hackathon')}
                style={{ height: '28px', fontSize: '12px', padding: '0 12px' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--hackathon)' }} />
                Hackathon
              </button>
              <button
                type="button"
                className={`chip ${seciliTur === 'sunum' ? 'chip--active' : ''}`}
                onClick={() => onTurSec('sunum')}
                style={{ height: '28px', fontSize: '12px', padding: '0 12px' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sunum)' }} />
                Sunum
              </button>
            </div>
          </div>

          {/* İstatistik Göstergeleri */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  lineHeight: 1.1,
                }}
              >
                {stats.etkinlik}+
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-3)', marginTop: '4px' }}>
                Yayında Etkinlik
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--sunum-deep)',
                  lineHeight: 1.1,
                }}
              >
                1.450+
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-3)', marginTop: '4px' }}>
                Öğrenci Başvurusu
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--hackathon-deep)',
                  lineHeight: 1.1,
                }}
              >
                {stats.universite}+
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-3)', marginTop: '4px' }}>
                Partner Üniversite
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--konferans)',
                  lineHeight: 1.1,
                }}
              >
                %100
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-3)', marginTop: '4px' }}>
                Ücretsiz & Onaylı
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
