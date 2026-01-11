<script setup>
import { computed } from 'vue'
import AppIcone from '@/components/AppIcone.vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | tertiary
  size: { type: String, default: 'md' }, // sm | md | lg
  icon: { type: String, required: true },
  as: { type: String, default: 'button' }, // button | link
  to: { type: Object, default: null },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})

const classes = computed(() => ['fab', `fab--${props.variant}`, `fab--${props.size}`])
</script>

<template>
  <RouterLink v-if="as === 'link' && to" :to="to" :class="classes">
    <slot><AppIcone :name="icon" /></slot>
  </RouterLink>

  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot><AppIcone :name="icon" /></slot>
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  bottom: 80px; /* au-dessus de la navbar (ajuste selon la hauteur de la navbar) */
  right: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.12s ease,
    opacity 0.12s ease;
  z-index: 1000; /* toujours au-dessus de la page */
}

/* Tailles */
.fab--sm {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
}

.fab--md {
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
}

.fab--lg {
  width: 72px;
  height: 72px;
  font-size: 1.8rem;
}

/* Variants */
.fab--primary {
  background-color: var(--c-primary);
  color: var(--c-bg);
}

.fab--secondary {
  background-color: var(--c-bg);
  color: var(--c-primary);
  border: 2px solid var(--c-primary);
}

.fab--tertiary {
  background-color: transparent;
  color: var(--c-primary);
  border: 2px dashed var(--c-primary);
}

/* Interaction */
.fab:active {
  transform: scale(0.95);
}

.fab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
