import { useEffect, useRef, useState } from 'react';
import * as api from '../api.js';
import { useOturum } from '../oturum.jsx';
import { Durum, Simge } from '../parcalar/temel.jsx';
import Rozetler from '../parcalar/Rozetler.jsx';
import { basHarfler, DUZEY, SINIF } from '../bicim.js';
import { git } from '../rota.js';

const BOS = {
  adSoyad: '', telefon: '', universite: '', bolumId: '',
  ogrenimDuzeyi: 'lisans', sinif: '', ogrenciNo: '', gano: '',
};

export default function Profil() {
  const { ogrenci, rozetler, hazir, profilTazele } = useOturum();
  const [form, setForm] = useState(BOS);
  const [foto, setFoto] = useState(null);
  const [cv, setCv] = useState(null);
  const [bolumler, setBolumler] = useState([]);
  const [eksikler, setEksikler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [durum, setDurum] = useState(null);
  const [kaydediyor, setKaydediyor] = useState(false);
  const fotoGirdi = useRef(null);
  const cvGirdi = useRef(null);

  useEffect(() => { if (hazir && !ogrenci) git('/giris'); }, [hazir, ogrenci]);

  useEffect(() => {
    if (!ogrenci) return;
    let iptal = false;
    Promise.all([api.profilGetir(), api.bolumleriGetir()])
      .then(([p, b]) => {
        if (iptal) return;
        setBolumler(b ?? []);
        setEksikler(p.eksikler ?? []);
        setFoto(p.profil.foto);
        setCv(p.profil.cv);
        setForm({
          adSoyad: p.profil.adSoyad ?? '',
          telefon: p.profil.telefon ?? '',
          universite: p.profil.universite ?? '',
          bolumId: p.profil.bolumId ?? '',
          ogrenimDuzeyi: p.profil.ogrenimDuzeyi ?? 'lisans',
          sinif: p.profil.sinif ?? '',
          ogrenciNo: p.profil.ogrenciNo ?? '',
          gano: p.profil.gano ?? '',
        });
      })
      .catch((e) => { if (!iptal) setHata(e); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [ogrenci]);

  const degistir = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function kaydet(e) {
    e.preventDefault();
    setDurum(null);
    setKaydediyor(true);
    try {
      const p = await api.profilGuncelle(form);
      setEksikler(p.eksikler ?? []);
      setDurum({ tip: 'iyi', mesaj: 'Profiliniz güncellendi.' });
      profilTazele?.(p.profil);
    } catch (e2) {
      setDurum({ tip: 'kotu', mesaj: e2.message });
    } finally {
      setKaydediyor(false);
    }
  }

  async function fotoSec(e) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setDurum(null);
    try {
      const s = await api.fotoYukle(dosya);
      setFoto(s.foto);
      profilTazele?.({ ...ogrenci, foto: s.foto });
    } catch (e2) {
      setDurum({ tip: 'kotu', mesaj: e2.message });
    }
  }

  async function cvSec(e) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setDurum(null);
    try {
      setCv((await api.cvYukle(dosya)).cv);
      setDurum({ tip: 'iyi', mesaj: 'CV yüklendi.' });
    } catch (e2) {
      setDurum({ tip: 'kotu', mesaj: e2.message });
    }
  }

  if (!hazir || yukleniyor) return <main className="detay"><Durum yukleniyor /></main>;
  if (!ogrenci) return null;
  if (hata) return <main className="detay"><Durum hata={hata} /></main>;

  return (
    <main className="detay">
      <header className="sayfa-basligi">
        <h1>Profilim</h1>
        <p>Şirketler başvurunu değerlendirirken bu bilgileri görür.</p>
      </header>

      {eksikler.length > 0 && (
        <p className="uyari uyari--kotu profil__uyari">
          Şu bilgiler eksik: <strong>{eksikler.join(', ')}</strong>. Bunları doldurmadan
          ön koşullu etkinliklere başvuramazsın.
        </p>
      )}
      {durum && <p className={`uyari uyari--${durum.tip}`}>{durum.mesaj}</p>}

      <div className="profil">
        <aside className="profil__yan">
          <div className="profil__foto">
            {foto ? <img src={foto} alt="Profil fotoğrafı" /> : <span>{basHarfler(form.adSoyad)}</span>}
          </div>
          <button type="button" className="dugme dugme--sade dugme--genis" onClick={() => fotoGirdi.current?.click()}>
            {foto ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
          </button>
          <input ref={fotoGirdi} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={fotoSec} />
          <p className="profil__ipucu">JPG, PNG veya WEBP · en fazla 3 MB</p>

          <div className="profil__rozet">
            <Rozetler rozetler={rozetler} />
          </div>

          <div className="profil__cv">
            <h3>CV</h3>
            {cv ? (
              <p className="profil__cvad">
                <Simge ad="onay" boyut={14} /> {cv.ad}
              </p>
            ) : (
              <p className="profil__ipucu">Henüz CV yüklemedin.</p>
            )}
            <button type="button" className="dugme dugme--sade dugme--genis" onClick={() => cvGirdi.current?.click()}>
              {cv ? 'CV değiştir' : 'CV yükle'}
            </button>
            <input ref={cvGirdi} type="file" accept="application/pdf" hidden onChange={cvSec} />
            <p className="profil__ipucu">Yalnızca PDF · en fazla 5 MB</p>
          </div>
        </aside>

        <form className="profil__form" onSubmit={kaydet}>
          <div className="profil__ikili">
            <label>
              <span>Ad soyad</span>
              <input name="adSoyad" value={form.adSoyad} onChange={degistir} required minLength={3} />
            </label>
            <label>
              <span>Telefon</span>
              <input name="telefon" value={form.telefon} onChange={degistir} placeholder="0555 000 00 00" />
            </label>
          </div>

          <label>
            <span>E-posta</span>
            <input value={ogrenci.eposta} disabled />
            <small>E-posta değiştirilemez.</small>
          </label>

          <div className="profil__ikili">
            <label>
              <span>Üniversite</span>
              <input name="universite" value={form.universite} onChange={degistir} />
            </label>
            <label>
              <span>Öğrenci numarası</span>
              <input name="ogrenciNo" value={form.ogrenciNo} onChange={degistir} />
            </label>
          </div>

          <label>
            <span>Bölüm</span>
            <select name="bolumId" value={form.bolumId} onChange={degistir}>
              <option value="">Seçin</option>
              {bolumler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
            </select>
          </label>

          <div className="profil__uclu">
            <label>
              <span>Öğrenim düzeyi</span>
              <select name="ogrenimDuzeyi" value={form.ogrenimDuzeyi} onChange={degistir}>
                {Object.entries(DUZEY).map(([d, e]) => <option key={d} value={d}>{e}</option>)}
              </select>
            </label>
            <label>
              <span>Sınıf</span>
              <select name="sinif" value={form.sinif} onChange={degistir}>
                <option value="">Seçin</option>
                {Object.entries(SINIF).map(([d, e]) => <option key={d} value={d}>{e}</option>)}
              </select>
            </label>
            <label>
              <span>Not ortalaması</span>
              <input name="gano" type="number" step="0.01" min="0" max="4" value={form.gano} onChange={degistir} placeholder="3.10" />
            </label>
          </div>

          <button type="submit" className="dugme dugme--birincil" disabled={kaydediyor}>
            {kaydediyor ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
          </button>
        </form>
      </div>
    </main>
  );
}
