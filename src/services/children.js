// src/services/children.js
import { apiFetch } from '@/services/apiFetch'

export async function getChildrenByParent(parentId) {
  return apiFetch(`/users?parentId=${encodeURIComponent(parentId)}`, { method: 'GET' })
}

export async function createChildApi(payload) {
  return apiFetch('/users', { method: 'POST', body: payload })
}

export async function updateUserApi(userId, payload) {
  return apiFetch(`/users/${userId}`, { method: 'PUT', body: payload })
}
