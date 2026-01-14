// src/stores/responsibles.js
// Gestion des utilisateurs admin et accompagnants (responsables)
// DÉCOUPLÉ de auth.js - pas de dépendance circulaire

import { ref, computed } from 'vue'
import {
  getAdminUsers as getAdminUsersApi,
  getUsers as getUsersApi,
} from '@/services/usersApi'
import { normalizeUser } from './_helpers'

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
 * Note: L'authentification est gérée via cookie HttpOnly
 * Si non authentifié, l'API retournera 401
 */
async function fetchAdminUsers() {
  try {
    const res = await getAdminUsersApi()
    const raw = res?.users ?? res?.data ?? res
    const arr = Array.isArray(raw) ? raw : []

    adminUsersObjects.value = arr.map(normalizeUser)
    return adminUsersObjects.value
  } catch (e) {
    // Si 401 ou autre erreur, on retourne un tableau vide
    console.warn('fetchAdminUsers failed:', e.message)
    adminUsersObjects.value = []
    return []
  }
}

/**
 * Récupère les responsables (admins + accompagnants)
 * Fusionne et dédoublonne les résultats
 */
async function fetchResponsibleUsers() {
  try {
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
  } catch (e) {
    // Si 401 ou autre erreur, on retourne un tableau vide
    console.warn('fetchResponsibleUsers failed:', e.message)
    responsibleUsersObjects.value = []
    return []
  }
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
