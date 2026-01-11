// src/services/itemsApi.js
import { apiFetch } from '@/services/apiFetch'

export async function getItems() {
  // apiFetch retourne directement les données (pas { data })
  const data = await apiFetch('/items')
  return Array.isArray(data) ? data : []
}
