<script setup>
import AppIcon from './AppIcon.vue';

/** Yükleniyor / hata / boş durum — üç ekran da aynı bileşeni kullanır. */
defineProps({
  yukleniyor: { type: Boolean, default: false },
  hata: { type: [Object, String, null], default: null },
  bos: { type: Boolean, default: false },
  bosBaslik: { type: String, default: 'Kayıt bulunamadı' },
  bosAciklama: { type: String, default: 'Filtreleri değiştirip tekrar deneyin.' },
});
</script>

<template>
  <div v-if="yukleniyor" class="mesaj">
    <span class="mesaj__donen" />
    <span class="mesaj__metin">Yükleniyor…</span>
  </div>
  <div v-else-if="hata" class="mesaj mesaj--hata">
    <AppIcon ad="capraz" :boyut="20" />
    <div>
      <p class="mesaj__baslik">Veri alınamadı</p>
      <p class="mesaj__metin">{{ typeof hata === 'string' ? hata : hata.message }}</p>
    </div>
  </div>
  <div v-else-if="bos" class="mesaj">
    <AppIcon ad="ara" :boyut="20" />
    <div>
      <p class="mesaj__baslik">{{ bosBaslik }}</p>
      <p class="mesaj__metin">{{ bosAciklama }}</p>
    </div>
  </div>
</template>

<style scoped>
.mesaj {
  display: flex; align-items: center; gap: 12px;
  padding: 28px 20px; color: var(--ink-2);
  justify-content: center; text-align: left;
}
.mesaj--hata { color: var(--konferans-deep); }
.mesaj__baslik { margin: 0 0 2px; font-size: 14px; font-weight: 600; color: var(--ink); }
.mesaj--hata .mesaj__baslik { color: var(--konferans-deep); }
.mesaj__metin { margin: 0; font-size: 13px; color: var(--ink-3); }
.mesaj__donen {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid var(--line); border-top-color: var(--konferans);
  animation: don 0.7s linear infinite;
}
@keyframes don { to { transform: rotate(360deg); } }
</style>
