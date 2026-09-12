import { useEffect, useState } from 'react';
import { useOturum } from '../oturum.jsx';
import { git } from '../rota.js';

export default function Giris() {
  const { ogrenci, hazir, giris, kayit } = useOturum();
  const [kip, setKip] = useState('giris'); // giris | kayit
  const [form, setForm] = useState({ adSoyad: '', eposta: '', parola: '', universite: '' });
  const [hata, setHata] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => { if (hazir && ogrenci) git('/'); }, [hazir, ogrenci]);

  const degistir = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function gonder(e) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);
    try {
      if (kip === 'giris') await giris({ eposta: form.eposta, parola: form.parola });
      else await kayit(form);
      git('/');
    } catch (e2) {
      setHata(e2.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <main className="giris-sayfasi">
      <div className="giris-kutu">
        <div className="giris-kutu__sekmeler" role="tablist">
          <button
            type="button" role="tab" aria-selected={kip === 'giris'}
            className={kip === 'giris' ? 'sekme sekme--aktif' : 'sekme'}
            onClick={() => { setKip('giris'); setHata(null); }}
          >
            Giriş yap
          </button>
          <button
            type="button" role="tab" aria-selected={kip === 'kayit'}
            className={kip === 'kayit' ? 'sekme sekme--aktif' : 'sekme'}
            onClick={() => { setKip('kayit'); setHata(null); }}
          >
            Hesap oluştur
          </button>
        </div>

        <h1>{kip === 'giris' ? 'Tekrar hoş geldin' : 'Aramıza katıl'}</h1>
        <p className="giris-kutu__alt">
          {kip === 'giris'
            ? 'Başvurularını görmek ve yeni etkinliklere başvurmak için giriş yap.'
            : 'Üniversite e-postanla kayıt ol, etkinliklere tek tıkla başvur.'}
        </p>

        {hata && <p className="uyari uyari--kotu">{hata}</p>}

        <form onSubmit={gonder} className="giris-form">
          {kip === 'kayit' && (
            <label>
              <span>Ad soyad</span>
              <input name="adSoyad" value={form.adSoyad} onChange={degistir} required minLength={3} autoComplete="name" />
            </label>
          )}

          <label>
            <span>E-posta</span>
            <input
              name="eposta" type="email" value={form.eposta} onChange={degistir} required
              autoComplete="username" placeholder="ornek@ogrenci.edu.tr"
            />
          </label>

          <label>
            <span>Parola</span>
            <input
              name="parola" type="password" value={form.parola} onChange={degistir} required
              autoComplete={kip === 'giris' ? 'current-password' : 'new-password'}
            />
            {kip === 'kayit' && (
              <small>En az 8 karakter; bir büyük harf, bir küçük harf ve bir rakam içermeli.</small>
            )}
          </label>

          {kip === 'kayit' && (
            <label>
              <span>Üniversite <em>(isteğe bağlı)</em></span>
              <input name="universite" value={form.universite} onChange={degistir} autoComplete="organization" />
            </label>
          )}

          <button type="submit" className="dugme dugme--birincil dugme--genis" disabled={gonderiliyor}>
            {gonderiliyor ? 'Bekleyin…' : kip === 'giris' ? 'Giriş yap' : 'Hesabı oluştur'}
          </button>
        </form>
      </div>

      <aside className="giris-yan">
        <h2>Neden hesap?</h2>
        <ul>
          <li>Başvurularını tek listede takip edersin.</li>
          <li>Aynı etkinliğe iki kez başvurmazsın.</li>
          <li>Etkinlik sayfasında soru sorabilir, deneyimini paylaşabilirsin.</li>
        </ul>
      </aside>
    </main>
  );
}
