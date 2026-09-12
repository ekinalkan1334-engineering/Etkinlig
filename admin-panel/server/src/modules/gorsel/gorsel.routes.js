import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ApiError, created } from '../../core/http.js';
import { env } from '../../config/env.js';

mkdirSync(env.yuklemeKlasoru, { recursive: true });

const IZINLI = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const depo = multer.diskStorage({
  destination: (req, dosya, cb) => cb(null, env.yuklemeKlasoru),
  // Dosya adı istemciden gelmez: rastgele ad + izinli uzantı.
  // Böylece yol kaçışı, üzerine yazma ve .php gibi uzantılar mümkün olmaz.
  filename: (req, dosya, cb) =>
    cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${IZINLI[dosya.mimetype]}`),
});

const yukleyici = multer({
  storage: depo,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, dosya, cb) => {
    if (!IZINLI[dosya.mimetype]) {
      return cb(new ApiError(400, 'gecersiz_istek', 'Yalnızca PNG, JPG veya WEBP yükleyebilirsiniz'));
    }
    return cb(null, true);
  },
}).single('gorsel');

export const gorselRouter = Router();

gorselRouter.post('/', (req, res, next) => {
  yukleyici(req, res, (hata) => {
    if (hata instanceof multer.MulterError) {
      const mesaj = hata.code === 'LIMIT_FILE_SIZE'
        ? 'Görsel en fazla 2 MB olabilir'
        : 'Görsel yüklenemedi';
      return next(new ApiError(400, 'gecersiz_istek', mesaj));
    }
    if (hata) return next(hata);
    if (!req.file) return next(new ApiError(400, 'gecersiz_istek', 'Görsel dosyası gönderilmedi'));

    return created(res, {
      yol: `${env.yuklemeYolu}/${path.basename(req.file.filename)}`,
      boyut: req.file.size,
      tip: req.file.mimetype,
    });
  });
});
