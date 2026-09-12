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
import { gorselRouter } from './modules/gorsel/gorsel.routes.js';
import { acikRouter } from './modules/acik/acik.routes.js';

export function createApp() {
  const app = express();

  // credentials: çerezle taşınan oturumun tarayıcıdan gönderilebilmesi için.
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Yüklenen görseller herkese açık servis edilir (vitrin de gösterecek).
  app.use(env.yuklemeYolu, express.static(env.yuklemeKlasoru, {
    maxAge: '7d',
    index: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }));

  const apiRouter = express.Router();

  apiRouter.get('/saglik', async (req, res) => {
    try {
      res.json({ data: { api: true, db: await healthcheck() } });
    } catch {
      res.status(503).json({ data: { api: true, db: false } });
    }
  });

  // --- Oturumsuz uçlar ---
  apiRouter.use('/oturum', oturumRouter);
  apiRouter.use('/acik', acikRouter);   // vitrin: yalnızca yayındaki etkinlikler

  // --- Oturum isteyenler ---
  apiRouter.use('/kullanicilar', kullaniciRouter);
  apiRouter.use('/gorseller', girisGerekli, gorselRouter);
  apiRouter.use('/etkinlikler', girisGerekli, etkinlikRouter);
  apiRouter.use('/basvurular', girisGerekli, basvuruRouter);
  apiRouter.use('/tanimlar', girisGerekli, lookupRouter);
  apiRouter.use('/istatistik', girisGerekli, istatistikRouter);

  // Hem /api hem /etkinlig/api yollarından hizmet verir
  app.use('/api', apiRouter);
  app.use('/etkinlig/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
