<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  etiket: { type: String, required: true },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <label class="anahtar">
    <span class="anahtar__etiket">{{ etiket }}</span>
    <input
      class="gorunmez" type="checkbox" :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="anahtar__ray" :class="{ 'anahtar__ray--acik': modelValue }"><span class="anahtar__top" /></span>
  </label>
</template>

<style scoped>
.anahtar { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
.anahtar__etiket { font-size: 13.5px; font-weight: 500; }
.anahtar__ray {
  width: 40px; height: 23px; border-radius: 999px; background: var(--line);
  padding: 2px; display: flex; align-items: center; justify-content: flex-start;
  transition: background 0.15s;
  flex: none;
}
.anahtar__ray--acik { background: var(--sunum); justify-content: flex-end; }
.anahtar__top { width: 19px; height: 19px; border-radius: 50%; background: #fff; }
.anahtar input:focus-visible + .anahtar__ray { outline: 2px solid var(--konferans); outline-offset: 2px; }
</style>
