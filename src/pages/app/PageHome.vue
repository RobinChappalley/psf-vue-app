<script setup>
import { computed, onMounted, ref } from 'vue'
import { authStore } from '@/stores/auth'
import { profileStore } from '@/stores/profile'
import { childrenStore } from '@/stores/childrenStore'
import { responsiblesStore } from '@/stores/responsibles'
import { campsStore } from '@/stores/camps'
import { useEventsFeed } from '@/composables/useEventsFeed'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { isRegisteredToEvent } from '@/composables/eventRegistration'

import EventsBlock from '@/components/events/EventsBlock.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventDetailsPanel from '@/components/ui/EventDetailsPanel.vue'
import BackButton from '@/components/ui/BackButton.vue'

// --------------------
// Charger les camps (lazy, sans App.vue)
// --------------------
const user = computed(() => authStore.user.value)

/* Dans PageHome.vue */

onMounted(async () => {
  // 1. Charger les camps (Toujours nécessaire)
  campsStore.ensureCampsLoaded()

  // 2. Si l'utilisateur est connecté, on rafraichit ses données
  if (authStore.isAuthenticated.value) {
    // On sécurise l'ID (on s'assure qu'il existe)
    const myId = user.value?.id

    if (myId) {
      // ÉTAPE A : Rafraîchir l'utilisateur
      try {
        const freshUser = await profileStore.refreshUser(myId)

        // C'EST ICI LA CLÉ :
        // On met à jour l'affichage (authStore) avec ce qu'on vient de recevoir
        if (freshUser) {
          authStore.user.value = freshUser
        }
      } catch (e) {
        console.error('Erreur chargement user', e)
      }

      // ÉTAPE B : Charger les enfants
      // On passe l'ID qu'on a déjà récupéré
      await childrenStore.fetchChildren(myId).catch((e) => console.error('Erreur enfants', e))
    }

    // ÉTAPE C : Responsables
    await responsiblesStore.fetchResponsibleUsers().catch(() => {})
  }
})

// --------------------
// Navigation
// --------------------
const step = ref('home') // 'home' | 'camp-details' | 'training-details'
const selectedDetailsEvent = ref(null)

function backToHome() {
  step.value = 'home'
  selectedDetailsEvent.value = null
}

// --------------------
// USER + CAMP ACTUEL
// --------------------
const firstname = computed(() => user.value?.firstname || '')

const camps = computed(() => campsStore.camps.value)
const campsLoading = computed(() => campsStore.loading.value)
const campsError = computed(() => campsStore.error.value)

// Home = n'affiche que le camp "courant"
const currentCamp = computed(() => getCurrentCamp(camps.value, 'home'))

// lookup usersById (pour parent -> enfants plus tard)
const usersById = computed(() => new Map())

// --------------------
// Construire les events UI depuis le camp (DB-ready)
// --------------------
const events = computed(() => {
  if (!currentCamp.value) return []

  const camp = currentCamp.value

  // savoir si l'utilisateur est inscrit au camp
  const campId = String(camp.id ?? camp._id ?? '')
  const myCampIds = (user.value?.camps || []).map(String)

  const childrenCampIds = (childrenStore.childrenObjects.value || [])
    .flatMap((ch) => (Array.isArray(ch.camps) ? ch.camps : []))
    .map(String)

  const campRegistered =
    !!campId && (myCampIds.includes(campId) || childrenCampIds.includes(campId))

  const baseEvents = []

  // 1) camp
  baseEvents.push({
    id: camp.id ?? camp._id,
    type: 'camp',
    name: camp.title,
    'start-date': camp.startDate,
    'end-date': camp.endDate,
    'subscription-deadline-date-time': camp.subEndDatetime,
    location: '',
    subscribable: true,
    userStatus: campRegistered ? 'registered' : 'none',
  })

  // 2) trainings : visibles SEULEMENT si inscrit au camp
  if (campRegistered) {
    for (const t of camp.trainings || []) {
      baseEvents.push({
        id: t.id ?? t._id,
        type: 'training',
        name: 'Entraînement',
        'start-date': t.date,
        'end-date': t.date,
        'subscription-deadline-date-time': null,
        location: t.meetingPoint || '',
        userStatus: 'registered',
        subscribable: false,
      })
    }
  }

  // 3) fundraisings
  for (const f of camp.fundraisings || []) {
    baseEvents.push({
      id: f.id ?? f._id,
      type: 'fundraising',
      name: 'Vente de pâtisserie',
      'start-date': f.dateTime,
      'end-date': f.dateTime,
      'subscription-deadline-date-time': camp.subEndDatetime,
      location: f.location || '',
      'users-id': f.usersId || f.participants || [],
      subscribable: true,
    })
  }

  // 4) generalMeeting
  if (camp.generalMeeting?.dateTime) {
    baseEvents.push({
      id: `ag-${camp.id ?? camp._id}`,
      type: 'ag',
      name: 'Assemblée générale',
      'start-date': camp.generalMeeting.dateTime,
      'end-date': camp.generalMeeting.dateTime,
      'subscription-deadline-date-time': camp.subEndDatetime,
      location: camp.generalMeeting.location || '',
      participants: camp.generalMeeting.participants || [],
      subscribable: true,
    })
  }

  // userStatus pour chaque event
  return baseEvents.map((e) => {
    if (e.userStatus) return e

    const registered = isRegisteredToEvent({
      user: user.value,
      camp,
      event: e,
      usersById: usersById.value,
    })

    return { ...e, userStatus: registered ? 'registered' : 'none' }
  })
})

