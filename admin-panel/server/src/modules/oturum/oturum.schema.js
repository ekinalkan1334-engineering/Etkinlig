import { z } from 'zod';

export const ROLLER = ['admin', 'sirket_admin'];

const parola = z
  .string()
  .min(8, 'Parola en az 8 karakter olmalı')
  .max(72, 'Parola en fazla 72 karakter olabilir')
  .refine((p) => /[a-zçğıöşü]/.test(p) && /[A-ZÇĞİÖŞÜ]/.test(p) && /\d/.test(p),
    'Parola en az bir büyük harf, bir küçük harf ve bir rakam içermeli');

export const girisGovdesi = z.object({
  eposta: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin'),
  parola: z.string().min(1, 'Parola zorunlu'),
});

/** Genel admin şirkete bağlanmaz; şirket admini bir şirket seçmek zorundadır. */
const kapsamTutarli = (v, ctx) => {
  if (v.rol === 'sirket_admin' && !v.sirketId) {
    ctx.addIssue({ code: 'custom', path: ['sirketId'], message: 'Şirket yöneticisi için şirket seçin' });
  }
  if (v.rol === 'admin' && v.sirketId) {
    ctx.addIssue({ code: 'custom', path: ['sirketId'], message: 'Genel yönetici bir şirkete bağlanamaz' });
  }
};

export const kullaniciOlusturGovdesi = z.object({
  adSoyad: z.string().trim().min(3, 'Ad soyad en az 3 karakter').max(120),
  eposta: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin').max(160),
  parola,
  rol: z.enum(ROLLER).default('sirket_admin'),
  sirketId: z.coerce.number().int().positive().nullish().transform((v) => v ?? null),
}).superRefine(kapsamTutarli);

export const kullaniciGuncelleGovdesi = z.object({
  adSoyad: z.string().trim().min(3).max(120).optional(),
  rol: z.enum(ROLLER).optional(),
  sirketId: z.coerce.number().int().positive().nullish(),
  aktif: z.boolean().optional(),
});

export const parolaDegistirGovdesi = z.object({
  mevcutParola: z.string().min(1, 'Mevcut parola zorunlu'),
  yeniParola: parola,
});

export const parolaSifirlaGovdesi = z.object({ yeniParola: parola });

export const idParam = z.object({ id: z.coerce.number().int().positive() });
