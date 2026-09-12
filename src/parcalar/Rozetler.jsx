import { ROZET_ETIKETI, TUR } from '../bicim.js';

/** Katılımı doğrulanmış etkinliklerden kazanılan rozetler. */
export default function Rozetler({ rozetler, baslikli = true }) {
  const toplam = rozetler?.toplam ?? 0;
  const turler = Object.entries(rozetler?.turler ?? {}).filter(([, adet]) => adet > 0);

  if (!toplam) {
    return baslikli ? (
      <div className="rozetler">
        <h3>Rozetler</h3>
        <p className="rozetler__bos">
          Henüz rozetin yok. Bir etkinliğe katılıp yoklama kodunu girdiğinde burada görünecek.
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="rozetler">
      {baslikli && <h3>Rozetler</h3>}
      <div className="rozetler__liste">
        {turler.map(([tur, adet]) => (
          <span key={tur} className={`rozet rozet--${tur}`} title={`${adet} ${TUR[tur]} etkinliğine katıldı`}>
            <span className="rozet__adet">{adet}</span>
            {ROZET_ETIKETI[tur] ?? TUR[tur]}
          </span>
        ))}
      </div>
      <p className="rozetler__ozet">
        Toplam <strong>{toplam}</strong> etkinliğe katılımın doğrulandı.
      </p>
    </div>
  );
}
