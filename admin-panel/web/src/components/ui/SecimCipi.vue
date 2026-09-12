<script setup>
defineProps({
  secili: { type: Boolean, default: false },
  ton: { type: String, default: 'hackathon' }, // hackathon | ink
});
defineEmits(['sec']);
</script>

<template>
  <button type="button" class="cip" :class="[{ 'cip--secili': secili }, `cip--${ton}`]" @click="$emit('sec')">
    <slot />
  </button>
</template>

<style scoped>
.cip {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.cip:hover { background: var(--paper-2); }
.cip:focus-visible { outline: 2px solid var(--konferans); outline-offset: 2px; }

.cip--hackathon.cip--secili {
  border-color: var(--hackathon-deep);
  background: var(--hackathon-tint);
  color: var(--hackathon-deep);
  font-weight: 600;
}
.cip--ink.cip--secili {
  border-radius: var(--r-md);
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
}
.cip--ink { border-radius: var(--r-md); }
</style>
