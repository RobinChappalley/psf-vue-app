<script setup>
import { computed, onMounted, ref, reactive } from 'vue'

import { hikesStore } from '@/stores/hikes'
import { authStore } from '@/stores/auth'
import { postHikes } from '@/services/hikesApi'
import { getNearestTraining } from '@/services/trainingsApi'
import { useGeolocation } from '@/composables/useGeolocation'

import BaseButton from '@/components/ui/BaseButton.vue'
import FloatingButton from '@/components/ui/FloatingButton.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import HikeCard from '@/components/hikes/HikeCard.vue'

// Authentification
const token = authStore.token.value

// Retrieve hikes
onMounted(async () => {
  try {
    await hikesStore.ensureHikesLoaded()
  } catch (e) {
    console.error(e)
  }
})

const hikes = computed(() => hikesStore.hikes.value)
const loading = computed(() => hikesStore.loading.value)
const error = computed(() => hikesStore.error.value)

// Bottom sheet
const sheetOpen = ref(false)

function openSheet() {
  sheetOpen.value = true
}

function closeSheet() {
  sheetOpen.value = false
}

// Handle form
const form = reactive({
  description: '',
  imageFile: null,
})

function onFileChange(e) {
  const file = e.target.files[0] || null
  if (file && file.size > 10 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 10MB).')
    form.imageFile = null
    e.target.value = ''
    return
  }
  form.imageFile = file
}

async function submitForm() {
  try {
    const userId = authStore.getUserId(authStore.user.value)
    if (!userId) {
      console.error('Utilisateur non connecté')
      return
    }

    const formData = new FormData()
    formData.append('user', userId)
    formData.append('content', form.description)
    if (form.imageFile) {
      formData.append('image', form.imageFile)
    }

    await postHikes(formData, token)
    await hikesStore.fetchHikes()

    closeSheet()
    form.description = ''
    form.imageFile = null
  } catch (e) {
    console.error("Erreur lors de l'ajout de la randonnée : ", e)
  }
}

// Geolocation - Nearest training
const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation()
const nearestTraining = ref(null)
const nearestLoading = ref(false)
const nearestError = ref(null)

async function findNearestTraining() {
  nearestLoading.value = true
  nearestError.value = null
  nearestTraining.value = null

  const pos = await getCurrentPosition()
  if (!pos) {
    nearestError.value = geoError.value || 'Impossible de vous localiser'
    nearestLoading.value = false
    return
  }

  try {
    const result = await getNearestTraining(pos.latitude, pos.longitude)
    nearestTraining.value = result
  } catch (e) {
    nearestError.value = e.message || 'Aucun entraînement trouvé'
  } finally {
    nearestLoading.value = false
  }
}

function clearNearestTraining() {
  nearestTraining.value = null
  nearestError.value = null
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <section class="section">
    <h1>Randonnées</h1>

    <!-- Nearest training search -->
    <div class="nearest-section">
      <BaseButton
        variant="secondary"
        @click="findNearestTraining"
        :disabled="nearestLoading || geoLoading"
      >
        {{ nearestLoading ? 'Recherche...' : 'Entraînement le plus proche' }}
      </BaseButton>

      <div v-if="nearestTraining" class="nearest-result">
        <div class="nearest-card">
          <button class="close-btn" @click="clearNearestTraining" type="button">&times;</button>
          <h3>Entraînement trouvé</h3>
          <p><strong>Date :</strong> {{ fmtDate(nearestTraining.date) }}</p>
          <p><strong>Lieu :</strong> {{ nearestTraining.meetingPoint || 'Non spécifié' }}</p>
          <p><strong>Distance :</strong> {{ nearestTraining._distanceKm?.toFixed(1) ?? '?' }} km</p>
        </div>
      </div>

      <p v-if="nearestError" class="error">{{ nearestError }}</p>
    </div>

    <!-- Loading and errors -->
    <div v-if="loading" class="loading">Chargement des randonnées…</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Hikes feed -->
    <div v-if="!loading && hikes.length === 0" class="empty-state">
      Aucune randonnée disponible.
    </div>

    <div v-if="hikes.length" class="hikes-feed">
      <HikeCard v-for="hike in hikes" :key="hike._id" :hike="hike" />
    </div>

    <FloatingButton icon="plus" @click="openSheet" />

    <!-- Add hike form -->
    <BottomSheet :open="sheetOpen" title="Ajouter une randonnée" @close="closeSheet">
      <form class="hike-form" @submit.prevent="submitForm">
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Racontez votre randonnée..."
            rows="3"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="image">Photo</label>
          <input id="image" type="file" @change="onFileChange" accept="image/*" />
        </div>

        <BaseButton type="submit" block>Publier</BaseButton>
      </form>
    </BottomSheet>
  </section>
</template>

<style scoped>
.nearest-section {
  margin-bottom: var(--sp-3);
}

.nearest-result {
  margin-top: var(--sp-2);
}

.nearest-card {
  position: relative;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: var(--sp-2);
}

.nearest-card h3 {
  margin: 0 0 var(--sp-1);
  font-family: var(--font-title);
  font-size: var(--fs-h3);
}

.nearest-card p {
  margin: 0.25rem 0;
  font-size: var(--fs-body);
}

.close-btn {
  position: absolute;
  top: var(--sp-1);
  right: var(--sp-1);
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--c-text);
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1;
}

.loading,
.empty-state {
  text-align: center;
  padding: var(--sp-2);
  color: var(--c-text);
  opacity: 0.7;
}

.error {
  color: var(--c-warning);
  margin-top: var(--sp-1);
}

.hikes-feed {
  display: flex;
  flex-direction: column;
}

.hike-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.form-group label {
  font-weight: var(--fw-semibold);
  font-size: var(--fs-body);
}

.form-group textarea {
  padding: var(--sp-1);
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  font-size: var(--fs-body);
  font-family: var(--font-body);
  resize: vertical;
}

.form-group input[type='file'] {
  padding: var(--sp-1);
}
</style>
