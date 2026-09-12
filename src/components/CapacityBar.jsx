import React from 'react';

export default function CapacityBar({
  deger = 0,
  toplam = 100,
  ton = 'konferans',
  etiketGoster = true,
  aciklama,
}) {
  const yuzde = toplam > 0 ? Math.min(100, Math.round((deger / toplam) * 100)) : 0;
  
  // Eğer dolmuşsa ton otomatik uyari/konferans olsun
  const aktifTon = yuzde >= 100 ? 'uyari' : ton;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
        {etiketGoster && (
          <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>
            {deger} / {toplam} kontenjan
          </span>
        )}
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: yuzde >= 100 ? 'var(--uyari-deep)' : 'var(--ink-3)' }}>
          %{yuzde} {yuzde >= 100 ? 'Doldu' : 'dolu'}
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            width: `${yuzde}%`,
            backgroundColor: `var(--${aktifTon})`,
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      {aciklama && (
        <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>{aciklama}</span>
      )}
    </div>
  );
}
