<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="card">
    <h2 v-if="title" class="card-title">{{ title }}</h2>
    <div class="card-content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: var(--sp-2);
  margin-bottom: 2rem;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  margin-bottom: var(--sp-1);
  color: var(--c-text);
}

.card-content {
  font-size: var(--fs-body);
  color: var(--c-text);
  line-height: 1.5;
}
</style>
