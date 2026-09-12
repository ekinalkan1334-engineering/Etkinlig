import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../core/http.js';
import { env } from '../../config/env.js';
import * as repo from './oturum.repository.js';

const TUZ_TURU = 10;

/** DB satırını API'ye çıkacak biçime çevirir — parola hash'i asla dışarı çıkmaz. */
export const cevir = (r) => ({
  id: r.id,
  adSoyad: r.ad_soyad,
  eposta: r.eposta,
  rol: r.rol,
  sirketId: r.sirket_id ?? null,
  sirketAdi: r.sirket_adi ?? null,
  aktif: !!r.aktif,
  sonGiris: r.son_giris,
  olusturuldu: r.olusturuldu,
});

export const jetonUret = (kullanici) =>
  jwt.sign(
    { sub: kullanici.id, rol: kullanici.rol, sid: kullanici.sirketId ?? null },
    env.jwt.gizli,
    { expiresIn: env.jwt.sure },
  );

export function jetonCoz(jeton) {
  try {
    return jwt.verify(jeton, env.jwt.gizli);
  } catch {
    return null;
  }
}

export async function giris({ eposta, parola }) {
  const satir = await repo.epostaIleBul(eposta);
  // Kullanıcı yoksa da aynı süre harcanır: e-posta var mı sorusu yanıtsız kalır.
  const hash = satir?.parola_hash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const uyuyor = await bcrypt.compare(parola, hash);

  if (!satir || !uyuyor) throw new ApiError(401, 'kimlik_hatasi', 'E-posta veya parola hatalı');
  if (!satir.aktif) throw new ApiError(403, 'hesap_pasif', 'Bu hesap devre dışı bırakılmış');

  await repo.girisiIsaretle(satir.id);
  const kullanici = cevir(satir);
  return { kullanici, jeton: jetonUret(kullanici) };
}

/**
 * Oturumdaki kullanıcı her istekte DB'den tazelenir — rolü veya şirketi
 * değiştirilmiş bir hesap eski jetonuyla eski yetkisini kullanamaz.
 */
export async function ben(id) {
  const satir = await repo.idIleBul(id);
  if (!satir || !satir.aktif) throw new ApiError(401, 'kimlik_hatasi', 'Oturum geçersiz');
  return cevir(satir);
}

export const listele = async () => (await repo.listele()).map(cevir);

export async function olustur(girdi) {
  const parolaHash = await bcrypt.hash(girdi.parola, TUZ_TURU);
  const id = await repo.olustur({ ...girdi, parolaHash });
  return cevir(await repo.idIleBul(id));
}

export async function guncelle(id, girdi, istekSahibiId) {
  const mevcut = await repo.idIleBul(id);
  if (!mevcut) throw ApiError.notFound('Kullanıcı bulunamadı');

  const yeniRol = girdi.rol ?? mevcut.rol;
  const yeniSirket = girdi.sirketId !== undefined ? girdi.sirketId : mevcut.sirket_id;
  if (yeniRol === 'sirket_admin' && !yeniSirket) {
    throw ApiError.badRequest('Şirket yöneticisi bir şirkete bağlı olmalı', [
      { alan: 'sirketId', mesaj: 'Şirket seçin' },
    ]);
  }
  if (yeniRol === 'admin' && yeniSirket) girdi = { ...girdi, sirketId: null };

  // Son aktif genel yönetici kendini kilitleyemesin.
  const adminlikBitiyor = (girdi.rol && girdi.rol !== 'admin') || girdi.aktif === false;
  if (mevcut.rol === 'admin' && mevcut.aktif && adminlikBitiyor) {
    if ((await repo.aktifAdminSayisi()) <= 1) {
      throw ApiError.conflict('Sistemde en az bir aktif genel yönetici kalmalı');
    }
  }
  if (Number(id) === Number(istekSahibiId) && girdi.aktif === false) {
    throw ApiError.conflict('Kendi hesabınızı devre dışı bırakamazsınız');
  }

  await repo.guncelle(id, girdi);
  return cevir(await repo.idIleBul(id));
}

export async function parolaDegistir(id, { mevcutParola, yeniParola }) {
  const satir = await repo.parolaHashiniAl(id);
  if (!satir) throw ApiError.notFound('Kullanıcı bulunamadı');
  if (!(await bcrypt.compare(mevcutParola, satir.parola_hash))) {
    throw new ApiError(400, 'gecersiz_istek', 'Mevcut parola hatalı');
  }
  await repo.parolaYaz(id, await bcrypt.hash(yeniParola, TUZ_TURU));
}

export async function parolaSifirla(id, yeniParola) {
  if (!(await repo.idIleBul(id))) throw ApiError.notFound('Kullanıcı bulunamadı');
  await repo.parolaYaz(id, await bcrypt.hash(yeniParola, TUZ_TURU));
}

export async function sil(id, istekSahibiId) {
  if (Number(id) === Number(istekSahibiId)) {
    throw ApiError.conflict('Kendi hesabınızı silemezsiniz');
  }
  const mevcut = await repo.idIleBul(id);
  if (!mevcut) throw ApiError.notFound('Kullanıcı bulunamadı');
  if (mevcut.rol === 'admin' && mevcut.aktif && (await repo.aktifAdminSayisi()) <= 1) {
    throw ApiError.conflict('Sistemde en az bir aktif genel yönetici kalmalı');
  }
  await repo.sil(id);
}

/** Hiç kullanıcı yoksa ilk genel yöneticinin kurulmasına izin verilir. */
export const kurulumGerekli = async () => (await repo.sayisi()) === 0;

export async function kurulum(girdi) {
  if (!(await kurulumGerekli())) {
    throw ApiError.conflict('Sistemde zaten kullanıcı var, kurulum kapalı');
  }
  return olustur({ ...girdi, rol: 'admin', sirketId: null });
}
