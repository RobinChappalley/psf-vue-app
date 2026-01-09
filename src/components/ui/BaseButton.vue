<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | tertiary
  as: { type: String, default: 'button' }, // button | link
  to: { type: Object, default: null },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },

  // ✅ nouveaux
  size: { type: String, default: 'md' }, // sm | md | lg
  block: { type: Boolean, default: false }, // full width
})

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  { 'btn--block': props.block },
])
</script>

<template>
  <RouterLink v-if="as === 'link' && to" :class="classes" :to="to">
    <slot />
  </RouterLink>

  <button v-else :class="classes" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5ch;

  border: none;
  border-radius: 6px;

  cursor: pointer;
  text-decoration: none;
  text-align: center;

  transition:
    transform 120ms ease,
    opacity 120ms ease;
}

/* ✅ tailles (c’est ça qui uniformise partout) */
.btn--sm {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

.btn--md {
  font-size: var(--fs-body);
  padding: 0.85rem 1rem;
}

.btn--lg {
  font-size: 1.05rem;
  padding: 1rem 1.25rem;
}

/* ✅ full width */
.btn--block {
  width: 100%;
}

/* Active / Disabled */
.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.btn--primary {
  background: var(--c-primary);
  color: var(--c-bg);
}

.btn--secondary {
  background: transparent;
  color: var(--c-primary);
  border: 0.125rem solid var(--c-primary);
}

.btn--tertiary {
  background: transparent;
  color: var(--c-text);
  text-decoration: underline;
  padding: 0;
  font-weight: var(--fw-regular);
}
</style>
