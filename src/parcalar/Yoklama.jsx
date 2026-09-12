import { useState } from 'react';
import * as api from '../api.js';
import { Simge } from './temel.jsx';

/**
 * Katılım doğrulama kutusu.
 * Yalnızca başvurusu onaylanmış katılımcıya, etkinlik saatinde gösterilir;
 * kodu etkinlik görevlisi söyler.
 */
export default function Yoklama({ etkinlikId, katildi, onKatildi }) {
  const [kod, setKod] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(null);

  if (katildi) {
    return (
      <div className="yoklama yoklama--tamam">
        <Simge ad="onay" boyut={18} />
        <div>
          <strong>Katılımınız doğrulandı</strong>
          <span>Profilinizde rozet olarak görünüyor.</span>
        </div>
      </div>
    );
  }

  async function gonder(e) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);
    try {
      const sonuc = await api.yoklamaGonder(etkinlikId, kod);
      onKatildi?.(sonuc);
      setKod('');
    } catch (e2) {
      setHata(e2.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form className="yoklama" onSubmit={gonder}>
      <div className="yoklama__metin">
        <strong>Yoklama</strong>
        <span>Etkinlikte görevlinin verdiği 4 haneli kodu gir.</span>
      </div>
      <div className="yoklama__alan">
        <input
          value={kod}
          onChange={(e) => setKod(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          aria-label="Yoklama kodu"
        />
        <button type="submit" className="dugme dugme--birincil" disabled={gonderiliyor || kod.length !== 4}>
          {gonderiliyor ? 'Gönderiliyor…' : 'Doğrula'}
        </button>
      </div>
      {hata && <p className="yoklama__hata">{hata}</p>}
    </form>
  );
}
