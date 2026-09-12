import { KOLEKSIYONLAR } from '../gorseller.js';

/**
 * Sonsuz kayan koleksiyon şeridi.
 * Liste iki kez basılır ve şerit -%50 kaydırılır: ikinci kopya birincinin
 * yerine geldiğinde animasyon başa döner, ek olarak kopma görünmez.
 * Fare üstündeyken durur; hareket azaltma tercihine de saygı duyar.
 */
export default function Koleksiyonlar({ secili, onSec }) {
  const seritler = [...KOLEKSIYONLAR, ...KOLEKSIYONLAR];

  return (
    <section className="serit" aria-label="Etkinlik koleksiyonları">
      <div className="serit__ray">
        {seritler.map((k, i) => {
          const kopya = i >= KOLEKSIYONLAR.length;
          const aktif = secili === k.anahtar;
          return (
            <button
              key={`${k.anahtar}-${i}`}
              type="button"
              className={aktif ? 'koleksiyon koleksiyon--aktif' : 'koleksiyon'}
              onClick={() => onSec(aktif ? null : k.anahtar)}
              aria-hidden={kopya || undefined}
              tabIndex={kopya ? -1 : 0}
              aria-pressed={!kopya ? aktif : undefined}
            >
              <img src={k.gorsel} alt="" loading="lazy" />
              <span className="koleksiyon__metin">
                <strong>{k.ad}</strong>
                <em>{k.alt}</em>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
