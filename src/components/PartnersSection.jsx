import React from 'react';
import AppIcon from './AppIcon';
import { SIRKETLER } from '../data/mockEvents';

export default function PartnersSection() {
  const universiteler = [
    'ODTÜ',
    'İTÜ',
    'Boğaziçi Üniversitesi',
    'Hacettepe Üniversitesi',
    'Gazi Üniversitesi',
    'Yıldız Teknik Üniversitesi',
    'Ankara Üniversitesi',
    'Ege Üniversitesi',
    'Beykent Üniversitesi',
    'Çankırı Karatekin Üniversitesi',
  ];

  return (
    <section id="partners" style={{ padding: '72px 0', background: 'var(--paper)' }}>
      <div className="container">
        {/* Şirketler Başlığı */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--konferans-deep)',
            }}
          >
            Lider Şirketler
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 800,
              marginTop: '6px',
              color: 'var(--ink)',
            }}
          >
            Teknoloji devleriyle doğrudan buluş
          </h2>
          <p style={{ fontSize: '14.5px', color: 'var(--ink-2)', marginTop: '8px' }}>
            EtkinLig üzerinden stajyer ve yeni mezun yetenek programları düzenleyen öncü teknoloji kuruluşları.
          </p>
        </div>

        {/* Şirket Kartları */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '56px',
          }}
        >
          {SIRKETLER.map((s) => (
            <div
              key={s.id}
              className="app-card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--paper-2)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink)',
                  flexShrink: 0,
                }}
              >
                <AppIcon ad="bina" boyut={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.ad}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>
                  {s.sektor}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Üniversiteler Şeridi */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-2)', fontSize: '13px', fontWeight: 600 }}>
            <AppIcon ad="mezuniyet" boyut={18} />
            <span>Aktif Katılımcı Üniversiteler</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {universiteler.map((u, i) => (
              <span
                key={i}
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-2)',
                }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
