import { ApiError } from './http.js';

/**
 * Çok kiracılı erişimin tek kaynağı.
 * Genel admin (rol='admin') tüm şirketleri görür; şirket admini yalnızca kendi şirketini.
 * Her sorgu ve her yazma bu fonksiyonlardan geçer — kapsam kontrolü modüllere dağılmaz.
 */

export const genelAdmin = (kullanici) => kullanici?.rol === 'admin';

/** Sorgularda kullanılacak şirket kısıtı: genel admin için null (kısıt yok). */
export const kapsamSirketId = (kullanici) => (genelAdmin(kullanici) ? null : kullanici.sirketId);

/**
 * Liste filtresini kapsama daraltır.
 * Şirket admini başka bir şirketi sorgulamaya çalışırsa istek reddedilir —
 * sessizce kendi şirketine döndürmek, filtrenin çalıştığı yanılgısı yaratır.
 */
export function filtreyiDarslat(filtre, kullanici) {
  const sirketId = kapsamSirketId(kullanici);
  if (sirketId === null) return filtre;
  if (filtre.sirketId && Number(filtre.sirketId) !== Number(sirketId)) {
    throw new ApiError(403, 'yetki_yok', 'Yalnızca kendi şirketinizin kayıtlarını görüntüleyebilirsiniz');
  }
  return { ...filtre, sirketId };
}

/**
 * Tekil bir kaydın kapsamda olduğunu doğrular.
 * Kapsam dışındaki kayıt için 403 değil 404 döner: başka şirketin
 * hangi id'lerinin var olduğu dışarıdan anlaşılmasın.
 */
export function kaydaErisimDogrula(kayitSirketId, kullanici) {
  const sirketId = kapsamSirketId(kullanici);
  if (sirketId === null) return;
  if (Number(kayitSirketId) !== Number(sirketId)) throw ApiError.notFound('Kayıt bulunamadı');
}

/**
 * Yazma gövdesindeki sirketId'yi kapsama sabitler.
 * Doğrulamadan önce çağrılır: şirket admini gövdede sirketId göndermek zorunda
 * değildir, kendi şirketi sunucu tarafında yazılır. Başka bir şirket gönderirse
 * istek reddedilir — sessizce düzeltmek, istemcinin dediğinin geçtiği izlenimi verir.
 */
export function govdeyiDarslat(govde, kullanici) {
  const sirketId = kapsamSirketId(kullanici);
  if (sirketId === null) return govde;
  if (govde?.sirketId && Number(govde.sirketId) !== Number(sirketId)) {
    throw new ApiError(403, 'yetki_yok', 'Başka bir şirket adına kayıt oluşturamazsınız');
  }
  return { ...govde, sirketId };
}
