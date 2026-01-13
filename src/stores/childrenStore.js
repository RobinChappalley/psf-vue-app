// src/stores/childrenStore.js
// Gestion des enfants (Découplé de Auth)

import { ref, computed } from 'vue'
import { getChildrenByParent, createChildApi, updateUserApi } from '@/services/children'
import { getUserId } from './_helpers'

// PLUS AUCUNE référence à Auth ici (ni require, ni import)

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
 * @param {string|number} parentId - ID du parent (OBLIGATOIRE)
 */
async function fetchChildren(parentId) {
  // Avant : on cherchait dans auth si parentId était null.
  // Maintenant : on bloque si pas d'ID.
  if (!parentId) throw new Error('Parent ID manquant pour fetchChildren')

  const res = await getChildrenByParent(parentId)

  // Gestion sécurisée du retour API (tableau ou objet avec data)
  childrenObjects.value = Array.isArray(res) ? res : (res?.data ?? [])

  return childrenObjects.value
}

/**
 * Crée un objet enfant vide pré-rempli avec l'ID du parent
 * @param {string|number} parentId - ID du parent (OBLIGATOIRE)
 */
function createEmptyChild(parentId) {
  if (!parentId) throw new Error('Parent ID manquant pour createEmptyChild')

  return {
    firstname: '',
    lastname: '',
    role: ['enfant'],
    parent: parentId, // On utilise l'ID passé en paramètre
    participationInfo: {},
    address: {},
  }
}

/**
 * Crée un nouvel enfant en base de données
 * @param {string|number} parentId - ID du parent (OBLIGATOIRE)
 * @param {Object} childPayload - Données de l'enfant
 */
async function createChild(parentId, childPayload) {
  if (!parentId) throw new Error('Parent ID manquant pour createChild')

  // Nettoyage des données (inchangé)
  const firstname = String(childPayload?.firstname ?? '').trim()
  const lastname = String(childPayload?.lastname ?? '').trim()

  if (!firstname || !lastname) {
    throw new Error('Prénom et nom sont obligatoires.')
  }

  const payload = {
    ...childPayload,
    firstname,
    lastname,
    parent: parentId, // On lie explicitement au parent reçu
    role: ['enfant'],
  }

  // On nettoie au cas où
  delete payload.parentId

  // 1. Création API
  const created = await createChildApi(payload)

  // 2. On rafraîchit la liste pour ce parent précis !!
  await fetchChildren(parentId)

  return created
}

/**
 * Met à jour un enfant existant
 * @param {string|number} parentId - ID du parent (Nécessaire pour rafraîchir la liste après update)
 * @param {Object} childPayload - Données de l'enfant avec id
 */
async function updateChild(parentId, childPayload) {
  // On a besoin de l'ID de l'enfant pour l'API
  const childId = getUserId(childPayload) // ou childPayload.id ou ._id
  if (!childId) throw new Error('Child ID manquant')

  if (!parentId) throw new Error('Parent ID manquant (nécessaire pour rafraichir la liste)')

  const payload = { ...childPayload }
  // On nettoie l'ID du payload pour éviter de l'envoyer dans le body si l'API n'aime pas ça
  delete payload.id
  delete payload._id

  // 1. Update API
  const updated = await updateUserApi(childId, payload)

  // 2. On rafraîchit la liste du parent
  await fetchChildren(parentId)

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
  createChild, // Attention: signature changée (parentId, payload)
  updateChild, // Attention: signature changée (parentId, payload)
  reset,
}
