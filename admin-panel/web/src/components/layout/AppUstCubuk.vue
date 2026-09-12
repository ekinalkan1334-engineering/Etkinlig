<script setup>
defineProps({
  baslik: { type: String, required: true },
  altBaslik: { type: String, default: '' },
});
</script>

<template>
  <header class="ust">
    <div class="ust__metin">
      <h1>{{ baslik }}</h1>
      <p v-if="altBaslik">{{ altBaslik }}</p>
    </div>
    <div class="ust__aksiyon"><slot name="aksiyon" /></div>
  </header>
</template>

<style scoped>
.ust {
  min-height: 76px; flex: none;
  border-bottom: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px; gap: 24px; flex-wrap: wrap;
}
.ust__metin { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ust__metin h1 { font-size: 23px; font-weight: 700; letter-spacing: -0.025em; }
.ust__metin p { margin: 0; font-size: 13px; color: var(--ink-2); }
.ust__aksiyon { display: flex; align-items: center; gap: 10px; }
</style>
