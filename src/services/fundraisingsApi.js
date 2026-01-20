import { apiFetch } from '@/services/apiFetch'

export function getFundraisings(campId) {
  return apiFetch(`/camps/${campId}/fundraisings`, { method: 'GET' })
}

export function createFundraising(campId, payload) {
  return apiFetch(`/camps/${campId}/fundraisings`, { method: 'POST', body: payload })
}

export function updateFundraising(campId, fundraisingId, payload) {
  return apiFetch(`/camps/${campId}/fundraisings/${fundraisingId}`, { method: 'PUT', body: payload })
}

export function deleteFundraising(campId, fundraisingId) {
  return apiFetch(`/camps/${campId}/fundraisings/${fundraisingId}`, { method: 'DELETE' })
}
