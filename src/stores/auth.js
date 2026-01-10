import { apiFetch } from '@/services/apiFetch'
import { getChildrenByParent, createChildApi, updateUserApi } from '@/services/children'
import { ref, computed } from 'vue'

/* ======================================================
   AUTH STATE
====================================================== */
const token = ref(localStorage.getItem('token'))
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

const isAuthenticated = computed(() => !!token.value && !!user.value)

/* ======================================================
   HELPERS
====================================================== */
function getUserId(u) {
  return u?.id ?? u?._id ?? null
}

/* ======================================================
   LOGIN / LOGOUT
====================================================== */
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password },
  })

  token.value = data.token
  user.value = data.user

  localStorage.setItem('token', token.value)
  localStorage.setItem('user', JSON.stringify(user.value))

  return data.user
}

function logout() {
  user.value = null
  token.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function hasAnyRole(roles) {
  const current = user.value?.role || []
  return roles.some((r) => current.includes(r))
}

/* ======================================================
   ENFANTS (API RÉELLE)
====================================================== */

// ✅ SOURCE DE VÉRITÉ
const childrenObjects = ref([])

// Getter pratique (à utiliser partout)
const children = computed(() => childrenObjects.value)

// Récupérer les enfants du parent connecté
async function fetchChildren(parentId = null) {
  const pid = parentId ?? getUserId(user.value)
  if (!pid) throw new Error('Missing parentId')

  const res = await getChildrenByParent(pid)
  childrenObjects.value = Array.isArray(res) ? res : (res?.data ?? [])
  return childrenObjects.value
}

// Modèle vide pour le formulaire
function createEmptyChild(parentId) {
  return {
    firstname: '',
    lastname: '',
    role: ['enfant'],
    parent: parentId ?? null,
    participationInfo: {},
    address: {},
  }
}

// Création d’un enfant (POST /users)
async function createChild(childPayload) {
  if (!user.value) throw new Error('Not authenticated')

  const parentId = getUserId(user.value)
  if (!parentId) throw new Error('Missing parent id')

  const firstname = String(childPayload?.firstname ?? '').trim()
  const lastname = String(childPayload?.lastname ?? '').trim()

  if (!firstname || !lastname) {
    throw new Error('Prénom et nom sont obligatoires.')
  }

  const payload = {
    ...childPayload,
    firstname,
    lastname,
    parent: parentId, // ✅ on envoie bien "parent"
    role: ['enfant'],
  }

  // ✅ si le form envoie "parentId", on le vire (mais on garde parent)
  delete payload.parentId

  console.log('CREATE CHILD payload sent:', payload) // ✅ avant l’appel

  const created = await createChildApi(payload)
  await fetchChildren(parentId)

  return created
}

// Update enfant (PUT /users/:id)
async function updateChild(childPayload) {
  const id = getUserId(childPayload)
  if (!id) throw new Error('Missing child id')

  const payload = childPayload
  const updated = await updateUserApi(id, payload)

  const pid = getUserId(user.value)
  if (pid) await fetchChildren(pid)

  return updated
}

/* ======================================================
   ADMIN / MOCKS (inchangés, provisoires)
====================================================== */
// ⚠️ Tu peux garder ces parties tant que l’admin n’est pas migré

const adminUsers = computed(() => {
  return Object.values(MOCK_USERS || {}).filter((u) => u.role?.includes('admin'))
})

const allUsers = computed(() => {
  const adults = Object.values(MOCK_USERS || {})
  const kids = Object.values(MOCK_CHILDREN || {})
  return [...adults, ...kids]
})

/* ======================================================
   EXPORT
====================================================== */
export const authStore = {
  // auth
  token,
  user,
  isAuthenticated,
  login,
  logout,
  hasAnyRole,

  // enfants (API)
  children,
  childrenObjects,
  fetchChildren,
  createEmptyChild,
  createChild,
  updateChild,

  // admin / mocks
  adminUsers,
  allUsers,
}
