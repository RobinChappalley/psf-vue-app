<script setup>
defineProps({
  hike: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="hike-card">
    <header class="hike-header">
      <span class="author">{{ hike.user?.email ?? 'Anonyme' }}</span>
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
  margin-bottom: var(--sp-1);
}

.author {
  font-weight: var(--fw-semibold);
  font-size: var(--fs-body);
  color: var(--c-text);
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
