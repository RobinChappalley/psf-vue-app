// src/stores/responsibles.js
// Gestion des utilisateurs admin et accompagnants (responsables)

import { ref, computed } from 'vue'
import {
  getAdminUsers as getAdminUsersApi,
  getUsers as getUsersApi,
} from '@/services/usersApi'
import { normalizeUser } from './_helpers'

// Import différé pour éviter la dépendance circulaire
let _authStore = null
function getAuthStore() {
  if (!_authStore) {
    _authStore = require('./auth').authStore
  }
  return _authStore
}

/* ======================================================
   STATE
====================================================== */
const adminUsersObjects = ref([])
const adminUsers = computed(() => adminUsersObjects.value)

const responsibleUsersObjects = ref([])
const responsibleUsers = computed(() => responsibleUsersObjects.value)

/* ======================================================
   ACTIONS
====================================================== */

/**
 * Récupère les utilisateurs admin
 */
async function fetchAdminUsers() {
  const auth = getAuthStore()
  if (!auth.token.value) {
    adminUsersObjects.value = []
    return []
  }

  const res = await getAdminUsersApi()
  const raw = res?.users ?? res?.data ?? res
  const arr = Array.isArray(raw) ? raw : []

  adminUsersObjects.value = arr.map(normalizeUser)
  return adminUsersObjects.value
}

/**
 * Récupère les responsables (admins + accompagnants)
 * Fusionne et dédoublonne les résultats
 */
async function fetchResponsibleUsers() {
  const auth = getAuthStore()
  if (!auth.token.value) {
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

  // Merge + normalize + dédoublonnage par ID
  const map = new Map()
  ;[...admins, ...accompagnants].map(normalizeUser).forEach((u) => {
    const id = u?.id ?? u?._id
    if (id) map.set(String(id), u)
  })

  responsibleUsersObjects.value = [...map.values()]

  // Garde adminUsers synchronisé
  adminUsersObjects.value = admins.map(normalizeUser)

  return responsibleUsersObjects.value
}

/**
 * Réinitialise le store (appelé au logout)
 */
function reset() {
  adminUsersObjects.value = []
  responsibleUsersObjects.value = []
}

/* ======================================================
   EXPORT
====================================================== */
export const responsiblesStore = {
  // State
  adminUsers,
  adminUsersObjects,
  responsibleUsers,
  responsibleUsersObjects,

  // Actions
  fetchAdminUsers,
  fetchResponsibleUsers,
  reset,
}
