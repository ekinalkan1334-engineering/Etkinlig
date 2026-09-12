import { useEffect, useState } from 'react';

/**
 * Bağımlılıksız hash yönlendirme.
 * Hash kullanmamızın sebebi: site alt dizinde (/etkinlig/) yayınlanıyor ve
 * paylaşımlı barındırmada URL yeniden yazma kuralı olmayabiliyor. Hash ile
 * derin bağlantılar sunucu yapılandırması gerektirmeden çalışır.
 */
export function yolOku() {
  const ham = window.location.hash.replace(/^#/, '');
  return ham.startsWith('/') ? ham : `/${ham}`;
}

export function git(yol) {
  window.location.hash = yol;
}

export function useYol() {
  const [yol, setYol] = useState(yolOku);
  useEffect(() => {
    const dinle = () => {
      setYol(yolOku());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', dinle);
    return () => window.removeEventListener('hashchange', dinle);
  }, []);
  return yol;
}

/** '/etkinlik/12' → { sayfa: 'etkinlik', id: '12' } */
export function yoluCoz(yol) {
  const p = yol.split('?')[0].split('/').filter(Boolean);
  if (p.length === 0) return { sayfa: 'ana' };
  if (p[0] === 'etkinlik' && p[1]) return { sayfa: 'etkinlik', id: p[1] };
  if (p[0] === 'basvurularim') return { sayfa: 'basvurularim' };
  if (p[0] === 'giris') return { sayfa: 'giris' };
  return { sayfa: 'yok' };
}
