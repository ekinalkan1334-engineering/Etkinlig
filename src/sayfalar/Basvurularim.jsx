import { useEffect } from 'react';
import { useOturum } from '../oturum.jsx';
import { Durum, DurumEtiketi, TurEtiketi } from '../parcalar/temel.jsx';
import { BASVURU_DURUM, DURUM_TONU, ayKisa, gunNo, kalanGun, saat, tarih } from '../bicim.js';
import { git } from '../rota.js';

export default function Basvurularim() {
  const { ogrenci, basvurular, hazir, basvurulariTazele } = useOturum();

  useEffect(() => {
    if (hazir && !ogrenci) git('/giris');
  }, [hazir, ogrenci]);

  useEffect(() => { if (ogrenci) basvurulariTazele(); }, [ogrenci, basvurulariTazele]);

  if (!hazir) return <main className="detay"><Durum yukleniyor /></main>;
  if (!ogrenci) return null;

  const gecmis = (b) => new Date(String(b.etkinlik.baslangic).replace(' ', 'T')) < new Date();
  const yaklasan = basvurular.filter((b) => !gecmis(b));
  const gecmisler = basvurular.filter(gecmis);

  return (
    <main className="detay">
      <header className="sayfa-basligi">
        <h1>Başvurularım</h1>
        <p>{basvurular.length} başvuru · {yaklasan.length} yaklaşan</p>
      </header>

      <Durum
        bos={basvurular.length === 0}
        bosBaslik="Henüz başvurun yok"
        bosAlt="Etkinliklere göz atıp ilgini çekene başvurabilirsin."
      >
        <>
          {yaklasan.length > 0 && (
            <section className="basvuru-bolum">
              <h2>Yaklaşan</h2>
              <ul className="basvuru-listesi">
                {yaklasan.map((b) => <BasvuruSatiri key={b.id} basvuru={b} />)}
              </ul>
            </section>
          )}

          {gecmisler.length > 0 && (
            <section className="basvuru-bolum">
              <h2>Geçmiş</h2>
              <ul className="basvuru-listesi basvuru-listesi--soluk">
                {gecmisler.map((b) => <BasvuruSatiri key={b.id} basvuru={b} />)}
              </ul>
            </section>
          )}
        </>
      </Durum>
    </main>
  );
}

function BasvuruSatiri({ basvuru }) {
  const e = basvuru.etkinlik;
  return (
    <li className="basvuru-satiri">
      <a className="basvuru-satiri__tarih" href={`#/etkinlik/${e.id}`}>
        <strong>{gunNo(e.baslangic)}</strong>
        <em>{ayKisa(e.baslangic)}</em>
      </a>

      <div className="basvuru-satiri__govde">
        <div className="basvuru-satiri__ust">
          <TurEtiketi tur={e.tur} />
          <DurumEtiketi ton={DURUM_TONU[basvuru.durum]}>
            {BASVURU_DURUM[basvuru.durum] ?? basvuru.durum}
          </DurumEtiketi>
        </div>
        <h3><a href={`#/etkinlik/${e.id}`}>{e.baslik}</a></h3>
        <p className="basvuru-satiri__alt">
          {e.sirket} · {saat(e.baslangic)} · {e.ilce ? `${e.ilce}, ${e.sehir}` : e.sehir}
        </p>
        <p className="basvuru-satiri__not">
          {tarih(basvuru.basvuruTarihi)} tarihinde başvuruldu · {kalanGun(e.baslangic)}
        </p>
      </div>

      <a className="dugme dugme--sade" href={`#/etkinlik/${e.id}`}>Detay</a>
    </li>
  );
}
