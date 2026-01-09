import { authStore } from '@/stores/auth'

/**
 * Contrat (à garder identique quand tu passeras au backend)
 * - listUsers(): Promise<User[]>
 * - updateUserRole(userId, roles): Promise<User>
 * - deleteUser(userId): Promise<void>
 *
 * Ici: implémentation MOCK en s’appuyant sur ton authStore.
 * Plus tard: même fonctions mais avec fetch/axios vers Express.
 */

export async function listUsers() {
  // mock: on lit le computed
  return authStore.allUsers.value ?? []
}

export async function updateUserRole(userId, roles) {
  // mock: on délègue au store (voir partie 2)
  const updated = authStore.setUserRoles(userId, roles)
  if (!updated) throw new Error('User not found')
  return updated
}

export async function deleteUser(userId, opts = { deleteChildren: false }) {
  const ok = authStore.deleteUser(userId, opts)
  if (!ok) throw new Error('User not found')
}
