import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../api.js';
import { useOturum } from '../oturum.jsx';
import EtkinlikKarti from '../parcalar/EtkinlikKarti.jsx';
import { Durum, Simge } from '../parcalar/temel.jsx';
import Koleksiyonlar from '../parcalar/Koleksiyonlar.jsx';
import { KOLEKSIYONLAR } from '../gorseller.js';
import { TUR } from '../bicim.js';

const BOS_FILTRE = { arama: '', tur: '', sehir: '' };

export default function AnaSayfa() {
  const { basvurumVar } = useOturum();
  const [etkinlikler, setEtkinlikler] = useState([]);
  const [secenekler, setSecenekler] = useState({ sehirler: [], turler: [] });
  const [filtre, setFiltre] = useState(BOS_FILTRE);
  const [koleksiyon, setKoleksiyon] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async (f) => {
    setYukleniyor(true);
    setHata(null);
    try {
      setEtkinlikler(await api.etkinlikleriGetir(f) ?? []);
    } catch (e) {
      setHata(e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { api.filtreleriGetir().then(setSecenekler).catch(() => {}); }, []);

  // Koleksiyon seçimi, kendi filtresini uygular; seçim kalkınca eski hâle döner.
  const etkinFiltre = useMemo(() => {
    const k = KOLEKSIYONLAR.find((x) => x.anahtar === koleksiyon);
    return k ? { ...filtre, ...k.filtre } : filtre;
  }, [filtre, koleksiyon]);

  // Filtre değişince tek istek; yazarken her tuşta değil.
  useEffect(() => {
    const z = setTimeout(() => yukle(etkinFiltre), 250);
    return () => clearTimeout(z);
  }, [etkinFiltre, yukle]);

  const filtreliMi = filtre.arama !== '' || filtre.tur !== '' || filtre.sehir !== '' || koleksiyon !== null;
  const degistir = (parca) => setFiltre((f) => ({ ...f, ...parca }));

  const baslik = useMemo(() => {
    const k = KOLEKSIYONLAR.find((x) => x.anahtar === koleksiyon);
    if (k) return k.ad;
    if (filtre.sehir && filtre.tur) return `${filtre.sehir} · ${TUR[filtre.tur]}`;
    if (filtre.sehir) return filtre.sehir;
    if (filtre.tur) return TUR[filtre.tur];
    return 'Yaklaşan etkinlikler';
  }, [filtre, koleksiyon]);

  return (
    <>
      <section className="kahraman">
        <h1>Şirketlerin kampüs etkinlikleri, <em>tek yerde</em>.</h1>
        <p className="kahraman__alt">
          Duyurular doğrudan düzenleyen şirketin panelinden gelir. Şartları oku, kontenjanı gör,
          başvurunu buradan yap.
        </p>
        <dl className="kahraman__sayilar">
          <div><dt>Açık etkinlik</dt><dd>{yukleniyor ? '—' : etkinlikler.length}</dd></div>
          <div><dt>Şehir</dt><dd>{secenekler.sehirler.length || '—'}</dd></div>
        </dl>
      </section>

      <Koleksiyonlar secili={koleksiyon} onSec={setKoleksiyon} />

      <div className="filtre-cubugu">
        <div className="filtre__turler" role="group" aria-label="Etkinlik türü">
          <button
            type="button"
            className={filtre.tur === '' ? 'sekme sekme--aktif' : 'sekme'}
            onClick={() => { degistir({ tur: '' }); setKoleksiyon(null); }}
          >
            Tümü
          </button>
          {secenekler.turler.map((t) => (
            <button
              key={t.deger}
              type="button"
              className={filtre.tur === t.deger ? 'sekme sekme--aktif' : 'sekme'}
              onClick={() => { degistir({ tur: filtre.tur === t.deger ? '' : t.deger }); setKoleksiyon(null); }}
            >
              {TUR[t.deger]}
              <span className="sekme__adet">{t.adet}</span>
            </button>
          ))}
        </div>

        <div className="filtre__sag">
          <label className="arama">
            <Simge ad="ara" />
            <input
              type="search"
              value={filtre.arama}
              onChange={(e) => degistir({ arama: e.target.value })}
              placeholder="Etkinlik veya şirket ara"
            />
          </label>

          <select
            className="secim"
            value={filtre.sehir}
            onChange={(e) => degistir({ sehir: e.target.value })}
            aria-label="Şehir"
          >
            <option value="">Tüm şehirler</option>
            {secenekler.sehirler.map((s) => (
              <option key={s.ad} value={s.ad}>{s.ad} ({s.adet})</option>
            ))}
          </select>

          {filtreliMi && (
            <button type="button" className="dugme dugme--sade" onClick={() => { setFiltre(BOS_FILTRE); setKoleksiyon(null); }}>
              Temizle
            </button>
          )}
        </div>
      </div>

      <main className="icerik">
        <div className="icerik__ust">
          <h2>{baslik}</h2>
          {!yukleniyor && !hata && (
            <span className="icerik__sayi">{etkinlikler.length} sonuç</span>
          )}
        </div>

        <Durum
          yukleniyor={yukleniyor}
          hata={hata}
          bos={etkinlikler.length === 0}
          bosBaslik={filtreliMi ? 'Bu filtrelerle etkinlik yok' : 'Henüz yayında etkinlik yok'}
          bosAlt={filtreliMi ? 'Aramayı daraltmayı ya da filtreleri temizlemeyi deneyin.' : 'Şirketler etkinlik yayınladığında burada görünecek.'}
        >
          <div className="izgara">
            {etkinlikler.map((e) => (
              <EtkinlikKarti key={e.id} etkinlik={e} basvuruDurumu={basvurumVar(e.id)} />
            ))}
          </div>
        </Durum>
      </main>
    </>
  );
}
