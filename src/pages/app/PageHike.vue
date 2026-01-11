<script setup>
import { computed, onMounted, ref, reactive } from 'vue'

import { hikesStore } from '@/stores/hikes'
import { authStore } from '@/stores/auth'
import { postHikes } from '@/services/hikesApi'

import BaseButton from '@/components/ui/BaseButton.vue'
import FloatingButton from '@/components/ui/FloatingButton.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'

//Authentification
const token = authStore.token.value

//Retrieve hikes
onMounted(async () => {
  try {
    await hikesStore.ensureHikesLoaded()
    console.log(hikesStore.hikes.value)
  } catch (e) {
    console.error(e)
  }
})

const hikes = computed(() => hikesStore.hikes.value)
const loading = computed(() => hikesStore.loading.value)
const error = computed(() => hikesStore.error.value)

console.log(hikes)

//Define what is displayed
const section = 'photos'
const sheetOpen = ref(false)

//Handle bottom sheet
function openSheet() {
  sheetOpen.value = true
}

function closeSheet() {
  sheetOpen.value = false
}

//Handle form
const form = reactive({
  description: '',
  imageFile: null,
})

function onFileChange(e) {
  const file = e.target.files[0] || null
  if (file && file.size > 10 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 10MB).')
    form.imageFile = null
    e.target.value = '' // réinitialiser le input
    return
  }
  form.imageFile = file
}

async function submitForm() {
  console.log('Token :', token)
  console.log('Description :', form.description)
  console.log('Image :', form.imageFile)
  try {
    const formData = new FormData()
    formData.append('content', form.description)
    if (form.imageFile) {
      formData.append('image', form.imageFile)
    }

    await postHikes(formData, token)

    await hikesStore.ensureHikesLoaded()

    closeSheet()
    form.description = ''
    form.imageFile = null
  } catch (e) {
    console.error("Erreur lors de l'ajout de la randonnée : ", e)
  }
}

//Format date
function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <section class="section">
    <h1>Randonnées</h1>

    <template v-if="section === 'photos'">
      <!-- Loading and errors -->
      <div v-if="loading">Chargement des randonnées…</div>
      <div v-if="error" class="error">{{ error }}</div>

      <!-- List of Hikes -->
      <div v-if="!loading && hikes.length === 0">Aucune randonnée disponible.</div>

      <ul v-if="hikes.length" class="hike-list">
        <li v-for="hike in hikes" :key="hike._id" class="hike-item">
          <h3>{{ hike.user.email }}</h3>
          <p v-if="hike.createdAt">{{ fmtDate(hike.createdAt) }}</p>
          <p>{{ hike.content || 'Randonnée' }}</p>
          <img v-if="hike.imageUrl" :src="hike.imageUrl" :alt="'Photo de la randonnée'" />
        </li>
      </ul>
      <FloatingButton @click="openSheet">+</FloatingButton>
    </template>

    <template v-if="section === 'hikes'">
      <p>page des randos</p>
    </template>

    <BottomSheet :open="sheetOpen" title="Ajouter une photo" @close="closeSheet">
      <form @submit.prevent="submitForm">
        <label>
          Description
          <input
            type="text"
            v-model="form.description"
            placeholder="Entrez une description"
            required
          />
        </label>

        <label>
          Image
          <input type="file" @change="onFileChange" accept="image/*" />
        </label>

        <BaseButton type="submit">Valider</BaseButton>
      </form>
    </BottomSheet>
  </section>
</template>

<style scoped>
.hike-list {
  list-style: none;
  padding: 0;
}
.hike-item {
  border-bottom: 1px solid var(--muted);
  padding: 0.75rem 0;
}
.error {
  color: var(--danger);
}
</style>
