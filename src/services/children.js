import { apiFetch } from '@/services/apiFetch'

export async function getChildrenByParent(parentId) {
  if (!parentId) throw new Error('parentId is required')
  const res = await apiFetch(`/users?parentId=${encodeURIComponent(parentId)}`, { method: 'GET' })
  // selon ton backend ça peut être [] direct ou {data: []}
  return Array.isArray(res) ? res : (res?.data ?? [])
}

export async function createChild(parentId, payload) {
  if (!parentId) throw new Error('parentId is required')

  const body = {
    ...payload,
    parent: parentId,
    // optionnel: si tu veux tagger les enfants
    // role: payload.role ?? ['child'],
  }

  return apiFetch('/user', { method: 'POST', body })
}
