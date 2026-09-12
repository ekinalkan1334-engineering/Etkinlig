<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppRozet from '@/components/ui/AppRozet.vue';
import FormAlani from '@/components/ui/FormAlani.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { kullaniciService } from '@/services';
import { useOturumStore } from '@/stores/oturum.js';
import { saat, tarih } from '@/utils/format.js';

const oturum = useOturumStore();
const kayitlar = ref([]);
const yukleniyor = ref(false);
const hata = ref(null);

const yeni = reactive({ adSoyad: '', eposta: '', parola: '', rol: 'moderator' });
const formHatalari = ref({});
const formHatasi = ref(null);
const kaydediyor = ref(false);

async function yukle() {
  yukleniyor.value = true;
  hata.value = null;
  try {
    const { data } = await kullaniciService.listele();
    kayitlar.value = data;
  } catch (e) {
    hata.value = e;
  } finally {
    yukleniyor.value = false;
  }
}

async function hesapAc() {
  formHatalari.value = {};
  formHatasi.value = null;
  kaydediyor.value = true;
  try {
    await kullaniciService.olustur({ ...yeni });
    Object.assign(yeni, { adSoyad: '', eposta: '', parola: '', rol: 'moderator' });
    await yukle();
  } catch (e) {
    if (Array.isArray(e.details)) {
      formHatalari.value = Object.fromEntries(e.details.map((d) => [d.alan, d.mesaj]));
    } else {
      formHatasi.value = e.message;
    }
  } finally {
    kaydediyor.value = false;
  }
}

async function calistir(islem) {
  try {
    await islem();
    await yukle();
  } catch (e) {
    window.alert(e.message);
  }
}

const rolDegistir = (k) =>
  calistir(() => kullaniciService.guncelle(k.id, { rol: k.rol === 'admin' ? 'moderator' : 'admin' }));

const aktiflikDegistir = (k) => calistir(() => kullaniciService.guncelle(k.id, { aktif: !k.aktif }));

function parolaSifirla(k) {
  const yeniParola = window.prompt(`${k.adSoyad} için yeni parola (en az 8 karakter, bir büyük harf ve bir rakam):`);
  if (!yeniParola) return;
  calistir(() => kullaniciService.parolaSifirla(k.id, yeniParola));
}

function sil(k) {
  if (!window.confirm(`${k.adSoyad} hesabı silinsin mi?`)) return;
  calistir(() => kullaniciService.sil(k.id));
}

onMounted(yukle);
</script>

