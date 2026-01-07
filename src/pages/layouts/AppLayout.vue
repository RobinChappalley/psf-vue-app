<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import TheHeader from '@/components/TheHeader.vue'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/auth'

const router = useRouter()

watch(
  () => authStore.isAuthenticated.value,
  (isAuth) => {
    if (!isAuth) router.replace({ name: 'public.login' })
  },
)
</script>

<template>
  <TheHeader />

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
