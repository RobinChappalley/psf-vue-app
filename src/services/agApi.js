import { apiFetch } from '@/services/apiFetch'

// AG (Assemblée Générale) est un singleton - un seul par camp
// PUT fait office de "upsert" (crée si n'existe pas, met à jour sinon)

export function getAG(campId) {
  return apiFetch(`/camps/${campId}/ag`, { method: 'GET' })
}

// createAG utilise PUT (upsert pattern pour singleton)
export function createAG(campId, payload) {
  return apiFetch(`/camps/${campId}/ag`, { method: 'PUT', body: payload })
}

export function updateAG(campId, payload) {
  return apiFetch(`/camps/${campId}/ag`, { method: 'PUT', body: payload })
}

export function deleteAG(campId) {
  return apiFetch(`/camps/${campId}/ag`, { method: 'DELETE' })
}
