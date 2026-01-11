import { ref, computed } from 'vue'
import { getHikes } from '@/services/hikesApi'

const hikes = ref([])
const pagination = ref({})
const loading = ref(false)
const error = ref(null)

let inFlight = null

async function fetchHikes() {
  if (inFlight) return inFlight

  loading.value = true
  error.value = null

  inFlight = (async () => {
    try {
      const res = await getHikes()
      hikes.value = res.data
      pagination.value = res.pagination ?? {}
    } catch (e) {
      error.value = e?.message ?? 'Erreur chargement randonnées'
      throw e
    } finally {
      loading.value = false
    }
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

async function ensureHikesLoaded() {
  if (hikes.value.length) return hikes.value
  return fetchHikes().then(() => hikes.value)
}

export const hikesStore = {
  hikes,
  pagination,
  loading,
  error,
  fetchHikes,
  ensureHikesLoaded,
}
