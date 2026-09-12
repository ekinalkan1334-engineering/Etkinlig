import React from 'react';

export const TUR_ETIKETLERI = {
  konferans: 'Konferans',
  sunum: 'Sunum',
  hackathon: 'Hackathon',
};

export const DURUM_ETIKETLERI = {
  yayinda: 'Yayında',
  doldu: 'Doldu',
  taslak: 'Taslak',
  iptal: 'İptal',
  tamamlandi: 'Tamamlandı',
  onaylandi: 'Onaylandı',
  beklemede: 'Beklemede',
  reddedildi: 'Reddedildi',
  yedek: 'Yedek',
};

export const TON_HARITASI = {
  konferans: 'konferans',
  sunum: 'sunum',
  hackathon: 'hackathon',
  yayinda: 'sunum',
  doldu: 'uyari',
  beklemede: 'uyari',
  onaylandi: 'sunum',
  reddedildi: 'konferans',
  yedek: 'hackathon',
  tamamlandi: 'hackathon',
  iptal: 'konferans',
};

export function TurRozeti({ tur, yuvarlak = true }) {
  const etiket = TUR_ETIKETLERI[tur] || tur;
  const ton = TON_HARITASI[tur] || 'notr';

  return (
    <span className={`badge badge--${ton} ${yuvarlak ? 'badge--rounded' : ''}`}>
      {etiket}
    </span>
  );
}

export function DurumRozeti({ durum, nokta = true, yuvarlak = false }) {
  const etiket = DURUM_ETIKETLERI[durum] || durum;
  const ton = TON_HARITASI[durum] || 'notr';

  return (
    <span className={`badge badge--${ton} ${yuvarlak ? 'badge--rounded' : ''}`}>
      {nokta && <span className="badge__dot" />}
      {etiket}
    </span>
  );
}

export default function AppBadge({ children, ton = 'notr', nokta = false, yuvarlak = false, className = '' }) {
  return (
    <span className={`badge badge--${ton} ${yuvarlak ? 'badge--rounded' : ''} ${className}`}>
      {nokta && <span className="badge__dot" />}
      {children}
    </span>
  );
}
