import React from 'react';
import AppIcon from './AppIcon';
import { TurRozeti, DurumRozeti } from './AppBadge';
import CapacityBar from './CapacityBar';

function formatTarih(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(d);
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

export default function EventDetailModal({
  event,
  hasApplied,
  onClose,
  onApply,
}) {
  if (!event) return null;

  const isDoldu = event.durum === 'doldu' || event.onayliSayisi >= event.kontenjan;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', padding: '0' }}
      >
        {/* Modal Başlığı */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'var(--paper)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TurRozeti tur={event.tur} />
              <DurumRozeti durum={event.durum} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)' }}>
                {event.kod}
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                lineHeight: 1.25,
                color: 'var(--ink)',
              }}
            >
              {event.baslik}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--ink-2)', fontSize: '13.5px' }}>
              <AppIcon ad="bina" boyut={16} />
              <span>{event.sirket}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn--hayalet btn--sm"
            style={{ padding: '6px', borderRadius: '50%', color: 'var(--ink-2)' }}
            title="Kapat"
          >
            <AppIcon ad="capraz" boyut={18} />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Kontenjan ve Doluluk */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--r-md)',
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
            }}
          >
            <CapacityBar
              deger={event.onayliSayisi}
              toplam={event.kontenjan}
              ton={event.tur}
              aciklama={event.sonBasvuru ? `Son Başvuru Tarihi: ${event.sonBasvuru}` : null}
            />
          </div>

          {/* Açıklama */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
              Etkinlik Hakkında
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--ink-2)' }}>
              {event.aciklama}
            </p>
          </div>

          {/* Etkinlik Künyesi Tablosu */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
              Etkinlik Künyesi
            </h4>
            <div
              style={{
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                overflow: 'hidden',
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--line)',
                  gap: '12px',
                }}
              >
                <AppIcon ad="takvim" boyut={18} style={{ color: 'var(--ink-3)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    Tarih & Saat
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                    {formatTarih(event.baslangic)} · {formatSaat(event.baslangic)}
                    {event.bitis ? ` – ${formatSaat(event.bitis)}` : ''}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--line)',
                  gap: '12px',
                }}
              >
                <AppIcon ad="konum" boyut={18} style={{ color: 'var(--ink-3)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    Konum & Salon
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                    {event.adres}, {event.ilce ? `${event.ilce} / ` : ''}{event.sehir}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  gap: '12px',
                }}
              >
                <AppIcon ad="sertifika" boyut={18} style={{ color: 'var(--ink-3)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    Katılım Belgesi
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--sunum-deep)' }}>
                    {event.katilimBelgesi ? 'Resmi Katılım Sertifikası Verilecektir' : 'Katılım belgesi bulunmuyor'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ön Katılım Şartları */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
              Ön Katılım Şartları
            </h4>
            <div
              style={{
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--ink-2)' }}>Öğrenim Düzeyi:</span>
                <span className="badge badge--hackathon badge--rounded">
                  {event.sartlar?.ogrenimDuzeyi || 'Tüm Düzeyler'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--ink-2)' }}>Hedef Sınıflar:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {event.sartlar?.siniflar?.length > 0 ? (
                    event.sartlar.siniflar.map((s) => (
                      <span key={s} className="badge badge--hackathon badge--rounded">
                        {s}. Sınıf
                      </span>
                    ))
                  ) : (
                    <span style={{ fontWeight: 600 }}>Tümü</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--ink-2)', flexShrink: 0 }}>İlgili Bölümler:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '380px' }}>
                  {event.sartlar?.bolumler?.map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: '11.5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        fontWeight: 600,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--ink-2)' }}>Asgari Genel Ortalama (GPA):</span>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {event.sartlar?.minOrtalama ? `${event.sartlar.minOrtalama.toFixed(2)} / 4.00` : 'Şart Yok'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--ink-2)' }}>Öğrenci Belgesi Kontrolü:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: event.sartlar?.belgeZorunlu ? 'var(--uyari-deep)' : 'var(--sunum-deep)',
                  }}
                >
                  {event.sartlar?.belgeZorunlu ? 'Zorunlu (e-Devlet / Transkript)' : 'İstenmiyor'}
                </span>
              </div>
            </div>
          </div>

          {/* Program Akışı */}
          {event.program && event.program.length > 0 && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                Etkinlik Programı
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {event.program.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '14px',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--paper-2)',
                      fontSize: '13.5px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--konferans)', minWidth: '95px', flexShrink: 0 }}>
                      {item.saat}
                    </span>
                    <span style={{ color: 'var(--ink)' }}>{item.baslik}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Aksiyon Barı */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid var(--line)',
            background: 'var(--paper)',
            borderRadius: '0 0 var(--r-xl) var(--r-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn--hayalet">
            Kapat
          </button>

          {hasApplied ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--sunum-tint)',
                border: '1px solid var(--sunum-line)',
                color: 'var(--sunum-deep)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              <AppIcon ad="onay" boyut={18} />
              <span>Bu Etkinliğe Zaten Başvurdunuz</span>
            </div>
          ) : isDoldu ? (
            <button type="button" disabled className="btn btn--lg" style={{ opacity: 0.7 }}>
              Kontenjan Dolmuştur
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--birincil btn--lg"
              onClick={() => {
                onClose();
                onApply(event);
              }}
              style={{ padding: '0 28px' }}
            >
              Hemen Başvur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
