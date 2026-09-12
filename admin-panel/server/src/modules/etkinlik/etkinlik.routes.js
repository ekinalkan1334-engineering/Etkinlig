import { Router } from 'express';
import { asyncHandler, created, ok, parse } from '../../core/http.js';
import { filtreyiDarslat, govdeyiDarslat } from '../../core/kapsam.js';
import * as service from './etkinlik.service.js';
import { durumGovdesi, guncelleGovdesi, idParam, listeSorgusu, olusturGovdesi } from './etkinlik.schema.js';
import { katilimciRaporu } from './etkinlik.rapor.js';

export const etkinlikRouter = Router();

etkinlikRouter.get('/', asyncHandler(async (req, res) => {
  const filtre = filtreyiDarslat(parse(listeSorgusu, req.query), req.kullanici);
  const { kayitlar, meta } = await service.listele(filtre);
  ok(res, kayitlar, meta);
}));

etkinlikRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  ok(res, await service.bul(id, req.kullanici));
}));

/** Katılımcı listesini Excel olarak indirir — etkinlik özelinde. */
etkinlikRouter.get('/:id/katilimcilar.xlsx', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const etkinlik = await service.bul(id, req.kullanici); // kapsam dışıysa 404
  const satirlar = await service.katilimcilar(id);
  const { dosyaAdi, tampon } = await katilimciRaporu(etkinlik, satirlar);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`);
  res.send(tampon);
}));

// Kapsam parse'tan ÖNCE yazılır: şirket admini gövdede sirketId göndermez,
// kendi şirketi sunucuda eklenir — istemciye güvenilmez.
etkinlikRouter.post('/', asyncHandler(async (req, res) => {
  const govde = parse(olusturGovdesi, govdeyiDarslat(req.body, req.kullanici));
  created(res, await service.olustur({ ...govde, olusturanId: req.kullanici.id }));
}));

etkinlikRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const govde = parse(guncelleGovdesi, govdeyiDarslat(req.body, req.kullanici));
  ok(res, await service.guncelle(id, govde, req.kullanici));
}));

etkinlikRouter.patch('/:id/durum', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { durum } = parse(durumGovdesi, req.body);
  ok(res, await service.durumDegistir(id, durum, req.kullanici));
}));

etkinlikRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = parse(idParam, req.params);
  await service.sil(id, req.kullanici);
  res.status(204).end();
}));
