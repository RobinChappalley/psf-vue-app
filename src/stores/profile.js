/* src/stores/profile.js */

// 1. On utilise des imports standards (pas de require)
import { apiFetch } from '@/services/apiFetch' // ou ton chemin vers l'API
import { normalizeUser } from './_helpers' // ou l'endroit où tu as cette fonction

// IMPORTANT : On n'importe PAS authStore ici.
// C'est ça qui causait la boucle et les crashs.

const profileStore = {
  // --- Fonctions utilitaires ---

  persistUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },

  // --- Actions ---

  /**
   * Cette fonction a désormais besoin qu'on lui donne l'ID.
   * Elle ne va plus le chercher toute seule.
   */
  async refreshUser(userId) {
    if (!userId) return null

    try {
      // Appel API standard
      const fresh = await apiFetch(`/users/${userId}`)

      // On nettoie les données
      const normalized = normalizeUser(fresh.user || fresh)

      // On sauvegarde le token/user si nécessaire
      profileStore.persistUser(normalized)

      return normalized
    } catch (e) {
      console.error(e)
      return null
    }
  },

  /**
   * Pareil ici : on donne l'ID et les données à changer
   */
  async updateUser(userId, payload) {
    if (!userId) throw new Error('ID utilisateur manquant')

    // 1. On envoie la modif à l'API
    await apiFetch(`/users/${userId}`, {
      method: 'PATCH', // ou PUT selon ton API
      body: payload,
    })

    // 2. On récupère la version à jour pour être sûr
    // (On réutilise la fonction d'au dessus)
    const updatedUser = await profileStore.refreshUser(userId)

    return updatedUser
  },
}

export { profileStore }
