<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import EventIconChips from '@/components/ui/EventIconChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import { getTypeEvent } from '@/composables/getTypeEvent'

const props = defineProps({
  year: { type: Number, required: true },
  camps: { type: Array, default: () => [] },
})

const emit = defineEmits(['openEvent'])
const filter = ref('all')

const events = computed(() => {
  const res = []

  for (const camp of props.camps ?? []) {
    if (!camp) continue

    res.push({ type: 'camp', data: camp, __campId: camp.id, __campTitle: camp.title })

    for (const t of camp?.trainings ?? []) {
      res.push({ type: 'training', data: t, __campId: camp.id, __campTitle: camp.title })
    }

    if (camp?.infoEvening) {
      res.push({
        type: 'information-evening',
        data: camp.infoEvening,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }

    if (camp?.generalMeeting) {
      res.push({
        type: 'generalMeeting',
        data: camp.generalMeeting,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }

    for (const f of camp?.fundraisings ?? []) {
      res.push({ type: 'fundraisings', data: f, __campId: camp.id, __campTitle: camp.title })
    }
  }

  const getSortTime = (ev) => {
    const d =
      ev?.data?.date ?? ev?.data?.startDate ?? ev?.data?.datetime ?? ev?.data?.startDatetime ?? null
    const t = d ? new Date(d).getTime() : 0
    return Number.isNaN(t) ? 0 : t
  }

  return res.sort((a, b) => getSortTime(b) - getSortTime(a))
})

const visibleEvents = computed(() => {
  if (filter.value === 'all') return events.value
  return events.value.filter((e) => e.type === filter.value)
})

const isEmpty = computed(() => visibleEvents.value.length === 0)

const emptyText = computed(() => {
  const labels = {
    all: 'Aucun évènement archivé pour cette année',
    camp: 'Aucun camp archivé pour cette année',
    training: 'Aucun entraînement archivé pour cette année',
    'information-evening': `Aucune soirée d'information archivée pour cette année`,
    generalMeeting: `Aucune assemblée générale archivée pour cette année`,
    fundraisings: `Aucune vente de pâtisserie archivée pour cette année`,
    stages: `Aucune étape archivée pour cette année`,
  }
  return labels[filter.value] ?? 'Aucun évènement pour ce filtre'
})

function open(ev) {
  emit('openEvent', ev)
}

function ui(ev) {
  return getTypeEvent({
    type: ev.type,
    data: ev.data,
    camp: { id: ev.__campId, title: ev.__campTitle },
  })
}
</script>

<template>
  <AdminPanel :title="`ARCHIVES — ${year}`" :is-empty="isEmpty" :empty-text="emptyText">
    <template #tools>
      <EventIconChips v-model="filter" />
    </template>

    <template v-if="!isEmpty">
      <DashboardCard
        v-for="ev in visibleEvents"
        :key="`${ev.__campId}-${ev.type}-${ev.data?.number ?? ev.data?.id ?? ''}`"
        :icon="ui(ev).icon"
        :title="ui(ev).title"
        :description="ui(ev).description"
        asButton
        @click="open(ev)"
      />
    </template>
  </AdminPanel>
</template>
