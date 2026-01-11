<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import RoleDropdown from '@/components/ui/RoleDropdown.vue'
import { membersStore } from '@/stores/members'

const emit = defineEmits(['openUser'])

const roleModel = computed({
  get: () => membersStore.roleFilter.value,
  set: (v) => (membersStore.roleFilter.value = v),
})
const searchModel = computed({
  get: () => membersStore.search.value,
  set: (v) => (membersStore.search.value = v),
})

// tri local
const sortDir = ref('az') // az | za

function toggleSort() {
  sortDir.value = sortDir.value === 'az' ? 'za' : 'az'
}

function userTitle(u) {
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || '(Sans nom)'
}

function roleLabel(u) {
  const roles = u?.role ?? []
  return roles
    .map((r) => {
      if (r === 'admin') return 'Admin'
      if (r === 'parent') return 'Parent'
      if (r === 'accompagnant') return 'Accompagnant'
      if (r === 'enfant') return 'Enfant'
      return r
    })
    .join(', ')
}

const roleOptions = [
  { value: 'all', label: 'Tous les rôles' },
  { value: 'admin', label: 'Admins' },
  { value: 'parent', label: 'Parents' },
  { value: 'accompagnant', label: 'Accompagnants' },
  { value: 'enfant', label: 'Enfants' },
]

// data backend (store)
const users = computed(() => membersStore.users.value ?? [])
const loading = computed(() => membersStore.loading.value)
const error = computed(() => membersStore.error.value)

// fetch initial
onMounted(() => {
  membersStore.fetchUsers().catch(() => {})
})

// debounce fetch quand search/role changent
let t = null
watch([membersStore.search, membersStore.roleFilter], () => {
  if (t) clearTimeout(t)
  t = setTimeout(() => {
    membersStore.fetchUsers().catch(() => {})
  }, 250)
})

// tri local seulement
const filteredUsers = computed(() => {
  const q = (searchModel.value ?? '').trim().toLowerCase()

  let list = Array.isArray(users.value) ? users.value.slice() : []

  // filtre texte (prénom/nom)
  if (q) {
    list = list.filter((u) => {
      const haystack = [u.firstname, u.lastname].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }

  // tri A-Z / Z-A
  return list.sort((a, b) => {
    const an = `${a.lastname ?? ''} ${a.firstname ?? ''}`.trim().toLowerCase()
    const bn = `${b.lastname ?? ''} ${b.firstname ?? ''}`.trim().toLowerCase()
    return sortDir.value === 'az' ? an.localeCompare(bn) : bn.localeCompare(an)
  })
})
</script>

<template>
  <AdminPanel
    title="MEMBRES"
    :is-empty="!loading && filteredUsers.length === 0"
    :empty-text="
      error
        ? 'Erreur lors du chargement des membres'
        : 'Aucun membre ne correspond à votre recherche'
    "
  >
    <!-- TOOLS -->
    <template #tools>
      <div class="tools">
        <input
          v-model="searchModel"
          type="search"
          class="control search"
          placeholder="Rechercher (nom ou prénom...)"
        />

        <div class="row">
          <RoleDropdown v-model="roleModel" :options="roleOptions" />

          <button type="button" class="control btn" @click="toggleSort">
            Nom ({{ sortDir === 'az' ? 'A-Z' : 'Z-A' }})
          </button>
        </div>

        <p v-if="loading" class="hint">Chargement…</p>
        <p v-else-if="error" class="hint error">{{ error.message ?? 'Erreur inconnue' }}</p>
      </div>
    </template>

    <!-- LISTE -->
    <DashboardCard
      v-for="u in filteredUsers"
      :key="u.id"
      icon="profile"
      :title="userTitle(u)"
      :description="roleLabel(u)"
      clickable
      @click="emit('openUser', u)"
    />

    <template #hint> Total : {{ filteredUsers.length }} membre(s) </template>
  </AdminPanel>
</template>

<style scoped>
.tools {
  display: grid;
  gap: var(--sp-2);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

.control {
  height: 44px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  background: var(--c-bg);
  color: inherit;
  font: inherit;
}

.btn {
  cursor: pointer;
  text-align: center;
}
.btn:active {
  opacity: 0.85;
}

.search {
  padding: 0 14px;
}

.hint {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.error {
  opacity: 1;
}
</style>
