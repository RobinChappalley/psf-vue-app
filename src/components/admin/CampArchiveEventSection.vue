<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import EventIconChips from '@/components/ui/EventIconChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import { getTypeEvent } from '@/composables/getTypeEvent'

const props = defineProps({
  year: { type: Number, required: true },
  camps: { type: Array, default: () => [] }, // camps archivés de l’année
})

const emit = defineEmits(['openEvent'])

const filter = ref('all')

/**
 * Normalisation + flatten de TOUS les évènements archivés de l’année
 * Chaque item contient:
 * - type: 'camp' | 'trainings' | 'information-evening' | 'generalMeeting' | 'fundraisings'
 * - data: l’objet source (camp ou event)
 * - __campId/__campTitle: contexte du camp
 */
const events = computed(() => {
  const res = []

  for (const camp of props.camps ?? []) {
    if (!camp) continue

    // ✅ Ajouter aussi le "camp" lui-même (si tu veux l’afficher comme card)
    res.push({
      type: 'camp',
      data: camp,
      __campId: camp.id,
      __campTitle: camp.title,
    })

    // Trainings (liste)
    for (const t of camp?.trainings ?? []) {
      res.push({
        type: 'trainings',
        data: t,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }

    // Info evening (objet unique)
    if (camp?.infoEvening) {
      res.push({
        type: 'information-evening',
        data: camp.infoEvening,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }

    // AG (objet unique)
    if (camp?.generalMeeting) {
      res.push({
        type: 'generalMeeting',
        data: camp.generalMeeting,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }

    // Fundraisings (liste)
    for (const f of camp?.fundraisings ?? []) {
      res.push({
        type: 'fundraisings',
        data: f,
        __campId: camp.id,
        __campTitle: camp.title,
      })
    }
  }

  // ✅ Tri: du plus récent au plus ancien (si date disponible)
  // On essaie plusieurs champs possibles (date/startDate/datetime)
  const getSortTime = (ev) => {
    const d =
      ev?.data?.date ?? ev?.data?.startDate ?? ev?.data?.datetime ?? ev?.data?.startDatetime ?? null
    const t = d ? new Date(d).getTime() : 0
    return Number.isNaN(t) ? 0 : t
  }

  return res.sort((a, b) => getSortTime(b) - getSortTime(a))
})

const isEmpty = computed(() => events.value.length === 0)

const visibleEvents = computed(() => {
  // v1: chips all/training
  if (filter.value === 'all') return events.value
  if (filter.value === 'training') return events.value.filter((e) => e.type === 'trainings')
  return []
})

function open(ev) {
  emit('openEvent', ev)
}

/**
 * Helpers UI (title/icon/description) via ton composable
 * getTypeEvent doit retourner au minimum:
 * { title: string, icon: string, description?: string }
 */
function ui(ev) {
  // 👉 si ton getTypeEvent attend (type, data, camp) adapte ici
  return getTypeEvent({
    type: ev.type,
    data: ev.data,
    camp: { id: ev.__campId, title: ev.__campTitle },
  })
}
</script>

<template>
  <AdminPanel
    :title="`ARCHIVES — ${year}`"
    :is-empty="isEmpty"
    empty-text="Aucun évènement archivé pour cette année"
  >
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
