<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/auth'
import ProfileMenuItem from '@/components/ui/ProfileMenuItem.vue'
import AppIcone from '@/components/AppIcone.vue'

const router = useRouter()

/**
 * Ton vrai modèle User (résumé)
 * {
 *  firstname, lastname, email, phoneNumber,
 *  address, role[], parent, children[], camps[], participationInfo...
 * }
 */
//En-dessous, appelle les données stockées dans auth.js
const me = computed(() => authStore.user.value)

const displayName = computed(() => {
  if (!me.value) return ''
  const fn = me.value.firstname ?? ''
  const ln = me.value.lastname ?? ''
  const full = `${fn} ${ln}`.trim()
  return full || '—'
})

const displayEmail = computed(() => {
  if (!me.value) return ''
  return me.value.email || '—'
})

function goToPersonalData() {
  router.push({ name: 'personal-data' })
}

function goToChildren() {
  router.push({ name: 'children' })
}

function onLogout() {
  authStore.logout()
  router.replace({ name: 'login' })
}
// sections internes “comme une nouvelle page”
const step = ref('profile') // "profile" | "personal" | "children"

function openPersonalData() {
  step.value = 'personal'
}

function openChildren() {
  step.value = 'children'
}

function backToProfile() {
  step.value = 'profile'
}
</script>

<template>
  <div class="page">
    <!-- ÉCRAN 1 : profil -->
    <template v-if="step === 'profile'">
      <header class="top">
        <h1 class="title">PROFIL</h1>
      </header>
      <!-- Carte utilisateur -->
      <section class="user-card" v-if="me">
        <div class="avatar" aria-hidden="true">
          <AppIcone name="profile" />
        </div>
        <div class="user-meta">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-email">{{ displayEmail }}</span>
        </div>
      </section>

      <nav class="menu">
        <ProfileMenuItem @click="openPersonalData"> Données personnelles </ProfileMenuItem>

        <ProfileMenuItem @click="openChildren"> Enfants </ProfileMenuItem>
      </nav>

      <div class="spacer"></div>

      <button class="logout" type="button" @click="authStore.logout()">Déconnexion</button>
    </template>

    <!-- ÉCRAN 2 : données personnelles -->
    <template v-else-if="step === 'personal'">
      <button class="back" type="button" @click="backToProfile">← Retour</button>
      <h1 class="title">Données personnelles</h1>

      <!-- Ici ta section "comme une page" -->
      <section class="section">
        <p><b>Email :</b> {{ me?.email || '—' }}</p>
        <p><b>Téléphone :</b> {{ me?.phoneNumber || '—' }}</p>
      </section>
    </template>

    <!-- ÉCRAN 3 : enfants -->
    <template v-else>
      <button class="back" type="button" @click="backToProfile">← Retour</button>
      <h1 class="title">Enfants</h1>

      <section class="section">
        <p v-if="!me?.children?.length">Aucun enfant.</p>
        <ul v-else>
          <li v-for="id in me.children" :key="id">{{ id }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--c-bg);
  padding: var(--sp-3) var(--sp-2);
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  color: var(--c-text);
}

/* ---------- HEADER ---------- */
.top {
  margin-bottom: var(--sp-3);
}

.title {
  margin: 0;
  font-family: var(--font-title);
  font-size: var(--fs-h1);
  font-weight: var(--fw-title);
  color: var(--c-text);
}

/* ---------- USER CARD ---------- */
.user-card {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: var(--c-surface);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-sm);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--c-secondary);
  display: grid;
  place-items: center;
  color: var(--c-bg);
  flex: 0 0 auto;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  margin-top: 2px;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- MENU ---------- */
.menu {
  margin-top: var(--sp-3);
  border-top: 1px solid var(--c-border);
}

.menu-item {
  width: 100%;
  padding: var(--sp-2) 0;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-body);
  color: var(--c-text);
  cursor: pointer;
  border-bottom: 1px solid var(--c-border);
}

.menu-item:active {
  opacity: 0.7;
}

.chevron {
  font-size: 1.25rem;
  color: var(--c-text);
  opacity: 0.6;
}

/* ---------- FOOTER ---------- */
.spacer {
  flex: 1;
}

.logout {
  width: 100%;
  padding: var(--sp-2);
  border-radius: var(--r-button);
  border: none;
  background: var(--c-primary);
  color: var(--c-bg);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-button);
  cursor: pointer;
}

.logout:active {
  opacity: 0.85;
}
</style>
