<script setup>
defineProps({
  baslik: { type: String, default: null },
  govdeDolgusu: { type: String, default: '20px' },
});
</script>

<template>
  <section class="kart" :style="{ padding: govdeDolgusu }">
    <header v-if="baslik || $slots.aksiyon" class="kart__ust">
      <h2 v-if="baslik">{{ baslik }}</h2>
      <div class="kart__aksiyon"><slot name="aksiyon" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.kart {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.kart__ust {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.kart__ust h2 { font-size: 16px; font-weight: 700; letter-spacing: -0.015em; }
.kart__aksiyon { display: flex; align-items: center; gap: 10px; }
</style>
