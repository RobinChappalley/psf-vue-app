import { apiFetch } from '@/services/apiFetch'

export function getStages(campId) {
  return apiFetch(`/camps/${campId}/stages`, { method: 'GET' })
}

export function createStage(campId, payload) {
  return apiFetch(`/camps/${campId}/stages`, { method: 'POST', body: payload })
}

export function updateStage(campId, stageId, payload) {
  return apiFetch(`/camps/${campId}/stages/${stageId}`, { method: 'PUT', body: payload })
}

export function deleteStage(campId, stageId) {
  return apiFetch(`/camps/${campId}/stages/${stageId}`, { method: 'DELETE' })
}
