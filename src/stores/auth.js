// src/stores/auth.js
import { ref, computed } from 'vue'
import { apiFetch } from '@/services/apiFetch'
import { getChildrenByParent, createChildApi, updateUserApi } from '@/services/children'
import {
  updateUser as updateUserFromUsersApi,
  getAdminUsers as getAdminUsersApi,
  getUsers as getUsersApi,
} from '@/services/usersApi'

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

function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u
  return {
    ...u,
    id: u.id ?? u._id,
  }
}

/* ======================================================
   LOGIN / LOGOUT / SIGNUP
====================================================== */
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password },
  })

  token.value = data.token
  user.value = normalizeUser(data.user)
  persistAuth()

  //charge admins + accompagnants (responsables possibles)
  await fetchResponsibleUsers().catch(() => {})

  return user.value
}

/**
 * Inscription d'un nouveau compte parent
 * Après inscription, l'utilisateur est automatiquement connecté
 */
async function signup(userData) {
  // Force le rôle parent pour les inscriptions publiques
  const payload = {
    ...userData,
    role: ['parent'],
  }

  const data = await apiFetch('/signup', {
    method: 'POST',
    body: payload,
  })

  // Si le backend retourne un token, on connecte automatiquement
  if (data.token) {
    token.value = data.token
    user.value = normalizeUser(data.user)
    persistAuth()
    await fetchResponsibleUsers().catch(() => {})
  }

  return data
}

function logout() {
  user.value = null
  token.value = null

  // localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  // reset caches
  adminUsersObjects.value = []
  responsibleUsersObjects.value = []
  allUsersObjects.value = []
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
  user.value = normalizeUser(fresh?.user ?? fresh)
  persistAuth()

  return user.value
}

/**
 * Update du profil de l'utilisateur connecté
 * payload = patch (champs modifiés uniquement)
 */
async function updateMe(payload) {
  const myId = getUserId(user.value)
  if (!myId) throw new Error('Not authenticated')

  await updateUserFromUsersApi(myId, payload)
  await refreshMe()

  return user.value
}

/**
 * Update d'un user par id (utile pour enfants/admin)
 * Retourne l'user updated (et refreshMe si c'est "moi")
 */
async function updateUserById(id, payload) {
  if (!id) throw new Error('Missing user id')

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

// SOURCE DE VÉRITÉ
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
    parent: parentId,
    role: ['enfant'],
  }

  delete payload.parentId

  const created = await createChildApi(payload)
  await fetchChildren(parentId)

  return created
}

// Update enfant (PUT /users/:id)
async function updateChild(childPayload) {
  const id = getUserId(childPayload)
  if (!id) throw new Error('Missing child id')

  const payload = { ...childPayload }
  delete payload.id
  delete payload._id

  const updated = await updateUserApi(id, payload)

  const pid = getUserId(user.value)
  if (pid) await fetchChildren(pid)

  return updated
}

/* ======================================================
   ADMIN / RESPONSABLES (BACKEND)
====================================================== */

const adminUsersObjects = ref([])
const adminUsers = computed(() => adminUsersObjects.value)

async function fetchAdminUsers() {
  if (!token.value) {
    adminUsersObjects.value = []
    return []
  }

  const res = await getAdminUsersApi()
  const raw = res?.users ?? res?.data ?? res
  const arr = Array.isArray(raw) ? raw : []

  adminUsersObjects.value = arr.map(normalizeUser)
  return adminUsersObjects.value
}

const responsibleUsersObjects = ref([])
const responsibleUsers = computed(() => responsibleUsersObjects.value)

async function fetchResponsibleUsers() {
  if (!token.value) {
    responsibleUsersObjects.value = []
    return []
  }

  // 2 requêtes en parallèle
  const [adminsRes, accompagnantsRes] = await Promise.all([
    getAdminUsersApi(),
    getUsersApi({ role: 'accompagnant' }),
  ])

  const adminsRaw = adminsRes?.users ?? adminsRes?.data ?? adminsRes
  const admins = Array.isArray(adminsRaw) ? adminsRaw : []

  const accompagnants = Array.isArray(accompagnantsRes) ? accompagnantsRes : []

  // merge + normalize + dédoublonnage
  const map = new Map()
  ;[...admins, ...accompagnants].map(normalizeUser).forEach((u) => {
    const id = u?.id ?? u?._id
    if (id) map.set(String(id), u)
  })

  responsibleUsersObjects.value = [...map.values()]

  // (optionnel) garde adminUsers synchronisé
  adminUsersObjects.value = admins.map(normalizeUser)

  return responsibleUsersObjects.value
}

/* ======================================================
   (Optionnel) allUsers si tu en as besoin plus tard
====================================================== */
const allUsersObjects = ref([])
const allUsers = computed(() => allUsersObjects.value)

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
  signup,
  hasAnyRole,

  // helpers
  getUserId,

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

  // admin (API)
  adminUsers,
  adminUsersObjects,
  fetchAdminUsers,

  // responsables (admins + accompagnants)
  responsibleUsers,
  responsibleUsersObjects,
  fetchResponsibleUsers,

  // all users (placeholder)
  allUsers,
  allUsersObjects,
}
