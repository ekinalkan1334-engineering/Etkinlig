import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { oturumService } from '@/services';
import { oturumDustugundeCagir } from '@/services/http.js';

export const useOturumStore = defineStore('oturum', () => {
  const kullanici = ref(null);
  const kurulumGerekli = ref(false);
  const hazir = ref(false);       // ilk kontrol tamamlandı mı
  const islemde = ref(false);

  const girisYapildi = computed(() => !!kullanici.value);
  /** Genel yönetici: tüm şirketleri görür, hesap açar. */
  const admin = computed(() => kullanici.value?.rol === 'admin');
  const sirketAdmini = computed(() => kullanici.value?.rol === 'sirket_admin');
  const sirketAdi = computed(() => kullanici.value?.sirketAdi ?? null);
  const rolEtiketi = computed(() => (admin.value ? 'Genel yönetici' : 'Şirket yöneticisi'));

  /** Uygulama açılışında bir kez: çerez geçerli mi, sistem kurulu mu? */
  async function baslat() {
    if (hazir.value) return;
    try {
      const { data } = await oturumService.ben();
      kullanici.value = data;
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
      kullanici.value = data;
      kurulumGerekli.value = false;
      return data;
    } finally {
      islemde.value = false;
    }
  }

  async function kurulum(govde) {
    islemde.value = true;
    try {
      const { data } = await oturumService.kurulum(govde);
      kullanici.value = data;
      kurulumGerekli.value = false;
      return data;
    } finally {
      islemde.value = false;
    }
  }

  async function cikis() {
    try { await oturumService.cikis(); } finally { kullanici.value = null; }
  }

  const parolaDegistir = (govde) => oturumService.parolaDegistir(govde);

  // API 401 dönerse oturumu düşür; router guard giriş ekranına alır.
  oturumDustugundeCagir(() => { kullanici.value = null; });

  return {
    kullanici, kurulumGerekli, hazir, islemde,
    girisYapildi, admin, sirketAdmini, sirketAdi, rolEtiketi,
    baslat, giris, kurulum, cikis, parolaDegistir,
  };
});
