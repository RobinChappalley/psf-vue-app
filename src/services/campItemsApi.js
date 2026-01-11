// src/services/campItemsApi.js
import { apiFetch } from '@/services/apiFetch'

export function getCampItems(campId) {
  return apiFetch(`/camps/${campId}/items`)
}

// add: backend attend { item_id, quantity }
export function addCampItem(campId, itemId) {
  return apiFetch(`/camps/${campId}/items`, {
    method: 'POST',
    body: { item_id: itemId, quantity: 1 },
  })
}

// delete: /camps/:campId/items/:itemId
export function deleteCampItem(campId, itemId) {
  return apiFetch(`/camps/${campId}/items/${itemId}`, { method: 'DELETE' })
}
