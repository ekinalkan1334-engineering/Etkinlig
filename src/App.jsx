import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { etkinlikleriGetir, etkinligiGetir, filtreleriGetir } from './api.js';
import { DUZEY_ETIKETI, SINIF_ETIKETI, TUR_ETIKETI, gun, kalanGun, saat, tarih, tarihKisa } from './bicim.js';
import KayitFormu from './KayitFormu.jsx';
import logo from './logo.JPG';

/* ---------- küçük parçalar ---------- */

function TurRozeti({ tur }) {
  return <span className={`rozet rozet--${tur}`}>{TUR_ETIKETI[tur] ?? tur}</span>;
}

function Doluluk({ katilimci, kontenjan }) {
  const yuzde = kontenjan > 0 ? Math.min(100, Math.round((katilimci / kontenjan) * 100)) : 0;
  return (
    <div className="doluluk">
      <div className="doluluk__ray"><div className="doluluk__dolu" style={{ width: `${yuzde}%` }} /></div>
      <span className="doluluk__metin">{katilimci}/{kontenjan} kişi</span>
    </div>
  );
}

function EtkinlikKarti({ etkinlik, onAc }) {
  const { baslik, sirket, sehir, ilce, baslangic, gorsel, tur, katilimci, kontenjan, kalanKontenjan } = etkinlik;
  return (
    <article className="kart">
      <button type="button" className="kart__gorsel" onClick={onAc} aria-label={`${baslik} detayını aç`}>
        {gorsel
          ? <img src={gorsel} alt="" loading="lazy" />
          : <span className={`kart__yedek kart__yedek--${tur}`}>{TUR_ETIKETI[tur]?.[0] ?? 'E'}</span>}
        <span className="kart__gun">
          <strong>{tarihKisa(baslangic).split(' ')[0]}</strong>
          <em>{tarihKisa(baslangic).split(' ')[1]}</em>
        </span>
      </button>

      <div className="kart__govde">
        <div className="kart__ust">
          <TurRozeti tur={tur} />
          <span className="kart__kalan">{kalanGun(baslangic)}</span>
        </div>

        <h3 className="kart__baslik">
          <button type="button" onClick={onAc}>{baslik}</button>
        </h3>
        <p className="kart__sirket">{sirket}</p>

        <dl className="kart__bilgi">
          <div><dt>Tarih</dt><dd>{tarih(baslangic)} · {saat(baslangic)}</dd></div>
          <div><dt>Yer</dt><dd>{ilce ? `${ilce}, ` : ''}{sehir}</dd></div>
        </dl>

        <Doluluk katilimci={katilimci} kontenjan={kontenjan} />

        <button type="button" className="kart__dugme" onClick={onAc}>
          {kalanKontenjan > 0 ? 'Detayları gör' : 'Kontenjan doldu'}
        </button>
      </div>
    </article>
  );
}

