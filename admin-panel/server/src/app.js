import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './core/http.js';
import { girisGerekli } from './core/guard.js';
import { healthcheck } from './db/pool.js';
import { etkinlikRouter } from './modules/etkinlik/etkinlik.routes.js';
import { basvuruRouter } from './modules/basvuru/basvuru.routes.js';
import { lookupRouter } from './modules/lookup/lookup.routes.js';
import { istatistikRouter } from './modules/istatistik/istatistik.routes.js';
import { kullaniciRouter, oturumRouter } from './modules/oturum/oturum.routes.js';
import { ogrenciRouter } from './modules/ogrenci/ogrenci.routes.js';

export function createApp() {
  const app = express();

  // credentials: çerezle taşınan oturumun tarayıcıdan gönderilebilmesi için.
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // API Kök Bilgilendirme Ucu
  app.get(['/', '/api'], (req, res) => {
    res.json({
      ad: 'etkinlig API',
      durum: 'aktif',
      mesaj: 'Express + MySQL API sunucusu çalışıyor',
      uclar: {
        saglik: '/api/saglik',
        etkinlikler: '/api/etkinlikler',
        tanimlar: '/api/tanimlar',
        ogrenciKayit: 'POST /api/ogrenci/kayit',
        ogrenciGiris: 'POST /api/ogrenci/giris',
        ogrenciBasvuru: 'POST /api/ogrenci/basvuru',
        ogrenciBasvurulari: 'GET /api/ogrenci/basvurular?eposta=...',
      },
      webSitesi: 'http://localhost:5173',
    });
  });

  app.get('/api/saglik', async (req, res) => {
    try {
      res.json({ data: { api: true, db: await healthcheck() } });
    } catch {
      res.status(503).json({ data: { api: true, db: false } });
    }
  });


  // Açık uçlar: yönetici oturum, öğrenci işlemleri
  app.use('/api/oturum', oturumRouter);
  app.use('/api/ogrenci', ogrenciRouter);

  // Genel listeleme ve tanım uçları (yazma işlemleri içeride korunur)
  app.use('/api/etkinlikler', etkinlikRouter);
  app.use('/api/tanimlar', lookupRouter);

  // Yönetici paneli uçları
  app.use('/api/kullanicilar', kullaniciRouter);
  app.use('/api/basvurular', girisGerekli, basvuruRouter);
  app.use('/api/istatistik', girisGerekli, istatistikRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

