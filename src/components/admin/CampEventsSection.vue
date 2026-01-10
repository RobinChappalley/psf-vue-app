<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import EventIconChips from '@/components/ui/EventIconChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  campTitle: { type: String, default: '' },
  trainings: { type: Array, default: () => [] },

  // v1: uniquement all + training activés
  enabledFilters: { type: Array, default: () => ['all', 'training'] },
})

const emit = defineEmits(['create', 'openTraining'])

const filter = ref('all')

const isEmpty = computed(() => (props.trainings?.length ?? 0) === 0)

const visibleTrainings = computed(() => {
  // prêt pour v2
  if (filter.value === 'all' || filter.value === 'training') return props.trainings
  return []
})
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
          v-for="t in visibleTrainings"
          :key="t.number"
          icon="boots"
          :title="`ENTRAINEMENT`"
          :description="t.meetingPoint"
          asButton
          @click="$emit('openTraining', t)"
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
