<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const emit = defineEmits(['openUser'])

const users = computed(() => authStore.allUsers.value ?? [])
const filteredUsers = computed(() => users.value) // simplifié ici

function userTitle(u) {
  return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim()
}
function roleLabel(u) {
  return (u.role ?? []).join(', ')
}
</script>

<template>
  <AdminPanel title="MEMBRES" :is-empty="filteredUsers.length === 0" empty-text="Aucun membre">
    <DashboardCard
      v-for="u in filteredUsers"
      :key="u.id"
      icon="profile"
      :title="userTitle(u)"
      :description="roleLabel(u)"
      clickable
      @click="emit('openUser', u)"
    />
  </AdminPanel>
</template>
