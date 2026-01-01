<script setup>
import { computed } from 'vue'
import { authStore } from '@/stores/auth'
import { useEventsFeed } from '@/composables/useEventsFeed'
import EventsBlock from '@/components/events/EventsBlock.vue'
import EventCard from '@/components/events/EventCard.vue'

const firstname = computed(() => authStore.user.value?.firstname || '')

const { upcomingRegistered, openToSubscribe } = useEventsFeed({
  initialEvents: [
    // tests : un inscrit + un pas inscrit
    //{
    //  id: 't1',
    //  name: 'Entrainement 1',
    //  type: 'training',
    //  'start-date': '2026-03-23',
    //  'end-date': '2026-03-23',
    //  'subscription-deadline-date-time': '2026-03-20T23:59:00',
    //  userStatus: 'registered',
    //  location: 'Payerne - Neuchâtel',
    //},
    //{
    //  id: 'c1',
    //  name: 'Camp 2026',
    //  type: 'camp',
    //  'start-date': '2026-07-12',
    //  'end-date': '2026-07-31',
    //  'subscription-deadline-date-time': '2026-06-15T23:59:00',
    //  userStatus: 'none',
    //  location: 'Zurich - Bellinzone',
    //},
  ],
})
</script>

<template>
  <section class="section">
    <h1>BONJOUR {{ firstname }}</h1>
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
