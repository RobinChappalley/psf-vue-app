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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.history-page :deep(.camp-map-wrapper) {
  flex: 1;
  height: 100%;
  border-radius: 0;
  border: none;
}
</style>
