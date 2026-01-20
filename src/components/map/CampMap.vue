<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { listCamps } from '@/services/campsApi'
import { getStages } from '@/services/stagesApi'

// Fix Leaflet default icons for Vite
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const mapContainer = ref(null)
let map = null
const loading = ref(true)
const error = ref(null)

// Palette de couleurs pour les camps
const CAMP_COLORS = [
  '#e63946', // rouge
  '#2a9d8f', // teal
  '#e9c46a', // jaune
  '#264653', // bleu foncé
  '#f4a261', // orange
  '#a855f7', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function formatDate(dateStr) {
  if (!dateStr) return 'Date inconnue'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function loadMap() {
  if (!mapContainer.value) return

  // Initialiser la carte centrée sur la Suisse
  map = L.map(mapContainer.value).setView([46.8, 8.2], 8)

  // Tuiles OpenTopoMap
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution:
      'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | ' +
      'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  }).addTo(map)

  try {
    const camps = await listCamps()
    const allBounds = []

    for (let i = 0; i < camps.length; i++) {
      const camp = camps[i]
      const color = CAMP_COLORS[i % CAMP_COLORS.length]

      // Récupérer les stages du camp
      let stages = []
      try {
        stages = await getStages(camp.id)
      } catch {
        // Camp sans stages ou erreur d'accès
        continue
      }

      if (!Array.isArray(stages)) continue

      for (const stage of stages) {
        if (!stage.gpsTrack || !stage.gpsTrack.coordinates) continue

        // Créer le GeoJSON pour le stage
        const geoJsonData = {
          type: 'Feature',
          geometry: stage.gpsTrack,
          properties: {
            campTitle: camp.title,
            date: stage.date,
            startPoint: stage.startPoint,
            endPoint: stage.endPoint,
          },
        }

        const layer = L.geoJSON(geoJsonData, {
          style: {
            color: color,
            weight: 4,
            opacity: 0.8,
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties
            const dateFormatted = formatDate(props.date)
            const popupContent = `
              <div style="min-width: 150px;">
                <strong>${props.campTitle}</strong><br>
                Étape du ${dateFormatted}<br>
                <em>${props.startPoint || '?'} → ${props.endPoint || '?'}</em>
              </div>
            `
            layer.bindPopup(popupContent)
          },
        }).addTo(map)

        // Collecter les bounds pour le zoom automatique
        const layerBounds = layer.getBounds()
        if (layerBounds.isValid()) {
          allBounds.push(layerBounds)
        }
      }
    }

    // Auto-zoom pour afficher toutes les traces
    if (allBounds.length > 0) {
      const combinedBounds = allBounds.reduce((acc, bounds) => acc.extend(bounds), allBounds[0])
      map.fitBounds(combinedBounds, { padding: [20, 20] })
    }
  } catch (e) {
    error.value = 'Erreur lors du chargement des données'
    console.error('CampMap error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="camp-map-wrapper">
    <div v-if="loading" class="loading-overlay">
      <span>Chargement de la carte...</span>
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.camp-map-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: var(--r-card, 8px);
  overflow: hidden;
  border: 1px solid var(--c-border, #e0e0e0);
}

.map-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-size: var(--fs-body, 1rem);
  color: var(--c-text, #333);
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 8px;
  z-index: 1001;
}
</style>