function DetayPenceresi({ id, onKapat }) {
  const [etkinlik, setEtkinlik] = useState(null);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    let iptal = false;
    etkinligiGetir(id)
      .then((d) => { if (!iptal) setEtkinlik(d); })
      .catch((e) => { if (!iptal) setHata(e.message); });
    return () => { iptal = true; };
  }, [id]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onKapat();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onKapat]);

  const sartlar = etkinlik?.sartlar;

  return (
    <div className="ortu" role="dialog" aria-modal="true" onClick={onKapat}>
      <div className="pencere" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pencere__kapat" onClick={onKapat} aria-label="Kapat">×</button>

        {hata && <p className="pencere__hata">{hata}</p>}
        {!etkinlik && !hata && <p className="pencere__bekle">Yükleniyor…</p>}

        {etkinlik && (
          <>
            {etkinlik.gorsel && <img className="pencere__kapak" src={etkinlik.gorsel} alt="" />}

            <div className="pencere__govde">
              <div className="pencere__ust">
                <TurRozeti tur={etkinlik.tur} />
                <span className="pencere__kod">{etkinlik.kod}</span>
              </div>

              <h2>{etkinlik.baslik}</h2>
              <p className="pencere__sirket">{etkinlik.sirket}</p>

              <div className="kunye">
                <div>
                  <span>Tarih</span>
                  <strong>{tarih(etkinlik.baslangic)}, {gun(etkinlik.baslangic)}</strong>
                </div>
                <div>
                  <span>Saat</span>
                  <strong>{saat(etkinlik.baslangic)}{etkinlik.bitis ? ` – ${saat(etkinlik.bitis)}` : ''}</strong>
                </div>
                <div>
                  <span>Yer</span>
                  <strong>{etkinlik.ilce ? `${etkinlik.ilce}, ` : ''}{etkinlik.sehir}</strong>
                </div>
                <div>
                  <span>Kontenjan</span>
                  <strong>{etkinlik.kalanKontenjan} kişilik yer kaldı</strong>
                </div>
              </div>

              {etkinlik.aciklama && (
                <section className="pencere__bolum">
                  <h3>Etkinlik hakkında</h3>
                  <p className="pencere__aciklama">{etkinlik.aciklama}</p>
                </section>
              )}

              <section className="pencere__bolum">
                <h3>Kimler başvurabilir?</h3>
                <ul className="sartlar">
                  <li>
                    <span>Öğrenim düzeyi</span>
                    <strong>{DUZEY_ETIKETI[sartlar.ogrenimDuzeyi] ?? 'Tüm düzeyler'}</strong>
                  </li>
                  <li>
                    <span>Sınıf</span>
                    <strong>{sartlar.siniflar.length
                      ? sartlar.siniflar.map((s) => SINIF_ETIKETI[s] ?? s).join(', ')
                      : 'Tüm sınıflar'}</strong>
                  </li>
                  <li>
                    <span>Bölüm</span>
                    <strong>{sartlar.bolumler.length ? sartlar.bolumler.join(', ') : 'Tüm bölümler'}</strong>
                  </li>
                  {sartlar.minOrtalama !== null && (
                    <li><span>Asgari ortalama</span><strong>{sartlar.minOrtalama.toFixed(2)}</strong></li>
                  )}
                  {sartlar.belgeZorunlu && (
                    <li><span>Belge</span><strong>Öğrenci belgesi zorunlu</strong></li>
                  )}
                </ul>
              </section>

              {etkinlik.adres && (
                <section className="pencere__bolum">
                  <h3>Adres</h3>
                  <p className="pencere__aciklama">{etkinlik.adres}</p>
                </section>
              )}

              <footer className="pencere__dip">
                {etkinlik.sonBasvuru && (
                  <span className="pencere__sonBasvuru">Son başvuru: {tarih(etkinlik.sonBasvuru)}</span>
                )}
                <button type="button" className="pencere__katil" disabled={!etkinlik.basvuruyaAcik}>
                  {etkinlik.basvuruyaAcik ? 'Başvur' : 'Başvurular kapalı'}
                </button>
              </footer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- sayfa ---------- */

export default function App() {
  const [etkinlikler, setEtkinlikler] = useState([]);
  const [filtreler, setFiltreler] = useState({ sehirler: [], turler: [] });
  const [secim, setSecim] = useState({ tur: '', sehir: '', arama: '' });
  const [acikId, setAcikId] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [kayitAcik, setKayitAcik] = useState(false);

  const yukle = useCallback(async (f) => {
    setYukleniyor(true);
    setHata(null);
    try {
      setEtkinlikler(await etkinlikleriGetir(f));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { filtreleriGetir().then(setFiltreler).catch(() => {}); }, []);

  useEffect(() => {
    const zamanlayici = setTimeout(() => yukle(secim), 250);
    return () => clearTimeout(zamanlayici);
  }, [secim, yukle]);

  const turSec = (t) => setSecim((s) => ({ ...s, tur: s.tur === t ? '' : t }));
  const sehirSec = (e) => setSecim((s) => ({ ...s, sehir: e.target.value }));

  const baslik = useMemo(() => {
    if (secim.sehir && secim.tur) return `${secim.sehir}'de ${TUR_ETIKETI[secim.tur]}`;
    if (secim.sehir) return `${secim.sehir} etkinlikleri`;
    if (secim.tur) return `${TUR_ETIKETI[secim.tur]} etkinlikleri`;
    return 'Yaklaşan etkinlikler';
  }, [secim]);

  if (kayitAcik) return <KayitFormu onGeri={() => setKayitAcik(false)} />;

  return (
    <div className="sayfa">
      <header className="ust">
        <a className="marka" href="/">
          <img src={logo} alt="" />
          <span>etkinlig</span>
        </a>

        <label className="arama">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search" placeholder="Etkinlik veya şirket ara…"
            value={secim.arama}
            onChange={(e) => setSecim((s) => ({ ...s, arama: e.target.value }))}
          />
        </label>

        <button type="button" className="ust__kayit" onClick={() => setKayitAcik(true)}>Kayıt ol</button>
      </header>

      <section className="kahraman">
        <p className="kahraman__etiket">Öğrencilere açık · Ücretsiz</p>
        <h1>Şirketlerin <em>gerçek</em> etkinliklerini keşfet</h1>
        <p className="kahraman__alt">
          Konferans, sunum ve hackathon duyuruları doğrudan şirketlerin kendi panellerinden geliyor.
          Şartları oku, kontenjanı gör, yerini ayır.
        </p>
      </section>

      <nav className="filtre" aria-label="Etkinlik filtreleri">
        <div className="filtre__cipler">
          <button type="button" className={!secim.tur ? 'cip cip--acik' : 'cip'} onClick={() => setSecim((s) => ({ ...s, tur: '' }))}>
            Tümü
          </button>
          {filtreler.turler.map((t) => (
            <button
              key={t.deger} type="button"
              className={secim.tur === t.deger ? 'cip cip--acik' : 'cip'}
              onClick={() => turSec(t.deger)}
            >
              {TUR_ETIKETI[t.deger]} <span className="cip__adet">{t.adet}</span>
            </button>
          ))}
        </div>

        <select className="filtre__sehir" value={secim.sehir} onChange={sehirSec} aria-label="Şehir">
          <option value="">Tüm şehirler</option>
          {filtreler.sehirler.map((s) => (
            <option key={s.ad} value={s.ad}>{s.ad} ({s.adet})</option>
          ))}
        </select>
      </nav>

      <main className="icerik">
        <div className="icerik__ust">
          <h2>{baslik}</h2>
          {!yukleniyor && !hata && <span className="icerik__sayi">{etkinlikler.length} etkinlik</span>}
        </div>

        {yukleniyor && <p className="durum">Etkinlikler yükleniyor…</p>}

        {hata && (
          <div className="durum durum--hata">
            <p><strong>Etkinlikler alınamadı.</strong> {hata}</p>
            <p className="durum__ipucu">API çalışıyor mu? <code>npm run server:dev</code></p>
          </div>
        )}

        {!yukleniyor && !hata && etkinlikler.length === 0 && (
          <div className="durum">
            <p><strong>Bu filtrelerle etkinlik yok.</strong></p>
            <p className="durum__ipucu">Filtreleri temizleyip tekrar deneyin.</p>
          </div>
        )}

        {!yukleniyor && !hata && etkinlikler.length > 0 && (
          <div className="izgara">
            {etkinlikler.map((e) => (
              <EtkinlikKarti key={e.id} etkinlik={e} onAc={() => setAcikId(e.id)} />
            ))}
          </div>
        )}
      </main>

      <footer className="alt">
        <span>etkinlig · üniversite etkinlik rehberi</span>
        <span>Etkinlikler şirketlerin yönetim panelinden yayınlanır.</span>
      </footer>

      {acikId && <DetayPenceresi id={acikId} onKapat={() => setAcikId(null)} />}
    </div>
  );
}
