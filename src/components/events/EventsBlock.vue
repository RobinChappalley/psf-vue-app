<script setup>
defineProps({
  title: { type: String, required: true },
  emptyText: { type: String, default: 'Aucun évènement pour le moment' },
  hasItems: { type: Boolean, required: true },
})
</script>

<template>
  <section class="section events-block">
    <h2 class="title">{{ title }}</h2>

    <div v-if="hasItems" class="events-list">
      <slot />
    </div>

    <p v-else class="empty">
      {{ emptyText }}
    </p>
  </section>
</template>

<style scoped>
.events-block {
  /* même look que tes blocs de maquette (fond clair, léger) */
  background: var(--c-surface);
  border: 1px solid var(--c-surface);
  border-radius: var(--r-input);
  box-shadow: none;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.empty {
  margin: 0;
  opacity: 0.85;
}
</style>
