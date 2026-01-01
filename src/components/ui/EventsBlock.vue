<script setup>
import BaseCard from '@/components/home/BaseCard.vue'

defineProps({
  title: { type: String, required: true },
  emptyText: { type: String, default: 'Aucun évènement pour le moment' },
})
</script>

<template>
  <BaseCard class="events-block" :title="title">
    <p class="empty">{{ emptyText }}</p>
  </BaseCard>
</template>

<style scoped>
.events-block {
  /* même look que tes blocs de maquette (fond clair, léger) */
  background: var(--c-surface);
  border: 1px solid var(--c-surface);
  box-shadow: none;
}

.empty {
  margin: 0;
  opacity: 0.85;
}
</style>
