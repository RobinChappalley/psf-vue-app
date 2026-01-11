import { apiFetch } from '@/services/apiFetch'

export async function getItems() {
  const res = await apiFetch('/items', { method: 'GET' })
  const arr = Array.isArray(res) ? res : (res?.items ?? [])
  // normalise pour que le picker ait toujours it.id
  return arr.map((it) => ({
    ...it,
    id: it.id ?? it._id,
  }))
}
