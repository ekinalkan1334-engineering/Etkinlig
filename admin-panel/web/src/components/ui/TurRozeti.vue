<script setup>
import AppRozet from './AppRozet.vue';
import { TUR_ETIKETI } from '@/utils/format.js';

defineProps({ tur: { type: String, required: true } });
</script>

<template>
  <AppRozet :ton="tur" yuvarlak>{{ TUR_ETIKETI[tur] ?? tur }}</AppRozet>
</template>
