import { ApiError, asyncHandler } from './http.js';
import { env } from '../config/env.js';
import * as oturumService from '../modules/oturum/oturum.service.js';

export const CEREZ_ADI = 'etkinlig_oturum';

export const cerezSecenekleri = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.uretim,
  path: '/',
  maxAge: env.jwt.cerezOmruMs,
};

/** Geçerli oturum yoksa 401. Doğrulanan kullanıcı req.kullanici'ya yazılır. */
export const girisGerekli = asyncHandler(async (req, res, next) => {
  const jeton = req.cookies?.[CEREZ_ADI] ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!jeton) throw new ApiError(401, 'kimlik_hatasi', 'Bu işlem için giriş yapmalısınız');

  const icerik = oturumService.jetonCoz(jeton);
  if (!icerik) throw new ApiError(401, 'kimlik_hatasi', 'Oturum süresi dolmuş, tekrar giriş yapın');

  req.kullanici = await oturumService.ben(icerik.sub);
  next();
});

/** girisGerekli'den sonra kullanılır. */
export const rolGerekli = (...roller) => (req, res, next) => {
  if (!req.kullanici) return next(new ApiError(401, 'kimlik_hatasi', 'Giriş gerekli'));
  if (!roller.includes(req.kullanici.rol)) {
    return next(new ApiError(403, 'yetki_yok', 'Bu işlem için yönetici yetkisi gerekiyor'));
  }
  return next();
};
