import './App.css';
import { OturumSaglayici } from './oturum.jsx';
import { useYol, yoluCoz } from './rota.js';
import UstCubuk from './parcalar/UstCubuk.jsx';
import AnaSayfa from './sayfalar/AnaSayfa.jsx';
import EtkinlikDetay from './sayfalar/EtkinlikDetay.jsx';
import Basvurularim from './sayfalar/Basvurularim.jsx';
import Giris from './sayfalar/Giris.jsx';
import Profil from './sayfalar/Profil.jsx';

function Govde({ yol }) {
  const { sayfa, id } = yoluCoz(yol);
  if (sayfa === 'etkinlik') return <EtkinlikDetay id={id} />;
  if (sayfa === 'basvurularim') return <Basvurularim />;
  if (sayfa === 'giris') return <Giris />;
  if (sayfa === 'profil') return <Profil />;
  if (sayfa === 'ana') return <AnaSayfa />;
  return (
    <main className="detay">
      <div className="durum">
        <p className="durum__baslik">Sayfa bulunamadı</p>
        <p><a href="#/">Etkinliklere dön</a></p>
      </div>
    </main>
  );
}

export default function App() {
  const yol = useYol();
  return (
    <OturumSaglayici>
      <div className="sayfa">
        <UstCubuk yol={yol} />
        <Govde yol={yol} />
        <footer className="alt">
          <span>etkinlig — üniversite etkinlik portalı</span>
          <span>Etkinlikler, düzenleyen şirketler tarafından yayınlanır.</span>
        </footer>
      </div>
    </OturumSaglayici>
  );
}
