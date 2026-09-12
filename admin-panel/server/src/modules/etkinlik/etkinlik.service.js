import { ApiError } from '../../core/http.js';
import { kaydaErisimDogrula } from '../../core/kapsam.js';
import * as repo from './etkinlik.repository.js';

/** DB satırını API sözleşmesine çevirir — tek dönüşüm noktası (DRY). */
const ozeteCevir = (r) => ({
  id: r.id,
  kod: r.kod,
  baslik: r.baslik,
  tur: r.tur,
  durum: r.durum,
  baslangic: r.baslangic,
  bitis: r.bitis,
  sonBasvuru: r.son_basvuru,
  kontenjan: r.kontenjan,
  basvuruyaAcik: !!r.basvuruya_acik,
  sirket: { id: r.sirket_id, ad: r.sirket_adi },
  sehir: { id: r.sehir_id, ad: r.sehir_adi },
  basvuruSayisi: Number(r.basvuru_sayisi),
  onayliSayisi: Number(r.onayli_sayisi),
  doluluk: r.kontenjan > 0 ? Math.round((Number(r.onayli_sayisi) / r.kontenjan) * 100) : 0,
});

const detayaCevir = (r) => ({
  ...ozeteCevir(r),
  aciklama: r.aciklama,
  iletisimEpostasi: r.iletisim_epostasi,
  ilce: r.ilce,
  adres: r.adres,
  kapakGorseli: r.kapak_gorseli,
  sartlar: {
    ogrenimDuzeyi: r.sart_ogrenim_duzeyi,
    siniflar: r.siniflar,
    bolumler: r.bolumler,
    minOrtalama: r.sart_min_ortalama === null ? null : Number(r.sart_min_ortalama),
    belgeZorunlu: !!r.sart_belge_zorunlu,
  },
  ayarlar: {
    otomatikOnay: !!r.otomatik_onay,
    yedekListe: !!r.yedek_liste,
    katilimBelgesi: !!r.katilim_belgesi,
  },
  olusturuldu: r.olusturuldu,
  guncellendi: r.guncellendi,
});

export async function listele(filtre) {
  const { satirlar, toplam } = await repo.listele(filtre);
  return {
    kayitlar: satirlar.map(ozeteCevir),
    meta: {
      toplam,
      sayfa: filtre.sayfa,
      limit: filtre.limit,
      sayfaSayisi: Math.max(1, Math.ceil(toplam / filtre.limit)),
    },
  };
}

/** Kullanıcı verildiyse kayıt onun kapsamında mı diye bakılır. */
export async function bul(id, kullanici = null) {
  const satir = await repo.bul(id);
  if (!satir) throw ApiError.notFound('Etkinlik bulunamadı');
  if (kullanici) kaydaErisimDogrula(satir.sirket_id, kullanici);
  return detayaCevir(satir);
}

export async function olustur(girdi) {
  const yil = girdi.baslangic.slice(0, 4);
  const kod = await repo.sonrakiKod(yil);
  const id = await repo.olustur(girdi, kod);
  return bul(id);
}

export async function guncelle(id, girdi, kullanici = null) {
  await bul(id, kullanici); // yoksa 404, kapsam dışıysa 404
  await repo.guncelle(id, girdi);
  return bul(id);
}

export async function durumDegistir(id, durum, kullanici = null) {
  await bul(id, kullanici);
  await repo.durumDegistir(id, durum);
  return bul(id);
}

export async function sil(id, kullanici = null) {
  await bul(id, kullanici);
  await repo.sil(id);
}

/** Excel raporu için katılımcı satırları. */
export const katilimcilar = (etkinlikId) => repo.katilimcilar(etkinlikId);
