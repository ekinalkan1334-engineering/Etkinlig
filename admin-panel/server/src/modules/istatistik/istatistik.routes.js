import { Router } from 'express';
import { queryAll, queryOne } from '../../db/pool.js';
import { asyncHandler, ok } from '../../core/http.js';
import { kapsamSirketId } from '../../core/kapsam.js';

export const istatistikRouter = Router();

/** Panel ekranının tek çağrıda okuduğu özet — oturumdaki şirkete göre daraltılır. */
istatistikRouter.get('/panel', asyncHandler(async (req, res) => {
  const sirketId = kapsamSirketId(req.kullanici);
  const p = { sirketId };
  // Genel adminde sirketId null; kıyas NULL olduğunda koşul her satır için doğru sayılır.
  const eSuz = 'AND (:sirketId IS NULL OR e.sirket_id = :sirketId)';

  const [kartlar, yaklasan, sonBasvurular, aylik, sehirDagilimi] = await Promise.all([
    queryOne(`
      SELECT
        (SELECT COUNT(*) FROM etkinlikler e WHERE e.durum = 'yayinda' ${eSuz})                     AS aktifEtkinlik,
        (SELECT COUNT(*) FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id
           WHERE b.durum = 'beklemede' ${eSuz})                                                    AS bekleyenBasvuru,
        (SELECT COUNT(*) FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id
           WHERE b.durum = 'onaylandi' ${eSuz})                                                    AS onayliKatilimci,
        (SELECT COUNT(*) FROM sirketler s WHERE (:sirketId IS NULL OR s.id = :sirketId))           AS kayitliSirket
    `, p),
    queryAll(`
      SELECT e.id, e.baslik, e.tur, e.baslangic, e.kontenjan,
             s.ad AS sirket_adi, c.ad AS sehir_adi,
             COALESCE(SUM(b.durum = 'onaylandi'), 0) AS onayli
      FROM etkinlikler e
      JOIN sirketler s ON s.id = e.sirket_id
      JOIN sehirler  c ON c.id = e.sehir_id
      LEFT JOIN basvurular b ON b.etkinlik_id = e.id
      WHERE e.baslangic >= NOW() AND e.durum IN ('yayinda','doldu') ${eSuz}
      GROUP BY e.id
      ORDER BY e.baslangic ASC
      LIMIT 5
    `, p),
    queryAll(`
      SELECT b.id, b.basvuru_tarihi, o.ad_soyad, o.sinif, bl.ad AS bolum_adi, e.baslik AS etkinlik_basligi
      FROM basvurular b
      JOIN ogrenciler o ON o.id = b.ogrenci_id
      JOIN etkinlikler e ON e.id = b.etkinlik_id
      LEFT JOIN bolumler bl ON bl.id = o.bolum_id
      WHERE 1 = 1 ${eSuz}
      ORDER BY b.basvuru_tarihi DESC
      LIMIT 6
    `, p),
    queryAll(`
      SELECT DATE_FORMAT(e.baslangic, '%Y-%m') AS ay,
             SUM(e.tur = 'konferans') AS konferans,
             SUM(e.tur = 'sunum')     AS sunum,
             SUM(e.tur = 'hackathon') AS hackathon
      FROM etkinlikler e
      WHERE e.baslangic >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) ${eSuz}
      GROUP BY ay ORDER BY ay
    `, p),
    queryAll(`
      SELECT c.ad AS sehir, COUNT(*) AS adet
      FROM etkinlikler e JOIN sehirler c ON c.id = e.sehir_id
      WHERE 1 = 1 ${eSuz}
      GROUP BY c.id ORDER BY adet DESC LIMIT 5
    `, p),
  ]);

  const toplamSehir = sehirDagilimi.reduce((t, s) => t + Number(s.adet), 0) || 1;

  ok(res, {
    kapsam: sirketId === null ? 'tum-sirketler' : 'sirket',
    kartlar: {
      aktifEtkinlik: Number(kartlar.aktifEtkinlik),
      bekleyenBasvuru: Number(kartlar.bekleyenBasvuru),
      onayliKatilimci: Number(kartlar.onayliKatilimci),
      kayitliSirket: Number(kartlar.kayitliSirket),
    },
    yaklasan: yaklasan.map((r) => ({
      id: r.id, baslik: r.baslik, tur: r.tur, baslangic: r.baslangic,
      sirket: r.sirket_adi, sehir: r.sehir_adi,
      onayli: Number(r.onayli), kontenjan: r.kontenjan,
    })),
    sonBasvurular: sonBasvurular.map((r) => ({
      id: r.id, adSoyad: r.ad_soyad, sinif: r.sinif, bolum: r.bolum_adi,
      etkinlik: r.etkinlik_basligi, tarih: r.basvuru_tarihi,
    })),
    aylik: aylik.map((r) => ({
      ay: r.ay, konferans: Number(r.konferans), sunum: Number(r.sunum), hackathon: Number(r.hackathon),
    })),
    sehirDagilimi: sehirDagilimi.map((r) => ({
      sehir: r.sehir, adet: Number(r.adet), yuzde: Math.round((Number(r.adet) / toplamSehir) * 100),
    })),
  });
}));
