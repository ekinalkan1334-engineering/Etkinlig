<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../ui/AppIcon.vue';
import { useOturumStore } from '@/stores/oturum.js';

const router = useRouter();
const oturum = useOturumStore();
const acikMenu = ref(false);

const MENU = [
  { ad: 'panel', etiket: 'Panel', simge: 'panel' },
  { ad: 'etkinlikler', etiket: 'Etkinlikler', simge: 'takvim' },
  { ad: 'etkinlik-yeni', etiket: 'Yeni Etkinlik', simge: 'arti' },
  { ad: 'basvurular', etiket: 'Başvurular', simge: 'gelen' },
  { ad: 'kullanicilar', etiket: 'Kullanıcılar', simge: 'kisiler', yalnizAdmin: true },
];

const menu = computed(() => MENU.filter((m) => !m.yalnizAdmin || oturum.admin));
const basHarfler = computed(() =>
  (oturum.kullanici?.adSoyad ?? '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
);

async function cikis() {
  await oturum.cikis();
  router.replace({ name: 'giris' });
}

async function parolaDegistir() {
  acikMenu.value = false;
  const mevcutParola = window.prompt('Mevcut parolanız:');
  if (!mevcutParola) return;
  const yeniParola = window.prompt('Yeni parola (en az 8 karakter, bir büyük harf ve bir rakam):');
  if (!yeniParola) return;
  try {
    await oturum.parolaDegistir({ mevcutParola, yeniParola });
    window.alert('Parolanız değiştirildi.');
  } catch (e) {
    window.alert(e.message);
  }
}
</script>

<template>
  <aside class="kenar">
    <div class="kenar__logo">
      <div class="kenar__marka"><AppIcon ad="takvim" :kalinlik="2" /></div>
      <div class="kenar__ad">
        <span class="kenar__baslik">etkinlig</span>
        <span class="kenar__altbaslik">{{ oturum.sirketAdi ?? 'genel yönetim' }}</span>
      </div>
    </div>

    <nav class="kenar__menu">
      <RouterLink v-for="m in menu" :key="m.ad" :to="{ name: m.ad }" class="kenar__link">
        <AppIcon :ad="m.simge" />
        <span>{{ m.etiket }}</span>
      </RouterLink>
    </nav>

    <div class="kenar__dip">
      <div v-if="acikMenu" class="kenar__acilir">
        <button type="button" @click="parolaDegistir"><AppIcon ad="ayar" :boyut="16" />Parolamı değiştir</button>
        <button type="button" class="cikis" @click="cikis"><AppIcon ad="capraz" :boyut="16" />Çıkış yap</button>
      </div>

      <button type="button" class="kenar__kullanici" @click="acikMenu = !acikMenu">
        <span class="kenar__avatar">{{ basHarfler }}</span>
        <span class="kenar__ad">
          <span class="kenar__kisi">{{ oturum.kullanici?.adSoyad }}</span>
          <span class="kenar__rol">{{ oturum.rolEtiketi }}</span>
        </span>
        <AppIcon ad="asagi" :boyut="15" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.kenar {
  width: 248px; flex: none;
  background: var(--paper-2);
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column;
  padding: 22px 14px; gap: 26px;
}
.kenar__logo { display: flex; align-items: center; gap: 10px; padding: 0 10px; }
.kenar__marka {
  width: 34px; height: 34px; border-radius: var(--r-md); flex: none;
  background: var(--konferans); color: var(--paper);
  display: flex; align-items: center; justify-content: center;
}
.kenar__ad { display: flex; flex-direction: column; min-width: 0; text-align: left; }
.kenar__baslik { font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
.kenar__altbaslik { font-size: 11px; font-weight: 500; color: var(--ink-3); }

.kenar__menu { display: flex; flex-direction: column; gap: 3px; }
.kenar__link {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 12px; border-radius: 9px;
  font-size: 14px; font-weight: 500; color: var(--ink-2);
}
.kenar__link:hover { background: rgba(31, 25, 21, 0.05); color: var(--ink); }
.kenar__link.router-link-active { background: var(--ink); color: var(--paper); font-weight: 600; }

.kenar__dip { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }
.kenar__kullanici {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px; border-radius: 11px; background: var(--surface);
  border: 1px solid var(--line); color: var(--ink-3); cursor: pointer; text-align: left;
}
.kenar__kullanici:hover { background: #fff; border-color: var(--ink-3); }
.kenar__avatar {
  width: 32px; height: 32px; border-radius: 50%; flex: none;
  background: var(--hackathon-tint); border: 1px solid var(--hackathon-line); color: var(--hackathon-deep);
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
}
.kenar__kisi { font-size: 13px; font-weight: 600; line-height: 1.3; color: var(--ink); }
.kenar__rol { font-size: 11px; color: var(--ink-3); line-height: 1.3; }

.kenar__acilir {
  display: flex; flex-direction: column; gap: 2px; padding: 6px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 11px;
}
.kenar__acilir button {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 8px 10px; border: none; background: none; border-radius: var(--r-sm);
  font-size: 13px; font-weight: 500; color: var(--ink-2); cursor: pointer; text-align: left;
}
.kenar__acilir button:hover { background: var(--paper-2); color: var(--ink); }
.kenar__acilir .cikis:hover { background: var(--konferans-tint); color: var(--konferans-deep); }
</style>
