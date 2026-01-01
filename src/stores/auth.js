// src/stores/auth.js
import { ref, computed } from 'vue'

const token = ref(null)
const user = ref(null)

// --- MOCK USERS (temporaire) ---
const MOCK_USERS = {
  parent: {
    id: '2',
    role: ['parent'],
    parentId: null,
    children: [1],
    name: 'Doe',
    firstname: 'Jane',
    'phone-number': '+41812345678',
    email: 'pauldoe@example.com',
  },
  accompagnant: {
    id: '3',
    role: ['accompagnant'],
    parentId: null,
    children: [],
    name: 'Doe',
    firstname: 'Paul',
    email: 'aosdfj@gmail.com',
  },
  admin: {
    id: '4',
    role: ['admin'],
    parentId: null,
    children: [1, 5],
    name: 'Chappalley',
    firstname: 'Robin',
    email: null,
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
}

export const authStore = {
  token,
  user,
  isAuthenticated,
  hasAnyRole,
  mockLogin,
  logout,
}
