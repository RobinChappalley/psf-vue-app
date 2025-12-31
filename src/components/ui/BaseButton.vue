<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | tertiary
  as: { type: String, default: 'button' }, // button | link
  to: { type: Object, default: null }, // pour RouterLink
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <RouterLink v-if="as === 'link' && to" class="btn" :class="`btn--${variant}`" :to="to">
    <slot />
  </RouterLink>

  <button v-else class="btn" :class="`btn--${variant}`" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5ch;

  font-family: var(--font-body);
  font-size: var(--fs-button);
  font-weight: var(--fw-semibold);

  padding: var(--sp-2) var(--sp-2);
  border-radius: var(--r-button);

  text-decoration: none;
  text-align: center;
  border: none;
  cursor: pointer;

  transition:
    transform 120ms ease,
    opacity 120ms ease;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Primary */
.btn--primary {
  background: var(--c-primary);
  color: var(--c-bg);
}

/* Secondary */
.btn--secondary {
  background: transparent;
  color: var(--c-primary);
  border: 0.125rem solid var(--c-primary);
}

/* Tertiary */
.btn--tertiary {
  background: transparent;
  color: var(--c-text);
  text-decoration: underline;
  padding: 0;
  font-weight: var(--fw-regular);
}
</style>
