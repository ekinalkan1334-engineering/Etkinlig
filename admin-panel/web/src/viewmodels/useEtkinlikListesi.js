import { computed, reactive, watch } from 'vue';
import { etkinlikService } from '@/services';
import { useAsyncKaynak } from './useAsyncKaynak.js';

const VARSAYILAN_FILTRE = () => ({
  arama: '',
  tur: '',
  durum: '',
  sehirId: '',
  siralama: 'baslangic',
  yon: 'asc',
  sayfa: 1,
  limit: 10,
});

/** Etkinlik listesi ViewModel'i: filtre state'i + sayfalama + yeniden yükleme. */
export function useEtkinlikListesi() {
  const filtre = reactive(VARSAYILAN_FILTRE());
  const { veri, yukleniyor, hata, calistir } = useAsyncKaynak(
    () => etkinlikService.listele({ ...filtre }),
    { data: [], meta: { toplam: 0, sayfa: 1, limit: 10, sayfaSayisi: 1 } },
  );

  const kayitlar = computed(() => veri.value?.data ?? []);
  const meta = computed(() => veri.value?.meta ?? { toplam: 0, sayfa: 1, limit: 10, sayfaSayisi: 1 });
  const bos = computed(() => !yukleniyor.value && kayitlar.value.length === 0);

  let zamanlayici;
  watch(
    () => [filtre.arama, filtre.tur, filtre.durum, filtre.sehirId, filtre.siralama, filtre.yon],
    () => {
      filtre.sayfa = 1;
      clearTimeout(zamanlayici);
      zamanlayici = setTimeout(() => calistir(), 250);
    },
  );
  watch(() => filtre.sayfa, () => calistir());

  const turSec = (tur) => { filtre.tur = filtre.tur === tur ? '' : tur; };
  const sayfaSec = (n) => { filtre.sayfa = Math.min(Math.max(1, n), meta.value.sayfaSayisi); };
  const sifirla = () => Object.assign(filtre, VARSAYILAN_FILTRE());

  async function durumDegistir(id, durum) {
    await etkinlikService.durumDegistir(id, durum);
    await calistir();
  }

  async function sil(id) {
    await etkinlikService.sil(id);
    if (kayitlar.value.length === 1 && filtre.sayfa > 1) filtre.sayfa -= 1;
    else await calistir();
  }

  return { filtre, kayitlar, meta, bos, yukleniyor, hata, yukle: calistir, turSec, sayfaSec, sifirla, durumDegistir, sil };
}
