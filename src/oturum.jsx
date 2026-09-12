import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api.js';

const OturumBaglami = createContext(null);

/**
 * Öğrenci oturumu ve başvuru listesi tek yerde tutulur.
 * "Bu etkinliğe başvurdum mu?" sorusu her ekranda buradan yanıtlanır —
 * ayrı ayrı istek atılmaz.
 */
export function OturumSaglayici({ children }) {
  const [ogrenci, setOgrenci] = useState(null);
  const [basvurular, setBasvurular] = useState([]);
  const [hazir, setHazir] = useState(false);

  const basvurulariTazele = useCallback(async () => {
    try {
      setBasvurular(await api.basvurularimiGetir() ?? []);
    } catch {
      setBasvurular([]);
    }
  }, []);

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const ben = await api.beniGetir();
        if (iptal) return;
        setOgrenci(ben);
        await basvurulariTazele();
      } catch {
        if (!iptal) { setOgrenci(null); api.jetonYaz(null); }
      } finally {
        if (!iptal) setHazir(true);
      }
    })();
    return () => { iptal = true; };
  }, [basvurulariTazele]);

  const oturumKur = useCallback(async (sonuc) => {
    if (sonuc?.jeton) api.jetonYaz(sonuc.jeton);
    setOgrenci(sonuc.ogrenci);
    await basvurulariTazele();
    return sonuc.ogrenci;
  }, [basvurulariTazele]);

  const giris = useCallback(async (govde) => oturumKur(await api.girisYap(govde)), [oturumKur]);
  const kayit = useCallback(async (govde) => oturumKur(await api.kayitOl(govde)), [oturumKur]);

  const cikis = useCallback(async () => {
    try { await api.cikisYap(); } finally {
      api.jetonYaz(null);
      setOgrenci(null);
      setBasvurular([]);
    }
  }, []);

  const basvur = useCallback(async (etkinlikId) => {
    const sonuc = await api.basvuruYap(etkinlikId);
    await basvurulariTazele();
    return sonuc;
  }, [basvurulariTazele]);

  const basvurumVar = useCallback(
    (etkinlikId) => basvurular.find((b) => b.etkinlik.id === Number(etkinlikId)) ?? null,
    [basvurular],
  );

  const deger = useMemo(
    () => ({ ogrenci, basvurular, hazir, giris, kayit, cikis, basvur, basvurumVar, basvurulariTazele }),
    [ogrenci, basvurular, hazir, giris, kayit, cikis, basvur, basvurumVar, basvurulariTazele],
  );

  return <OturumBaglami.Provider value={deger}>{children}</OturumBaglami.Provider>;
}

export function useOturum() {
  const b = useContext(OturumBaglami);
  if (!b) throw new Error('useOturum, OturumSaglayici içinde çağrılmalı');
  return b;
}
