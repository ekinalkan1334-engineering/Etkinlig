import { useEffect, useState } from 'react';
import * as api from '../api.js';
import { useOturum } from '../oturum.jsx';
import Yorumlar from '../parcalar/Yorumlar.jsx';
import Yoklama from '../parcalar/Yoklama.jsx';
import { Doluluk, Durum, DurumEtiketi, Simge, TurEtiketi } from '../parcalar/temel.jsx';
import { BASVURU_DURUM, DURUM_TONU, DUZEY, basHarfler, gun, kalanGun, saat, SINIF, tarih, TUR } from '../bicim.js';

import { kapakGorseli } from '../gorseller.js';
import logoTechnobridge from '../assets/firma_gorselleri/technobridge.webp';
import logoPapara from '../assets/firma_gorselleri/papara-logo.jpg';
import logoAselsan from '../assets/firma_gorselleri/aselsan.png';
import logoYildiz from '../assets/firma_gorselleri/yildiz_teknoloji.jpeg';
import logoStm from '../assets/firma_gorselleri/stm.webp';
import logoTrendyol from '../assets/firma_gorselleri/trendyol.jpeg';

const SIRKET_LOGOLARI = [
  { anahtar: 'technobridge', logo: logoTechnobridge },
  { anahtar: 'papara', logo: logoPapara },
  { anahtar: 'aselsan', logo: logoAselsan },
  { anahtar: 'yıldız', logo: logoYildiz },
  { anahtar: 'yildiz', logo: logoYildiz },
  { anahtar: 'stm', logo: logoStm },
  { anahtar: 'trendyol', logo: logoTrendyol },
];

function sirketLogosuBul(sirketAdi) {
  if (!sirketAdi) return null;
  const kucuk = sirketAdi.toLowerCase();
  const eslesme = SIRKET_LOGOLARI.find((item) => kucuk.includes(item.anahtar));
  return eslesme ? eslesme.logo : null;
}

