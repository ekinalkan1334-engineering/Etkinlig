<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  sayfa: { type: Number, required: true },
  sayfaSayisi: { type: Number, required: true },
  toplam: { type: Number, default: 0 },
  limit: { type: Number, default: 10 },
});
defineEmits(['degisti']);

const numaralar = computed(() => {
  const { sayfa, sayfaSayisi } = props;
  if (sayfaSayisi <= 7) return Array.from({ length: sayfaSayisi }, (_, i) => i + 1);
  const set = new Set([1, sayfaSayisi, sayfa - 1, sayfa, sayfa + 1].filter((n) => n >= 1 && n <= sayfaSayisi));
  const sirali = [...set].sort((a, b) => a - b);
  const cikti = [];
  sirali.forEach((n, i) => {
    if (i > 0 && n - sirali[i - 1] > 1) cikti.push('…');
    cikti.push(n);
  });
  return cikti;
});

const aralik = computed(() => {
  if (!props.toplam) return '0 kayıt';
  const bas = (props.sayfa - 1) * props.limit + 1;
  const son = Math.min(props.toplam, props.sayfa * props.limit);
  return `${props.toplam} kayıttan ${bas}–${son} arası gösteriliyor`;
});
</script>

<template>
  <div class="gezgin">
    <span class="gezgin__bilgi">{{ aralik }}</span>
    <div class="gezgin__butonlar">
      <button class="gezgin__btn" :disabled="sayfa <= 1" @click="$emit('degisti', sayfa - 1)" aria-label="Önceki sayfa">
        <AppIcon ad="geri" :boyut="15" />
      </button>
      <button
        v-for="(n, i) in numaralar" :key="`${n}-${i}`" class="gezgin__btn"
        :class="{ 'gezgin__btn--aktif': n === sayfa }" :disabled="n === '…'"
        @click="n !== '…' && $emit('degisti', n)"
      >{{ n }}</button>
      <button class="gezgin__btn" :disabled="sayfa >= sayfaSayisi" @click="$emit('degisti', sayfa + 1)" aria-label="Sonraki sayfa">
        <AppIcon ad="ileri" :boyut="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.gezgin { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.gezgin__bilgi { font-size: 13px; color: var(--ink-3); }
.gezgin__butonlar { display: flex; gap: 6px; }
.gezgin__btn {
  min-width: 34px; height: 34px; padding: 0 10px;
  border-radius: var(--r-md); border: 1px solid var(--line);
  background: var(--surface); color: var(--ink-2);
  font-size: 13px; font-weight: 500; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.gezgin__btn:hover:not(:disabled) { background: var(--paper-2); }
.gezgin__btn:disabled { opacity: 0.45; cursor: default; }
.gezgin__btn--aktif { background: var(--ink); border-color: var(--ink); color: var(--paper); font-weight: 600; }
</style>
