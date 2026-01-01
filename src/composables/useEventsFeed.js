import { computed, ref } from 'vue'

export function useEventsFeed(options = {}) {
  const events = ref(options.initialEvents || [])

  // --- Helpers ---
  //MODIFIER ICI pour accéder aux évènements auxquels les personnes sont inscrites
  const isRegistered = (e) => e?.userStatus === 'registered'

  const isOpenForSubscription = (e) => {
    const deadline = e?.['subscription-deadline-date-time']
    if (!deadline) return false
    return new Date(deadline) > new Date()
  }

  // --- Sections ---
  // 1) "Vos prochains évènements" => seulement inscrits
  const upcomingRegistered = computed(() => events.value.filter(isRegistered))

  // 2) "Ouverts à l'inscription" => pas inscrit + inscription ouverte
  const openToSubscribe = computed(() =>
    events.value.filter((e) => !isRegistered(e) && isOpenForSubscription(e)),
  )

  // (optionnel) prochain camp ouvert
  const nextOpenCamp = computed(() => openToSubscribe.value.find((e) => e.type === 'camp') || null)

  return {
    events,
    upcomingRegistered,
    openToSubscribe,
    nextOpenCamp,
  }
}
