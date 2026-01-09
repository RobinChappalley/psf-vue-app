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
    title: 'Camp 2026',
    status: 'published',
    startDate: '2026-07-12',
    endDate: '2026-07-31',
    subStartDatetime: '2026-05-01T08:00:00',
    subEndDatetime: '2026-06-15T23:59:00',
    trainings: [
      { id: 'training-1', date: '2026-03-23', meetingPoint: 'Payerne - Neuchâtel' },
      { id: 'training-2', date: '2026-04-15', meetingPoint: 'Lac Noir' },
    ],
    fundraisings: [
      {
        id: 'fund-1',
        dateTime: '2026-06-16T10:00:00',
        location: 'Informations complémentaires',
        usersId: ['4'],
      },
    ],
    generalMeeting: {
      dateTime: '2026-06-01T18:30:00',
      location: 'Fribourg',
      participants: [{ email: 'pauldoe@example.com' }],
    },
  },
]

// --------------------
// USER + CAMP ACTUEL
// --------------------
const user = computed(() => authStore.user.value)
const firstname = computed(() => user.value?.firstname || '')

const currentCamp = computed(() => getCurrentCamp(camps, 'home'))

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
    name: camp.title, // ✅ title
    'start-date': camp.startDate, // ✅ startDate
    'end-date': camp.endDate, // ✅ endDate
    'subscription-deadline-date-time': camp.subEndDatetime, // ✅ subEndDatetime
    location: '',
  })

  // 2) trainings : visibles SEULEMENT si inscrit au camp
  if (campRegistered) {
    for (const t of camp.trainings || []) {
      baseEvents.push({
        id: t.id,
        type: 'training',
        name: 'Entraînement',
        'start-date': t.date,
        'end-date': t.date,
        'subscription-deadline-date-time': null, // pas inscriptible
        location: t.meetingPoint || '', // ✅ meetingPoint
        userStatus: 'registered',
        subscribable: false,
      })
    }
  }

  // 3) fundraisings
  for (const f of camp.fundraisings || []) {
    // ✅ fundraisings
    baseEvents.push({
      id: f.id,
      type: 'fundraising',
      name: 'Vente de pâtisserie',
      'start-date': f.dateTime, // ✅ dateTime
      'end-date': f.dateTime,
      'subscription-deadline-date-time': camp.subEndDatetime, // ✅ subEndDatetime
      location: f.location || '',
      'users-id': f.usersId || [], // ✅ usersId
      subscribable: true,
    })
  }

  // 4) generalMeeting
  if (camp.generalMeeting?.dateTime) {
    // ✅ generalMeeting
    baseEvents.push({
      id: `ag-${camp.id}`,
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

  return baseEvents.map((e) => {
    // si déjà défini (ex: trainings), ne pas recalculer
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
// useEventsFeed (inchangé) : split registered vs open-to-subscribe
// --------------------
const { upcomingRegistered, openToSubscribe } = useEventsFeed({
  events,
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
