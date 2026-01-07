<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/auth'
import ProfileMenuItem from '@/components/ui/ProfileMenuItem.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcone from '@/components/AppIcone.vue'
import ProfilePersonalDataForm from '@/components/profile/PersonalDataForm.vue'
import FullDataForm from '@/components/profile/FullDataForm.vue'

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
const isParent = computed(() => authStore.hasAnyRole(['parent']))

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

//le logout se gère dans AppLayout, pour s'assurer qu'à chaque fois que l'utilisateur est sur
//la partie privée, il est bien connecté, sinon ça le redirige sur la page de login

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

//partie pour envoyer des données modifiées au backend (ici parent)
function onSubmitPersonalData(payload) {
  // TEMP (sans backend) : tu peux soit log, soit mettre à jour le user mock
  // Exemple: update local store
  authStore.user.value = {
    ...authStore.user.value,
    ...payload,
    address: payload.address,
  }
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

      <section class="section">
        <BaseButton class="logout cta" type="button" @click="authStore.logout()">
          Déconnexion
        </BaseButton>
      </section>
    </template>

    <!-- ÉCRAN 2 : données personnelles -->
    <template v-else-if="step === 'personal'">
      <header class="page-header">
        <button class="back" type="button" aria-label="Retour" @click="backToProfile">←</button>
      </header>

      <!-- Parent -->
      <ProfilePersonalDataForm v-if="isParent && me" :user="me" @submit="onSubmitPersonalData" />

      <!-- Autre rôle -->
      <FullDataForm
        v-else-if="me"
        :user="me"
        @submit="onSubmitPersonalData"
        @close="backToProfile"
      />

      <!-- si pas d'utilisateur -->
      <section v-else class="alt">
        <p>Impossible de charger l’utilisateur.</p>
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
  margin-top: 20rem;
}

.cta {
  margin: var(--sp-4) auto 0;
  display: block;
  max-width: 20rem;
}

.back {
  background: none;
  border: none;
  padding: var(--sp-2) 0;
  color: var(--c-text);
  font-size: var(--fs-body);
  cursor: pointer;
}
.back:active {
  opacity: 0.7;
}

.alt {
  background: var(--c-surface);
  border-radius: var(--r-card);
  padding: var(--sp-2);
  box-shadow: var(--shadow-sm);
}
.section-title {
  margin: 0 0 var(--sp-1);
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  font-weight: var(--fw-title);
}
</style>
