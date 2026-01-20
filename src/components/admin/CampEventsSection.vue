<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import EventIconChips from '@/components/ui/EventIconChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  campTitle: { type: String, default: '' },
  trainings: { type: Array, default: () => [] },
  stages: { type: Array, default: () => [] },
  fundraisings: { type: Array, default: () => [] },
  generalMeeting: { type: Object, default: null },
  infoEvening: { type: Object, default: null },

  enabledFilters: {
    type: Array,
    default: () => ['all', 'training', 'stage', 'fundraising', 'ag', 'informationEvening'],
  },
})

const emit = defineEmits(['create', 'openTraining', 'openEvent'])

const filter = ref('all')

// Combiner tous les événements en une liste normalisée
const allEvents = computed(() => {
  const events = []

  // Trainings
  for (const t of props.trainings ?? []) {
    events.push({
      id: t.id ?? t._id,
      type: 'trainings',
      data: t,
      icon: 'boots',
      title: `Entrainement ${t.number ?? ''}`.trim(),
      description: t.meetingPoint ?? '',
      date: t.date,
    })
  }

  // Stages
  for (const s of props.stages ?? []) {
    events.push({
      id: s.id ?? s._id,
      type: 'stages',
      data: s,
      icon: 'stage',
      title: `Étape ${s.number ?? ''}`.trim(),
      description: s.startPoint && s.endPoint ? `${s.startPoint} → ${s.endPoint}` : '',
      date: s.date,
    })
  }

  // Fundraisings
  for (const f of props.fundraisings ?? []) {
    events.push({
      id: f.id ?? f._id,
      type: 'fundraisings',
      data: f,
      icon: 'fundraising',
      title: `Vente ${f.number ?? ''}`.trim(),
      description: f.location ?? '',
      date: f.dateTime,
    })
  }

  // AG (singleton)
  if (props.generalMeeting) {
    events.push({
      id: 'ag',
      type: 'generalMeeting',
      data: props.generalMeeting,
      icon: 'ag',
      title: 'Assemblée générale',
      description: props.generalMeeting.location ?? '',
      date: props.generalMeeting.dateTime,
    })
  }

  // Info Evening (singleton)
  if (props.infoEvening) {
    events.push({
      id: 'ie',
      type: 'information-evening',
      data: props.infoEvening,
      icon: 'informationEvening',
      title: "Soirée d'information",
      description: props.infoEvening.location ?? '',
      date: props.infoEvening.dateTime,
    })
  }

  // Trier par date
  return events.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return da - db
  })
})

const isEmpty = computed(() => allEvents.value.length === 0)

const visibleEvents = computed(() => {
  if (filter.value === 'all') return allEvents.value

  const filterMap = {
    training: 'trainings',
    stage: 'stages',
    fundraising: 'fundraisings',
    ag: 'generalMeeting',
    informationEvening: 'information-evening',
  }

  const targetType = filterMap[filter.value]
  if (!targetType) return allEvents.value

  return allEvents.value.filter((e) => e.type === targetType)
})

function onOpenEvent(event) {
  if (event.type === 'trainings') {
    emit('openTraining', event.data)
  } else {
    emit('openEvent', event.data, event.type)
  }
}
</script>

<template>
  <div class="camp-events">
    <AdminPanel
      title="ÉVÈNEMENTS EXISTANTS"
      :is-empty="isEmpty"
      empty-text="Aucun évènement pour le moment"
    >
      <template #tools>
        <EventIconChips v-model="filter" />
      </template>

      <template v-if="!isEmpty">
        <DashboardCard
          v-for="event in visibleEvents"
          :key="event.id"
          :icon="event.icon"
          :title="event.title.toUpperCase()"
          :description="event.description"
          asButton
          @click="onOpenEvent(event)"
        />
      </template>

      <template #actions>
        <BaseButton variant="primary" size="md" :block="true" @click="$emit('create')">
          Créer un nouvel évènement
        </BaseButton>
      </template>
    </AdminPanel>
  </div>
</template>
