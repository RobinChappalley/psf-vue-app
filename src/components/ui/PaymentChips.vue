<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
})
const emit = defineEmits(['update:modelValue'])

const CHIPS = [
  { key: 'all', label: 'Tout' },
  { key: 'paid', label: 'Payé' },
  { key: 'pending', label: 'En attente' },
]

const activeIndex = computed(() => CHIPS.findIndex((c) => c.key === props.modelValue))

function pick(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <div
    class="chips"
    role="tablist"
    aria-label="Filtres paiements"
    :style="{
      '--n': CHIPS.length,
      '--i': Math.max(activeIndex, 0),
    }"
  >
    <button
      v-for="c in CHIPS"
      :key="c.key"
      type="button"
      class="chip"
      :class="{ active: modelValue === c.key }"
      :aria-pressed="modelValue === c.key"
      @click="pick(c.key)"
    >
      <span>{{ c.label }}</span>
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

  background: var(--c-bg);
  padding: 0.3rem;
  border-radius: 999px;

  overflow: hidden;
  isolation: isolate;
}

.chips::before {
  content: '';
  position: absolute;
  inset: 0.3rem;
  width: calc((100% - 0.6rem) / var(--n));
  border-radius: 999px;
  background: var(--c-border);
  box-shadow: 0 1px 2px var(--c-border);

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
