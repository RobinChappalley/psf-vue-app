<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/auth'
import AppIcone from '@/components/AppIcone.vue'

const router = useRouter()

const isAuthed = computed(() => authStore.isAuthenticated.value)

function goToLogin() {
  router.push({ name: 'public.login' })
}
</script>

<template>
  <header class="app-header">
    <img src="/src/assets/img/psf-logo.svg" alt="Pieds Sans Frontières" class="logo" />

    <button v-if="!isAuthed" class="login-btn" @click="goToLogin" aria-label="Se connecter">
      <AppIcone name="userCircle" />
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-2);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg);
}

.logo {
  height: 2.4rem;
}

.login-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--c-text);
}

.login-btn:hover {
  color: var(--c-primary);
}
</style>
