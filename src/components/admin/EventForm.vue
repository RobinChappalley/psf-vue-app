<script setup>
import { computed, reactive, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventDropdown from '@/components/ui/EventDropdown.vue'

const emit = defineEmits(['submit', 'cancel', 'update:type', 'delete'])

const props = defineProps({
  mode: { type: String, default: 'create' }, // create | edit
  type: { type: String, required: true }, // 'trainings' | 'stages' | 'information-evening' | 'generalMeeting' | 'fundraisings'
  initialValues: { type: Object, default: null },

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

/**
 * Champs "superset" : on a tout, puis on affiche selon le type.
 */
const form = reactive({
  type: props.type,

  // commun
  title: '',
  description: '',
  date: '', // YYYY-MM-DD
  location: '',

  // training
  meetingPoint: '',
  meetingTime: '',
  arrivalMeetingPoint: '',
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
  },
  { immediate: true },
)

watch(
  () => props.initialValues,
  (v) => {
    if (!v) return

    form.title = v.title ?? ''
    form.description = v.remark ?? v.description ?? ''
    form.date = v.date ?? (v.dateTime ? String(v.dateTime).slice(0, 10) : '')
    form.location = v.location ?? ''

    // training: accepter plusieurs noms (compat mock/backend)
    form.meetingPoint = v.meetingPoint ?? ''
    form.meetingTime = v.meetingTime ?? ''

    // ✅ arrivée: supporte returnTime (ton modèle)
    form.arrivalMeetingPoint = v.arrivalMeetingPoint ?? v.returnPoint ?? ''
    form.arrivalTime = v.arrivalTime ?? v.returnTime ?? ''

    form.distance = v.distance != null ? String(v.distance) : ''
    form.elevationGain = v.elevationGain != null ? String(v.elevationGain) : ''
    form.elevationLoss = v.elevationLoss != null ? String(v.elevationLoss) : ''

    form.responsiblePerson = v.responsiblePerson ?? ''

    // stage
    form.startPoint = v.startPoint ?? ''
    form.endPoint = v.endPoint ?? ''
  },
  { immediate: true },
)

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
  // règles minimales (tu affines quand tu veux)
  if (!form.title.trim()) return false
  if (!form.date) return false

  // pour types avec lieu
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

  // payload commun
  const base = {
    type: form.type,
    title: form.title.trim(),
    date: form.date || null,
  }

  let payload

  switch (form.type) {
    case 'trainings':
      // conforme à ton modèle training (sans number -> parent l’ajoute)
      payload = {
        ...base,
        remark: form.description.trim() || null,
        meetingPoint: form.meetingPoint.trim() || null,
        meetingTime: form.meetingTime || null,
        // champs additionnels UI
        arrivalMeetingPoint: form.arrivalMeetingPoint.trim() || null,
        arrivalTime: form.arrivalTime || null,
        distance: toNumberOrNull(form.distance),
        elevationGain: toNumberOrNull(form.elevationGain),
        elevationLoss: toNumberOrNull(form.elevationLoss),
        responsiblePerson: form.responsiblePerson || null,
      }
      break

    case 'stages':
      payload = {
        ...base,
        routeDescription: form.description.trim() || null,
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
        // si tu veux être plus proche de ton modèle backend:
        // dateTime: `${form.date}T18:00:00Z`,
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
          @update:modelValue="$emit('update:type', $event)"
        />
      </div>

      <!-- Titre -->
      <div class="field">
        <label>Titre</label>
        <input v-model.trim="form.title" type="text" placeholder="Titre" />
      </div>

      <!-- Description (training + stage) -->
      <div v-if="visible.showDescription" class="field">
        <label>Description</label>
        <input v-model.trim="form.description" type="text" placeholder="Description" />
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
          <label>Lieu de rendez-vous (arrivée)</label>
          <input v-model.trim="form.arrivalMeetingPoint" type="text" placeholder="Gare ..." />
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

      <div class="actions">
        <BaseButton type="submit" variant="primary" size="md" :block="true" :disabled="!canSubmit">
          Valider
        </BaseButton>

        <!-- Visible uniquement en edit -->
        <BaseButton
          v-if="mode === 'edit'"
          type="button"
          variant="secondary"
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
</style>
