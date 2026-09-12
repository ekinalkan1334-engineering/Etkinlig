<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppKenarCubugu from '@/components/layout/AppKenarCubugu.vue';
import { useTanimlarStore } from '@/stores/tanimlar.js';
import { useOturumStore } from '@/stores/oturum.js';

const route = useRoute();
const tanimlar = useTanimlarStore();
const oturum = useOturumStore();

const kabuklu = computed(() => !route.meta.kabuksuz && oturum.girisYapildi);

// Tanım listeleri yalnızca oturum açıkken çekilir (uçlar korumalı).
watch(
  () => oturum.girisYapildi,
  (acik) => { if (acik) tanimlar.yukle(); },
  { immediate: true },
);
</script>

<template>
  <div v-if="kabuklu" class="kabuk">
    <AppKenarCubugu />
    <main class="kabuk__icerik"><RouterView /></main>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.kabuk { display: flex; min-height: 100vh; }
.kabuk__icerik { flex: 1; display: flex; flex-direction: column; min-width: 0; }
</style>
