import { computed, reactive, ref } from 'vue';
import { etkinlikService } from '@/services';
import { apiyeDatetime, girdiyeDatetime } from '@/utils/format.js';

export const BOS_MODEL = () => ({
  baslik: '',
  aciklama: '',
  tur: 'konferans',
  sirketId: '',
  iletisimEpostasi: '',
  sehirId: '',
  ilce: '',
  adres: '',
  baslangic: '',
  bitis: '',
  sonBasvuru: '',
  kontenjan: 100,
  kapakGorseli: null,
  sartOgrenimDuzeyi: 'lisans',
  sartSiniflar: [],
  sartBolumIdleri: [],
  sartMinOrtalama: '',
  sartBelgeZorunlu: false,
  durum: 'taslak',
  basvuruyaAcik: true,
  otomatikOnay: false,
  yedekListe: true,
  katilimBelgesi: true,
});

export const ADIMLAR = [
  { anahtar: 'temel', etiket: 'Temel bilgiler', alanlar: ['baslik', 'sirketId', 'tur', 'iletisimEpostasi', 'aciklama'] },
  { anahtar: 'sartlar', etiket: 'Katılım şartları', alanlar: ['sartOgrenimDuzeyi', 'sartSiniflar', 'kontenjan'] },
  { anahtar: 'zaman', etiket: 'Zaman ve yer', alanlar: ['sehirId', 'baslangic', 'sonBasvuru', 'adres'] },
  { anahtar: 'onizleme', etiket: 'Önizleme', alanlar: [] },
];

