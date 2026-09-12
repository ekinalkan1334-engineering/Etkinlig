import { Router } from 'express';
import { z } from 'zod';
import { queryAll, queryOne } from '../../db/pool.js';
import { ApiError, asyncHandler, ok, parse } from '../../core/http.js';

/**
 * Vitrin (öğrenci tarafı) için oturumsuz uçlar.
 *
 * Kural: yalnızca durum='yayinda' etkinlikler görünür ve yalnızca aşağıdaki
 * alanlar dışarı çıkar. İletişim e-postası, oluşturan kullanıcı, taslak/iptal
 * kayıtlar ve başvuran öğrenci bilgileri bu uçlardan asla dönmez.
 */
export const acikRouter = Router();

const ALANLAR = `
  e.id, e.kod, e.baslik, e.tur, e.baslangic, e.bitis, e.son_basvuru,
  e.ilce, e.adres, e.kontenjan, e.kapak_gorseli, e.basvuruya_acik,
  s.ad AS sirket_adi, c.ad AS sehir_adi,
  COALESCE(b.onayli, 0) AS onayli
`;

const KAYNAK = `
  FROM etkinlikler e
  JOIN sirketler s ON s.id = e.sirket_id
  JOIN sehirler  c ON c.id = e.sehir_id
  LEFT JOIN (
    SELECT etkinlik_id, SUM(durum = 'onaylandi') AS onayli
    FROM basvurular GROUP BY etkinlik_id
  ) b ON b.etkinlik_id = e.id
  WHERE e.durum = 'yayinda'
`;

const cevir = (r) => ({
  id: r.id,
  kod: r.kod,
  baslik: r.baslik,
  tur: r.tur,
  baslangic: r.baslangic,
  bitis: r.bitis,
  sonBasvuru: r.son_basvuru,
  sirket: r.sirket_adi,
  sehir: r.sehir_adi,
  ilce: r.ilce,
  gorsel: r.kapak_gorseli,
  kontenjan: r.kontenjan,
  katilimci: Number(r.onayli),
  kalanKontenjan: Math.max(0, r.kontenjan - Number(r.onayli)),
  basvuruyaAcik: !!r.basvuruya_acik && Math.max(0, r.kontenjan - Number(r.onayli)) > 0,
});

const listeSorgusu = z.object({
  arama: z.string().trim().max(160).optional(),
  tur: z.enum(['konferans', 'sunum', 'hackathon']).optional(),
  sehir: z.string().trim().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

acikRouter.get('/etkinlikler', asyncHandler(async (req, res) => {
  const f = parse(listeSorgusu, req.query);
  const kosul = [];
  const params = {};
  if (f.arama) { kosul.push('(e.baslik LIKE :arama OR s.ad LIKE :arama)'); params.arama = `%${f.arama}%`; }
  if (f.tur) { kosul.push('e.tur = :tur'); params.tur = f.tur; }
  if (f.sehir) { kosul.push('c.ad = :sehir'); params.sehir = f.sehir; }

  const satirlar = await queryAll(
    `SELECT ${ALANLAR} ${KAYNAK} ${kosul.length ? `AND ${kosul.join(' AND ')}` : ''}
     ORDER BY e.baslangic ASC LIMIT ${Number(f.limit)}`,
    params,
  );
  ok(res, satirlar.map(cevir));
}));

acikRouter.get('/etkinlikler/:id', asyncHandler(async (req, res) => {
  const { id } = parse(z.object({ id: z.coerce.number().int().positive() }), req.params);

  const satir = await queryOne(`SELECT ${ALANLAR}, e.aciklama ${KAYNAK} AND e.id = :id`, { id });
  if (!satir) throw ApiError.notFound('Etkinlik bulunamadı');

  const [siniflar, bolumler] = await Promise.all([
    queryAll('SELECT sinif FROM etkinlik_siniflari WHERE etkinlik_id = :id ORDER BY sinif', { id }),
    queryAll(
      `SELECT b.ad FROM etkinlik_bolumleri eb JOIN bolumler b ON b.id = eb.bolum_id
       WHERE eb.etkinlik_id = :id ORDER BY b.ad`,
      { id },
    ),
  ]);
  const sart = await queryOne(
    'SELECT sart_ogrenim_duzeyi, sart_min_ortalama, sart_belge_zorunlu FROM etkinlikler WHERE id = :id',
    { id },
  );

  ok(res, {
    ...cevir(satir),
    aciklama: satir.aciklama,
    sartlar: {
      ogrenimDuzeyi: sart.sart_ogrenim_duzeyi,
      siniflar: siniflar.map((s) => s.sinif),
      bolumler: bolumler.map((b) => b.ad),
      minOrtalama: sart.sart_min_ortalama === null ? null : Number(sart.sart_min_ortalama),
      belgeZorunlu: !!sart.sart_belge_zorunlu,
    },
  });
}));

/** Vitrinin filtre çubuğu için: yalnızca yayında etkinliği olan şehir ve türler. */
acikRouter.get('/filtreler', asyncHandler(async (req, res) => {
  const [sehirler, turler] = await Promise.all([
    queryAll(`SELECT c.ad, COUNT(*) AS adet ${KAYNAK} GROUP BY c.id ORDER BY adet DESC, c.ad`),
    queryAll(`SELECT e.tur, COUNT(*) AS adet ${KAYNAK} GROUP BY e.tur ORDER BY e.tur`),
  ]);
  ok(res, {
    sehirler: sehirler.map((s) => ({ ad: s.ad, adet: Number(s.adet) })),
    turler: turler.map((t) => ({ deger: t.tur, adet: Number(t.adet) })),
  });
}));
