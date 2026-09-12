import { z } from 'zod';

export const TURLER = ['konferans', 'sunum', 'hackathon'];
export const DURUMLAR = ['taslak', 'yayinda', 'doldu', 'iptal', 'tamamlandi'];
export const OGRENIM_DUZEYLERI = ['on_lisans', 'lisans', 'yuksek_lisans', 'doktora'];

const bool = z.union([z.boolean(), z.literal(0), z.literal(1)]).transform((v) => (v ? 1 : 0));
const id = z.coerce.number().int().positive();
const trim = (max) => z.string().trim().min(1).max(max);
const datetime = z.string().regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/, 'YYYY-MM-DD HH:mm biçiminde olmalı');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD biçiminde olmalı');

/** Liste filtreleri — hem controller hem repository bu sözleşmeye bakar. */
export const listeSorgusu = z.object({
  arama: z.string().trim().max(160).optional(),
  tur: z.enum(TURLER).optional(),
  durum: z.enum(DURUMLAR).optional(),
  sehirId: id.optional(),
  sirketId: id.optional(),
  baslangicSonrasi: date.optional(),
  baslangicOncesi: date.optional(),
  siralama: z.enum(['baslangic', 'baslik', 'olusturuldu', 'basvuru_sayisi']).default('baslangic'),
  yon: z.enum(['asc', 'desc']).default('asc'),
  sayfa: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const govde = z.object({
  baslik: trim(200),
  aciklama: z.string().trim().max(5000).optional().nullable(),
  tur: z.enum(TURLER),
  sirketId: id,
  iletisimEpostasi: z.string().trim().email('Geçerli bir e-posta girin').max(160).optional().nullable(),
  sehirId: id,
  ilce: z.string().trim().max(80).optional().nullable(),
  adres: z.string().trim().max(300).optional().nullable(),
  baslangic: datetime,
  bitis: datetime.optional().nullable(),
  sonBasvuru: date.optional().nullable(),
  kontenjan: z.coerce.number().int().min(0).max(65535),
  kapakGorseli: z.string().trim().max(300).optional().nullable(),

  sartOgrenimDuzeyi: z.enum(OGRENIM_DUZEYLERI).optional().nullable(),
  sartSiniflar: z.array(z.coerce.number().int().min(0).max(5)).max(6).default([]),
  sartBolumIdleri: z.array(id).max(40).default([]),
  sartMinOrtalama: z.coerce.number().min(0).max(4).optional().nullable(),
  sartBelgeZorunlu: bool.default(0),

  durum: z.enum(DURUMLAR).default('taslak'),
  basvuruyaAcik: bool.default(1),
  otomatikOnay: bool.default(0),
  yedekListe: bool.default(1),
  katilimBelgesi: bool.default(1),
});

const tarihTutarli = (v, ctx) => {
  if (v.bitis && v.bitis < v.baslangic) {
    ctx.addIssue({ code: 'custom', path: ['bitis'], message: 'Bitiş, başlangıçtan önce olamaz' });
  }
  if (v.sonBasvuru && v.sonBasvuru > v.baslangic.slice(0, 10)) {
    ctx.addIssue({ code: 'custom', path: ['sonBasvuru'], message: 'Son başvuru tarihi etkinlikten sonra olamaz' });
  }
};

export const olusturGovdesi = govde.superRefine(tarihTutarli);
export const guncelleGovdesi = govde.superRefine(tarihTutarli);
export const durumGovdesi = z.object({ durum: z.enum(DURUMLAR) });
export const idParam = z.object({ id });
