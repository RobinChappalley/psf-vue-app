// src/stores/childrenStore.js
// Gestion des enfants du parent connecté

import { ref, computed } from 'vue'
import { getChildrenByParent, createChildApi, updateUserApi } from '@/services/children'
import { getUserId } from './_helpers'

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
const childrenObjects = ref([])
const children = computed(() => childrenObjects.value)

/* ======================================================
   ACTIONS
====================================================== */

/**
 * Récupère les enfants d'un parent
 * @param {string|null} parentId - ID du parent (utilise le user connecté par défaut)
 */
async function fetchChildren(parentId = null) {
  const auth = getAuthStore()
  const pid = parentId ?? getUserId(auth.user.value)
  if (!pid) throw new Error('Missing parentId')

  const res = await getChildrenByParent(pid)
  childrenObjects.value = Array.isArray(res) ? res : (res?.data ?? [])
  return childrenObjects.value
}

/**
 * Crée un objet enfant vide pour les formulaires
 * @param {string|null} parentId - ID du parent
 */
function createEmptyChild(parentId = null) {
  const auth = getAuthStore()
  const pid = parentId ?? getUserId(auth.user.value)
  return {
    firstname: '',
    lastname: '',
    role: ['enfant'],
    parent: pid,
    participationInfo: {},
    address: {},
  }
}

/**
 * Crée un nouvel enfant
 * @param {Object} childPayload - Données de l'enfant
 */
async function createChild(childPayload) {
  const auth = getAuthStore()
  if (!auth.user.value) throw new Error('Not authenticated')

  const parentId = getUserId(auth.user.value)
  if (!parentId) throw new Error('Missing parent id')

  const firstname = String(childPayload?.firstname ?? '').trim()
  const lastname = String(childPayload?.lastname ?? '').trim()

  if (!firstname || !lastname) {
    throw new Error('Prénom et nom sont obligatoires.')
  }

  const payload = {
    ...childPayload,
    firstname,
    lastname,
    parent: parentId,
    role: ['enfant'],
  }

  delete payload.parentId

  const created = await createChildApi(payload)
  await fetchChildren(parentId)

  return created
}

/**
 * Met à jour un enfant existant
 * @param {Object} childPayload - Données de l'enfant avec id
 */
async function updateChild(childPayload) {
  const id = getUserId(childPayload)
  if (!id) throw new Error('Missing child id')

  const payload = { ...childPayload }
  delete payload.id
  delete payload._id

  const updated = await updateUserApi(id, payload)

  const auth = getAuthStore()
  const pid = getUserId(auth.user.value)
  if (pid) await fetchChildren(pid)

  return updated
}

/**
 * Réinitialise le store (appelé au logout)
 */
function reset() {
  childrenObjects.value = []
}

/* ======================================================
   EXPORT
====================================================== */
export const childrenStore = {
  // State
  children,
  childrenObjects,

  // Actions
  fetchChildren,
  createEmptyChild,
  createChild,
  updateChild,
  reset,
}
