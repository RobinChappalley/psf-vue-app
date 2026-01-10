<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

/* ======================================================
   EMITS & PROPS
====================================================== */
const emit = defineEmits(['submit'])

const props = defineProps({
  mode: { type: String, default: 'create' }, // "create" | "edit"
  initialValues: { type: Object, default: null },

  // ex: { fileName: "trace.gpx", url: "..." }
  existingGpx: { type: Object, default: null },
})

/* ======================================================
   FORM STATE
====================================================== */
const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  subscriptionStartDate: '',
  subscriptionDeadline: '',
})

/* ======================================================
   GPX STATE
====================================================== */
const gpxFile = ref(null)
const fileInputKey = ref(0)
const removeExistingGpx = ref(false)

function resetFileInput() {
  fileInputKey.value += 1
}

/* ======================================================
   HELPERS
====================================================== */
function isoToDate(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10) // YYYY-MM-DD
}

/* ======================================================
   INIT FORM FROM initialValues (EDIT MODE)
====================================================== */
watch(
  () => props.initialValues,
  (camp) => {
    if (!camp) return

    form.name = camp.title ?? camp.name ?? ''
    form.startDate = isoToDate(camp.startDate)
    form.endDate = isoToDate(camp.endDate)
    form.subscriptionStartDate = isoToDate(camp.subStartDatetime ?? camp.subscriptionStartDate)
    form.subscriptionDeadline = isoToDate(camp.subEndDatetime ?? camp.subscriptionDeadline)

    gpxFile.value = null
    removeExistingGpx.value = false
    resetFileInput()
  },
  { immediate: true },
)

/* ======================================================
   GPX HANDLERS
====================================================== */
function onPickGpx(e) {
  gpxFile.value = e.target.files?.[0] ?? null
  if (gpxFile.value) removeExistingGpx.value = false
}

function clearPickedGpx() {
  gpxFile.value = null
  resetFileInput()
}

function requestRemoveExistingGpx() {
  removeExistingGpx.value = true
  gpxFile.value = null
  resetFileInput()
}

/* ======================================================
   SUBMIT
====================================================== */
const canSubmit = computed(() => form.name.trim().length > 0 && !!form.startDate && !!form.endDate)

function onSubmit() {
  if (!canSubmit.value) return

  const payload = {
    name: form.name.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    subscriptionStartDate: form.subscriptionStartDate || null,
    subscriptionDeadline: form.subscriptionDeadline || null,
  }

  // ---- GPX (3 états) ----
  if (gpxFile.value) {
    payload.gpsTrack = { file: gpxFile.value }
  } else if (props.mode === 'edit' && props.existingGpx && removeExistingGpx.value) {
    payload.gpsTrack = null
  }

  emit('submit', payload)
}

/* ======================================================
   TODAY (min date)
====================================================== */
const today = computed(() => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
})
</script>

<template>
  <section class="wrap">
    <h2>{{ mode === 'edit' ? 'Modifier le camp' : "Création d'un nouveau camp" }}</h2>

    <form class="card" @submit.prevent="onSubmit">
      <!-- Titre -->
      <div class="field">
        <label for="name">Titre *</label>
        <input
          id="name"
          v-model.trim="form.name"
          type="text"
          placeholder="Titre du camp"
          required
        />
      </div>

      <!-- Date de début -->
      <div class="field">
        <label for="startDate">Date de début *</label>
        <input id="startDate" v-model="form.startDate" type="date" :min="today" required />
      </div>

      <!-- Date de fin -->
      <div class="field">
        <label for="endDate">Date de fin *</label>
        <input id="endDate" v-model="form.endDate" type="date" :min="today" required />
      </div>

      <!-- Début inscription -->
      <div class="field">
        <label for="subStart">Date de début d’inscription</label>
        <input id="subStart" v-model="form.subscriptionStartDate" type="date" :min="today" />
      </div>

      <!-- Deadline inscription -->
      <div class="field">
        <label for="subEnd">Date limite d’inscription</label>
        <input id="subEnd" v-model="form.subscriptionDeadline" type="date" :min="today" />
      </div>

      <!-- GPX -->
      <div class="field">
        <label>GPX du tracé</label>

        <!-- GPX existant -->
        <div
          v-if="mode === 'edit' && existingGpx && !removeExistingGpx && !gpxFile"
          class="gpx-existing"
        >
          <p class="file-name">
            GPX actuel :
            <strong>{{ existingGpx.fileName ?? 'aucun fichier' }}</strong>
          </p>

          <BaseButton type="button" variant="secondary" size="sm" @click="requestRemoveExistingGpx">
            Retirer le GPX
          </BaseButton>
        </div>

        <!-- GPX supprimé -->
        <div v-else-if="mode === 'edit' && existingGpx && removeExistingGpx">
          <label class="upload">
            <input
              :key="fileInputKey"
              class="upload-input"
              type="file"
              accept=".gpx"
              @change="onPickGpx"
            />
            <span class="upload-btn">＋</span>
            <span class="upload-text">Ajouter un nouveau fichier</span>
          </label>
        </div>

        <!-- Aucun GPX -->
        <div v-else>
          <label class="upload">
            <input
              :key="fileInputKey"
              class="upload-input"
              type="file"
              accept=".gpx"
              @change="onPickGpx"
            />
            <span class="upload-btn">＋</span>
            <span class="upload-text">Ajouter un fichier</span>
          </label>
        </div>

        <!-- Nouveau GPX sélectionné -->
        <div v-if="gpxFile" class="gpx-picked">
          <p class="file-name">
            Nouveau fichier : <strong>{{ gpxFile.name }}</strong>
          </p>
          <BaseButton type="button" variant="secondary" size="sm" @click="clearPickedGpx">
            Retirer le fichier
          </BaseButton>
        </div>
      </div>

      <BaseButton type="submit" variant="primary" size="md" :block="true" :disabled="!canSubmit">
        {{ mode === 'edit' ? 'Enregistrer' : 'Créer le camp' }}
      </BaseButton>
    </form>
  </section>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.card {
  background: var(--c-surface);
  padding: var(--sp-3);
  border-radius: var(--r-input);
}

.field {
  margin-bottom: var(--sp-2);
}

label {
  display: block;
  margin-bottom: 0.35rem;
}

input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
}

.upload {
  display: inline-flex;
  gap: 0.75rem;
  cursor: pointer;
}

.upload-input {
  display: none;
}

.upload-btn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  display: grid;
  place-items: center;
}

.file-name {
  margin-top: 0.5rem;
  font-size: var(--fs-caption);
}

.gpx-picked {
  margin-top: 0.5rem;
}
</style>
