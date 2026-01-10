import { apiFetch } from '@/services/apiFetch'
import { ref, computed } from 'vue'

// Partie API réelle
//Variables
const token = ref(localStorage.getItem('token'))
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

//Login
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password },
  })

  token.value = data.token
  user.value = data.user

  localStorage.setItem('token', token.value)
  localStorage.setItem('user', JSON.stringify(user.value))

  return data.user
}

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
    lastname: 'Chappalley',
    firstname: 'Robin',
    email: 'robin@chapi.ch',
    phoneNumber: '+41791234567',
    address: {
      street: 'Chemin des Alpes 12',
      city: 'Fribourg',
      postalCode: 1700,
      country: 'CH',
    },
    parent: null,
    children: ['1', '5'],
    camps: ['camp-2026'],
    participationInfo: {
      birthDate: '1996-09-18',
      tshirtInfo: {
        size: 'L',
        gender: 'm',
      },
      allergies: ['pollen'],
      medication: [],
      insuranceNumber: '756.1234.5678.97',
      insuranceName: 'CSS',
      idExpireDate: '2028-04-20',
      publicTransportPass: 'AG',
      isCASMember: true,
      isHelicopterInsured: true,
      hasPhotoConsent: true,
      hasPaid: true,
    },
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

// Helpers admin (mock)
function findUserById(userId) {
  const id = String(userId)

  // adultes : MOCK_USERS = { parent: {...}, accompagnant: {...}, admin: {...} }
  const adult = Object.values(MOCK_USERS).find((u) => String(u.id) === id)
  if (adult) return { kind: 'adult', user: adult }

  // enfants : MOCK_CHILDREN = { '1': {...}, '5': {...} }
  const child = MOCK_CHILDREN[id]
  if (child) return { kind: 'child', user: child }

  return null
}

//Pour modifier les users
function setUserRoles(userId, roles = []) {
  const found = findUserById(userId)
  if (!found) return null

  // enfant: on force toujours child (à toi de décider si tu veux permettre autre chose)
  if (found.kind === 'child') {
    found.user.role = ['child']
    return found.user
  }

  const next = Array.isArray(roles) ? roles : [String(roles)]
  found.user.role = next
  return found.user
}

function deleteUser(userId, { deleteChildren = false } = {}) {
  const found = findUserById(userId)
  if (!found) return false

  const id = String(userId)

  // --------------------
  // SUPPRIMER UN ENFANT
  // --------------------
  if (found.kind === 'child') {
    const child = found.user
    const parentId = child.parent ? String(child.parent) : null

    // enlever l'enfant de la liste children du parent (si adulte existant)
    if (parentId) {
      const parent = Object.values(MOCK_USERS).find((u) => String(u.id) === parentId)
      if (parent && Array.isArray(parent.children)) {
        parent.children = parent.children.map(String).filter((cid) => cid !== id)
      }
      // si le parent est le user courant dans le store, sync aussi
      if (user.value && String(user.value.id) === parentId && Array.isArray(user.value.children)) {
        user.value.children = user.value.children.map(String).filter((cid) => cid !== id)
      }
    }

    delete MOCK_CHILDREN[id]
    return true
  }

  // --------------------
  // SUPPRIMER UN ADULTE
  // --------------------
  const adult = found.user

  // gérer ses enfants si parent/admin a children
  const childrenIds = (adult.children ?? []).map(String)

  if (childrenIds.length) {
    if (deleteChildren) {
      // supprime chaque enfant
      for (const cid of childrenIds) {
        if (MOCK_CHILDREN[cid]) delete MOCK_CHILDREN[cid]
      }
    } else {
      // orphelins (tu peux choisir une autre politique)
      for (const cid of childrenIds) {
        if (MOCK_CHILDREN[cid]) MOCK_CHILDREN[cid].parent = null
      }
    }
  }

  // si c'est le user connecté, logout
  if (user.value && String(user.value.id) === id) {
    logout()
  }

  // IMPORTANT: MOCK_USERS est un objet indexé par clés "parent/accompagnant/admin"
  // donc on supprime par clé
  const keyToDelete = Object.keys(MOCK_USERS).find((k) => String(MOCK_USERS[k].id) === id)
  if (keyToDelete) {
    delete MOCK_USERS[keyToDelete]
    return true
  }

  return false
}

export const authStore = {
  token,
  user,
  isAuthenticated,
  hasAnyRole,
  logout,
  childrenObjects,
  createEmptyChild,
  createChild,
  updateChild,
  adminUsers,
  allUsers,
  setUserRoles,
  deleteUser,
  login,
}
