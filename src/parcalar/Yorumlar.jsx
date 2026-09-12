import { useEffect, useState } from 'react';
import { useOturum } from '../oturum.jsx';
import * as api from '../api.js';
import { basHarfler, gecenSure } from '../bicim.js';
import { Simge } from './temel.jsx';

const SINIR = 1000;

export default function Yorumlar({ etkinlikId }) {
  const { ogrenci } = useOturum();
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    let iptal = false;
    api.yorumlariGetir(etkinlikId)
      .then((d) => { if (!iptal) setListe(d ?? []); })
      .catch(() => { if (!iptal) setListe([]); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [etkinlikId]);

  async function gonder(e) {
    e.preventDefault();
    const temiz = metin.trim();
    if (temiz.length < 2) return;
    setGonderiliyor(true);
    setHata(null);
    try {
      const yeni = await api.yorumEkle(etkinlikId, temiz);
      setListe((l) => [yeni, ...l]);
      setMetin('');
    } catch (e2) {
      setHata(e2.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  async function sil(id) {
    if (!window.confirm('Yorum silinsin mi?')) return;
    try {
      await api.yorumSil(id);
      setListe((l) => l.filter((y) => y.id !== id));
    } catch (e) {
      setHata(e.message);
    }
  }

  return (
    <section className="yorumlar" id="yorumlar">
      <header className="yorumlar__ust">
        <h2>Katılımcı yorumları</h2>
        <span className="yorumlar__sayi">{liste.length}</span>
      </header>

      {ogrenci ? (
        <form className="yorum-form" onSubmit={gonder}>
          <span className="yorum__avatar" aria-hidden="true">{basHarfler(ogrenci.adSoyad)}</span>
          <div className="yorum-form__alan">
            <textarea
              value={metin}
              onChange={(e) => setMetin(e.target.value.slice(0, SINIR))}
              placeholder="Bu etkinlik hakkında ne düşünüyorsun? Soru sor, deneyimini paylaş."
              rows={3}
            />
            <div className="yorum-form__dip">
              <span className="yorum-form__sayac">{metin.length}/{SINIR}</span>
              <button type="submit" className="dugme dugme--birincil" disabled={gonderiliyor || metin.trim().length < 2}>
                {gonderiliyor ? 'Gönderiliyor…' : 'Yorum yap'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="yorumlar__giris">
          Yorum yazmak için <a href="#/giris">giriş yapın</a>. Yorumları herkes görebilir.
        </p>
      )}

      {hata && <p className="yorumlar__hata">{hata}</p>}

      {yukleniyor ? (
        <p className="yorumlar__bos">Yorumlar yükleniyor…</p>
      ) : liste.length === 0 ? (
        <p className="yorumlar__bos">Henüz yorum yok. İlk yazan sen ol.</p>
      ) : (
        <ul className="yorum-listesi">
          {liste.map((y) => (
            <li key={y.id} className="yorum">
              <span className="yorum__avatar" aria-hidden="true">{basHarfler(y.yazar.adSoyad)}</span>
              <div className="yorum__govde">
                <div className="yorum__ust">
                  <strong>{y.yazar.adSoyad}</strong>
                  {y.yazar.bolum && <span className="yorum__bolum">{y.yazar.bolum}</span>}
                  <span className="yorum__zaman">{gecenSure(y.olusturuldu)}</span>
                  {y.benim && (
                    <button type="button" className="yorum__sil" onClick={() => sil(y.id)} aria-label="Yorumu sil">
                      <Simge ad="cop" boyut={14} />
                    </button>
                  )}
                </div>
                <p className="yorum__metin">{y.metin}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