export default function EtkinlikDetay({ id }) {
  const { ogrenci, basvur, basvurumVar, basvurulariTazele } = useOturum();
  const [etkinlik, setEtkinlik] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [uyari, setUyari] = useState(null);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    api.etkinligiGetir(id)
      .then((d) => { if (!iptal) setEtkinlik(d); })
      .catch((e) => { if (!iptal) setHata(e); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [id]);

  const basvurum = basvurumVar(id);

  async function basvuruGonder() {
    setUyari(null);
    setGonderiliyor(true);
    try {
      const sonuc = await basvur(Number(id));
      setUyari({ tip: 'iyi', mesaj: sonuc.mesaj });
      setEtkinlik((e) => (e ? { ...e, katilimci: e.katilimci + (sonuc.durum === 'onaylandi' ? 1 : 0) } : e));
    } catch (e) {
      setUyari({
        tip: 'kotu',
        mesaj: e.message,
        nedenler: e.detay?.nedenler ?? e.detay?.eksikler ?? null,
        profile: e.kod === 'profil_eksik' || e.kod === 'sart_saglanmiyor',
      });
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor || hata || !etkinlik) {
    return (
      <main className="detay">
        <a className="geri" href="#/"><Simge ad="geri" /> Etkinlikler</a>
        <Durum yukleniyor={yukleniyor} hata={hata} bos={!etkinlik} bosBaslik="Etkinlik bulunamadı" />
      </main>
    );
  }

  const s = etkinlik.sartlar;
  const doldu = etkinlik.kalanKontenjan <= 0;
  const sirketLogo = sirketLogosuBul(etkinlik.sirket);

  return (
    <main className="detay">
      <a className="geri" href="#/"><Simge ad="geri" /> Etkinlikler</a>

      <header className="detay__ust">
        <div className="detay__etiketler">
          <TurEtiketi tur={etkinlik.tur} />
          <span className="detay__kod">{etkinlik.kod}</span>
          <span className="detay__kalan">{kalanGun(etkinlik.baslangic)}</span>
        </div>
        <h1>{etkinlik.baslik}</h1>
        <p className="detay__sirket">{etkinlik.sirket}</p>
      </header>

      <figure className={etkinlik.gorsel ? 'detay__kapak' : 'detay__kapak detay__kapak--dolgu'}>
        <img src={kapakGorseli(etkinlik)} alt={`${etkinlik.baslik} görseli`} />
      </figure>

      <div className="detay__duzen">
        <div className="detay__ana">
          <section className="blok">
            <h2>Etkinlik hakkında</h2>
            <p className="blok__metin">
              {etkinlik.aciklama || 'Bu etkinlik için açıklama girilmemiş.'}
            </p>
          </section>

          <section className="blok">
            <h2>Kimler başvurabilir</h2>
            <dl className="sartlar">
              <div>
                <dt>Öğrenim düzeyi</dt>
                <dd>{DUZEY[s.ogrenimDuzeyi] ?? 'Tüm düzeyler'}</dd>
              </div>
              <div>
                <dt>Sınıf</dt>
                <dd>{s.siniflar.length ? s.siniflar.map((x) => SINIF[x] ?? x).join(', ') : 'Tüm sınıflar'}</dd>
              </div>
              <div>
                <dt>Bölüm</dt>
                <dd>{s.bolumler.length ? s.bolumler.join(', ') : 'Tüm bölümlere açık'}</dd>
              </div>
              {s.minOrtalama !== null && (
                <div><dt>Asgari ortalama</dt><dd>{s.minOrtalama.toFixed(2)}</dd></div>
              )}
              <div>
                <dt>Öğrenci belgesi</dt>
                <dd>{s.belgeZorunlu ? 'Zorunlu' : 'İstenmiyor'}</dd>
              </div>
            </dl>
          </section>

          {etkinlik.adres && (
            <section className="blok">
              <h2>Adres</h2>
              <p className="blok__metin">
                {etkinlik.adres}
                <br />
                {etkinlik.ilce ? `${etkinlik.ilce} / ${etkinlik.sehir}` : etkinlik.sehir}
              </p>
            </section>
          )}

          <Yorumlar etkinlikId={id} />
        </div>

        <aside className="detay__yan">
          <div className="basvuru-kutusu">
            <dl className="kunye">
              <div>
                <dt>Tarih</dt>
                <dd>{tarih(etkinlik.baslangic)}<span>{gun(etkinlik.baslangic)}</span></dd>
              </div>
              <div>
                <dt>Saat</dt>
                <dd>{saat(etkinlik.baslangic)}{etkinlik.bitis ? ` – ${saat(etkinlik.bitis)}` : ''}</dd>
              </div>
              <div>
                <dt>Yer</dt>
                <dd>{etkinlik.ilce ? `${etkinlik.ilce}, ${etkinlik.sehir}` : etkinlik.sehir}</dd>
              </div>
              {etkinlik.sonBasvuru && (
                <div><dt>Son başvuru</dt><dd>{tarih(etkinlik.sonBasvuru)}</dd></div>
              )}
            </dl>

            <div className="kontenjan">
              <div className="kontenjan__ust">
                <span>Kontenjan</span>
                <strong>{etkinlik.katilimci}/{etkinlik.kontenjan}</strong>
              </div>
              <Doluluk katilimci={etkinlik.katilimci} kontenjan={etkinlik.kontenjan} etiketli={false} />
              <span className="kontenjan__alt">
                {doldu ? 'Kontenjan doldu' : `${etkinlik.kalanKontenjan} kişilik yer kaldı`}
              </span>
            </div>

            {uyari && (
              <div className={uyari.tip === 'iyi' ? 'uyari uyari--iyi' : 'uyari uyari--kotu'}>
                <p>{uyari.mesaj}</p>
                {uyari.nedenler && (
                  <ul className="uyari__liste">
                    {uyari.nedenler.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
                {uyari.profile && <a className="uyari__bag" href="#/profil">Profilimi düzenle</a>}
              </div>
            )}

            {basvurum ? (
              <div className="basvurdum">
                <DurumEtiketi ton={DURUM_TONU[basvurum.durum]}>
                  {BASVURU_DURUM[basvurum.durum] ?? basvurum.durum}
                </DurumEtiketi>
                <p>Bu etkinliğe {tarih(basvurum.basvuruTarihi)} tarihinde başvurdunuz.</p>
                {basvurum.durum === 'onaylandi' && (
                  <Yoklama
                    etkinlikId={id}
                    katildi={basvurum.katildi}
                    onKatildi={() => basvurulariTazele()}
                  />
                )}
                <a className="dugme dugme--sade dugme--genis" href="#/basvurularim">Başvurularım</a>
              </div>
            ) : !ogrenci ? (
              <>
                <a className="dugme dugme--birincil dugme--genis" href="#/giris">Başvurmak için giriş yap</a>
                <p className="basvuru-kutusu__not">Hesabın yoksa aynı ekrandan bir dakikada oluşturabilirsin.</p>
              </>
            ) : (
              <>
                {etkinlik.uygunluk && !etkinlik.uygunluk.uygun && (
                  <div className="uyari uyari--kotu">
                    <p>Bu etkinliğin şartlarını sağlamıyorsun.</p>
                    <ul className="uyari__liste">
                      {(etkinlik.uygunluk.eksikler?.length
                        ? etkinlik.uygunluk.eksikler.map((e) => `Profilinde ${e} eksik`)
                        : etkinlik.uygunluk.nedenler
                      ).map((n) => <li key={n}>{n}</li>)}
                    </ul>
                    <a className="uyari__bag" href="#/profil">Profilimi düzenle</a>
                  </div>
                )}
                <button
                  type="button"
                  className="dugme dugme--birincil dugme--genis"
                  onClick={basvuruGonder}
                  disabled={gonderiliyor || !etkinlik.basvuruyaAcik || (etkinlik.uygunluk && !etkinlik.uygunluk.uygun)}
                >
                  {gonderiliyor
                    ? 'Gönderiliyor…'
                    : etkinlik.uygunluk && !etkinlik.uygunluk.uygun
                      ? 'Başvuramazsın'
                      : etkinlik.basvuruyaAcik ? 'Başvur' : 'Başvurular kapalı'}
                </button>
                {doldu && etkinlik.basvuruyaAcik && (
                  <p className="basvuru-kutusu__not">Kontenjan dolu; başvurun yedek listeye alınır.</p>
                )}
              </>
            )}
          </div>

          <div className="yan-kutu duzenleyen-kutu">
            <h3>Düzenleyen</h3>
            <div className="duzenleyen-kart">
              {sirketLogo ? (
                <div className="duzenleyen-logo-kutu">
                  <img src={sirketLogo} alt={etkinlik.sirket} className="duzenleyen-logo" />
                </div>
              ) : (
                <div className="duzenleyen-logo-kutu duzenleyen-logo-yedek">
                  {basHarfler(etkinlik.sirket)}
                </div>
              )}
              <div className="duzenleyen-bilgi">
                <p className="yan-kutu__sirket">{etkinlik.sirket}</p>
                <p className="yan-kutu__alt">{TUR[etkinlik.tur]} · {etkinlik.kod}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
