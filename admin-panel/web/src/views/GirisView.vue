<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import FormAlani from '@/components/ui/FormAlani.vue';
import { useOturumStore } from '@/stores/oturum.js';

const oturum = useOturumStore();
const router = useRouter();
const route = useRoute();

const kurulum = computed(() => oturum.kurulumGerekli);
const model = reactive({ adSoyad: '', eposta: '', parola: '' });
const hata = ref(null);
const alanHatalari = ref({});

async function gonder() {
  hata.value = null;
  alanHatalari.value = {};
  try {
    if (kurulum.value) await oturum.kurulum({ ...model, rol: 'admin' });
    else await oturum.giris({ eposta: model.eposta, parola: model.parola });
    router.replace(route.query.devam ?? { name: 'panel' });
  } catch (e) {
    if (Array.isArray(e.details)) {
      alanHatalari.value = Object.fromEntries(e.details.map((d) => [d.alan, d.mesaj]));
    } else {
      hata.value = e.message;
    }
  }
}
</script>

<template>
  <div class="giris">
    <div class="giris__panel">
      <div class="marka">
        <span class="marka__kutu"><AppIcon ad="takvim" :kalinlik="2" :boyut="20" /></span>
        <div>
          <p class="marka__ad">etkinlig</p>
          <p class="marka__alt">yönetim paneli</p>
        </div>
      </div>

      <div class="giris__metin">
        <h1>{{ kurulum ? 'İlk yönetici hesabını oluşturun' : 'Tekrar hoş geldiniz' }}</h1>
        <p>
          {{ kurulum
            ? 'Sistemde henüz kullanıcı yok. Bu hesap tam yetkili yönetici olarak açılır.'
            : 'Devam etmek için yönetici hesabınızla giriş yapın.' }}
        </p>
      </div>

      <form class="giris__form" @submit.prevent="gonder">
        <p v-if="hata" class="uyari">{{ hata }}</p>

        <FormAlani v-if="kurulum" etiket="Ad soyad" zorunlu :hata="alanHatalari.adSoyad">
          <template #default="{ hatali }">
            <input v-model="model.adSoyad" autocomplete="name" :aria-invalid="hatali" placeholder="Adınız ve soyadınız" />
          </template>
        </FormAlani>

        <FormAlani etiket="E-posta" zorunlu :hata="alanHatalari.eposta">
          <template #default="{ hatali }">
            <input v-model="model.eposta" type="email" autocomplete="username" :aria-invalid="hatali" placeholder="admin@etkinlig.local" />
          </template>
        </FormAlani>

        <FormAlani
          etiket="Parola" zorunlu :hata="alanHatalari.parola"
          :yardim="kurulum ? 'En az 8 karakter, bir büyük harf ve bir rakam içermeli' : null"
        >
          <template #default="{ hatali }">
            <input
              v-model="model.parola" type="password"
              :autocomplete="kurulum ? 'new-password' : 'current-password'"
              :aria-invalid="hatali" placeholder="••••••••"
            />
          </template>
        </FormAlani>

        <AppButton tip="submit" cesit="birincil" :pasif="oturum.islemde" class="giris__dugme">
          {{ oturum.islemde ? 'Bekleyin…' : kurulum ? 'Hesabı oluştur ve gir' : 'Giriş yap' }}
        </AppButton>
      </form>
    </div>

    <aside class="giris__yan">
      <p class="yan__slogan">Konferans, sunum ve hackathon başvurularını tek panelden yönetin.</p>
      <ul class="yan__liste">
        <li><span class="yan__nokta yan__nokta--konferans" />Ön katılım şartlarını sınıf ve bölüm bazında tanımlayın</li>
        <li><span class="yan__nokta yan__nokta--sunum" />Başvuruları tek tıkla onaylayın veya reddedin</li>
        <li><span class="yan__nokta yan__nokta--hackathon" />Kontenjan ve doluluk durumunu anlık izleyin</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.giris { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr); }
@media (max-width: 900px) { .giris { grid-template-columns: minmax(0, 1fr); } .giris__yan { display: none; } }

.giris__panel {
  display: flex; flex-direction: column; gap: 30px;
  padding: 48px clamp(24px, 6vw, 72px); justify-content: center;
}
.marka { display: flex; align-items: center; gap: 11px; }
.marka__kutu {
  width: 38px; height: 38px; border-radius: 11px; flex: none;
  background: var(--konferans); color: var(--paper);
  display: flex; align-items: center; justify-content: center;
}
.marka__ad { margin: 0; font-family: var(--font-display); font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
.marka__alt { margin: 0; font-size: 11.5px; color: var(--ink-3); }

.giris__metin h1 { font-size: 27px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 8px; }
.giris__metin p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--ink-2); max-width: 42ch; }

.giris__form { display: flex; flex-direction: column; gap: 16px; max-width: 380px; }
.giris__dugme { height: 44px; justify-content: center; margin-top: 4px; }
.uyari {
  margin: 0; padding: 11px 14px; border-radius: var(--r-md);
  background: var(--konferans-tint); border: 1px solid var(--konferans-line);
  color: var(--konferans-deep); font-size: 13px; font-weight: 500;
}

.giris__yan {
  background: var(--paper-2); border-left: 1px solid var(--line);
  padding: 48px clamp(28px, 4vw, 56px);
  display: flex; flex-direction: column; justify-content: center; gap: 26px;
}
.yan__slogan {
  margin: 0; font-family: var(--font-display); font-size: 26px; font-weight: 700;
  letter-spacing: -0.03em; line-height: 1.25; max-width: 18ch; text-wrap: pretty;
}
.yan__liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.yan__liste li { display: flex; align-items: flex-start; gap: 11px; font-size: 14px; color: var(--ink-2); line-height: 1.5; max-width: 34ch; }
.yan__nokta { width: 9px; height: 9px; border-radius: 3px; flex: none; margin-top: 6px; }
.yan__nokta--konferans { background: var(--konferans); }
.yan__nokta--sunum { background: var(--sunum); }
.yan__nokta--hackathon { background: var(--hackathon); }
</style>
