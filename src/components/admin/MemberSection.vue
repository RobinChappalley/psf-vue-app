<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const emit = defineEmits(['openUser'])

const search = ref('')
const roleFilter = ref('all') // all | admin | parent | accompagnant | child

const roleOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'admin', label: 'Admins' },
  { value: 'parent', label: 'Parents' },
  { value: 'accompagnant', label: 'Accompagnants' },
  { value: 'child', label: 'Enfants' },
]

function roleLabel(user) {
  const roles = user?.role ?? []
  // si plusieurs rôles un jour, on les affiche joliment
  return roles
    .map((r) => {
      if (r === 'admin') return 'Admin'
      if (r === 'parent') return 'Parent'
      if (r === 'accompagnant') return 'Accompagnant'
      if (r === 'child') return 'Enfant'
      return r
    })
    .join(', ')
}

function userTitle(user) {
  return `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || '(Sans nom)'
}

function userIcon(user) {
  // adapte aux icônes que tu as dans AppIcone
  if (user?.role?.includes('admin')) return 'shield' // ou 'userCog'
  if (user?.role?.includes('child')) return 'child' // ou 'user'
  return 'user'
}

const users = computed(() => authStore.allUsers.value ?? [])

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()

  return users.value.filter((u) => {
    const roles = u.role ?? []
    const matchesRole = roleFilter.value === 'all' ? true : roles.includes(roleFilter.value)

    const haystack = [u.firstname, u.lastname, u.email, u.phoneNumber, roleLabel(u), u.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = !q ? true : haystack.includes(q)
    return matchesRole && matchesSearch
  })
})

const isEmpty = computed(() => filteredUsers.value.length === 0)
</script>

<template>
  <AdminPanel
    title="MEMBRES"
    :is-empty="isEmpty"
    empty-text="Aucun membre ne correspond à votre recherche"
  >
    <!-- TOOLS: recherche + filtre -->
    <template #tools>
      <div class="tools-row">
        <input
          v-model="search"
          type="search"
          class="search"
          placeholder="Rechercher (nom, email, tél, rôle...)"
        />

        <select v-model="roleFilter" class="select">
          <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
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
    >
    </DashboardCard>

    <!-- HINT -->
    <template #hint> Total : {{ filteredUsers.length }} membre(s) </template>
  </AdminPanel>
</template>

<style scoped>
.tools-row {
  display: grid;
  grid-template-columns: 1fr 160px;
  gap: var(--sp-2);
}

.search,
.select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  background: var(--c-bg);
}

.meta {
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
  white-space: nowrap;
}
</style>
