<script setup>
import AppIcone from '@/components/AppIcone.vue'

defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  clickable: { type: Boolean, default: true }, // si tu veux pouvoir désactiver
})

defineEmits(['click'])
</script>

<template>
  <button v-if="clickable" type="button" class="card" @click="$emit('click')">
    <div class="icon-wrap" aria-hidden="true">
      <AppIcone :name="icon" />
    </div>

    <div class="content">
      <h3>{{ title }}</h3>
      <p class="desc">{{ description }}</p>
    </div>
  </button>

  <article v-else class="card">
    <div class="icon-wrap" aria-hidden="true">
      <AppIcone :name="icon" />
    </div>

    <div class="content">
      <h3 class="title">{{ title }}</h3>
      <p class="desc">{{ description }}</p>
    </div>
  </article>
</template>

<style scoped>
.card {
  width: 100%;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--sp-2);
  align-items: center;
  padding: var(--sp-2);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  background-color: var(--c-bg);
  text-align: left;
}

button.card {
  cursor: pointer;
  border: 1px solid var(--c-border);
}

.card:active {
  opacity: 0.85;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--c-primary);
}

.content {
  min-width: 0;
}

.desc {
  margin: 0.25rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.7);
  line-height: 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
