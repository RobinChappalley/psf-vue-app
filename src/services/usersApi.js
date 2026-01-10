import { apiFetch } from '@/services/apiFetch'

function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u
  return {
    ...u,
    id: u.id ?? u._id, // mapping comme campsApi
  }
}

export async function getUser(id) {
  const data = await apiFetch(`/users/${id}`, { method: 'GET' })
  return normalizeUser(data?.user ?? data)
}

export async function updateUser(id, payload) {
  const data = await apiFetch(`/users/${id}`, { method: 'PUT', body: payload })
  return normalizeUser(data?.user ?? data)
}
