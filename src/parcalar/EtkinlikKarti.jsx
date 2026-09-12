import { Doluluk, TurEtiketi } from './temel.jsx';
import { ayKisa, gunNo, kalanGun, saat } from '../bicim.js';
import { kapakGorseli } from '../gorseller.js';

export default function EtkinlikKarti({ etkinlik, basvuruDurumu }) {
  const { id, baslik, sirket, sehir, ilce, baslangic, gorsel, tur, katilimci, kontenjan, kalanKontenjan, uygunluk } = etkinlik;
  // uygunluk yalnızca giriş yapmış kullanıcıda gelir; misafirde null.
  const engel = uygunluk && !uygunluk.uygun && !basvuruDurumu;
  const engelNedeni = engel
    ? (uygunluk.eksikler?.length
        ? `Profilinde ${uygunluk.eksikler.join(', ')} eksik`
        : uygunluk.nedenler?.[0] ?? 'Şartları sağlamıyorsun')
    : null;
  // Şirket kapak yüklemediyse türe/başlığa göre bir banner düşer.
  const kapak = kapakGorseli(etkinlik);
  const adres = `#/etkinlik/${id}`;

  return (
    <article className={engel ? 'kart kart--engelli' : 'kart'}>
      <a className="kart__kapak" href={adres} aria-label={`${baslik} detayı`}>
        <img
          src={kapak}
          alt=""
          loading="lazy"
          className={gorsel ? 'kart__gorsel' : 'kart__gorsel kart__gorsel--dolgu'}
        />
        <span className="kart__tarih">
          <strong>{gunNo(baslangic)}</strong>
          <em>{ayKisa(baslangic)}</em>
        </span>
        {engel && <span className="kart__engel">Başvuramazsın</span>}
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
          ) : engel ? (
            <span className="kart__engel-neden" title={engelNedeni}>{engelNedeni}</span>
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
