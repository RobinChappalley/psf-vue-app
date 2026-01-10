import { apiFetch } from '@/services/apiFetch'

function normalizeCamp(c) {
  if (!c || typeof c !== 'object') return c
  return {
    ...c,
    id: c.id ?? c._id, // 🔥 mapping principal
  }
}

export async function listCamps() {
  const data = await apiFetch('/camps', { method: 'GET' })
  // backend renvoie un array direct, donc:
  return Array.isArray(data) ? data.map(normalizeCamp) : []
}

export async function getCamp(id) {
  const data = await apiFetch(`/camps/${id}`, { method: 'GET' })
  // selon backend: camp ou objet direct
  return normalizeCamp(data?.camp ?? data)
}

export async function createCamp(payload) {
  const data = await apiFetch('/camps', { method: 'POST', body: payload })
  return normalizeCamp(data?.camp ?? data)
}

export async function updateCamp(id, payload) {
  const data = await apiFetch(`/camps/${id}`, { method: 'PUT', body: payload })
  return normalizeCamp(data?.camp ?? data)
}

export async function deleteCamp(id) {
  return apiFetch(`/camps/${id}`, { method: 'DELETE' })
}
