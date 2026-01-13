// src/stores/auth.js
// Authentification : token, login, logout, signup

import { ref, computed } from 'vue'
import { apiFetch } from '@/services/apiFetch'
import { getUserId, normalizeUser } from './_helpers'

/* ======================================================
   STATE
====================================================== */
const token = ref(localStorage.getItem('token'))
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

const isAuthenticated = computed(() => !!token.value && !!user.value)

/* ======================================================
   PERSISTENCE
====================================================== */
function persistAuth() {
  if (token.value) localStorage.setItem('token', token.value)
  else localStorage.removeItem('token')

  if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
  else localStorage.removeItem('user')
}

/* ======================================================
   ACTIONS
====================================================== */

/**
 * Connexion utilisateur
 * @param {string} email
 * @param {string} password
 */
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password },
  })

  token.value = data.token
  user.value = normalizeUser(data.user)
  persistAuth()

  return user.value
}

/**
 * Inscription d'un nouveau compte parent
 * @param {Object} userData - Données utilisateur
 */
async function signup(userData) {
  const payload = {
    ...userData,
    role: ['parent'],
  }

  const data = await apiFetch('/signup', {
    method: 'POST',
    body: payload,
  })

  if (data.token) {
    token.value = data.token
    user.value = normalizeUser(data.user)
    persistAuth()
  }

  return data
}

/**
 * Déconnexion - reset tous les stores
 */
function logout() {
  // Reset auth state
  user.value = null
  token.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  // Reset autres stores (import dynamique pour éviter dépendance circulaire)
  const { childrenStore } = require('./childrenStore')
  const { responsiblesStore } = require('./responsibles')
  childrenStore.reset()
  responsiblesStore.reset()
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
 * @param {string[]} roles - Rôles à vérifier
 */
function hasAnyRole(roles) {
  const current = user.value?.role || []
  return roles.some((r) => current.includes(r))
}

/* ======================================================
   EXPORT
====================================================== */
export const authStore = {
  // State
  token,
  user,
  isAuthenticated,

  // Actions
  login,
  logout,
  signup,
  hasAnyRole,

  // Helpers (réexportés pour compatibilité)
  getUserId,
  persistAuth,
}
