<script setup>
import { computed, ref, onMounted } from 'vue'
import { authStore } from '@/stores/auth'
import { useEventsFeed } from '@/composables/useEventsFeed'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { isRegisteredToEvent } from '@/composables/eventRegistration'
import { listCamps } from '@/services/campsApi'

import EventsBlock from '@/components/events/EventsBlock.vue'
import EventCard from '@/components/events/EventCard.vue'

// --------------------
// CAMPS depuis API
// --------------------
const camps = ref([])
const campsLoading = ref(false)
const campsError = ref(null)

onMounted(async () => {
  campsLoading.value = true
  campsError.value = null
  try {
    camps.value = await listCamps()
  } catch (e) {
    campsError.value = e?.message ?? 'Erreur chargement camps'
    console.error('❌ /camps failed', e)
  } finally {
    campsLoading.value = false
  }
})

// --------------------
// USER + CAMP ACTUEL
// --------------------
const user = computed(() => authStore.user.value)
const firstname = computed(() => user.value?.firstname || '')

const currentCamp = computed(() => getCurrentCamp(camps.value, 'home'))

// lookup usersById (pour parent -> enfants plus tard)
const usersById = computed(() => new Map())

// --------------------
// Construire les events UI depuis le camp (DB-ready)
// --------------------
const events = computed(() => {
  if (!currentCamp.value) return []

  const camp = currentCamp.value

  const campRegistered = isRegisteredToEvent({
    user: user.value,
    camp,
    event: { type: 'camp' },
    usersById: usersById.value,
  })

  const baseEvents = []

  // 1) camp
  baseEvents.push({
    id: camp.id ?? camp._id, // ✅ au cas où (normalement listCamps normalize déjà)
    type: 'camp',
    name: camp.title,
    'start-date': camp.startDate,
    'end-date': camp.endDate,
    'subscription-deadline-date-time': camp.subEndDatetime,
    location: '',
  })

  // 2) trainings (seulement si inscrit au camp)
  if (campRegistered) {
    for (const t of camp.trainings || []) {
      baseEvents.push({
        id: t.id ?? t._id, // ✅ mongo
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
      id: f.id ?? f._id, // ✅ mongo
      type: 'fundraising',
      name: 'Vente de pâtisserie',
      'start-date': f.dateTime,
      'end-date': f.dateTime,
      'subscription-deadline-date-time': camp.subEndDatetime,
      location: f.location || '',
      'users-id': f.usersId || [],
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
// useEventsFeed (inchangé)
// --------------------
const { upcomingRegistered, openToSubscribe } = useEventsFeed({ events })
</script>

<template>
  <section class="section">
    <h1>BONJOUR {{ firstname }} !</h1>
    <p>Voici les évènements à venir</p>

    <!-- ✅ Optionnel: feedback -->
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
