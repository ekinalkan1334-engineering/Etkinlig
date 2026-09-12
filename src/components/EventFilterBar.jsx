import React from 'react';
import AppIcon from './AppIcon';
import { SEHIRLER, SINIFLAR } from '../data/mockEvents';

export default function EventFilterBar({
  toplamSayi,
  seciliTur,
  onTurSec,
  seciliSehir,
  onSehirSec,
  seciliSinif,
  onSinifSec,
  siralama,
  onSiralamaSec,
  gorunumTuru, // 'grid' | 'list'
  onGorunumDegis,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        padding: '16px 20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Üst Satır: Kategori Çipleri ve Görünüm Seçici */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`chip ${seciliTur === '' ? 'chip--active' : ''}`}
            onClick={() => onTurSec('')}
          >
            Tümü
          </button>
          <button
            type="button"
            className={`chip ${seciliTur === 'konferans' ? 'chip--active' : ''}`}
            onClick={() => onTurSec('konferans')}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--konferans)' }} />
            Konferanslar
          </button>
          <button
            type="button"
            className={`chip ${seciliTur === 'hackathon' ? 'chip--active' : ''}`}
            onClick={() => onTurSec('hackathon')}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--hackathon)' }} />
            Hackathonlar
          </button>
          <button
            type="button"
            className={`chip ${seciliTur === 'sunum' ? 'chip--active' : ''}`}
            onClick={() => onTurSec('sunum')}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--sunum)' }} />
            Teknoloji Sunumları
          </button>
        </div>

        {/* Görünüm Değiştirici & Kayıt Sayısı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)' }}>
            <strong style={{ color: 'var(--ink)' }}>{toplamSayi}</strong> etkinlik bulundu
          </span>
          <div
            style={{
              display: 'flex',
              background: 'var(--paper-2)',
              padding: '3px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => onGorunumDegis('grid')}
              style={{
                background: gorunumTuru === 'grid' ? 'var(--surface)' : 'transparent',
                color: gorunumTuru === 'grid' ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: gorunumTuru === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
              title="Izgara Görünümü"
            >
              <AppIcon ad="panel" boyut={16} />
            </button>
            <button
              type="button"
              onClick={() => onGorunumDegis('list')}
              style={{
                background: gorunumTuru === 'list' ? 'var(--surface)' : 'transparent',
                color: gorunumTuru === 'list' ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: gorunumTuru === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
              title="Liste Görünümü"
            >
              <AppIcon ad="gelen" boyut={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Alt Satır: Dropdown Filtreler */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderTop: '1px solid var(--line)',
          paddingTop: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Filtreler:</span>
        </div>

        {/* Şehir Seçimi */}
        <select
          value={seciliSehir}
          onChange={(e) => onSehirSec(e.target.value)}
          style={{
            height: '36px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            padding: '0 12px',
            fontSize: '13px',
            color: 'var(--ink)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Şehir: Tümü</option>
          {SEHIRLER.map((s) => (
            <option key={s.id} value={s.ad}>
              {s.ad} ({s.plaka})
            </option>
          ))}
        </select>

        {/* Sınıf Seçimi */}
        <select
          value={seciliSinif}
          onChange={(e) => onSinifSec(e.target.value)}
          style={{
            height: '36px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            padding: '0 12px',
            fontSize: '13px',
            color: 'var(--ink)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Sınıf Kriteri: Tümü</option>
          {SINIFLAR.map((s) => (
            <option key={s.deger} value={s.deger}>
              {s.etiket}
            </option>
          ))}
        </select>

        {/* Sıralama */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>Sırala:</span>
          <select
            value={siralama}
            onChange={(e) => onSiralamaSec(e.target.value)}
            style={{
              height: '36px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              padding: '0 12px',
              fontSize: '13px',
              color: 'var(--ink)',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option value="yaklasan">Tarihe Göre (En Yakın)</option>
            <option value="populer">Popülerliğe Göre</option>
            <option value="kontenjan">Kalan Kontenjana Göre</option>
            <option value="alfabetik">İsme Göre (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
