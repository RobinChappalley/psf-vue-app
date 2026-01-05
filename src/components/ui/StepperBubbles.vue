<template>
  <nav class="bubbles" aria-label="Progression">
    <button
      v-for="(s, i) in steps"
      :key="s.key"
      type="button"
      :class="['bubble', i < activeIndex && 'is-done', i === activeIndex && 'is-active']"
      :aria-current="i === activeIndex ? 'step' : undefined"
      @click="$emit('go', i)"
    >
      <span class="bubble-n">{{ i + 1 }}</span>
      <span class="bubble-label">{{ s.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  steps: {
    type: Array,
    required: true,
    // optionnel : validation simple (si tu veux)
    // validator: (arr) => arr.every(s => s && typeof s.key === 'string' && typeof s.label === 'string'),
  },
  activeIndex: {
    type: Number,
    required: true,
  },
})

defineEmits(['go'])
</script>

<style scoped>
/* Tu peux laisser vide ici si tu gardes les styles dans le parent */
</style>
