<script setup>
import { computed } from 'vue'
import { authStore } from '@/stores/auth'
import { useEventsFeed } from '@/composables/useEventsFeed'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { isRegisteredToEvent } from '@/composables/eventRegistration'

import EventsBlock from '@/components/events/EventsBlock.vue'
import EventCard from '@/components/events/EventCard.vue'

// --------------------
// MOCK DATA (plus tard: API)
// --------------------
const camps = [
  {
    id: 'camp-2026',
    name: 'Camp 2026',
    'start-date': '2026-07-12',
    'end-date': '2026-07-31',
    'subscription-start-date-time': '2026-05-01T08:00:00',
    'subscription-deadline-date-time': '2026-06-15T23:59:00',
    trainings: [
      {
        id: 'training-1',
        date: '2026-03-23',
        'meeting-point': 'Payerne - Neuchâtel',
      },
      {
        id: 'training-2',
        date: '2026-04-15',
        'meeting-point': 'Lac Noir',
      },
    ],
    fundraising: [
      {
        id: 'fund-1',
        'date-time': '2026-06-16T10:00:00',
        location: 'Informations complémentaires',
        'users-id': ['4'], // parent inscrit
      },
    ],
    AG: {
      'date-time': '2026-06-01T18:30:00',
      location: 'Fribourg',
      participants: [{ mail: 'pauldoe@example.com' }],
    },
  },
]

// --------------------
// USER + CAMP ACTUEL
// --------------------
const user = computed(() => authStore.user.value)
const firstname = computed(() => user.value?.firstname || '')

const currentCamp = computed(() => getCurrentCamp(camps))

// lookup usersById (pour parent -> enfants plus tard)
// pour l’instant Map vide (tu brancheras la DB ensuite)
const usersById = computed(() => new Map())

// --------------------
// Construire les events UI depuis le camp (DB-ready)
// --------------------
const events = computed(() => {
  if (!currentCamp.value) return []

  const camp = currentCamp.value

  // ✅ savoir si l'utilisateur est inscrit au camp
  const campRegistered = isRegisteredToEvent({
    user: user.value,
    camp,
    event: { type: 'camp' },
    usersById: usersById.value,
  })

  const baseEvents = []

  // 1) camp
  baseEvents.push({
    id: camp.id,
    type: 'camp',
    name: camp.name,
    'start-date': camp['start-date'],
    'end-date': camp['end-date'],
    'subscription-deadline-date-time': camp['subscription-deadline-date-time'],
    location: '',
  })

  // 2) trainings (pas inscriptibles tant que pas inscrit au camp)
  for (const t of camp.trainings || []) {
    baseEvents.push({
      id: t.id,
      type: 'training',
      name: 'Entraînement',
      'start-date': t.date,
      'end-date': t.date,
      'subscription-deadline-date-time': campRegistered
        ? camp['subscription-deadline-date-time']
        : null,
      location: t['meeting-point'] || '',
    })
  }

  // 3) fundraising
  for (const f of camp.fundraising || []) {
    baseEvents.push({
      id: f.id,
      type: 'fundraising',
      name: 'Vente de pâtisserie',
      'start-date': f['date-time'],
      'end-date': f['date-time'],
      'subscription-deadline-date-time': camp['subscription-deadline-date-time'],
      location: f.location || '',
      'users-id': f['users-id'] || [],
    })
  }

  // 4) AG
  if (camp.AG?.['date-time']) {
    baseEvents.push({
      id: `ag-${camp.id}`,
      type: 'ag',
      name: 'Assemblée générale',
      'start-date': camp.AG['date-time'],
      'end-date': camp.AG['date-time'],
      'subscription-deadline-date-time': camp['subscription-deadline-date-time'],
      location: camp.AG.location || '',
      participants: camp.AG.participants || [],
    })
  }

  // userStatus calculé depuis ta logique DB
  return baseEvents.map((e) => {
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
// useEventsFeed (inchangé) : split registered vs open-to-subscribe
// --------------------
const { upcomingRegistered, openToSubscribe } = useEventsFeed({
  initialEvents: events.value,
})
</script>

<template>
  <section class="section">
    <h1>BONJOUR {{ firstname }} !</h1>
    <p>Voici les évènements à venir</p>
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
