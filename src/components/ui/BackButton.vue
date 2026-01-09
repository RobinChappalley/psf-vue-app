<script setup>
defineEmits(['click'])
</script>

<template>
  <button type="button" class="back" aria-label="Retour" @click="$emit('click')">←</button>
</template>

<style scoped>
.back {
  background: none;
  border: none;
  padding: var(--sp-2) 0;
  color: var(--c-text);
  font-size: var(--fs-body);
  cursor: pointer;
}

.back:active {
  opacity: 0.7;
}
</style>
