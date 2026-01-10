import { ref, computed } from 'vue'
import { listCamps, getCamp as apiGetCamp } from '@/services/campsApi'

const camps = ref([])
const loading = ref(false)
const error = ref(null)

// empêche plusieurs fetch simultanés
let inFlight = null

async function fetchCamps() {
  loading.value = true
  error.value = null
  try {
    camps.value = await listCamps()
  } catch (e) {
    error.value = e?.message ?? 'Erreur chargement camps'
    throw e
  } finally {
    loading.value = false
  }
}

// ✅ à appeler depuis les pages
async function ensureCampsLoaded() {
  if (camps.value.length) return camps.value
  if (inFlight) return inFlight

  inFlight = fetchCamps()
    .then(() => camps.value)
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

async function getCampById(id) {
  // tente cache d’abord
  const found = camps.value.find((c) => String(c.id) === String(id))
  if (found) return found

  // sinon, s’assurer que la liste est chargée une fois
  await ensureCampsLoaded()
  const found2 = camps.value.find((c) => String(c.id) === String(id))
  if (found2) return found2

  // fallback endpoint détail
  return apiGetCamp(id)
}

const publishedCamps = computed(() => camps.value.filter((c) => c.status === 'published'))
const archivedCamps = computed(() => camps.value.filter((c) => c.status === 'archived'))
const draftCamps = computed(() => camps.value.filter((c) => c.status === 'draft'))

export const campsStore = {
  camps,
  loading,
  error,
  fetchCamps,
  ensureCampsLoaded,
  getCampById,
  publishedCamps,
  archivedCamps,
  draftCamps,
}