// --------------------
// useEventsFeed : split registered vs open-to-subscribe
// --------------------
const { upcomingRegistered, openToSubscribe } = useEventsFeed({ events })

/* ======================================================
   DÉTAILS (CAMP + TRAINING)
====================================================== */

// map id -> "Prénom Nom" pour ton panneau (responsables, participants, etc.)
const displayUserName = (id) => {
  const rid = String(id ?? '')
  if (!rid) return '—'
  const u =
    responsiblesStore.responsibleUsersObjects.value?.find((x) => String(x.id ?? x._id) === rid) ||
    responsiblesStore.adminUsersObjects.value?.find((x) => String(x.id ?? x._id) === rid) ||
    null
  if (!u) return rid
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || rid
}

async function openCampDetailsFromCard(ev) {
  // On ne veut afficher les détails que pour le camp ET inscrit
  if (!ev || ev.type !== 'camp' || ev.userStatus !== 'registered') return

  const campId = currentCamp.value?.id ?? currentCamp.value?._id
  if (!campId) return

  // recommandé si /camps renvoie une version light :
  const campFull = await campsStore.getCampById(campId)

  selectedDetailsEvent.value = {
    type: 'camp',
    data: campFull,
    __campTitle: campFull.title,
  }

  step.value = 'camp-details'
}

async function openTrainingDetailsFromCard(ev) {
  // trainings visibles seulement si inscrit, donc en pratique toujours 'registered'
  if (!ev || ev.type !== 'training' || ev.userStatus !== 'registered') return

  const camp = currentCamp.value
  if (!camp) return

  const trainingId = String(ev.id ?? '')
  if (!trainingId) return

  // chercher le training dans le camp courant
  const rawTraining =
    (camp.trainings || []).find((t) => String(t.id ?? t._id) === trainingId) || null

  if (!rawTraining) return

  // petit normalize pour compat avec ton panel (si jamais itemsList vs 'items-list')
  const trainingFull = {
    ...rawTraining,
    'items-list': rawTraining['items-list'] ?? rawTraining.itemsList ?? [],
  }

  selectedDetailsEvent.value = {
    type: 'training',
    data: trainingFull,
    __campTitle: camp.title,
  }

  step.value = 'training-details'
}
</script>

<template>
  <!-- ÉCRAN HOME -->
  <template v-if="step === 'home'">
    <section class="section">
      <h1>BONJOUR {{ firstname }} !</h1>
      <p>Voici les évènements à venir</p>

      <p v-if="campsLoading">Chargement des camps…</p>
      <p v-else-if="campsError" style="color: red">Erreur: {{ campsError }}</p>
    </section>

    <section class="section">
      <EventsBlock title="Vos prochains évènements" :has-items="upcomingRegistered.length > 0">
        <EventCard
          v-for="event in upcomingRegistered"
          :key="event.id"
          :event="event"
          @open-camp-details="openCampDetailsFromCard"
          @open-training-details="openTrainingDetailsFromCard"
        />
      </EventsBlock>
    </section>

    <section class="section">
      <EventsBlock
        title="Évènements ouverts à l’inscription"
        :has-items="openToSubscribe.length > 0"
      >
        <EventCard
          v-for="event in openToSubscribe"
          :key="event.id"
          :event="event"
          @open-camp-details="openCampDetailsFromCard"
          @open-training-details="openTrainingDetailsFromCard"
        />
      </EventsBlock>
    </section>
  </template>

  <!-- ÉCRAN DÉTAILS CAMP -->
  <template v-else-if="step === 'camp-details'">
    <section class="section">
      <BackButton @click="backToHome" />
      <h2>Détails du camp</h2>

      <EventDetailsPanel
        v-if="selectedDetailsEvent"
        :event="selectedDetailsEvent"
        :display-user-name="displayUserName"
      />
    </section>
  </template>

  <!-- ÉCRAN DÉTAILS ENTRAÎNEMENT -->
  <template v-else-if="step === 'training-details'">
    <section class="section">
      <BackButton @click="backToHome" />
      <h2>Détails de l’entraînement</h2>

      <EventDetailsPanel
        v-if="selectedDetailsEvent"
        :event="selectedDetailsEvent"
        :display-user-name="displayUserName"
      />
    </section>
  </template>
</template>

<style scoped>
.event-click-wrapper {
  cursor: default;
}
.event-click-wrapper[role='button'] {
  cursor: pointer;
}
</style>
