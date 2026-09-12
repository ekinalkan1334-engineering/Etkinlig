import { execute, queryAll, queryOne } from '../../db/pool.js';

const ALANLAR = `k.id, k.ad_soyad, k.eposta, k.rol, k.sirket_id, k.aktif, k.son_giris, k.olusturuldu,
                 s.ad AS sirket_adi`;
const KAYNAK = 'FROM kullanicilar k LEFT JOIN sirketler s ON s.id = k.sirket_id';

export const epostaIleBul = (eposta) =>
  queryOne(`SELECT ${ALANLAR}, k.parola_hash ${KAYNAK} WHERE k.eposta = :eposta`, { eposta });

export const idIleBul = (id) =>
  queryOne(`SELECT ${ALANLAR} ${KAYNAK} WHERE k.id = :id`, { id });

export const parolaHashiniAl = (id) =>
  queryOne('SELECT parola_hash FROM kullanicilar WHERE id = :id', { id });

export const listele = () =>
  queryAll(`SELECT ${ALANLAR} ${KAYNAK} ORDER BY k.rol, s.ad, k.ad_soyad`);

export const sayisi = async () =>
  Number((await queryOne('SELECT COUNT(*) AS adet FROM kullanicilar'))?.adet ?? 0);

export const aktifAdminSayisi = async () =>
  Number((await queryOne("SELECT COUNT(*) AS adet FROM kullanicilar WHERE rol = 'admin' AND aktif = 1"))?.adet ?? 0);

export async function olustur({ adSoyad, eposta, parolaHash, rol, sirketId }) {
  const sonuc = await execute(
    `INSERT INTO kullanicilar (ad_soyad, eposta, parola_hash, rol, sirket_id)
     VALUES (:adSoyad, :eposta, :parolaHash, :rol, :sirketId)`,
    { adSoyad, eposta, parolaHash, rol, sirketId: rol === 'admin' ? null : sirketId },
  );
  return sonuc.insertId;
}

export async function guncelle(id, girdi) {
  const harita = { adSoyad: 'ad_soyad', rol: 'rol', sirketId: 'sirket_id', aktif: 'aktif' };
  const atamalar = [];
  const params = { id };
  for (const [anahtar, kolon] of Object.entries(harita)) {
    if (girdi[anahtar] === undefined) continue;
    atamalar.push(`${kolon} = :${kolon}`);
    params[kolon] = typeof girdi[anahtar] === 'boolean' ? Number(girdi[anahtar]) : girdi[anahtar] ?? null;
  }
  if (!atamalar.length) return false;
  const sonuc = await execute(`UPDATE kullanicilar SET ${atamalar.join(', ')} WHERE id = :id`, params);
  return sonuc.affectedRows > 0;
}

export const parolaYaz = (id, parolaHash) =>
  execute('UPDATE kullanicilar SET parola_hash = :parolaHash WHERE id = :id', { id, parolaHash });

export const girisiIsaretle = (id) =>
  execute('UPDATE kullanicilar SET son_giris = NOW() WHERE id = :id', { id });

export async function sil(id) {
  const sonuc = await execute('DELETE FROM kullanicilar WHERE id = :id', { id });
  return sonuc.affectedRows > 0;
}
