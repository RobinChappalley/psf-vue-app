<script setup>
import { useNavigation } from '@/composables/useNavigation'
import AppIcone from '@/components/AppIcone.vue'

const { items } = useNavigation()
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="nav-item"
      :class="{ active: $route.name === item.name }"
    >
      <AppIcone :name="item.icon" />
      <span class="label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);

  background: var(--c-bg);
  border-top: 1px solid var(--c-border);

  display: flex;
  justify-content: space-around;
  align-items: center;

  z-index: 50;
}

.nav-item {
  flex: 1;
  text-align: center;
  text-decoration: none;

  color: var(--c-muted);
  font-size: 0.875rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.nav-item svg {
  width: 1.6rem;
  height: 1.6rem;
  stroke: currentColor;
}

.nav-item.active {
  color: var(--c-primary);
  font-weight: 600;
}
</style>
