<script setup>
defineProps({
  hike: {
    type: Object,
    required: true,
  },
})

function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <article class="hike-card">
    <header class="hike-header">
      <span class="author">{{ hike.user?.email ?? 'Anonyme' }}</span>
      <time class="date">{{ fmtDate(hike.createdAt) }}</time>
    </header>

    <img v-if="hike.imageUrl" :src="hike.imageUrl" alt="" class="hike-image" />

    <p class="hike-content">{{ hike.content }}</p>
  </article>
</template>

<style scoped>
.hike-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: var(--sp-2);
  margin-bottom: var(--sp-2);
  box-shadow: var(--shadow-sm);
}

.hike-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-1);
}

.author {
  font-weight: var(--fw-semibold);
  font-size: var(--fs-body);
  color: var(--c-text);
}

.date {
  font-size: var(--fs-caption);
  color: var(--c-text);
  opacity: 0.7;
}

.hike-image {
  width: 100%;
  border-radius: var(--r-input);
  margin-bottom: var(--sp-1);
  object-fit: cover;
  max-height: 300px;
}

.hike-content {
  margin: 0;
  font-size: var(--fs-body);
  color: var(--c-text);
  line-height: 1.5;
}
</style>
