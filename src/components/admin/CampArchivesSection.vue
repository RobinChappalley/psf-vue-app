<script setup>
import { computed } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const props = defineProps({
  // Tu peux passer tous les camps, le composant filtrera les "archived"
  camps: { type: Array, default: () => [] },

  title: { type: String, default: 'ARCHIVES' },
  emptyText: { type: String, default: 'Aucun camp archivé pour le moment' },

  // Icon de la card (tu peux changer selon tes icônes dispo)
  icon: { type: String, default: 'calendar' },

  // Par défaut, on prend l'année de startDate, sinon endDate
  yearFrom: { type: String, default: 'startDate' }, // 'startDate' | 'endDate'
})

const emit = defineEmits(['openYear'])

const archivedCamps = computed(() => (props.camps ?? []).filter((c) => c?.status === 'archived'))

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

const campsByYear = computed(() => {
  const map = new Map()

  for (const camp of archivedCamps.value) {
    const year = getYear(camp)
    if (!year) continue

    if (!map.has(year)) map.set(year, [])
    map.get(year).push(camp)
  }

  // optionnel: tri des camps dans chaque année (par startDate desc)
  for (const [year, list] of map.entries()) {
    list.sort((a, b) => {
      const da = new Date(a?.startDate ?? a?.endDate ?? 0).getTime()
      const db = new Date(b?.startDate ?? b?.endDate ?? 0).getTime()
      return db - da
    })
    map.set(year, list)
  }

  return map
})

const years = computed(() => Array.from(campsByYear.value.keys()).sort((a, b) => b - a))

const isEmpty = computed(() => years.value.length === 0)

function openYear(year) {
  emit('openYear', { year, camps: campsByYear.value.get(year) ?? [] })
}
</script>

<template>
  <AdminPanel :title="title" :is-empty="isEmpty" :empty-text="emptyText">
    <DashboardCard
      v-for="year in years"
      :key="year"
      :icon="icon"
      :title="String(year)"
      :description="`${(campsByYear.get(year) ?? []).length} camp${
        (campsByYear.get(year) ?? []).length > 1 ? 's' : ''
      }`"
      @click="openYear(year)"
    >
      <template #right>
        <span class="pill">
          {{ (campsByYear.get(year) ?? []).length }}
        </span>
      </template>
    </DashboardCard>
  </AdminPanel>
</template>

<style scoped>
/* petit badge à droite, comme sur ton mock */
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 1.75rem;
  padding: 0 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font-size: var(--fs-caption);
}
</style>
