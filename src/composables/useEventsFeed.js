// src/composables/useEventsFeed.js
import { computed, ref } from 'vue'

/**
 * Types d'event qu'on gère côté UI.
 * - camp -> redirige vers page Camp
 * - info_evening -> soirée d'info
 * - ag -> assemblée générale
 * - training / fundraising -> auto-inscrit (quand inscrit au camp)
 */
export function useEventsFeed(options = {}) {
  // plus tard: remplacer par appel API
  const events = ref(options.initialEvents || [])

  // helpers
  const isOpenForSubscription = (e) => e?.status === 'open' // convention UI (mock)
  const isUserRegistered = (e) => e?.userStatus === 'registered' // convention UI (mock)

  const openToSubscribe = computed(() =>
    events.value.filter((e) => isOpenForSubscription(e) && !isUserRegistered(e)),
  )

  const upcomingRegistered = computed(() => events.value.filter((e) => isUserRegistered(e)))

  // Pour la home publique: souvent on met en avant surtout le prochain camp ouvert
  const nextOpenCamp = computed(() => openToSubscribe.value.find((e) => e.type === 'camp') || null)

  /**
   * Route cible selon type (front routes)
   * - camp -> app.camp (connecté) ou public.subscription (public) selon usage
   */
  function getEventRoute(e, context = 'app') {
    if (!e) return { name: context === 'public' ? 'public.home' : 'app.home' }

    if (e.type === 'camp') {
      // si connecté: page camp, sinon: page inscription
      return context === 'app' ? { name: 'app.camp' } : { name: 'public.subscription' }
    }

    // pour l'instant, on renvoie vers subscription (ou plus tard pages dédiées)
    return context === 'app' ? { name: 'app.home' } : { name: 'public.subscription' }
  }

  return {
    events,
    openToSubscribe,
    upcomingRegistered,
    nextOpenCamp,
    getEventRoute,
  }
}
