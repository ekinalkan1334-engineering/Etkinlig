import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { oturumService } from '@/services';
import { oturumDustugundeCagir } from '@/services/http.js';

export const useOturumStore = defineStore('oturum', () => {
  const kullanici = ref(null);
  const kurulumGerekli = ref(false);
  const hazir = ref(false);       // ilk kontrol tamamlandı mı
  const islemde = ref(false);

  const safKullanici = computed(() => kullanici.value?.kullanici ?? kullanici.value);
  const girisYapildi = computed(() => !!safKullanici.value);
  /** Genel yönetici: tüm şirketleri görür, hesap açar. */
  const admin = computed(() => safKullanici.value?.rol === 'admin');
  const sirketAdmini = computed(() => safKullanici.value?.rol === 'sirket_admin');
  const sirketAdi = computed(() => safKullanici.value?.sirketAdi ?? null);
  const sirketId = computed(() => safKullanici.value?.sirketId ?? null);
  const rolEtiketi = computed(() => (admin.value ? 'Genel yönetici' : (sirketAdi.value ? `${sirketAdi.value} Yöneticisi` : 'Şirket yöneticisi')));

  /** Uygulama açılışında bir kez: çerez geçerli mi, sistem kurulu mu? */
  async function baslat() {
    if (hazir.value) return;
    try {
      const { data } = await oturumService.ben();
      kullanici.value = data?.kullanici ?? data;
    } catch {
      kullanici.value = null;
      try {
        const { data } = await oturumService.durum();
        kurulumGerekli.value = data.kurulumGerekli;
      } catch {
        kurulumGerekli.value = false;
      }
    } finally {
      hazir.value = true;
    }
  }

  async function giris(govde) {
    islemde.value = true;
    try {
      const { data } = await oturumService.giris(govde);
      kullanici.value = data?.kullanici ?? data;
      kurulumGerekli.value = false;
      return kullanici.value;
    } finally {
      islemde.value = false;
    }
  }

  async function kurulum(govde) {
    islemde.value = true;
    try {
      const { data } = await oturumService.kurulum(govde);
      kullanici.value = data?.kullanici ?? data;
      kurulumGerekli.value = false;
      return kullanici.value;
    } finally {
      islemde.value = false;
    }
  }

  async function cikis() {
    try { await oturumService.cikis(); } finally { kullanici.value = null; }
  }

  const parolaDegistir = (govde) => oturumService.parolaDegistir(govde);

  /** Kullanıcı bu etkinliği düzenleyebilir mi? (Admin her şeyi düzenler, şirket yöneticisi yalnızca kendi şirketini) */
  function duzenleyebilir(etkinlikVeyaKayit) {
    const k = safKullanici.value;
    if (!k) return false;
    if (admin.value) return true;
    const sId = etkinlikVeyaKayit?.sirket?.id ?? etkinlikVeyaKayit?.sirketId ?? etkinlikVeyaKayit?.sirket_id;
    return Number(k.sirketId) === Number(sId);
  }

  return {
    kullanici: safKullanici, kurulumGerekli, hazir, islemde,
    girisYapildi, admin, sirketAdmini, sirketAdi, sirketId, rolEtiketi,
    baslat, giris, kurulum, cikis, parolaDegistir, duzenleyebilir,
  };
});
