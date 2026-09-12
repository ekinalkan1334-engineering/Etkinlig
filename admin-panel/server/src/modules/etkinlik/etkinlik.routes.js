import { Router } from 'express';
import { asyncHandler, created, ok, parse } from '../../core/http.js';
import { girisGerekli } from '../../core/guard.js';
import * as service from './etkinlik.service.js';
import { durumGovdesi, guncelleGovdesi, idParam, listeSorgusu, olusturGovdesi } from './etkinlik.schema.js';

export const etkinlikRouter = Router();

// Herkese açık listeleme ve detay
etkinlikRouter.get('/', asyncHandler(async (req, res) => {
  const filtre = parse(listeSorgusu, req.query);
  const { kayitlar, meta } = await service.listele(filtre);
  ok(res, kayitlar, meta);
}));

etkinlikRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  ok(res, await service.bul(id));
}));

// Yönetici işlemleri
etkinlikRouter.post('/', girisGerekli, asyncHandler(async (req, res) => {
  const govde = parse(olusturGovdesi, req.body);
  created(res, await service.olustur({ ...govde, olusturanId: req.kullanici.id }));
}));

etkinlikRouter.put('/:id', girisGerekli, asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const govde = parse(guncelleGovdesi, req.body);
  ok(res, await service.guncelle(id, govde));
}));

etkinlikRouter.patch('/:id/durum', girisGerekli, asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { durum } = parse(durumGovdesi, req.body);
  ok(res, await service.durumDegistir(id, durum));
}));

etkinlikRouter.delete('/:id', girisGerekli, asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  await service.sil(id);
  res.status(204).end();
}));

