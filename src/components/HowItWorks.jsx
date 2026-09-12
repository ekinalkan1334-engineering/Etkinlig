import React from 'react';
import AppIcon from './AppIcon';

export default function HowItWorks() {
  const steps = [
    {
      no: '01',
      baslik: 'Etkinlikleri Keşfet',
      aciklama:
        'Yapay zeka, fintech, savunma sanayii ve bulut teknolojileri alanındaki en güncel konferans ve hackathonları incele.',
      simge: 'ara',
      ton: 'konferans',
    },
    {
      no: '02',
      baslik: 'Şartları Kontrol Et',
      aciklama:
        'Etkinlik için belirlenen sınıf düzeyi, asgari genel not ortalaması (GPA) ve bölüm uygunluğu kriterlerine göz at.',
      simge: 'onay',
      ton: 'sunum',
    },
    {
      no: '03',
      baslik: 'Tek Tıkla Başvur',
      aciklama:
        'Üniversite e-postan ve öğrenci bilgilerinle formu doldur; organizatör onayından sonra giriş karekodun hazır olsun.',
      simge: 'bilet',
      ton: 'hackathon',
    },
    {
      no: '04',
      baslik: 'Sertifikanı Cebine Al',
      aciklama:
        'Etkinlik tamamlandığında onaylı dijital katılım belgen sistem tarafından üretilsin ve CV\'ne doğrudan eklensin.',
      simge: 'sertifika',
      ton: 'uyari',
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: '72px 0',
        background: 'var(--paper-2)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--konferans-deep)',
            }}
          >
            Nasıl Çalışır?
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 800,
              marginTop: '6px',
              marginBottom: '12px',
              color: 'var(--ink)',
            }}
          >
            Öğrenciler için tasarlanmış 4 adımda katılım
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Başvuru karmaşasını ortadan kaldırıyoruz. Her etkinlik için geçerli şartları şeffaf bir şekilde gör, hızlıca kaydol.
          </p>
        </div>

        {/* Adımlar Izgarası */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {steps.map((s) => (
            <div
              key={s.no}
              className="app-card"
              style={{
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--r-md)',
                    background: `var(--${s.ton}-tint)`,
                    border: `1px solid var(--${s.ton}-line)`,
                    color: `var(--${s.ton}-deep)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon ad={s.simge} boyut={20} />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: 'var(--line)',
                    lineHeight: 1,
                  }}
                >
                  {s.no}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                {s.baslik}
              </h3>

              <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
                {s.aciklama}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
