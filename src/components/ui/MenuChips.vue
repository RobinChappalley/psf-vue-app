<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const activeIndex = computed(() => {
  const idx = props.items.findIndex((c) => c.key === props.modelValue)
  return idx >= 0 ? idx : 0
})

function pick(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <div
    class="chips"
    role="tablist"
    aria-label="Filtres"
    :style="{ '--n': items.length, '--i': activeIndex }"
  >
    <button
      v-for="c in items"
      :key="c.key"
      type="button"
      class="chip"
      :class="{ active: modelValue === c.key }"
      :aria-pressed="modelValue === c.key"
      @click="pick(c.key)"
    >
      <span v-if="c.label">{{ c.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.chips {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  align-items: center;

  background: #e0e0e0; /* fond gris du menu */
  padding: 0.5rem; /* un peu plus d'espace */
  border-radius: 999px;

  overflow: hidden;
  isolation: isolate;

  margin-bottom: var(--sp-4);
}

.chips::before {
  content: '';
  position: absolute;
  inset: 0.5rem; /* espace autour de la pastille active */
  width: calc((100% - 1rem) / var(--n)); /* pastille plus petite que le menu */
  border-radius: 999px;
  background: #ffffff; /* fond blanc de l'onglet actif */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

  transform: translateX(calc(var(--i) * 100%));
  transition: transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1);
  z-index: 0;
}

.chip {
  position: relative;
  z-index: 1;

  border: none;
  background: transparent;
  border-radius: 999px;

  height: 34px;
  min-width: 34px;
  padding: 0 0.6rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: var(--fs-caption);
  cursor: pointer;
  white-space: nowrap;

  transition: transform 120ms ease;
}

.chip:active {
  transform: scale(0.96);
}
</style>
