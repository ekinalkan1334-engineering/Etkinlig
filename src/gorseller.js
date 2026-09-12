import atolye from './assets/banner/atolye.jpeg';
import bootcamp from './assets/banner/bootcamp.jpeg';
import fuar from './assets/banner/fuar.jpeg';
import hackathon from './assets/banner/hackathon.jpeg';
import seminer from './assets/banner/seminer.jpeg';

/**
 * Ana sayfadaki koleksiyon şeridi.
 * Her biri altta listeyi süzer: kimi tür filtresi, kimi arama kelimesi.
 */
export const KOLEKSIYONLAR = [
  { anahtar: 'hackathon', ad: 'Hackathon', alt: 'Takım yarışmaları', gorsel: hackathon, filtre: { tur: 'hackathon' } },
  { anahtar: 'seminer', ad: 'Seminer', alt: 'Tek oturumluk sunumlar', gorsel: seminer, filtre: { tur: 'sunum' } },
  { anahtar: 'atolye', ad: 'Atölye', alt: 'Uygulamalı çalışmalar', gorsel: atolye, filtre: { arama: 'atölye' } },
  { anahtar: 'bootcamp', ad: 'Bootcamp', alt: 'Yoğun eğitim kampları', gorsel: bootcamp, filtre: { arama: 'kamp' } },
  { anahtar: 'fuar', ad: 'Kariyer fuarı', alt: 'Şirketlerle tanışma', gorsel: fuar, filtre: { arama: 'fuar' } },
];

const BANNER = { atolye, bootcamp, fuar, hackathon, seminer };

/** Başlıkta geçen kelimeye göre en uygun yedek görsel. */
const ANAHTARLAR = [
  [/hackathon|hack/i, 'hackathon'],
  [/atölye|atolye|workshop/i, 'atolye'],
  [/bootcamp|kamp/i, 'bootcamp'],
  [/fuar|kariyer günleri|kariyer gunleri/i, 'fuar'],
  [/seminer|sunum|söyleşi|soylesi|konuşma/i, 'seminer'],
];

/** Tür, hiçbir kelime tutmazsa devreye giren yedek. */
const TURE_GORE = { hackathon: 'hackathon', sunum: 'seminer', konferans: 'fuar' };

/**
 * Şirket kapak görseli yüklememişse ilana bir banner atar.
 * Seçim başlığa ve türe bakar; ikisi de tutmazsa id'den türetilir —
 * böylece aynı ilan her açılışta aynı görseli gösterir.
 */
export function yedekGorsel(etkinlik) {
  const baslik = etkinlik?.baslik ?? '';
  for (const [kalip, ad] of ANAHTARLAR) {
    if (kalip.test(baslik)) return BANNER[ad];
  }
  const turden = TURE_GORE[etkinlik?.tur];
  if (turden) return BANNER[turden];

  const adlar = Object.keys(BANNER);
  return BANNER[adlar[(Number(etkinlik?.id) || 0) % adlar.length]];
}

export const kapakGorseli = (etkinlik) => etkinlik?.gorsel || yedekGorsel(etkinlik);
