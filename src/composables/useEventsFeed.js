import { computed, unref } from 'vue'

export function useEventsFeed({ events }) {
  const source = computed(() => unref(events) ?? [])

  const upcomingRegistered = computed(() =>
    source.value.filter((e) => e.userStatus === 'registered'),
  )

  const openToSubscribe = computed(() =>
    source.value.filter(
      (e) => e.userStatus !== 'registered' && e['subscription-deadline-date-time'],
    ),
  )

  return { upcomingRegistered, openToSubscribe }
}
