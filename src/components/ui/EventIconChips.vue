<script setup>
import AppIcone from '@/components/AppIcone.vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' }, // 'all' | 'training' | ...
  enabled: { type: Array, default: () => ['all', 'training'] },
})

const emit = defineEmits(['update:modelValue'])

/**
 * Mapping type -> icône AppIcone
 * Adapte les keys si tu changes ton modèle.
 */
const CHIPS = [
  { key: 'all', label: 'tous', icon: null },
  { key: 'training', label: '', icon: 'training' },
  { key: 'information-evening', label: '', icon: 'information-evening' },
  { key: 'fundraisings', label: '', icon: 'fundraising' },
  { key: 'generalMeeting', label: '', icon: 'ag' },
  { key: 'stages', label: '', icon: 'stage' },
]

function isEnabled(key) {
  return props.enabled.includes(key)
}

function pick(key) {
  if (!isEnabled(key)) return
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="chips" role="tablist" aria-label="Filtres évènements">
    <button
      v-for="c in CHIPS"
      :key="c.key"
      type="button"
      class="chip"
      :class="{ active: modelValue === c.key, disabled: !isEnabled(c.key) }"
      :aria-pressed="modelValue === c.key"
      :aria-disabled="!isEnabled(c.key)"
      @click="pick(c.key)"
    >
      <span v-if="c.label">{{ c.label }}</span>

      <span v-else class="icon" aria-hidden="true">
        <AppIcone :name="c.icon" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.chip {
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: var(--fs-caption);
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chip.active {
  background: rgba(0, 0, 0, 0.04);
}

.chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
}
</style>
