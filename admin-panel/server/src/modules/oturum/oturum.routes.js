import { Router } from 'express';
import { asyncHandler, created, ok, parse } from '../../core/http.js';
import { CEREZ_ADI, cerezSecenekleri, girisGerekli, rolGerekli } from '../../core/guard.js';
import * as service from './oturum.service.js';
import {
  girisGovdesi, idParam, kullaniciGuncelleGovdesi, kullaniciOlusturGovdesi,
  parolaDegistirGovdesi, parolaSifirlaGovdesi,
} from './oturum.schema.js';

/** /api/oturum — giriş, çıkış, ilk kurulum, kendi hesabı. */
export const oturumRouter = Router();

oturumRouter.get('/durum', asyncHandler(async (req, res) => {
  ok(res, { kurulumGerekli: await service.kurulumGerekli() });
}));

oturumRouter.post('/kurulum', asyncHandler(async (req, res) => {
  const govde = parse(kullaniciOlusturGovdesi, { ...req.body, rol: 'admin', sirketId: null });
  const kullanici = await service.kurulum(govde);
  const { jeton } = await service.giris({ eposta: govde.eposta, parola: govde.parola });
  res.cookie(CEREZ_ADI, jeton, cerezSecenekleri);
  created(res, kullanici);
}));

oturumRouter.post('/giris', asyncHandler(async (req, res) => {
  const govde = parse(girisGovdesi, req.body);
  const { kullanici, jeton } = await service.giris(govde);
  res.cookie(CEREZ_ADI, jeton, cerezSecenekleri);
  ok(res, kullanici);
}));

oturumRouter.post('/cikis', (req, res) => {
  res.clearCookie(CEREZ_ADI, { ...cerezSecenekleri, maxAge: undefined });
  res.status(204).end();
});

oturumRouter.get('/ben', girisGerekli, (req, res) => ok(res, req.kullanici));

oturumRouter.post('/parola', girisGerekli, asyncHandler(async (req, res) => {
  const govde = parse(parolaDegistirGovdesi, req.body);
  await service.parolaDegistir(req.kullanici.id, govde);
  res.status(204).end();
}));

/** /api/kullanicilar — hesap açma ve yönetim, yalnızca admin. */
export const kullaniciRouter = Router();
kullaniciRouter.use(girisGerekli, rolGerekli('admin'));

kullaniciRouter.get('/', asyncHandler(async (req, res) => ok(res, await service.listele())));

kullaniciRouter.post('/', asyncHandler(async (req, res) => {
  const govde = parse(kullaniciOlusturGovdesi, req.body);
  created(res, await service.olustur(govde));
}));

kullaniciRouter.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const govde = parse(kullaniciGuncelleGovdesi, req.body);
  ok(res, await service.guncelle(id, govde, req.kullanici.id));
}));

kullaniciRouter.patch('/:id/parola', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { yeniParola } = parse(parolaSifirlaGovdesi, req.body);
  await service.parolaSifirla(id, yeniParola);
  res.status(204).end();
}));

kullaniciRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  await service.sil(id, req.kullanici.id);
  res.status(204).end();
}));
