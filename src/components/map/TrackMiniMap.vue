<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  // GeoJSON coordinates: [[lng, lat], [lng, lat], ...]
  coordinates: { type: Array, required: true },
  // Couleur du tracé
  color: { type: String, default: '#e63946' },
  // Hauteur de la carte
  height: { type: String, default: '200px' },
})

const mapContainer = ref(null)
let map = null
let trackLayer = null

function drawTrack() {
  if (!map || !props.coordinates || props.coordinates.length < 2) return

  // Supprimer l'ancien tracé si existant
  if (trackLayer) {
    map.removeLayer(trackLayer)
  }

  // Créer le GeoJSON
  const geoJsonData = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: props.coordinates,
    },
  }

  trackLayer = L.geoJSON(geoJsonData, {
    style: {
      color: props.color,
      weight: 4,
      opacity: 0.8,
    },
  }).addTo(map)

  // Auto-zoom sur le tracé
  const bounds = trackLayer.getBounds()
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] })
  }
}

function initMap() {
  if (!mapContainer.value) return

  // Initialiser la carte
  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([46.8, 8.2], 10)

  // Tuiles OpenTopoMap
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
  }).addTo(map)

  drawTrack()
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Redessiner si les coordonnées changent
watch(() => props.coordinates, drawTrack)
</script>

<template>
  <div class="track-mini-map" :style="{ height }">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.track-mini-map {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--c-border, #e0e0e0);
}

.map-container {
  width: 100%;
  height: 100%;
}
</style>
