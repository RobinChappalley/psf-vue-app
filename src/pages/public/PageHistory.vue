<script setup>
import CampMap from '@/components/map/CampMap.vue'
</script>

<template>
  <div class="history-page">
    <CampMap />
  </div>
</template>

<style scoped>
.history-page {
  height: calc(100vh - 60px - var(--nav-height) - env(safe-area-inset-bottom));
}

.history-page :deep(.camp-map-wrapper) {
  height: 100%;
  border-radius: 0;
  border: none;
}
</style>
