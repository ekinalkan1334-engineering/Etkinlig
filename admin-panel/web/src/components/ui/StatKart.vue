<script setup>
import AppIcon from './AppIcon.vue';
import { sayi } from '@/utils/format.js';

defineProps({
  etiket: { type: String, required: true },
  deger: { type: [Number, String], required: true },
  altBilgi: { type: String, default: null },
  ton: { type: String, default: 'konferans' },
  simge: { type: String, default: 'takvim' },
});
</script>

<template>
  <div class="stat">
    <div class="stat__ust">
      <span class="stat__etiket">{{ etiket }}</span>
      <div class="stat__simge" :class="`stat__simge--${ton}`"><AppIcon :ad="simge" /></div>
    </div>
    <div class="stat__alt">
      <span class="stat__deger">{{ typeof deger === 'number' ? sayi(deger) : deger }}</span>
      <span v-if="altBilgi" class="stat__yardim">{{ altBilgi }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat {
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stat__ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.stat__etiket { font-size: 13px; font-weight: 500; color: var(--ink-2); }
.stat__simge {
  width: 30px; height: 30px; border-radius: 9px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-2); border: 1px solid var(--line); color: var(--ink-2);
}
.stat__simge--konferans { background: var(--konferans-tint); border-color: var(--konferans-line); color: var(--konferans-deep); }
.stat__simge--sunum     { background: var(--sunum-tint);     border-color: var(--sunum-line);     color: var(--sunum-deep); }
.stat__simge--hackathon { background: var(--hackathon-tint); border-color: var(--hackathon-line); color: var(--hackathon-deep); }
.stat__simge--uyari     { background: var(--uyari-tint);     border-color: var(--uyari-line);     color: var(--uyari-deep); }
.stat__alt { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.stat__deger { font-family: var(--font-display); font-size: 32px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.stat__yardim { font-size: 12px; font-weight: 600; color: var(--sunum-deep); }
</style>
