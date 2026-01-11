import { apiFetch } from '@/services/apiFetch'

export function getHikes() {
  return apiFetch('/hikes', { method: 'GET' })
}

export function postHikes(formData, token) {
  return apiFetch('/hikes', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })
}
