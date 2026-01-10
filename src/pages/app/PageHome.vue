<script setup>
import { computed, onMounted } from 'vue'
import { authStore } from '@/stores/auth'
import { campsStore } from '@/stores/camps'
import { useEventsFeed } from '@/composables/useEventsFeed'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { isRegisteredToEvent } from '@/composables/eventRegistration'

import EventsBlock from '@/components/events/EventsBlock.vue'
import EventCard from '@/components/events/EventCard.vue'

// --------------------
// Charger les camps (lazy, sans App.vue)
// --------------------
onMounted(async () => {
  campsStore.ensureCampsLoaded()
  if (authStore.isAuthenticated.value) {
    await authStore.refreshMe()
    await authStore.fetchChildren()
  }
})

// --------------------
// USER + CAMP ACTUEL
// --------------------
const user = computed(() => authStore.user.value)
const firstname = computed(() => user.value?.firstname || '')

const camps = computed(() => campsStore.camps.value)
const campsLoading = computed(() => campsStore.loading.value)
const campsError = computed(() => campsStore.error.value)

// Home = n'affiche que le camp "courant" (souvent published) selon ta logique dans getCurrentCamp
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

  const childrenCampIds = (authStore.childrenObjects.value || [])
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
        id: t.id ?? t._id, // mongo
        type: 'training',
        name: 'Entraînement',
        'start-date': t.date,
        'end-date': t.date,
        'subscription-deadline-date-time': null, // pas inscriptible
        location: t.meetingPoint || '',
        userStatus: 'registered',
        subscribable: false,
      })
    }
  }

  // 3) fundraisings
  for (const f of camp.fundraisings || []) {
    baseEvents.push({
      id: f.id ?? f._id, // mongo
      type: 'fundraising',
      name: 'Vente de pâtisserie',
      'start-date': f.dateTime,
      'end-date': f.dateTime,
      'subscription-deadline-date-time': camp.subEndDatetime,
      location: f.location || '',
      'users-id': f.usersId || f.participants || [], // selon ton backend (tu as "participants" dans ton seeder)
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

    return {
      ...e,
      userStatus: registered ? 'registered' : 'none',
    }
  })
})

// --------------------
// useEventsFeed : split registered vs open-to-subscribe
// --------------------
const { upcomingRegistered, openToSubscribe } = useEventsFeed({ events })
</script>

<template>
  <section class="section">
    <h1>BONJOUR {{ firstname }} !</h1>
    <p>Voici les évènements à venir</p>

    <!-- Optionnel: feedback -->
    <p v-if="campsLoading">Chargement des camps…</p>
    <p v-else-if="campsError" style="color: red">Erreur: {{ campsError }}</p>
  </section>

  <section class="section">
    <EventsBlock title="Vos prochains évènements" :has-items="upcomingRegistered.length > 0">
      <EventCard v-for="event in upcomingRegistered" :key="event.id" :event="event" />
    </EventsBlock>
  </section>

  <section class="section">
    <EventsBlock title="Évènements ouverts à l’inscription" :has-items="openToSubscribe.length > 0">
      <EventCard v-for="event in openToSubscribe" :key="event.id" :event="event" />
    </EventsBlock>
  </section>
</template>
