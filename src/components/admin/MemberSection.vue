<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import RoleDropdown from '@/components/ui/RoleDropdown.vue'

const emit = defineEmits(['openUser'])

// --- state UI ---
const search = ref('')
const selectedRole = ref('all') // all | admin | parent | accompagnant | child
const sortDir = ref('az') // az | za

// --- data ---
const users = computed(() => authStore.allUsers.value ?? [])

function userTitle(u) {
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || '(Sans nom)'
}

function roleLabel(u) {
  const roles = u?.role ?? []
  // affichage plus joli (optionnel)
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

const roleOptions = [
  { value: 'all', label: 'Tous les rôles' },
  { value: 'admin', label: 'Admins' },
  { value: 'parent', label: 'Parents' },
  { value: 'accompagnant', label: 'Accompagnants' },
  { value: 'child', label: 'Enfants' },
]

// --- filtering + sorting ---
const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  const role = selectedRole.value

  // 1) filtre texte + rôle
  let list = users.value.filter((u) => {
    const roles = u?.role ?? []
    const matchRole = role === 'all' ? true : roles.includes(role)

    const haystack = [u.firstname, u.lastname].filter(Boolean).join(' ').toLowerCase()

    const matchSearch = !q ? true : haystack.includes(q)
    return matchRole && matchSearch
  })

  // 2) tri A-Z / Z-A
  list = list.slice().sort((a, b) => {
    const an = `${a.lastname ?? ''} ${a.firstname ?? ''}`.trim().toLowerCase()
    const bn = `${b.lastname ?? ''} ${b.firstname ?? ''}`.trim().toLowerCase()
    return sortDir.value === 'az' ? an.localeCompare(bn) : bn.localeCompare(an)
  })

  return list
})
</script>

<template>
  <AdminPanel
    title="MEMBRES"
    :is-empty="filteredUsers.length === 0"
    empty-text="Aucun membre ne correspond à votre recherche"
  >
    <!-- TOOLS -->
    <template #tools>
      <div class="tools">
        <input
          v-model="search"
          type="search"
          class="control search"
          placeholder="Rechercher (nom ou prénom...)"
        />

        <div class="row">
          <RoleDropdown v-model="selectedRole" :options="roleOptions" />

          <button
            type="button"
            class="control btn"
            @click="sortDir = sortDir === 'az' ? 'za' : 'az'"
          >
            Nom ({{ sortDir === 'az' ? 'A-Z' : 'Z-A' }})
          </button>
        </div>
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

    <!-- HINT (optionnel) -->
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
  grid-template-columns: 1fr 1fr; /* 2 champs égaux */
  gap: var(--sp-2);
}

/* Style commun (select + button + search) */
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

/* Bouton tri */
.btn {
  cursor: pointer;
  text-align: center;
}
.btn:active {
  opacity: 0.85;
}

/* Search (si tu la gardes) */
.search {
  padding: 0 14px;
}

/* Select custom chevron */
.select-wrap {
  position: relative;
}

.select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 42px; /* place pour le chevron */
}

/* Chevron en CSS */
.select-wrap::after {
  content: '';
  position: absolute;
  right: 16px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-60%) rotate(45deg);
  pointer-events: none;
  opacity: 0.65;
}

.search,
.select,
.sort {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  background: var(--c-bg);
  color: inherit;
}

.sort {
  cursor: pointer;
  text-align: center;
}

.sort:active {
  opacity: 0.85;
}
</style>
