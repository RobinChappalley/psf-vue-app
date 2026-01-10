<script setup>
import { computed, ref, watch } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import PaymentChips from '@/components/ui/PaymentChips.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import { getUsers } from '@/services/usersApi'

const props = defineProps({
  camp: { type: Object, required: true },
})

const emit = defineEmits(['openUser'])

const filter = ref('all') // 'all' | 'paid' | 'pending'
const loading = ref(false)
const error = ref(null)
const users = ref([])

const campId = computed(() => String(props.camp?.id ?? ''))

const hasPaidParam = computed(() => {
  if (filter.value === 'paid') return true
  if (filter.value === 'pending') return false
  return null
})

async function fetchUsers() {
  if (!campId.value) {
    users.value = []
    console.log('campId', campId.value, 'filter', filter.value, 'hasPaidParam', hasPaidParam.value)

    return
  }

  loading.value = true
  error.value = null

  try {
    users.value = await getUsers({
      campId: campId.value,
      hasPaid: hasPaidParam.value, // true | false | null
    })
  } catch (e) {
    console.error('FETCH CAMP USERS ERROR:', e)
    error.value = e
    users.value = []
  } finally {
    loading.value = false
  }
  console.log(
    'hasPaid fields:',
    users.value.map((u) => ({
      id: u.id,
      hasPaid: u.hasPaid,
      participationHasPaid: u.participationInfo?.hasPaid,
      type: typeof u.hasPaid,
    })),
  )
}

watch(
  () => [campId.value, filter.value],
  () => fetchUsers(),
  { immediate: true },
)

const visibleUsers = computed(() => users.value ?? [])

function openUser(u) {
  emit('openUser', u)
}
</script>

<template>
  <AdminPanel
    title="INSCRIPTIONS AU CAMP"
    :is-empty="!loading && visibleUsers.length === 0"
    empty-text="Aucune inscription pour le moment"
  >
    <template #tools>
      <PaymentChips v-model="filter" />
    </template>

    <template v-if="loading">
      <p class="hint">Chargement…</p>
    </template>

    <template v-else-if="error">
      <p class="hint">Erreur lors du chargement des inscriptions.</p>
    </template>

    <template v-else-if="visibleUsers.length">
      <DashboardCard
        v-for="u in visibleUsers"
        :key="u.id"
        icon="profile"
        :title="`${u.firstname} ${u.lastname}`.toUpperCase()"
        :clickable="true"
        @click="openUser(u)"
      >
        <template #right>
          <span class="pill" :class="u.hasPaid === true ? 'paid' : 'pending'">
            {{ u.hasPaid === true ? 'A payé' : 'en attente' }}
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
  background: var(--c-border);
  color: var(--c-text);
}

.pill.pending {
  background: var(--c-primary);
  color: var(--c-bg);
}
</style>