/** Yeni etkinlik / düzenleme ViewModel'i: model, doğrulama, adım durumu, kaydetme. */
export function useEtkinlikForm() {
  const model = reactive(BOS_MODEL());
  const adim = ref(0);
  const kaydediyor = ref(false);
  const sunucuHatalari = ref({});
  const duzenlenenId = ref(null);

  const hatalar = computed(() => {
    const h = {};
    if (!model.baslik.trim()) h.baslik = 'Etkinlik adı zorunlu';
    else if (model.baslik.trim().length < 5) h.baslik = 'En az 5 karakter olmalı';
    if (!model.sirketId) h.sirketId = 'Şirket seçin';
    if (!model.sehirId) h.sehirId = 'Şehir seçin';
    if (!model.baslangic) h.baslangic = 'Başlangıç tarihi ve saati zorunlu';
    if (model.bitis && model.baslangic && model.bitis < model.baslangic) h.bitis = 'Bitiş, başlangıçtan önce olamaz';
    if (model.sonBasvuru && model.baslangic && model.sonBasvuru > model.baslangic.slice(0, 10)) {
      h.sonBasvuru = 'Son başvuru tarihi etkinlikten sonra olamaz';
    }
    if (!(Number(model.kontenjan) >= 0)) h.kontenjan = 'Kontenjan 0 veya üzeri olmalı';
    if (!model.sartSiniflar.length) h.sartSiniflar = 'En az bir sınıf seçin';
    if (model.iletisimEpostasi && !/^\S+@\S+\.\S+$/.test(model.iletisimEpostasi)) {
      h.iletisimEpostasi = 'Geçerli bir e-posta girin';
    }
    if (model.sartMinOrtalama !== '' && (Number(model.sartMinOrtalama) < 0 || Number(model.sartMinOrtalama) > 4)) {
      h.sartMinOrtalama = '0 ile 4 arasında olmalı';
    }
    return { ...h, ...sunucuHatalari.value };
  });

  const gecerli = computed(() => Object.keys(hatalar.value).length === 0);

  const adimDurumu = (i) => {
    if (i === adim.value) return 'now';
    if (i < adim.value) return 'done';
    return 'idle';
  };

  const adimGecerli = (i) => ADIMLAR[i].alanlar.every((a) => !hatalar.value[a]);
  const ileri = () => { if (adim.value < ADIMLAR.length - 1) adim.value += 1; };
  const geri = () => { if (adim.value > 0) adim.value -= 1; };

  const cokluSec = (liste, deger) => {
    const i = liste.indexOf(deger);
    if (i === -1) liste.push(deger);
    else liste.splice(i, 1);
  };

  function doldur(detay) {
    duzenlenenId.value = detay.id;
    Object.assign(model, {
      baslik: detay.baslik,
      aciklama: detay.aciklama ?? '',
      tur: detay.tur,
      sirketId: detay.sirket.id,
      iletisimEpostasi: detay.iletisimEpostasi ?? '',
      sehirId: detay.sehir.id,
      ilce: detay.ilce ?? '',
      adres: detay.adres ?? '',
      baslangic: girdiyeDatetime(detay.baslangic),
      bitis: girdiyeDatetime(detay.bitis),
      sonBasvuru: detay.sonBasvuru ?? '',
      kontenjan: detay.kontenjan,
      kapakGorseli: detay.kapakGorseli ?? null,
      sartOgrenimDuzeyi: detay.sartlar.ogrenimDuzeyi ?? 'lisans',
      sartSiniflar: [...detay.sartlar.siniflar],
      sartBolumIdleri: detay.sartlar.bolumler.map((b) => b.id),
      sartMinOrtalama: detay.sartlar.minOrtalama ?? '',
      sartBelgeZorunlu: detay.sartlar.belgeZorunlu,
      durum: detay.durum,
      basvuruyaAcik: detay.basvuruyaAcik,
      otomatikOnay: detay.ayarlar.otomatikOnay,
      yedekListe: detay.ayarlar.yedekListe,
      katilimBelgesi: detay.ayarlar.katilimBelgesi,
    });
  }

  const govde = () => ({
    baslik: model.baslik.trim(),
    aciklama: model.aciklama.trim() || null,
    tur: model.tur,
    sirketId: Number(model.sirketId),
    iletisimEpostasi: model.iletisimEpostasi.trim() || null,
    sehirId: Number(model.sehirId),
    ilce: model.ilce.trim() || null,
    adres: model.adres.trim() || null,
    baslangic: apiyeDatetime(model.baslangic),
    bitis: apiyeDatetime(model.bitis),
    sonBasvuru: model.sonBasvuru || null,
    kontenjan: Number(model.kontenjan),
    kapakGorseli: model.kapakGorseli || null,
    sartOgrenimDuzeyi: model.sartOgrenimDuzeyi || null,
    sartSiniflar: [...model.sartSiniflar],
    sartBolumIdleri: model.sartBolumIdleri.map(Number),
    sartMinOrtalama: model.sartMinOrtalama === '' ? null : Number(model.sartMinOrtalama),
    sartBelgeZorunlu: model.sartBelgeZorunlu,
    durum: model.durum,
    basvuruyaAcik: model.basvuruyaAcik,
    otomatikOnay: model.otomatikOnay,
    yedekListe: model.yedekListe,
    katilimBelgesi: model.katilimBelgesi,
  });

  async function kaydet(durum) {
    if (durum) model.durum = durum;
    sunucuHatalari.value = {};
    if (!gecerli.value) return null;
    kaydediyor.value = true;
    try {
      const { data } = duzenlenenId.value
        ? await etkinlikService.guncelle(duzenlenenId.value, govde())
        : await etkinlikService.olustur(govde());
      return data;
    } catch (e) {
      if (Array.isArray(e.details)) {
        sunucuHatalari.value = Object.fromEntries(e.details.map((d) => [d.alan, d.mesaj]));
      } else {
        sunucuHatalari.value = { _genel: e.message };
      }
      return null;
    } finally {
      kaydediyor.value = false;
    }
  }

  return {
    model, adim, ADIMLAR, adimDurumu, adimGecerli, ileri, geri,
    hatalar, gecerli, kaydediyor, duzenlenenId, cokluSec, doldur, kaydet,
  };
}
