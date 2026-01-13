// src/stores/index.js
// Barrel export pour tous les stores

// Auth & Profile
export { authStore } from './auth'
export { profileStore } from './profile'

// Data stores
export { childrenStore } from './childrenStore'
export { responsiblesStore } from './responsibles'
export { campsStore } from './camps'
export { hikesStore } from './hikes'
export { membersStore } from './members'

// Helpers
export { getUserId, normalizeUser } from './_helpers'
