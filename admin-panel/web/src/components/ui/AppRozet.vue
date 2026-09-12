<script setup>
/** Tek rozet bileşeni; tür ve durum rozetleri bunun üstüne kurulur (DRY). */
defineProps({
  ton: { type: String, default: 'notr' }, // konferans | sunum | hackathon | uyari | notr
  nokta: { type: Boolean, default: false },
  yuvarlak: { type: Boolean, default: false },
});
</script>

<template>
  <span class="rozet" :class="[`rozet--${ton}`, { 'rozet--yuvarlak': yuvarlak }]">
    <span v-if="nokta" class="rozet__nokta" />
    <slot />
  </span>
</template>

<style scoped>
.rozet {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  background: var(--paper-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
}
.rozet--yuvarlak { border-radius: 999px; }
.rozet__nokta { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.rozet--konferans { background: var(--konferans-tint); border-color: var(--konferans-line); color: var(--konferans-deep); }
.rozet--sunum     { background: var(--sunum-tint);     border-color: var(--sunum-line);     color: var(--sunum-deep); }
.rozet--hackathon { background: var(--hackathon-tint); border-color: var(--hackathon-line); color: var(--hackathon-deep); }
.rozet--uyari     { background: var(--uyari-tint);     border-color: var(--uyari-line);     color: var(--uyari-deep); }
</style>
