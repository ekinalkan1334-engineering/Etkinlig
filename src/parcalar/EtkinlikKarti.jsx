import { Doluluk, TurEtiketi } from './temel.jsx';
import { ayKisa, gunNo, kalanGun, saat, TUR } from '../bicim.js';

export default function EtkinlikKarti({ etkinlik, basvuruDurumu }) {
  const { id, baslik, sirket, sehir, ilce, baslangic, gorsel, tur, katilimci, kontenjan, kalanKontenjan } = etkinlik;
  const adres = `#/etkinlik/${id}`;

  return (
    <article className="kart">
      <a className="kart__kapak" href={adres} aria-label={`${baslik} detayı`}>
        {gorsel
          ? <img src={gorsel} alt="" loading="lazy" />
          : <span className={`kart__yedek kart__yedek--${tur}`}>{TUR[tur] ?? ''}</span>}
        <span className="kart__tarih">
          <strong>{gunNo(baslangic)}</strong>
          <em>{ayKisa(baslangic)}</em>
        </span>
      </a>

      <div className="kart__govde">
        <div className="kart__satir">
          <TurEtiketi tur={tur} />
          <span className="kart__kalan">{kalanGun(baslangic)}</span>
        </div>

        <h3 className="kart__baslik"><a href={adres}>{baslik}</a></h3>
        <p className="kart__sirket">{sirket}</p>

        <p className="kart__yer">
          {saat(baslangic)} · {ilce ? `${ilce}, ${sehir}` : sehir}
        </p>

        <Doluluk katilimci={katilimci} kontenjan={kontenjan} />

        <div className="kart__dip">
          {basvuruDurumu ? (
            <span className="kart__basvurdum">Başvurdunuz</span>
          ) : (
            <span className="kart__yer-kaldi">
              {kalanKontenjan > 0 ? `${kalanKontenjan} yer kaldı` : 'Kontenjan doldu'}
            </span>
          )}
          <a className="dugme dugme--sade" href={adres}>Detay</a>
        </div>
      </div>
    </article>
  );
}
