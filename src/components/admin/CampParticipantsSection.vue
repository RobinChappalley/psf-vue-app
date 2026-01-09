<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'

import AdminPanel from '@/components/admin/AdminPanel.vue'
import PaymentChips from '@/components/ui/PaymentChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const props = defineProps({
  camp: { type: Object, required: true },
})

const filter = ref('all') // 'all' | 'paid' | 'pending'

const campId = computed(() => String(props.camp?.id ?? ''))

// 1) tous les users inscrits à CE camp
const campUsers = computed(() => {
  if (!campId.value) return []
  const all = authStore.allUsers.value ?? []
  return all.filter((u) => Array.isArray(u.camps) && u.camps.includes(campId.value))
})

// 2) filtrage paiement
const visibleUsers = computed(() => {
  if (filter.value === 'paid') {
    return campUsers.value.filter((u) => u.participationInfo?.hasPaid === true)
  }
  if (filter.value === 'pending') {
    return campUsers.value.filter((u) => u.participationInfo?.hasPaid !== true)
  }

  return campUsers.value
})
</script>

<template>
  <AdminPanel
    title="INSCRIPTIONS AU CAMP"
    :is-empty="visibleUsers.length === 0"
    empty-text="Aucune inscription pour le moment"
  >
    <!-- Barre Tout / Payé / En attente -->
    <template #tools>
      <PaymentChips v-model="filter" />
    </template>

    <!-- Liste des personnes -->
    <template v-if="visibleUsers.length">
      <DashboardCard
        v-for="u in visibleUsers"
        :key="u.id"
        icon="profile"
        :title="`${u.firstname} ${u.lastname}`.toUpperCase()"
        :description="u.participationInfo?.hasPaid ? '' : ''"
        :clickable="false"
      >
        <template #right>
          <span class="pill" :class="u.participationInfo?.hasPaid === true ? 'paid' : 'pending'">
            {{ u.participationInfo?.hasPaid === true ? 'A payé' : 'en attente' }}
          </span>
        </template>
      </DashboardCard>
    </template>
  </AdminPanel>
</template>
<style scoped>
.pill {
  font-size: var(--fs-caption);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
  line-height: 1;
}

.pill.paid {
  background: #efe7ea;
  color: rgba(0, 0, 0, 0.75);
}

.pill.pending {
  background: #b44b2a;
  color: white;
}
</style>
