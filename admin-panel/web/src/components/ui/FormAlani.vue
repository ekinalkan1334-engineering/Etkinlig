<script setup>
/** Etiket + kontrol + yardım/hata satırı — tüm form alanları bunu kullanır. */
defineProps({
  etiket: { type: String, required: true },
  zorunlu: { type: Boolean, default: false },
  yardim: { type: String, default: null },
  hata: { type: String, default: null },
});
</script>

<template>
  <div class="alan">
    <label class="alan__etiket">
      {{ etiket }}<span v-if="zorunlu" class="alan__yildiz">*</span>
    </label>
    <slot :hatali="!!hata" />
    <span v-if="hata" class="alan__hata">{{ hata }}</span>
    <span v-else-if="yardim" class="alan__yardim">{{ yardim }}</span>
  </div>
</template>

<style scoped>
.alan { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.alan__etiket { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.alan__yildiz { color: var(--konferans); }
.alan__yardim { font-size: 12px; color: var(--ink-3); }
.alan__hata { font-size: 12px; font-weight: 500; color: var(--konferans-deep); }

.alan :deep(input),
.alan :deep(select),
.alan :deep(textarea) {
  width: 100%;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 0 13px;
  height: 42px;
  font-size: 14px;
  color: var(--ink);
}
.alan :deep(textarea) { height: auto; min-height: 112px; padding: 12px 13px; line-height: 1.6; resize: vertical; }
.alan :deep(input:focus),
.alan :deep(select:focus),
.alan :deep(textarea:focus) { outline: 2px solid var(--konferans); outline-offset: -1px; }
.alan :deep(input[aria-invalid='true']),
.alan :deep(select[aria-invalid='true']),
.alan :deep(textarea[aria-invalid='true']) { border-color: var(--konferans); }
.alan :deep(::placeholder) { color: var(--ink-3); }
</style>
