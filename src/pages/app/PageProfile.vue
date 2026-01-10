<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'
import ProfileMenuItem from '@/components/ui/ProfileMenuItem.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import AppIcone from '@/components/AppIcone.vue'
import ProfilePersonalDataForm from '@/components/profile/PersonalDataForm.vue'
import FullDataForm from '@/components/profile/FullDataForm.vue'
import ChildrenList from '@/components/profile/ChildrenList.vue'
import { useChildrenEditor } from '@/composables/useChildrenEditor'

//Navigation retour
function goBack() {
  if (step.value === 'personal') return backToProfile()
  if (step.value === 'children') return backToProfile()
  if (step.value === 'child-edit') return closeChildEditAndBack()
  // fallback
  step.value = 'profile'
}

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
const saving = ref(false)
const errorMsg = ref('')

async function onSubmitPersonalData(payload) {
  saving.value = true
  errorMsg.value = ''
  try {
    await authStore.updateMe(payload)
    // option UX: revenir au profil direct
    // step.value = 'profile'
  } catch (e) {
    console.error(e)
    errorMsg.value = e?.message ?? 'Erreur lors de la sauvegarde.'
  } finally {
    saving.value = false
  }
}

//PARTIE ENFANT
const { children, selectedChild, openEditChild, openCreateChild, submitChild, closeChildEdit } =
  useChildrenEditor()

function onEditChild(child) {
  openEditChild(child)
  step.value = 'child-edit'
}

function onAddChild() {
  openCreateChild(me.value?.id) // parentId
  step.value = 'child-edit'
}

const savingChild = ref(false)
const childError = ref('')

async function onSubmitChildData(payload) {
  if (savingChild.value) return
  savingChild.value = true
  childError.value = ''

  try {
    const childId = selectedChild.value?.id ?? selectedChild.value?._id

    if (childId) {
      await authStore.updateChild({ ...payload, id: childId })
    } else {
      await authStore.createChild(payload)
    }
    closeChildEditAndBack()
  } catch (e) {
    console.error(e)
    childError.value = e?.message ?? "Erreur lors de la sauvegarde de l'enfant."
  } finally {
    savingChild.value = false
  }
}

function closeChildEditAndBack() {
  closeChildEdit()
  step.value = 'children'
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
        </div>
      </section>

      <nav class="menu">
        <ProfileMenuItem @click="openPersonalData"> Données personnelles </ProfileMenuItem>

        <ProfileMenuItem @click="openChildren"> Enfants </ProfileMenuItem>
      </nav>

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
</style>
