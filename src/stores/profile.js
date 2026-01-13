// src/stores/profile.js
// Gestion du profil de l'utilisateur connecté

import { apiFetch } from '@/services/apiFetch'
import { updateUser as updateUserFromUsersApi } from '@/services/usersApi'
import { getUserId, normalizeUser } from './_helpers'

// Import différé pour éviter la dépendance circulaire
let _authStore = null
function getAuthStore() {
  if (!_authStore) {
    _authStore = require('./auth').authStore
  }
  return _authStore
}

/**
 * Persiste l'utilisateur dans localStorage
 */
function persistUser(user) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  } else {
    localStorage.removeItem('user')
  }
}

/**
 * Rafraîchit le profil depuis l'API
 */
async function refreshMe() {
  const auth = getAuthStore()
  const myId = getUserId(auth.user.value)
  if (!myId) return null

  const fresh = await apiFetch(`/users/${myId}`, { method: 'GET' })
  auth.user.value = normalizeUser(fresh?.user ?? fresh)
  persistUser(auth.user.value)

  return auth.user.value
}

/**
 * Met à jour le profil de l'utilisateur connecté
 * @param {Object} payload - Champs à modifier
 */
async function updateMe(payload) {
  const auth = getAuthStore()
  const myId = getUserId(auth.user.value)
  if (!myId) throw new Error('Not authenticated')

  await updateUserFromUsersApi(myId, payload)
  await refreshMe()

  return auth.user.value
}

/**
 * Met à jour un utilisateur par son ID
 * Si c'est l'utilisateur connecté, rafraîchit aussi le profil local
 * @param {string} id - ID de l'utilisateur
 * @param {Object} payload - Champs à modifier
 */
async function updateUserById(id, payload) {
  if (!id) throw new Error('Missing user id')

  const updated = await updateUserFromUsersApi(id, payload)

  const auth = getAuthStore()
  const myId = getUserId(auth.user.value)
  if (myId && String(myId) === String(id)) {
    await refreshMe()
    return auth.user.value
  }

  return updated
}

export const profileStore = {
  // Fonctions
  refreshMe,
  updateMe,
  updateUserById,
  persistUser,
}
