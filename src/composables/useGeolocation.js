import { ref } from 'vue'

export function useGeolocation() {
  const position = ref(null)
  const error = ref(null)
  const loading = ref(false)

  async function getCurrentPosition() {
    if (!navigator.geolocation) {
      error.value = 'Géolocalisation non supportée par ce navigateur'
      return null
    }

    loading.value = true
    error.value = null

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          position.value = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }
          loading.value = false
          resolve(position.value)
        },
        (err) => {
          error.value = err.message || 'Erreur de géolocalisation'
          loading.value = false
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  return { position, error, loading, getCurrentPosition }
}
