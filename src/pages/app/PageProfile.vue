<script setup>
import { computed, ref, onMounted } from 'vue'
import { authStore } from '@/stores/auth'
import { profileStore } from '@/stores/profile'
import { childrenStore } from '@/stores/childrenStore'
import { hikesStore } from '@/stores/hikes'

import ProfileMenuItem from '@/components/ui/ProfileMenuItem.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import AppIcone from '@/components/AppIcone.vue'

import ProfilePersonalDataForm from '@/components/profile/PersonalDataForm.vue'
import FullDataForm from '@/components/profile/FullDataForm.vue'
import ChildrenList from '@/components/profile/ChildrenList.vue'

import { usePushNotifications } from '@/composables/usePushNotification'

/* ======================================================
   NOTIIFICATIONS
====================================================== */
const {
  permission,
  supported,
  hasSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  sendWelcomePush,
} = usePushNotifications()

/* ======================================================
   STATE / DERIVED
====================================================== */
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

// Compte les hikes de l'utilisateur connecté
const userHikesCount = computed(() => {
  if (!me.value) return 0
  const myId = me.value.id ?? me.value._id
  if (!myId) return 0

  return hikesStore.hikes.value.filter((hike) => {
    const hikeUserId = hike.user?.id ?? hike.user?._id ?? hike.user
    return String(hikeUserId) === String(myId)
  }).length
})

const displayHikesCount = computed(() => {
  const count = userHikesCount.value

  if (count === 0) return '0 randonnée publiée'
  if (count === 1) return '1 randonnée publiée'

  return `${count} randonnées publiées`
})

// Charger les hikes au montage pour le compteur
onMounted(async () => {
  try {
    await hikesStore.ensureHikesLoaded()
  } catch (e) {
    // Silently fail - le compteur restera à 0
  }
})

//Source de vérité enfants = store (API)
const children = computed(() => childrenStore.children.value)

// sélection enfant en cours d'édition
const selectedChild = ref(null)

// sections internes
const step = ref('profile') // "profile" | "personal" | "children" | "child-edit"

/* ======================================================
   NAVIGATION
====================================================== */
function backToProfile() {
  step.value = 'profile'
}

function closeChildEditAndBack() {
  selectedChild.value = null
  step.value = 'children'
}

function goBack() {
  if (step.value === 'personal') return backToProfile()
  if (step.value === 'children') return backToProfile()
  if (step.value === 'child-edit') return closeChildEditAndBack()
  step.value = 'profile'
}

function openPersonalData() {
  step.value = 'personal'
}

async function openChildren() {
  step.value = 'children'
  try {
    await childrenStore.fetchChildren()
  } catch (e) {}
}

/* ======================================================
   PROFIL (update "me")
====================================================== */
const saving = ref(false)
const errorMsg = ref('')

async function onSubmitPersonalData(payload) {
  if (saving.value) return
  saving.value = true
  errorMsg.value = ''

  try {
    await profileStore.updateMe(payload)
    // option UX
    // step.value = 'profile'
  } catch (e) {
    errorMsg.value = e?.message ?? 'Erreur lors de la sauvegarde.'
  } finally {
    saving.value = false
  }
}

/* ======================================================
   ENFANTS (CRUD)
====================================================== */
function onEditChild(child) {
  selectedChild.value = child
  step.value = 'child-edit'
}

function onAddChild() {
  const parentId = me.value?.id ?? me.value?._id
  selectedChild.value = childrenStore.createEmptyChild(parentId)
  step.value = 'child-edit'
}

const savingChild = ref(false)
const childError = ref('')

async function onSubmitChildData(payload) {
  if (savingChild.value) return
  savingChild.value = true
  childError.value = ''

  try {
    // si l'enfant vient de l'API il aura id/_id, sinon null (nouveau)
    const childId = selectedChild.value?.id ?? selectedChild.value?._id

    if (childId) {
      // update enfant existant
      await childrenStore.updateChild({ ...payload, id: childId })
    } else {
      // création enfant
      await childrenStore.createChild(payload)
    }

    // resync liste enfants (au cas où)
    await childrenStore.fetchChildren()

    closeChildEditAndBack()
  } catch (e) {
    childError.value = e?.message ?? "Erreur lors de la sauvegarde de l'enfant."
  } finally {
    savingChild.value = false
  }
}
</script>

<template>
  <div class="section">
    <!-- ========================= -->
    <!-- ÉCRAN 1 : PROFIL -->
    <!-- ========================= -->
    <template v-if="step === 'profile'">
      <header class="top">
        <h1 class="title">PROFIL</h1>
      </header>

      <section class="user-card" v-if="me">
        <div class="avatar" aria-hidden="true">
          <AppIcone name="profile" />
        </div>
        <div class="user-meta">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-email">{{ displayEmail }}</span>
          <span class="user-email">{{ displayHikesCount }}</span>
        </div>
      </section>

      <nav class="menu">
        <ProfileMenuItem @click="openPersonalData"> Données personnelles </ProfileMenuItem>

        <ProfileMenuItem @click="openChildren"> Enfants </ProfileMenuItem>
      </nav>

      <div class="menu-item notifications-item">
        <p class="label">Notifications</p>
        <BaseButton
          class="notifications-button"
          :disabled="!hasSubscription && !supported ? true : false"
          @click="hasSubscription ? unsubscribeUserFromPush() : subscribeUserToPush()"
          variant="secondary"
          size="sm"
        >
          {{ hasSubscription ? 'Désactiver' : 'Activer' }}
        </BaseButton>
      </div>

      <div class="spacer"></div>

      <section class="section">
        <BaseButton
          type="button"
          variant="primary"
          size="md"
          :block="true"
          @click="authStore.logout()"
        >
          Déconnexion
        </BaseButton>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 2 : DONNÉES PERSO -->
    <!-- ========================= -->
    <template v-else-if="step === 'personal'">
      <header>
        <BackButton @click="goBack" />
      </header>

      <!-- Parent -->
      <ProfilePersonalDataForm v-if="isParent && me" :user="me" @submit="onSubmitPersonalData" />

      <!-- Autres rôles -->
      <FullDataForm
        v-else-if="me"
        :user="me"
        @submit="onSubmitPersonalData"
        @close="backToProfile"
      />

      <section v-else class="alt">
        <p>Impossible de charger l’utilisateur.</p>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 3 : LISTE ENFANTS -->
    <!-- ========================= -->
    <template v-else-if="step === 'children'">
      <header>
        <BackButton @click="goBack" />
      </header>

      <h2>Enfants</h2>

      <ChildrenList :children="children" @edit="onEditChild" @add="onAddChild" />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 4 : ÉDITION ENFANT -->
    <!-- ========================= -->
    <template v-else-if="step === 'child-edit'">
      <header>
        <BackButton @click="goBack" />
      </header>

      <FullDataForm
        v-if="selectedChild"
        :user="selectedChild"
        @submit="onSubmitChildData"
        @close="closeChildEditAndBack"
      />

      <section v-else class="alt">
        <p>Impossible de charger l’enfant.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* ---------- HEADER ---------- */
.top {
  margin-bottom: var(--sp-3);
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
  color: var(--c-bg-dark);
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
  margin-top: 4rem;
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

.notifications-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-body);
  color: var(--c-text);
  border-bottom: 1px solid var(--c-border);
}

.notifications-item .label {
  display: flex;
  align-items: center;
  text-align: left;
  flex: 1;
}

.notifications-button {
  flex-shrink: 0;
  height: 32px;
  min-height: 32px;
  line-height: 1;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
