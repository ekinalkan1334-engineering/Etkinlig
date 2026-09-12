import { TUR } from '../bicim.js';

/* Yalnızca işlevsel simgeler — süs yok. */
export function Simge({ ad, boyut = 16 }) {
  const yollar = {
    ara: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    geri: <path d="m15 6-6 6 6 6" />,
    ileri: <path d="m9 6 6 6-6 6" />,
    kapat: <path d="M18 6 6 18M6 6l12 12" />,
    onay: <path d="M20 6 9 17l-5-5" />,
    cop: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="m6 7 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M9 7V4h6v3" /></>,
  };
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {yollar[ad]}
    </svg>
  );
}

export const TurEtiketi = ({ tur }) => (
  <span className={`etiket etiket--${tur}`}>{TUR[tur] ?? tur}</span>
);

export const DurumEtiketi = ({ ton, children }) => (
  <span className={`etiket etiket--${ton}`}>{children}</span>
);

export function Doluluk({ katilimci, kontenjan, etiketli = true }) {
  const yuzde = kontenjan > 0 ? Math.min(100, Math.round((katilimci / kontenjan) * 100)) : 0;
  return (
    <div className="doluluk">
      <div className="doluluk__ray"><div className="doluluk__dolu" style={{ width: `${yuzde}%` }} /></div>
      {etiketli && <span className="doluluk__metin">{katilimci}/{kontenjan}</span>}
    </div>
  );
}

export function Durum({ yukleniyor, hata, bos, bosBaslik, bosAlt, children }) {
  if (yukleniyor) return <div className="durum"><span className="donen" /><p>Yükleniyor…</p></div>;
  if (hata) {
    return (
      <div className="durum durum--hata">
        <p className="durum__baslik">Bir şeyler ters gitti</p>
        <p>{hata.message ?? String(hata)}</p>
      </div>
    );
  }
  if (bos) {
    return (
      <div className="durum">
        <p className="durum__baslik">{bosBaslik}</p>
        {bosAlt && <p>{bosAlt}</p>}
      </div>
    );
  }
  return children ?? null;
}
