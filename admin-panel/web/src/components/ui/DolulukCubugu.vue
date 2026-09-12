<script setup>
import { computed } from 'vue';

const props = defineProps({
  deger: { type: Number, required: true },
  toplam: { type: Number, required: true },
  ton: { type: String, default: 'konferans' },
  etiketGoster: { type: Boolean, default: true },
});

const yuzde = computed(() => (props.toplam > 0 ? Math.min(100, Math.round((props.deger / props.toplam) * 100)) : 0));
</script>

<template>
  <div class="doluluk">
    <span v-if="etiketGoster" class="doluluk__etiket">{{ deger }}/{{ toplam }}</span>
    <div class="doluluk__ray">
      <div class="doluluk__dolu" :style="{ width: `${yuzde}%`, background: `var(--${ton})` }" />
    </div>
  </div>
</template>

<style scoped>
.doluluk { display: flex; flex-direction: column; gap: 5px; min-width: 92px; }
.doluluk__etiket { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.doluluk__ray { height: 5px; border-radius: 999px; background: var(--paper-2); overflow: hidden; }
.doluluk__dolu { height: 100%; border-radius: 999px; transition: width 0.25s; }
</style>
