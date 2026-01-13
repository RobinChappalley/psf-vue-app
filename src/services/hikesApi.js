import { apiFetch } from '@/services/apiFetch'

export function getHikes() {
  return apiFetch('/hikes', { method: 'GET' })
}

export function postHikes(formData) {
  return apiFetch('/hikes', {
    method: 'POST',
    body: formData,
  })
}
