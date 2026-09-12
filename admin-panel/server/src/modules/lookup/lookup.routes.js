import { Router } from 'express';
import { z } from 'zod';
import { execute, queryAll } from '../../db/pool.js';
import { asyncHandler, created, ok, parse } from '../../core/http.js';
import { girisGerekli } from '../../core/guard.js';

export const lookupRouter = Router();

/** Form ekranının ve ziyaretçilerin ihtiyaç duyduğu tüm listeler tek çağrıda. */
lookupRouter.get('/', asyncHandler(async (req, res) => {
  const [sehirler, bolumler, sirketler] = await Promise.all([
    queryAll('SELECT id, ad, plaka_kodu AS plakaKodu FROM sehirler ORDER BY ad'),
    queryAll('SELECT id, ad, fakulte FROM bolumler ORDER BY ad'),
    queryAll('SELECT id, ad, eposta FROM sirketler ORDER BY ad'),
  ]);
  ok(res, {
    sehirler,
    bolumler,
    sirketler,
    turler: [
      { deger: 'konferans', etiket: 'Konferans', aciklama: 'Çok oturumlu, konuşmacı programlı tam gün etkinlik' },
      { deger: 'sunum', etiket: 'Sunum', aciklama: 'Tek konuşmacılı, 1–2 saatlik tanıtım veya seminer' },
      { deger: 'hackathon', etiket: 'Hackathon', aciklama: 'Takım bazlı, çok günlü yarışma formatı' },
    ],
    ogrenimDuzeyleri: [
      { deger: 'on_lisans', etiket: 'Ön lisans' },
      { deger: 'lisans', etiket: 'Lisans' },
      { deger: 'yuksek_lisans', etiket: 'Yüksek lisans' },
      { deger: 'doktora', etiket: 'Doktora' },
    ],
    siniflar: [
      { deger: 0, etiket: 'Hazırlık' }, { deger: 1, etiket: '1. sınıf' }, { deger: 2, etiket: '2. sınıf' },
      { deger: 3, etiket: '3. sınıf' }, { deger: 4, etiket: '4. sınıf' }, { deger: 5, etiket: 'Mezun' },
    ],
    durumlar: [
      { deger: 'taslak', etiket: 'Taslak' }, { deger: 'yayinda', etiket: 'Yayında' },
      { deger: 'doldu', etiket: 'Doldu' }, { deger: 'iptal', etiket: 'İptal' },
      { deger: 'tamamlandi', etiket: 'Tamamlandı' },
    ],
  });
}));

lookupRouter.post('/sirketler', girisGerekli, asyncHandler(async (req, res) => {

  const govde = parse(
    z.object({
      ad: z.string().trim().min(2).max(160),
      eposta: z.string().trim().email().max(160).optional().nullable(),
      webSitesi: z.string().trim().max(200).optional().nullable(),
    }),
    req.body,
  );
  const sonuc = await execute(
    'INSERT INTO sirketler (ad, eposta, web_sitesi) VALUES (:ad, :eposta, :webSitesi)',
    { ad: govde.ad, eposta: govde.eposta ?? null, webSitesi: govde.webSitesi ?? null },
  );
  created(res, { id: sonuc.insertId, ad: govde.ad, eposta: govde.eposta ?? null });
}));

lookupRouter.post('/bolumler', girisGerekli, asyncHandler(async (req, res) => {
  const govde = parse(
    z.object({ ad: z.string().trim().min(2).max(120), fakulte: z.string().trim().max(120).optional().nullable() }),
    req.body,
  );
  const sonuc = await execute('INSERT INTO bolumler (ad, fakulte) VALUES (:ad, :fakulte)', {
    ad: govde.ad, fakulte: govde.fakulte ?? null,
  });
  created(res, { id: sonuc.insertId, ad: govde.ad });
}));
