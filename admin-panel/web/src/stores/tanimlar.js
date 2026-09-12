import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tanimService } from '@/services';

/** Şehir / bölüm / şirket ve enum listeleri — bir kez yüklenir, her ekran paylaşır. */
export const useTanimlarStore = defineStore('tanimlar', () => {
  const sehirler = ref([]);
  const bolumler = ref([]);
  const sirketler = ref([]);
  const turler = ref([]);
  const ogrenimDuzeyleri = ref([]);
  const siniflar = ref([]);
  const durumlar = ref([]);
  const yuklendi = ref(false);
  const yukleniyor = ref(false);

  async function yukle(zorla = false) {
    if ((yuklendi.value && !zorla) || yukleniyor.value) return;
    yukleniyor.value = true;
    try {
      const { data } = await tanimService.tumu();
      sehirler.value = (data.sehirler || []).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
      bolumler.value = data.bolumler;
      sirketler.value = data.sirketler;
      turler.value = data.turler;
      ogrenimDuzeyleri.value = data.ogrenimDuzeyleri;
      siniflar.value = data.siniflar;
      durumlar.value = data.durumlar;
      yuklendi.value = true;
    } finally {
      yukleniyor.value = false;
    }
  }

  async function sirketEkle(govde) {
    const { data } = await tanimService.sirketEkle(govde);
    sirketler.value = [...sirketler.value, data].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return data;
  }

  async function bolumEkle(govde) {
    const { data } = await tanimService.bolumEkle(govde);
    bolumler.value = [...bolumler.value, data].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return data;
  }

  return {
    sehirler, bolumler, sirketler, turler, ogrenimDuzeyleri, siniflar, durumlar,
    yuklendi, yukleniyor, yukle, sirketEkle, bolumEkle,
  };
});
