<script setup>
import { ref } from 'vue';
import AppIcon from './AppIcon.vue';
import { gorselService } from '@/services';

const props = defineProps({ modelValue: { type: String, default: null } });
const emit = defineEmits(['update:modelValue']);

const girdi = ref(null);
const yukleniyor = ref(false);
const hata = ref(null);
const uzerinde = ref(false);

async function yukle(dosya) {
  if (!dosya) return;
  hata.value = null;
  yukleniyor.value = true;
  try {
    const { yol } = await gorselService.yukle(dosya);
    emit('update:modelValue', yol);
  } catch (e) {
    hata.value = e.message;
  } finally {
    yukleniyor.value = false;
  }
}

const secildi = (e) => yukle(e.target.files?.[0]);

function birakildi(e) {
  uzerinde.value = false;
  yukle(e.dataTransfer?.files?.[0]);
}

function kaldir() {
  emit('update:modelValue', null);
  if (girdi.value) girdi.value.value = '';
}
</script>

<template>
  <div class="yukleyici">
    <figure v-if="modelValue" class="onizleme">
      <img :src="modelValue" alt="Etkinlik kapak görseli" />
      <figcaption>
        <button type="button" @click="girdi?.click()">Değiştir</button>
        <button type="button" class="sil" @click="kaldir">Kaldır</button>
      </figcaption>
    </figure>

    <button
      v-else type="button" class="alan" :class="{ 'alan--uzerinde': uzerinde }"
      @click="girdi?.click()"
      @dragover.prevent="uzerinde = true"
      @dragleave.prevent="uzerinde = false"
      @drop.prevent="birakildi"
    >
      <span class="alan__simge">
        <span v-if="yukleniyor" class="donen" />
        <AppIcon v-else ad="disaAktar" />
      </span>
      <span class="alan__baslik">{{ yukleniyor ? 'Yükleniyor…' : 'Görsel sürükleyin' }}</span>
      <span class="alan__yardim">PNG, JPG veya WEBP · en fazla 2 MB<br>önerilen 1200×630 px</span>
    </button>

    <p v-if="hata" class="hata">{{ hata }}</p>

    <input ref="girdi" type="file" accept="image/png,image/jpeg,image/webp" class="gorunmez" @change="secildi" />
  </div>
</template>

<style scoped>
.yukleyici { display: flex; flex-direction: column; gap: 9px; }

.alan {
  width: 100%;
  border: 1.5px dashed var(--line);
  border-radius: 13px;
  background: var(--paper-2);
  padding: 26px 18px;
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  text-align: center; cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.alan:hover, .alan--uzerinde { border-color: var(--konferans); background: var(--konferans-tint); }
.alan__simge {
  width: 38px; height: 38px; border-radius: 11px;
  background: var(--surface); border: 1px solid var(--line); color: var(--ink-2);
  display: flex; align-items: center; justify-content: center;
}
.alan__baslik { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.alan__yardim { font-size: 12px; color: var(--ink-3); line-height: 1.5; }

.donen {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid var(--line); border-top-color: var(--konferans);
  animation: don 0.7s linear infinite;
}
@keyframes don { to { transform: rotate(360deg); } }

.onizleme { margin: 0; border-radius: 13px; overflow: hidden; border: 1px solid var(--line); background: var(--paper-2); }
.onizleme img { display: block; width: 100%; aspect-ratio: 1200 / 630; object-fit: cover; }
.onizleme figcaption { display: flex; gap: 6px; padding: 8px; background: var(--surface); border-top: 1px solid var(--line); }
.onizleme button {
  flex: 1; height: 30px; border-radius: var(--r-sm);
  border: 1px solid var(--line); background: var(--surface);
  font-size: 12.5px; font-weight: 600; color: var(--ink-2); cursor: pointer;
}
.onizleme button:hover { background: var(--paper-2); }
.onizleme .sil { color: var(--konferans-deep); border-color: var(--konferans-line); }
.onizleme .sil:hover { background: var(--konferans-tint); }

.hata { margin: 0; font-size: 12px; font-weight: 500; color: var(--konferans-deep); }
</style>
