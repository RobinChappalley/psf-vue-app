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
    camps: ['1'],
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
    camps: ['1'],
    participationInfo: null,
  },
}

const MOCK_CHILDREN = {
  1: {
    id: '1',
    role: ['child'],
    parent: '2',
    children: [],
    lastname: 'Doe',
    firstname: 'Jimmy',
    email: null,
    phoneNumber: null,
    address: null,
    camps: ['1'],
    participationInfo: {
      birthDate: '2014-05-02',
      tshirtInfo: { size: 'm', gender: 'm' },
      allergies: [],
      medication: [],
      insuranceNumber: '',
      insuranceName: '',
      idExpireDate: '',
      publicTransportPass: '',
      isCASMember: false,
      isHelicopterInsured: false,
      hasPhotoConsent: false,
      hasPaid: true,
    },
  },
  5: {
    id: '5',
    role: ['child'],
    parent: '4',
    children: [],
    lastname: 'Chappalley',
    firstname: 'Léa',
    email: null,
    phoneNumber: null,
    address: null,
    camps: [1],
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

//ENFANTS
// ✅ liste d’objets enfants correspondant à user.children (ids)
const childrenObjects = computed(() => {
  const ids = user.value?.children || []
  return ids.map((id) => MOCK_CHILDREN[String(id)]).filter(Boolean)
})

function createEmptyChild(parentId) {
  return {
    id: '', // sera rempli à la création
    role: ['child'], // ✅ role enfant
    parent: parentId ?? null,
    children: [],
    lastname: '',
    firstname: '',
    email: null, // ton FullDataForm masque le champ si role child
    phoneNumber: null,
    address: null, // si tu veux que l’enfant ait une adresse, mets un objet ici
    camps: [],
    participationInfo: null,
  }
}

function createChild(childPayload) {
  if (!user.value) throw new Error('Not authenticated')

  const id = String(Date.now()) // mock id
  const parentId = user.value.id

  const child = {
    ...createEmptyChild(parentId),
    ...childPayload,
    id,
    role: ['child'], // ✅ force
    parent: parentId, // ✅ force
  }

  MOCK_CHILDREN[id] = child

  // rattacher au user courant
  if (!Array.isArray(user.value.children)) user.value.children = []
  user.value.children = [...user.value.children, id]

  return child
}

function updateChild(childPayload) {
  const id = String(childPayload?.id ?? '')
  if (!id || !MOCK_CHILDREN[id]) return null

  MOCK_CHILDREN[id] = {
    ...MOCK_CHILDREN[id],
    ...childPayload,
    role: ['child'], // ✅ force
  }

  return MOCK_CHILDREN[id]
}

const adminUsers = computed(() => {
  return Object.values(MOCK_USERS).filter((u) => u.role?.includes('admin'))
})

//Pour récupérer tous les utilisateurs
const allUsers = computed(() => {
  const adults = Object.values(MOCK_USERS)
  const kids = Object.values(MOCK_CHILDREN)
  return [...adults, ...kids]
})

export const authStore = {
  token,
  user,
  isAuthenticated,
  hasAnyRole,
  mockLogin,
  logout,
  childrenObjects,
  createEmptyChild,
  createChild,
  updateChild,
  adminUsers,
  allUsers,
}
