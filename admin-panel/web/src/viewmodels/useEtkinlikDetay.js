import { computed, reactive, ref } from 'vue';
import { basvuruService, etkinlikService } from '@/services';
import { useAsyncKaynak } from './useAsyncKaynak.js';

/** Detay ekranı ViewModel'i: etkinlik + başvuru listesi + karar verme. */
export function useEtkinlikDetay(id) {
  const { veri, yukleniyor, hata, calistir } = useAsyncKaynak(() => etkinlikService.bul(id));
  const basvurular = ref([]);
  const basvuruFiltresi = reactive({ durum: '', sinif: '' });
  const basvurularYukleniyor = ref(false);

  const etkinlik = computed(() => veri.value?.data ?? null);

  const sayaclar = computed(() => {
    const e = etkinlik.value;
    if (!e) return { basvuru: 0, onayli: 0, bos: 0, oran: 0 };
    const bos = Math.max(0, e.kontenjan - e.onayliSayisi);
    return {
      basvuru: e.basvuruSayisi,
      onayli: e.onayliSayisi,
      bos,
      oran: e.basvuruSayisi ? Math.round((e.onayliSayisi / e.basvuruSayisi) * 100) : 0,
    };
  });

  async function basvurulariYukle() {
    basvurularYukleniyor.value = true;
    try {
      const { data } = await basvuruService.listele({
        etkinlikId: id,
        durum: basvuruFiltresi.durum || undefined,
        sinif: basvuruFiltresi.sinif === '' ? undefined : basvuruFiltresi.sinif,
      });
      basvurular.value = data;
    } finally {
      basvurularYukleniyor.value = false;
    }
  }

  async function yukle() {
    await Promise.all([calistir(), basvurulariYukle()]);
  }

  async function basvuruKarari(basvuruId, durum) {
    await basvuruService.durumDegistir(basvuruId, durum);
    await Promise.all([calistir(), basvurulariYukle()]);
  }

  async function durumDegistir(durum) {
    await etkinlikService.durumDegistir(id, durum);
    await calistir();
  }

  return {
    etkinlik, sayaclar, basvurular, basvuruFiltresi, basvurularYukleniyor,
    yukleniyor, hata, yukle, basvurulariYukle, basvuruKarari, durumDegistir,
  };
}
