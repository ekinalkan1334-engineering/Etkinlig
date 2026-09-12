import React from 'react';
import AppIcon from './AppIcon';
import { TurRozeti, DurumRozeti } from './AppBadge';
import CapacityBar from './CapacityBar';

function formatTarih(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return str;
  }
}

function formatSaat(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return '';
  }
}

export default function EventCard({
  event,
  hasApplied = false,
  applicationStatus,
  onSelectEvent,
  onApply,
}) {
  const isDoldu = event.durum === 'doldu' || event.onayliSayisi >= event.kontenjan;

  return (
    <div
      className="app-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        position: 'relative',
        height: '100%',
      }}
    >
      {/* Üst Kısım: Tür & Durum & Kod */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TurRozeti tur={event.tur} />
            <DurumRozeti durum={event.durum} />
          </div>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
            {event.kod}
          </span>
        </div>

        {/* Başlık */}
        <h3
          onClick={() => onSelectEvent(event)}
          style={{
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '8px',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.target.style.color = 'var(--konferans)')}
          onMouseLeave={(e) => (e.target.style.color = 'var(--ink)')}
        >
          {event.baslik}
        </h3>

        {/* Şirket */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--ink-2)', fontSize: '13px', marginBottom: '14px' }}>
          <AppIcon ad="bina" boyut={15} />
          <span style={{ fontWeight: 600 }}>{event.sirket}</span>
        </div>

        {/* Tarih & Konum */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '10px 12px',
            borderRadius: 'var(--r-md)',
            background: 'var(--paper-2)',
            border: '1px solid var(--line)',
            fontSize: '12.5px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
            <AppIcon ad="takvim" boyut={14} style={{ color: 'var(--ink-3)' }} />
            <span style={{ fontWeight: 600 }}>{formatTarih(event.baslangic)}</span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span>{formatSaat(event.baslangic)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-2)' }}>
            <AppIcon ad="konum" boyut={14} style={{ color: 'var(--ink-3)' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.sehir} {event.ilce ? `(${event.ilce})` : ''} · {event.adres}
            </span>
          </div>
        </div>

        {/* Kısa Açıklama */}
        <p
          style={{
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.aciklama}
        </p>

        {/* Ön Katılım Şartları Çipleri */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
          {event.sartlar?.siniflar?.length > 0 && (
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink-2)',
              }}
            >
              {event.sartlar.siniflar.map((s) => `${s}. Sınıf`).join(', ')}
            </span>
          )}
          {event.sartlar?.minOrtalama && (
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink-2)',
              }}
            >
              Ortalama ≥ {event.sartlar.minOrtalama.toFixed(2)}
            </span>
          )}
          {event.sartlar?.belgeZorunlu && (
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--uyari-tint)',
                border: '1px solid var(--uyari-line)',
                color: 'var(--uyari-deep)',
                fontWeight: 600,
              }}
            >
              Öğrenci Belgesi Şart
            </span>
          )}
          {event.katilimBelgesi && (
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--sunum-tint)',
                border: '1px solid var(--sunum-line)',
                color: 'var(--sunum-deep)',
                fontWeight: 600,
              }}
            >
              Sertifikalı
            </span>
          )}
        </div>
      </div>

      {/* Alt Kısım: Kontenjan & Başvuru Aksiyonları */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <CapacityBar
          deger={event.onayliSayisi}
          toplam={event.kontenjan}
          ton={event.tur}
          aciklama={event.sonBasvuru ? `Son başvuru: ${formatTarih(event.sonBasvuru)}` : null}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn--hayalet"
            onClick={() => onSelectEvent(event)}
            style={{ flex: 1, height: '38px', fontSize: '13px' }}
          >
            İncele
          </button>

          {hasApplied ? (
            <div
              style={{
                flex: 1.2,
                height: '38px',
                borderRadius: 'var(--r-md)',
                background: 'var(--sunum-tint)',
                border: '1px solid var(--sunum-line)',
                color: 'var(--sunum-deep)',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AppIcon ad="onay" boyut={15} />
              <span>Başvuruldu</span>
            </div>
          ) : isDoldu ? (
            <button
              type="button"
              disabled
              className="btn btn--sm"
              style={{
                flex: 1.2,
                height: '38px',
                background: 'var(--paper-2)',
                color: 'var(--ink-3)',
                borderColor: 'var(--line)',
                cursor: 'not-allowed',
              }}
            >
              Kontenjan Doldu
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--birincil"
              onClick={() => onApply(event)}
              style={{ flex: 1.2, height: '38px', fontSize: '13px' }}
            >
              Hemen Başvur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
