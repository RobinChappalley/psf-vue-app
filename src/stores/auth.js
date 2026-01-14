// src/stores/auth.js
// Authentification : login, logout, signup
// Le token est géré via cookie HttpOnly (non accessible en JS)

import { ref, computed } from 'vue'
import { apiFetch } from '@/services/apiFetch'
import { getUserId, normalizeUser } from './_helpers'

/* ======================================================
   STATE
====================================================== */
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

// L'authentification est basée sur la présence du user
// Le token est dans un cookie HttpOnly (non accessible en JS)
const isAuthenticated = computed(() => !!user.value)

/* ======================================================
   PERSISTENCE
====================================================== */
function persistUser() {
  if (user.value) {
    localStorage.setItem('user', JSON.stringify(user.value))
  } else {
    localStorage.removeItem('user')
  }
}

/* ======================================================
   ACTIONS
====================================================== */

/**
 * Connexion utilisateur
 * Le token est automatiquement stocké dans un cookie par le backend
 */
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password },
  })

  user.value = normalizeUser(data.user)
  persistUser()

  return user.value
}

/**
 * Inscription d'un nouveau compte parent
 * Le token est automatiquement stocké dans un cookie par le backend
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

  if (data.user) {
    user.value = normalizeUser(data.user)
    persistUser()
  }

  return data
}

/**
 * Déconnexion - appelle le backend pour supprimer le cookie
 * Note: Les autres stores doivent être reset par le composant appelant
 * ou via un watcher dans App.vue
 */
async function logout() {
  try {
    // Appel API pour supprimer le cookie côté serveur
    await apiFetch('/logout', { method: 'POST' })
  } catch (e) {
    // Ignorer les erreurs de logout (ex: déjà déconnecté)
  }

  // Reset auth state uniquement
  user.value = null
  localStorage.removeItem('user')
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
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
  user,
  isAuthenticated,

  // Actions
  login,
  logout,
  signup,
  hasAnyRole,

  // Helpers (réexportés pour compatibilité)
  getUserId,
  persistUser,
}
