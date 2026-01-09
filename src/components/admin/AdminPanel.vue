<script setup>
defineProps({
  title: { type: String, required: true },
  isEmpty: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Aucun évènement pour le moment' },
})
</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>

    <!-- zone optionnelle: filtres / chips / search -->
    <div v-if="$slots.tools" class="tools">
      <slot name="tools" />
    </div>

    <!-- état vide -->
    <p v-if="isEmpty" class="empty">{{ emptyText }}</p>

    <!-- contenu -->
    <div v-else class="content">
      <slot />
    </div>

    <!-- actions (boutons) -->
    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>

    <!-- hint -->
    <p v-if="$slots.hint" class="hint">
      <slot name="hint" />
    </p>
  </section>
</template>

<style scoped>
.panel {
  background: var(--c-surface);
  border-radius: var(--r-card);
  padding: var(--sp-3);
}

.tools {
  margin: 0.75rem 0 var(--sp-2);
}

.empty {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}

.content {
  display: grid;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.actions {
  display: grid;
  gap: var(--sp-2);
}

.hint {
  margin: 0.75rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}
</style>
