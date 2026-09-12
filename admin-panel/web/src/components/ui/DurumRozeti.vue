<script setup>
import { computed } from 'vue';
import AppRozet from './AppRozet.vue';
import { BASVURU_DURUM_ETIKETI, DURUM_ETIKETI } from '@/utils/format.js';

const props = defineProps({
  durum: { type: String, required: true },
  kapsam: { type: String, default: 'etkinlik' }, // etkinlik | basvuru
});

const TONLAR = {
  yayinda: 'sunum', doldu: 'uyari', taslak: 'notr', iptal: 'konferans', tamamlandi: 'hackathon',
  onaylandi: 'sunum', beklemede: 'uyari', reddedildi: 'konferans', yedek: 'hackathon',
};

const ton = computed(() => TONLAR[props.durum] ?? 'notr');
const etiket = computed(() =>
  props.kapsam === 'basvuru'
    ? BASVURU_DURUM_ETIKETI[props.durum] ?? props.durum
    : DURUM_ETIKETI[props.durum] ?? props.durum,
);
</script>

<template>
  <AppRozet :ton="ton" nokta>{{ etiket }}</AppRozet>
</template>
