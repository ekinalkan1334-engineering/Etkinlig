<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  cesit: { type: String, default: 'ikincil' }, // birincil | ikincil | hayalet | tehlike
  simge: { type: String, default: null },
  tip: { type: String, default: 'button' },
  pasif: { type: Boolean, default: false },
  yalnizSimge: { type: Boolean, default: false },
});
</script>

<template>
  <button :type="tip" :disabled="pasif" class="btn" :class="[`btn--${cesit}`, { 'btn--simge': yalnizSimge }]">
    <AppIcon v-if="simge" :ad="simge" />
    <span v-if="!yalnizSimge"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  height: 38px;
  padding: 0 16px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, opacity 0.12s;
  white-space: nowrap;
}
.btn:hover:not(:disabled) { background: var(--paper-2); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:focus-visible { outline: 2px solid var(--konferans); outline-offset: 2px; }

.btn--birincil { background: var(--konferans); border-color: var(--konferans); color: #fff; }
.btn--birincil:hover:not(:disabled) { background: var(--konferans-deep); border-color: var(--konferans-deep); }

.btn--hayalet { background: transparent; color: var(--ink-2); }

.btn--tehlike { background: var(--surface); border-color: var(--konferans-line); color: var(--konferans-deep); }
.btn--tehlike:hover:not(:disabled) { background: var(--konferans-tint); }

.btn--simge { width: 38px; padding: 0; justify-content: center; color: var(--ink-2); }
</style>
