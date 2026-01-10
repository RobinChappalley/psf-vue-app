// src/stores/auth.js
import { ref, computed } from 'vue'
import { apiFetch } from '@/services/apiFetch'
import { getChildrenByParent, createChildApi, updateUserApi } from '@/services/children'
import { updateUser as updateUserFromUsersApi } from '@/services/usersApi'

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

function persistAuth() {
  if (token.value) localStorage.setItem('token', token.value)
  else localStorage.removeItem('token')

  if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
  else localStorage.removeItem('user')
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
  persistAuth()

  return user.value
}

function logout() {
  user.value = null
  token.value = null
  persistAuth()
}

function hasAnyRole(roles) {
  const current = user.value?.role || []
  return roles.some((r) => current.includes(r))
}

/* ======================================================
   ME (profil connecté)
====================================================== */
async function refreshMe() {
  const myId = getUserId(user.value)
  if (!myId) return null

  const fresh = await apiFetch(`/users/${myId}`, { method: 'GET' })
  // selon backend: {user: {...}} ou directement l'objet
  user.value = fresh?.user ?? fresh
  persistAuth()

  return user.value
}

/**
 * ✅ Update du profil de l'utilisateur connecté
 * payload = patch (champs modifiés uniquement)
 */
async function updateMe(payload) {
  const myId = getUserId(user.value)
  if (!myId) throw new Error('Not authenticated')

  // Tu peux utiliser usersApi.updateUser (PUT /users/:id)
  await updateUserFromUsersApi(myId, payload)

  // Source de vérité => on resync depuis le backend
  await refreshMe()

  return user.value
}

/**
 * ✅ Update d'un user par id (utile pour enfants/admin)
 * Retourne l'user updated (et refreshMe si c'est "moi")
 */
async function updateUserById(id, payload) {
  if (!id) throw new Error('Missing user id')

  // Tu peux choisir l'une des deux selon ton code existant :
  // - updateUserFromUsersApi (usersApi.js)
  // - updateUserApi (services/children) si ça pointe sur le même endpoint
  const updated = await updateUserFromUsersApi(id, payload)

  const myId = getUserId(user.value)
  if (myId && String(myId) === String(id)) {
    await refreshMe()
    return user.value
  }

  return updated
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

  const created = await createChildApi(payload)
  await fetchChildren(parentId)

  return created
}

// Update enfant (PUT /users/:id)
async function updateChild(childPayload) {
  const id = getUserId(childPayload)
  if (!id) throw new Error('Missing child id')

  // childPayload peut être un patch (recommandé)
  const payload = { ...childPayload }
  delete payload.id
  delete payload._id

  // Ici tu utilisais updateUserApi depuis services/children.
  // Si ça fait bien PUT /users/:id, c'est OK.
  const updated = await updateUserApi(id, payload)

  const pid = getUserId(user.value)
  if (pid) await fetchChildren(pid)

  return updated
}

/* ======================================================
   ADMIN / MOCKS (inchangés, provisoires)
====================================================== */
// ⚠️ Garde si tu as encore des mocks ailleurs.
// Ces variables doivent exister quelque part, sinon supprime ce bloc.
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

  // me
  refreshMe,
  updateMe,
  updateUserById,

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
