<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventDropdown from '@/components/ui/EventDropdown.vue'

const emit = defineEmits(['submit', 'cancel', 'update:type', 'delete'])

const props = defineProps({
  mode: { type: String, default: 'create' }, // create | edit
  type: { type: String, required: true }, // 'trainings' | 'stages' | 'information-evening' | 'generalMeeting' | 'fundraisings'
  initialValues: { type: Object, default: null },

  // ex: { fileName: "trace.gpx", url: "..." }
  existingGpx: { type: Object, default: null },

  // dropdown options (même format que ton EventDropdown)
  typeOptions: { type: Array, default: () => [] }, // [{ key,label,enabled }]

  // pour dropdown responsable (training)
  responsibleOptions: { type: Array, default: () => [] }, // [{ value,label }]
})

const responsibleDropdownOptions = computed(() =>
  (props.responsibleOptions ?? []).map((o) => ({
    key: o.value,
    label: o.label,
    enabled: true,
  })),
)

//gestion des dates
function toDateInput(v) {
  if (!v) return ''
  // déjà bon
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''

  return d.toISOString().slice(0, 10)
}

/* ======================================================
   GPX STATE (déclaré AVANT watch/onSubmit)
====================================================== */
const gpxFile = ref(null)
const fileInputKey = ref(0)
const removeExistingGpx = ref(false)

function resetFileInput() {
  fileInputKey.value += 1
}

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

/**
 * Champs "superset" : on a tout, puis on affiche selon le type.
 */
const form = reactive({
  type: props.type,

  // commun
  date: '',
  location: '',

  // training
  meetingPoint: '',
  meetingTime: '',
  arrivalTime: '',
  distance: '',
  elevationGain: '',
  elevationLoss: '',
  responsiblePerson: '',

  // stage
  startPoint: '',
  endPoint: '',
})

watch(
  () => props.type,
  (t) => {
    form.type = t

    // reset GPX quand on change de type (évite que le GPX reste sélectionné si on passe à "stages")
    gpxFile.value = null
    removeExistingGpx.value = false
    resetFileInput()
  },
  { immediate: true },
)

watch(
  () => props.initialValues,
  (v) => {
    if (!v) return

    form.date = toDateInput(v.date ?? v.dateTime)
    form.location = v.location ?? ''

    // training
    form.meetingPoint = v.meetingPoint ?? ''
    form.meetingTime = v.meetingTime ?? ''
    form.arrivalTime = v.arrivalTime ?? v.returnTime ?? ''

    form.distance = v.distance != null ? String(v.distance) : ''
    form.elevationGain = v.elevationGain != null ? String(v.elevationGain) : ''
    form.elevationLoss = v.elevationLoss != null ? String(v.elevationLoss) : ''

    const rawResp =
      v.responsiblePerson ??
      v.responsiblePersonId ??
      v.responsiblePerson?._id ??
      v.responsiblePerson?.id ??
      v.responsiblePersonId?._id ??
      v.responsiblePersonId?.id ??
      ''

    form.responsiblePerson =
      typeof rawResp === 'object' && rawResp !== null
        ? (rawResp.id ?? rawResp._id ?? '')
        : (rawResp ?? '')

    // stage
    form.startPoint = v.startPoint ?? ''
    form.endPoint = v.endPoint ?? ''

    // reset GPX à l’ouverture/chargement
    gpxFile.value = null
    removeExistingGpx.value = false
    resetFileInput()
  },
  { immediate: true },
)

function onPickResponsible(v) {
  // EventDropdown peut renvoyer un id (string) OU un objet { key, ... }
  form.responsiblePerson =
    typeof v === 'object' && v !== null ? (v.key ?? v.value ?? v.id ?? v._id ?? '') : (v ?? '')
}

/** Quels champs afficher ? */
const visible = computed(() => {
  switch (form.type) {
    case 'trainings':
      return {
        showDescription: true,
        showLocation: false,
        showTraining: true,
        showStage: false,
      }
    case 'stages':
      return {
        showDescription: true,
        showLocation: false,
        showTraining: false,
        showStage: true,
      }
    case 'information-evening':
    case 'generalMeeting':
    case 'fundraisings':
      return {
        showDescription: false,
        showLocation: true,
        showTraining: false,
        showStage: false,
      }
    default:
      return {
        showDescription: false,
        showLocation: false,
        showTraining: false,
        showStage: false,
      }
  }
})

const canSubmit = computed(() => {
  if (!form.date) return false
  if (visible.value.showLocation && !form.location.trim()) return false
  return true
})

function toNumberOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function onDelete() {
  if (props.mode !== 'edit') return
  if (props.confirmDelete) {
    const ok = window.confirm('Supprimer cet évènement ? Cette action est définitive.')
    if (!ok) return
  }
  emit('delete')
}

