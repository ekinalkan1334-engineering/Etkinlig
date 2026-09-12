import { ref, shallowRef } from 'vue';

/**
 * Her ViewModel'in paylaştığı yükleniyor / hata / veri üçlüsü.
 * try-catch-finally tekrarı tek yerde kalır (DRY).
 */
export function useAsyncKaynak(yukleyici, baslangic = null) {
  const veri = shallowRef(baslangic);
  const yukleniyor = ref(false);
  const hata = ref(null);

  async function calistir(...args) {
    yukleniyor.value = true;
    hata.value = null;
    try {
      const sonuc = await yukleyici(...args);
      veri.value = sonuc;
      return sonuc;
    } catch (e) {
      hata.value = e;
      throw e;
    } finally {
      yukleniyor.value = false;
    }
  }

  return { veri, yukleniyor, hata, calistir };
}
