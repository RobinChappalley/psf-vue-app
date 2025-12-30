import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '@/stores/auth'

// Layouts
import PublicLayout from '@/pages/layouts/PublicLayout.vue'
import AppLayout from '@/pages/layouts/AppLayout.vue'

// Public pages
import PublicHome from '@/pages/public/PageHome.vue'
import PublicLogin from '@/pages/public/PageLogin.vue'
import PublicSignup from '@/pages/public/PageSignup.vue'
import PublicSubscription from '@/pages/public/PageSubscription.vue'
import PublicHistory from '@/pages/public/PageHistory.vue'
import PublicContact from '@/pages/public/PageContact.vue'

// App pages
import AppHome from '@/pages/app/PageHome.vue'
import AppCamp from '@/pages/app/PageCamp.vue'
import AppHistory from '@/pages/app/PageHistory.vue'
import AppProfile from '@/pages/app/PageProfile.vue'
import AppHike from '@/pages/app/PageHike.vue'
import AppAdmin from '@/pages/app/PageAdmin.vue'

const routes = [
  // --- PUBLIC LAYOUT ---
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'public.home', component: PublicHome, meta: { public: true } },

      // Création de compte
      { path: 'signup', name: 'public.signup', component: PublicSignup, meta: { public: true } },

      // Login
      { path: 'login', name: 'public.login', component: PublicLogin, meta: { public: true } },

      // "Inscription" = inscription à des camps
      {
        path: 'inscription',
        name: 'public.subscription',
        component: PublicSubscription,
        meta: { public: true },
      },

      // Historique des camps public
      {
        path: 'historique',
        name: 'public.history',
        component: PublicHistory,
        meta: { public: true },
      },

      { path: 'contact', name: 'public.contact', component: PublicContact, meta: { public: true } },
    ],
  },

  // --- APP LAYOUT (AUTH) ---
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'app.home' } },

      { path: 'home', name: 'app.home', component: AppHome },
      { path: 'camp', name: 'app.camp', component: AppCamp },
      { path: 'historique', name: 'app.history', component: AppHistory },
      { path: 'profil', name: 'app.profile', component: AppProfile },

      // hike/rando : accompagnant OU admin
      {
        path: 'hike',
        name: 'app.hike',
        component: AppHike,
        meta: { roles: ['accompagnant', 'admin'] },
      },

      // admin : admin only
      {
        path: 'admin',
        name: 'app.admin',
        component: AppAdmin,
        meta: { roles: ['admin'] },
      },
    ],
  },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: { name: 'public.home' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})
export default router

router.beforeEach((to) => {
  const isPublic = to.matched.some((r) => r.meta.public)
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)

  // récupère la première meta.roles rencontrée (si une route en a une)
  const rolesMeta = to.matched.map((r) => r.meta.roles).find((x) => Array.isArray(x) && x.length)

  // Si déjà connecté et va sur login -> renvoi app.home
  if (to.name === 'public.login' && authStore.isAuthenticated.value) {
    return { name: 'app.home' }
  }

  // Auth guard
  if (!isPublic && requiresAuth && !authStore.isAuthenticated.value) {
    return { name: 'public.login' }
  }

  // Role guard
  if (rolesMeta && rolesMeta.length) {
    if (!authStore.isAuthenticated.value) return { name: 'public.login' }
    if (!authStore.hasAnyRole(rolesMeta)) return { name: 'app.home' }
  }

  return true
})
