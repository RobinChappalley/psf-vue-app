<template>
  <button class="menu-item" type="button" @click="$emit('click')">
    <span class="label">
      <slot />
    </span>
    <span class="chevron" aria-hidden="true">›</span>
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.menu-item {
  width: 100%;
  padding: var(--sp-2) 0;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-body);
  color: var(--c-text);
  cursor: pointer;
  border-bottom: 1px solid var(--c-border);
}

.menu-item:active {
  opacity: 0.7;
}

.label {
  text-align: left;
}

.chevron {
  font-size: 1.25rem;
  color: var(--c-text);
  opacity: 0.6;
}
</style>
