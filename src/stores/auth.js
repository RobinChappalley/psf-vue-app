// src/stores/auth.js
import { ref, computed } from 'vue'

const token = ref(null)
const user = ref(null)

// --- MOCK USERS (temporaire) ---
// Alignés sur ton vrai modèle (lastname, phoneNumber, etc.)
const MOCK_USERS = {
  parent: {
    id: '2',
    role: ['parent'],
    parent: null,
    children: ['1'],
    lastname: 'Doe',
    firstname: 'Jane',
    phoneNumber: '+41812345678',
    email: 'jane.doe@example.com',
    address: {
      street: 'Rue Exemple 1',
      city: 'Lausanne',
      postalCode: 1000000,
      country: 'CH',
    },
    camps: [],
    participationInfo: null,
  },

  accompagnant: {
    id: '3',
    role: ['accompagnant'],
    parent: null,
    children: [],
    lastname: 'Doe',
    firstname: 'Paul',
    phoneNumber: '+41876543210',
    email: 'paul.doe@example.com',
    address: null,
    camps: [],
    participationInfo: null,
  },

  admin: {
    id: '4',
    role: ['admin'],
    parent: null,
    children: ['1', '5'],
    lastname: 'Chappalley',
    firstname: 'Robin',
    phoneNumber: null,
    email: 'robin@chapi.ch',
    address: null,
    camps: [],
    participationInfo: null,
  },
}

const isAuthenticated = computed(() => !!token.value && !!user.value)

function hasAnyRole(roles) {
  const current = user.value?.role || []
  return roles.some((r) => current.includes(r))
}

/**
 * TEMP: simuler une connexion sans backend
 * role: "parent" | "accompagnant" | "admin"
 */
function mockLogin(role = 'parent') {
  user.value = MOCK_USERS[role] || MOCK_USERS.parent
  token.value = 'mock-jwt-token'
}

/** Déconnexion */
function logout() {
  user.value = null
  token.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const authStore = {
  token,
  user,
  isAuthenticated,
  hasAnyRole,
  mockLogin,
  logout,
}