function onSubmit() {
  if (!canSubmit.value) return

  const base = {
    type: form.type,
    date: form.date || null,
  }

  let payload

  switch (form.type) {
    case 'trainings':
      payload = {
        ...base,
        meetingPoint: form.meetingPoint.trim() || null,
        meetingTime: form.meetingTime || null,
        arrivalTime: form.arrivalTime || null,
        distance: toNumberOrNull(form.distance),
        elevationGain: toNumberOrNull(form.elevationGain),
        elevationLoss: toNumberOrNull(form.elevationLoss),
        responsiblePerson: form.responsiblePerson || null,
      }

      // ---- GPX (même logique que CampForm) ----
      if (gpxFile.value) {
        payload.gpsTrack = { file: gpxFile.value }
      } else if (props.mode === 'edit' && props.existingGpx && removeExistingGpx.value) {
        payload.gpsTrack = null
      }
      break

    case 'stages':
      payload = {
        ...base,
        startPoint: form.startPoint.trim() || null,
        endPoint: form.endPoint.trim() || null,
        distance: toNumberOrNull(form.distance),
        elevationGain: toNumberOrNull(form.elevationGain),
        elevationLoss: toNumberOrNull(form.elevationLoss),
      }
      break

    case 'information-evening':
      payload = {
        ...base,
        location: form.location.trim(),
      }
      break

    case 'generalMeeting':
      payload = {
        ...base,
        location: form.location.trim(),
      }
      break

    case 'fundraisings':
      payload = {
        ...base,
        location: form.location.trim(),
      }
      break

    default:
      payload = { ...base }
  }

  emit('submit', payload)
}

//s'assurer que l'évènement ne soit pas dans le passé
const today = computed(() => {
  const d = new Date()
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
})
</script>

<template>
  <section class="wrap">
    <form class="card" @submit.prevent="onSubmit">
      <!-- Type d’évènement (dropdown) -->
      <div class="field">
        <label>Évènement</label>
        <EventDropdown
          :model-value="form.type"
          :options="typeOptions"
          @update:modelValue="onPickResponsible"
        />
      </div>

      <!-- Date -->
      <div class="field">
        <label>Date</label>
        <div class="input-wrap">
          <input id="date" v-model="form.date" type="date" :min="today" />
        </div>
      </div>

      <!-- Lieu (info evening / ag / fundraising) -->
      <div v-if="visible.showLocation" class="field">
        <label>Lieu</label>
        <input v-model.trim="form.location" type="text" placeholder="Adresse / lieu" />
      </div>

      <!-- TRAINING fields -->
      <template v-if="visible.showTraining">
        <div class="field">
          <label>Lieu de rendez-vous</label>
          <input v-model.trim="form.meetingPoint" type="text" placeholder="Gare ..." />
        </div>

        <div class="field">
          <label>Heure de rendez-vous (départ)</label>
          <input v-model="form.meetingTime" type="time" />
        </div>

        <div class="field">
          <label>Heure de rendez-vous (arrivée)</label>
          <input v-model="form.arrivalTime" type="time" />
        </div>
      </template>

      <!-- STAGE fields -->
      <template v-if="visible.showStage">
        <div class="field">
          <label>Point de départ</label>
          <input v-model.trim="form.startPoint" type="text" placeholder="Départ" />
        </div>

        <div class="field">
          <label>Point d’arrivée</label>
          <input v-model.trim="form.endPoint" type="text" placeholder="Arrivée" />
        </div>
      </template>

      <!-- Champs communs training + stage -->
      <template v-if="visible.showTraining || visible.showStage">
        <div class="field">
          <label for="distance">Distance (km)</label>
          <input
            id="distance"
            v-model.number="form.distance"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.1"
            placeholder="ex : 12.5"
          />
        </div>

        <div class="field">
          <label for="elevationGain">Dénivelé positif (m)</label>
          <input
            id="elevationGain"
            v-model.number="form.elevationGain"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            placeholder="ex : 300"
          />
        </div>

        <div v-if="visible.showStage" class="field">
          <label>Dénivelé négatif</label>
          <input v-model.trim="form.elevationLoss" type="number" step="1" placeholder="200" />
        </div>
      </template>

      <!-- Responsable (training) -->
      <div v-if="visible.showTraining" class="field">
        <label>Personne responsable</label>

        <EventDropdown
          :model-value="form.responsiblePerson"
          :placeholder="'Choisir'"
          :options="responsibleDropdownOptions"
          @update:modelValue="form.responsiblePerson = $event"
        />
      </div>

      <!-- GPX (training only) -->
      <div v-if="visible.showTraining" class="field">
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

      <div class="actions">
        <BaseButton type="submit" variant="primary" size="md" :block="true" :disabled="!canSubmit">
          Valider
        </BaseButton>

        <!-- Visible uniquement en edit -->
        <BaseButton
          v-if="mode === 'edit'"
          type="button"
          variant="tertiary"
          size="md"
          :block="true"
          @click="onDelete"
        >
          Supprimer l’évènement
        </BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.wrap {
  width: 100%;
  box-sizing: border-box;
}

.card {
  background: var(--c-surface);
  padding: var(--sp-3);
  box-sizing: border-box;
  border-radius: var(--r-input);
}

/* Fields */
.field {
  margin-bottom: var(--sp-2);
}

label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  line-height: 1.2;
  margin-bottom: 0.35rem;
  color: var(--c-text);
}

input,
.select {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  padding: 0.65rem 0.75rem;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text);
  outline: none;
}

input[type='date'] {
  color: var(--c-border);
}

.input-wrap input[type='date'] {
  padding-right: 0.5rem;
}

input[type='date']:valid {
  color: var(--c-text);
}
.actions {
  display: grid;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
.gpx-picked {
  margin-top: 0.5rem;
}
</style>
