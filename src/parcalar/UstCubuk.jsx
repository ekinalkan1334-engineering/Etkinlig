import { useOturum } from '../oturum.jsx';
import { git, yoluCoz } from '../rota.js';
import { basHarfler } from '../bicim.js';
import siteImg from '../assets/site_img.jpeg';

export default function UstCubuk({ yol }) {
  const { ogrenci, cikis, basvurular } = useOturum();
  const { sayfa } = yoluCoz(yol);

  return (
    <header className="ust">
      <a className="marka" href="#/" aria-label="Ana sayfa">
        <img src={siteImg} alt="etkinlig" className="marka__gorsel" />
        <span className="marka__ad">etkinlig</span>
      </a>

      <nav className="ust__gezinme">
        <a href="#/" className={sayfa === 'ana' ? 'ust__bag ust__bag--aktif' : 'ust__bag'}>Etkinlikler</a>
        {ogrenci && (
          <a href="#/basvurularim" className={sayfa === 'basvurularim' ? 'ust__bag ust__bag--aktif' : 'ust__bag'}>
            Başvurularım
            {basvurular.length > 0 && <span className="ust__sayac">{basvurular.length}</span>}
          </a>
        )}
      </nav>

      {ogrenci ? (
        <div className="ust__hesap">
          <span className="ust__avatar" aria-hidden="true">{basHarfler(ogrenci.adSoyad)}</span>
          <span className="ust__isim">{ogrenci.adSoyad}</span>
          <button type="button" className="dugme dugme--sade" onClick={() => cikis().then(() => git('/'))}>
            Çıkış
          </button>
        </div>
      ) : (
        <a href="#/giris" className="dugme dugme--birincil">Giriş yap</a>
      )}
    </header>
  );
}
