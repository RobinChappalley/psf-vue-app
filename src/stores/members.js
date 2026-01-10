import { ref, computed } from 'vue'
import { getUsers, updateUser, deleteUser } from '@/services/usersApi'

const usersObjects = ref([])
const loading = ref(false)
const error = ref(null)

const roleFilter = ref('all') // 'all' | 'enfant' | 'parent' | 'accompagnant' | 'admin'
const paidFilter = ref('all') // 'all' | 'paid' | 'unpaid'
const search = ref('')

const users = computed(() => usersObjects.value)

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const role = roleFilter.value === 'all' ? null : roleFilter.value
    const hasPaid =
      paidFilter.value === 'paid' ? true : paidFilter.value === 'unpaid' ? false : null

    const list = await getUsers({ role, search: search.value || null })
    usersObjects.value = list
    return list
  } catch (e) {
    error.value = e
    throw e
  } finally {
    loading.value = false
  }
}

async function updateUserById(id, patch) {
  const updated = await updateUser(id, patch)
  usersObjects.value = usersObjects.value.map((u) => (String(u.id) === String(id) ? updated : u))
  return updated
}

async function deleteUserById(id) {
  await deleteUser(id)
  usersObjects.value = usersObjects.value.filter((u) => String(u.id) !== String(id))
}

export const membersStore = {
  users,
  usersObjects,
  loading,
  error,
  roleFilter,
  paidFilter,
  search,
  fetchUsers,
  updateUserById,
  deleteUserById,
}
