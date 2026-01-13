// src/stores/_helpers.js
// Fonctions utilitaires partagées entre les stores

/**
 * Extrait l'ID d'un objet user (compatible MongoDB _id et id standard)
 * @param {Object} u - Objet utilisateur
 * @returns {string|null} L'ID ou null
 */
export function getUserId(u) {
  return u?.id ?? u?._id ?? null
}

/**
 * Normalise un objet user pour garantir la présence de `id`
 * @param {Object} u - Objet utilisateur brut
 * @returns {Object} Utilisateur normalisé avec id
 */
export function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u
  return {
    ...u,
    id: u.id ?? u._id,
  }
}
