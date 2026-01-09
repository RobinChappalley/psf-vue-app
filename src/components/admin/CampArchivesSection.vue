<script setup>
import { computed } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const props = defineProps({
  camps: { type: Array, default: () => [] },

  title: { type: String, default: 'ARCHIVES' },
  emptyText: { type: String, default: 'Aucun camp archivé pour le moment' },

  // icône DashboardCard (AppIcone)
  icon: { type: String, default: 'calendarPlus' },

  // source de l’année
  yearFrom: { type: String, default: 'startDate' }, // 'startDate' | 'endDate'
})

const emit = defineEmits(['openYear'])

/* ----------------------------
 * Camps archivés uniquement
 * ---------------------------- */
const archivedCamps = computed(() => (props.camps ?? []).filter((c) => c?.status === 'archived'))

/* ----------------------------
 * Extraire l’année
 * ---------------------------- */
function getYear(camp) {
  const raw =
    props.yearFrom === 'endDate'
      ? (camp?.endDate ?? camp?.startDate)
      : (camp?.startDate ?? camp?.endDate)

  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.getFullYear()
}

/* ----------------------------
 * Groupement par année
 * ---------------------------- */
const campsByYear = computed(() => {
  const map = new Map()

  for (const camp of archivedCamps.value) {
    const year = getYear(camp)
    if (!year) continue

    if (!map.has(year)) map.set(year, [])
    map.get(year).push(camp)
  }

  return map
})

/* ----------------------------
 * Liste des années (desc)
 * ---------------------------- */
const years = computed(() => Array.from(campsByYear.value.keys()).sort((a, b) => b - a))

const isEmpty = computed(() => years.value.length === 0)

function openYear(year) {
  emit('openYear', {
    year,
    camps: campsByYear.value.get(year) ?? [],
  })
}
</script>

<template>
  <AdminPanel :title="title" :is-empty="isEmpty" :empty-text="emptyText">
    <DashboardCard
      v-for="year in years"
      :key="year"
      :icon="icon"
      :title="String(year)"
      @click="openYear(year)"
    >
    </DashboardCard>
  </AdminPanel>
</template>

<style scoped></style>
