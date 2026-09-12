import React from 'react';
import AppIcon from './AppIcon';
import { TurRozeti, DurumRozeti } from './AppBadge';

export default function MyApplicationsModal({
  applications = [],
  onClose,
  onCancelApplication,
  onExploreEvents,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '0' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--hackathon-tint)',
                color: 'var(--hackathon-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon ad="gelen" boyut={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Başvurularım
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-3)', margin: 0 }}>
                Kayıt olduğun tüm etkinlikler ve onay durumları
              </p>
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

        {/* Gövde / Liste */}
        <div style={{ padding: '24px 26px', maxHeight: '65vh', overflowY: 'auto' }}>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--paper-2)',
                  color: 'var(--ink-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AppIcon ad="takvim" boyut={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                Henüz bir başvurun bulunmuyor
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', maxWidth: '340px', margin: '0 auto 20px' }}>
                Üniversite konferanslarına, hackathonlara ve teknoloji buluşmalarına göz atıp yerini hemen ayırtabilirsin.
              </p>
              <button
                type="button"
                className="btn btn--birincil"
                onClick={() => {
                  onClose();
                  onExploreEvents();
                }}
              >
                Etkinlikleri Keşfet
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <TurRozeti tur={app.etkinlikTur} />
                        <DurumRozeti durum={app.durum} />
                      </div>
                      <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
                        {app.etkinlikBaslik}
                      </h4>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>
                        {app.sirket} · {app.sehir}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn--tehlike btn--sm"
                      onClick={() => onCancelApplication(app.id)}
                      title="Başvuruyu Geri Çek"
                      style={{ fontSize: '12px', height: '30px' }}
                    >
                      İptal Et
                    </button>
                  </div>

                  {/* Detay Şeridi */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                      color: 'var(--ink-2)',
                      padding: '8px 12px',
                      background: 'var(--paper)',
                      borderRadius: 'var(--r-sm)',
                    }}
                  >
                    <span>
                      Başvuru Tarihi: <strong>{app.basvuruTarihi}</strong>
                    </span>
                    {app.durum === 'onaylandi' && (
                      <span style={{ color: 'var(--sunum-deep)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AppIcon ad="onay" boyut={14} /> Giriş Onaylandı
                      </span>
                    )}
                  </div>

                  {app.not && (
                    <div style={{ fontSize: '12px', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                      Not: {app.not}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alt Kısım */}
        <div
          style={{
            padding: '16px 26px',
            borderTop: '1px solid var(--line)',
            background: 'var(--paper)',
            borderRadius: '0 0 var(--r-xl) var(--r-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--ink-3)' }}>
            Toplam <strong>{applications.length}</strong> başvuru
          </span>
          <button type="button" onClick={onClose} className="btn btn--hayalet">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
