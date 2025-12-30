// src/app/useNavigation.js
import { computed } from 'vue'
import { authStore } from '@/stores/auth'

const NAV_ITEMS = [
  // --- GUEST ---
  {
    label: 'Accueil',
    name: 'public.home',
    icon: 'home',
    publicOnly: true,
  },
  {
    label: 'Inscription',
    name: 'public.subscription',
    icon: 'clipboard',
    publicOnly: true,
  },
  {
    label: 'Historique',
    name: 'public.history',
    icon: 'history',
    publicOnly: true,
  },
  {
    label: 'Contact',
    name: 'public.contact',
    icon: 'mail',
    publicOnly: true,
  },

  // --- CONNECTÉ ---
  {
    label: 'Accueil',
    name: 'app.home',
    icon: 'home',
    authOnly: true,
  },
  {
    label: 'Camp',
    name: 'app.camp',
    icon: 'camp',
    authOnly: true,
  },
  {
    label: 'Historique',
    name: 'app.history',
    icon: 'history',
    authOnly: true,
  },
  {
    label: 'Profil',
    name: 'app.profile',
    icon: 'profile',
    authOnly: true,
  },

  // --- RÔLES ---
  {
    label: 'Rando',
    name: 'app.hike',
    icon: 'rando',
    authOnly: true,
    roles: ['accompagnant', 'admin'],
  },
  {
    label: 'Admin',
    name: 'app.admin',
    icon: 'admin',
    authOnly: true,
    roles: ['admin'],
  },
]

export function useNavigation() {
  const items = computed(() => {
    const isAuthed = authStore.isAuthenticated.value

    return NAV_ITEMS.filter((item) => {
      if (item.publicOnly && isAuthed) return false
      if (item.authOnly && !isAuthed) return false

      if (item.roles?.length) {
        return isAuthed && authStore.hasAnyRole(item.roles)
      }

      return true
    })
  })

  return { items }
}
