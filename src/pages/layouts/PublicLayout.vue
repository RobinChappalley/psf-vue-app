<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
</script>
<template>
  <main class="content">
    <RouterView />
  </main>
  <TheNavbar />
</template>

<style scoped>
.content {
  padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom));
}
</style>
