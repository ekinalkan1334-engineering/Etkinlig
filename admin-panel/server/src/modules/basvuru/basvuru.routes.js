import { Router } from 'express';
import { z } from 'zod';
import { pool, queryAll, queryOne } from '../../db/pool.js';
import { ApiError, asyncHandler, ok, parse } from '../../core/http.js';
import { kapsamSirketId, kaydaErisimDogrula } from '../../core/kapsam.js';

export const basvuruRouter = Router();

const DURUMLAR = ['beklemede', 'onaylandi', 'reddedildi', 'yedek', 'iptal'];
const id = z.coerce.number().int().positive();

const listeSorgusu = z.object({
  etkinlikId: id.optional(),
  sirketId: id.optional(),
  durum: z.enum(DURUMLAR).optional(),
  sinif: z.coerce.number().int().min(0).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const cevir = (r) => ({
  id: r.id,
  durum: r.durum,
  basvuruTarihi: r.basvuru_tarihi,
  kararTarihi: r.karar_tarihi,
  etkinlik: { id: r.etkinlik_id, baslik: r.etkinlik_basligi },
  sirket: { id: r.sirket_id, ad: r.sirket_adi },
  ogrenci: {
    id: r.ogrenci_id,
    adSoyad: r.ad_soyad,
    bolum: r.bolum_adi,
    sinif: r.sinif,
    ogrenimDuzeyi: r.ogrenim_duzeyi,
    notOrtalamasi: r.not_ortalamasi === null ? null : Number(r.not_ortalamasi),
  },
});

basvuruRouter.get('/', asyncHandler(async (req, res) => {
  const f = parse(listeSorgusu, req.query);
  const kapsam = kapsamSirketId(req.kullanici);
  if (kapsam !== null && f.sirketId && Number(f.sirketId) !== Number(kapsam)) {
    throw new ApiError(403, 'yetki_yok', 'Yalnızca kendi şirketinizin başvurularını görüntüleyebilirsiniz');
  }

  const where = [];
  const params = {};
  const sirketSuzgeci = kapsam ?? f.sirketId;
  if (sirketSuzgeci) { where.push('e.sirket_id = :sirketId'); params.sirketId = sirketSuzgeci; }
  if (f.etkinlikId) { where.push('b.etkinlik_id = :etkinlikId'); params.etkinlikId = f.etkinlikId; }
  if (f.durum) { where.push('b.durum = :durum'); params.durum = f.durum; }
  if (f.sinif !== undefined) { where.push('o.sinif = :sinif'); params.sinif = f.sinif; }

  const satirlar = await queryAll(
    `SELECT b.id, b.durum, b.basvuru_tarihi, b.karar_tarihi, b.etkinlik_id,
            e.baslik AS etkinlik_basligi, e.sirket_id, s.ad AS sirket_adi,
            o.id AS ogrenci_id, o.ad_soyad, o.sinif, o.ogrenim_duzeyi, o.not_ortalamasi,
            bl.ad AS bolum_adi
     FROM basvurular b
     JOIN etkinlikler e ON e.id = b.etkinlik_id
     JOIN sirketler   s ON s.id = e.sirket_id
     JOIN ogrenciler  o ON o.id = b.ogrenci_id
     LEFT JOIN bolumler bl ON bl.id = o.bolum_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY b.basvuru_tarihi DESC
     LIMIT ${Number(f.limit)}`,
    params,
  );
  ok(res, satirlar.map(cevir));
}));

basvuruRouter.patch('/:id/durum', asyncHandler(async (req, res) => {
  const { id: basvuruId } = parse(z.object({ id }), req.params);
  const { durum } = parse(z.object({ durum: z.enum(DURUMLAR) }), req.body);

  const sahip = await queryOne(
    `SELECT e.sirket_id FROM basvurular b JOIN etkinlikler e ON e.id = b.etkinlik_id WHERE b.id = :id`,
    { id: basvuruId },
  );
  if (!sahip) throw ApiError.notFound('Başvuru bulunamadı');
  kaydaErisimDogrula(sahip.sirket_id, req.kullanici);

  await pool.query('UPDATE basvurular SET durum = :durum, karar_tarihi = NOW() WHERE id = :id', {
    id: basvuruId, durum,
  });
  ok(res, await queryOne('SELECT id, durum, karar_tarihi FROM basvurular WHERE id = :id', { id: basvuruId }));
}));
