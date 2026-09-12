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

export function createApp() {
  const app = express();

  // credentials: çerezle taşınan oturumun tarayıcıdan gönderilebilmesi için.
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/saglik', async (req, res) => {
    try {
      res.json({ data: { api: true, db: await healthcheck() } });
    } catch {
      res.status(503).json({ data: { api: true, db: false } });
    }
  });

  // Açık uçlar: giriş, çıkış, ilk kurulum.
  app.use('/api/oturum', oturumRouter);

  // Bundan sonrası oturum ister.
  app.use('/api/kullanicilar', kullaniciRouter);
  app.use('/api/etkinlikler', girisGerekli, etkinlikRouter);
  app.use('/api/basvurular', girisGerekli, basvuruRouter);
  app.use('/api/tanimlar', girisGerekli, lookupRouter);
  app.use('/api/istatistik', girisGerekli, istatistikRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