<template>
  <AppUstCubuk baslik="Kullanıcılar" alt-baslik="Panele erişimi olan yönetici ve moderatör hesapları" />

  <div class="sayfa">
    <div class="izgara">
      <AppKart class="izgara__genis" govde-dolgusu="18px 6px 6px">
        <DurumMesaji
          :yukleniyor="yukleniyor" :hata="hata"
          :bos="!yukleniyor && !hata && kayitlar.length === 0"
          bos-baslik="Kullanıcı yok" bos-aciklama="Sağdaki formdan ilk hesabı açabilirsiniz."
        />
        <div v-if="!yukleniyor && !hata && kayitlar.length" class="tablo-sarmal">
          <table class="tablo">
            <thead>
              <tr><th>Hesap</th><th>Rol</th><th>Durum</th><th>Son giriş</th><th class="sag">İşlem</th></tr>
            </thead>
            <tbody>
              <tr v-for="k in kayitlar" :key="k.id">
                <td>
                  <span class="ad">
                    {{ k.adSoyad }}
                    <AppRozet v-if="k.id === oturum.kullanici?.id" ton="uyari" yuvarlak>siz</AppRozet>
                  </span>
                  <span class="alt">{{ k.eposta }}</span>
                </td>
                <td>
                  <AppRozet :ton="k.rol === 'admin' ? 'hackathon' : 'notr'" yuvarlak>
                    {{ k.rol === 'admin' ? 'Yönetici' : 'Moderatör' }}
                  </AppRozet>
                </td>
                <td>
                  <AppRozet :ton="k.aktif ? 'sunum' : 'konferans'" nokta>
                    {{ k.aktif ? 'Aktif' : 'Pasif' }}
                  </AppRozet>
                </td>
                <td class="notr">{{ k.sonGiris ? `${tarih(k.sonGiris)} · ${saat(k.sonGiris)}` : 'Hiç giriş yapmadı' }}</td>
                <td class="sag">
                  <div class="islemler">
                    <AppButton cesit="hayalet" @click="rolDegistir(k)">
                      {{ k.rol === 'admin' ? 'Moderatör yap' : 'Yönetici yap' }}
                    </AppButton>
                    <AppButton cesit="hayalet" @click="aktiflikDegistir(k)">
                      {{ k.aktif ? 'Pasifleştir' : 'Aktifleştir' }}
                    </AppButton>
                    <AppButton yalniz-simge simge="ayar" title="Parola sıfırla" @click="parolaSifirla(k)" />
                    <AppButton yalniz-simge simge="cop" cesit="tehlike" title="Sil" @click="sil(k)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppKart>

      <AppKart baslik="Yeni hesap aç">
        <form class="form" @submit.prevent="hesapAc">
          <p v-if="formHatasi" class="uyari">{{ formHatasi }}</p>

          <FormAlani etiket="Ad soyad" zorunlu :hata="formHatalari.adSoyad">
            <template #default="{ hatali }">
              <input v-model="yeni.adSoyad" :aria-invalid="hatali" placeholder="Ad Soyad" />
            </template>
          </FormAlani>

          <FormAlani etiket="E-posta" zorunlu :hata="formHatalari.eposta">
            <template #default="{ hatali }">
              <input v-model="yeni.eposta" type="email" :aria-invalid="hatali" placeholder="kisi@etkinlig.local" />
            </template>
          </FormAlani>

          <FormAlani
            etiket="Geçici parola" zorunlu :hata="formHatalari.parola"
            yardim="En az 8 karakter, bir büyük harf ve bir rakam"
          >
            <template #default="{ hatali }">
              <input v-model="yeni.parola" type="text" :aria-invalid="hatali" placeholder="Örn. Etkinlig2026" />
            </template>
          </FormAlani>

          <FormAlani etiket="Rol" :hata="formHatalari.rol">
            <select v-model="yeni.rol">
              <option value="moderator">Moderatör — etkinlik ve başvuru yönetir</option>
              <option value="admin">Yönetici — kullanıcı hesaplarını da yönetir</option>
            </select>
          </FormAlani>

          <AppButton tip="submit" cesit="birincil" simge="arti" :pasif="kaydediyor" class="form__dugme">
            {{ kaydediyor ? 'Açılıyor…' : 'Hesabı aç' }}
          </AppButton>
        </form>
      </AppKart>
    </div>
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; }
.izgara { display: grid; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); gap: 18px; align-items: start; }
@media (max-width: 1100px) { .izgara { grid-template-columns: minmax(0, 1fr); } }

.tablo-sarmal { overflow-x: auto; }
.tablo { width: 100%; border-collapse: collapse; min-width: 820px; }
.tablo th {
  text-align: left; padding: 0 14px 11px; font-size: 11.5px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.tablo td { padding: 14px; border-top: 1px solid var(--line); vertical-align: middle; }
.sag { text-align: right; }
.notr { font-size: 13px; color: var(--ink-2); }
.ad { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; }
.alt { display: block; font-size: 12.5px; color: var(--ink-3); margin-top: 3px; }
.islemler { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.islemler :deep(.btn) { height: 32px; font-size: 12.5px; padding: 0 10px; }
.islemler :deep(.btn--simge) { width: 32px; padding: 0; }

.form { display: flex; flex-direction: column; gap: 16px; }
.form__dugme { justify-content: center; }
.uyari {
  margin: 0; padding: 11px 14px; border-radius: var(--r-md);
  background: var(--konferans-tint); border: 1px solid var(--konferans-line);
  color: var(--konferans-deep); font-size: 13px; font-weight: 500;
}
</style>
