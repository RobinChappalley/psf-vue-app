import { apiFetch } from '@/services/apiFetch'

function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u
  return { ...u, id: u.id ?? u._id }
}

function normalizeUsersResponse(res) {
  // backend peut renvoyer: { users: [...] } ou directement [...]
  const raw = res?.users ?? res?.data ?? res
  const arr = Array.isArray(raw) ? raw : []
  return arr.map(normalizeUser)
}

export async function getUsers(params = {}) {
  const qs = new URLSearchParams()

  //filtre by role
  if (params.role) qs.set('role', params.role)
  if (params.parentId) qs.set('parentId', params.parentId)
  if (params.search) qs.set('search', params.search)

  if (params.campId) qs.set('campId', params.campId)
  //filtre by hasPaid
  if (params.hasPaid === true) qs.set('hasPaid', 'true')
  if (params.hasPaid === false) qs.set('hasPaid', 'false')

  // optionnel pagination
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const url = qs.toString() ? `/users?${qs.toString()}` : '/users'
  const res = await apiFetch(url, { method: 'GET' })
  return normalizeUsersResponse(res)
}

export async function getUser(id) {
  const data = await apiFetch(`/users/${id}`, { method: 'GET' })
  return normalizeUser(data?.user ?? data)
}

export async function updateUser(id, payload) {
  console.log('PATCH payload sent to backend:', payload)
  const data = await apiFetch(`/users/${id}`, { method: 'PUT', body: payload })
  return normalizeUser(data?.user ?? data)
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' })
}

export function getAdminUsers() {
  return apiFetch('/users?role=admin', { method: 'GET' })
}
