import { apiFetch } from '@/services/apiFetch'

// Information Evening est un singleton - un seul par camp
// PUT fait office de "upsert" (crée si n'existe pas, met à jour sinon)

export function getInfoEvening(campId) {
  return apiFetch(`/camps/${campId}/info-evening`, { method: 'GET' })
}

// createInfoEvening utilise PUT (upsert pattern pour singleton)
export function createInfoEvening(campId, payload) {
  return apiFetch(`/camps/${campId}/info-evening`, { method: 'PUT', body: payload })
}

export function updateInfoEvening(campId, payload) {
  return apiFetch(`/camps/${campId}/info-evening`, { method: 'PUT', body: payload })
}

export function deleteInfoEvening(campId) {
  return apiFetch(`/camps/${campId}/info-evening`, { method: 'DELETE' })
}
