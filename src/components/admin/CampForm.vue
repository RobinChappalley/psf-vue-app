<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const emit = defineEmits(['submit'])

const props = defineProps({
  mode: { type: String, default: 'create' }, // "create" | "edit"
  initialValues: { type: Object, default: null },

  // ex: { fileName: "trace.gpx", url: "..." } ou { fileName: "trace.gpx" }
  existingGpx: { type: Object, default: null },
})

const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  subscriptionStartDate: '',
  subscriptionDeadline: '',
})

const gpxFile = ref(null)

// true = l’admin a demandé de supprimer le GPX existant
const removeExistingGpx = ref(false)

function isoToDate(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

watch(
  () => props.initialValues,
  (camp) => {
    if (!camp) return

    form.name = camp.title ?? camp.name ?? ''
    form.startDate = camp.startDate ?? ''
    form.endDate = camp.endDate ?? ''
    form.subscriptionStartDate = isoToDate(camp.subStartDatetime)
    form.subscriptionDeadline = isoToDate(camp.subEndDatetime)

    // reset GPX UI
    gpxFile.value = null
    removeExistingGpx.value = false
  },
  { immediate: true },
)

function onPickGpx(e) {
  gpxFile.value = e.target.files?.[0] ?? null
  // si je choisis un nouveau fichier, ça veut dire "je ne supprime pas",
  // je remplace
  if (gpxFile.value) removeExistingGpx.value = false
}

function clearPickedGpx() {
  gpxFile.value = null
}

function requestRemoveExistingGpx() {
  // si on demande la suppression, on annule un éventuel fichier choisi
  removeExistingGpx.value = true
  gpxFile.value = null
}

const canSubmit = computed(() => form.name.trim().length > 0)

function onSubmit() {
  if (!canSubmit.value) return

  // base payload
  const payload = {
    name: form.name.trim(),
    'start-date': form.startDate || null,
    'end-date': form.endDate || null,
    'subscription-start-date': form.subscriptionStartDate || null,
    'subscription-deadline': form.subscriptionDeadline || null,
  }

  // ---- gestion GPX (3 états) ----
  // 1) remplacement
  if (gpxFile.value) {
    payload['GPS-track'] = { file: gpxFile.value }
  }
  // 2) suppression (edit uniquement, et seulement si un existant)
  else if (props.mode === 'edit' && props.existingGpx && removeExistingGpx.value) {
    payload['GPS-track'] = null
  }
  // 3) sinon: ne rien mettre => pas de changement côté backend
  // (donc pas de clé 'GPS-track')

  emit('submit', payload)
}
</script>

<template>
  <section class="wrap">
    <h2>{{ props.mode === 'edit' ? 'Modifier le camp' : "Création d'un nouveau camp" }}</h2>

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
        <label for="startDate">Date de début</label>
        <div class="input-wrap">
          <input id="startDate" v-model="form.startDate" type="date" />
        </div>
      </div>

      <!-- Date de fin -->
      <div class="field">
        <label for="endDate">Date de fin</label>
        <div class="input-wrap">
          <input id="endDate" v-model="form.endDate" type="date" />
        </div>
      </div>

      <!-- Début inscription -->
      <div class="field">
        <label for="subStart">Date de début d’inscription</label>
        <div class="input-wrap">
          <input id="subStart" v-model="form.subscriptionStartDate" type="date" />
        </div>
      </div>

      <!-- Deadline inscription -->
      <div class="field">
        <label for="subEnd">Date limite d’inscription</label>
        <div class="input-wrap">
          <input id="subEnd" v-model="form.subscriptionDeadline" type="date" />
        </div>
      </div>

      <!-- GPX -->
      <div class="field">
        <label>GPX du tracé</label>

        <!-- Etat: GPX existant (edit) -->
        <div
          v-if="mode === 'edit' && existingGpx && !removeExistingGpx && !gpxFile"
          class="gpx-existing"
        >
          <p class="file-name">
            GPX actuel : <strong>{{ existingGpx.fileName ?? 'aucun fichier' }}</strong>
          </p>

          <div class="gpx-actions">
            <BaseButton
              type="button"
              variant="secondary"
              size="sm"
              @click="requestRemoveExistingGpx"
            >
              Retirer le GPX
            </BaseButton>

            <label class="upload">
              <input class="upload-input" type="file" accept=".gpx" @change="onPickGpx" />
              <span class="upload-btn" aria-hidden="true">＋</span>
              <span class="upload-text">Remplacer le fichier</span>
            </label>
          </div>
        </div>

        <!-- Etat: suppression demandée -->
        <div v-else-if="mode === 'edit' && existingGpx && removeExistingGpx" class="gpx-removed">
          <p class="file-name">Le GPX est supprimé</p>

          <div class="gpx-actions">
            <label class="upload">
              <input class="upload-input" type="file" accept=".gpx" @change="onPickGpx" />
              <span class="upload-btn" aria-hidden="true">＋</span>
              <span class="upload-text">Ajouter un nouveau fichier</span>
            </label>

            <BaseButton
              type="button"
              variant="secondary"
              size="sm"
              @click="removeExistingGpx = false"
            >
              Annuler
            </BaseButton>
          </div>
        </div>

        <!-- Etat: aucun existant OU create -->
        <div v-else class="gpx-new">
          <label class="upload">
            <input class="upload-input" type="file" accept=".gpx" @change="onPickGpx" />
            <span class="upload-btn" aria-hidden="true">＋</span>
            <span class="upload-text">Ajouter un fichier</span>
          </label>
        </div>

        <!-- Etat: nouveau fichier sélectionné -->
        <div v-if="gpxFile" class="gpx-picked">
          <p class="file-name">
            Nouveau fichier : <strong>{{ gpxFile.name }}</strong>
          </p>
          <BaseButton type="button" variant="secondary" size="sm" @click="clearPickedGpx">
            Retirer le nouveau fichier
          </BaseButton>
        </div>
      </div>

      <!-- Matériel (placeholder comme ton screen) -->
      <div class="field">
        <label>Matériel pour le camp</label>
        <p class="placeholder">??????????????????</p>
      </div>

      <BaseButton type="submit" variant="primary" size="md" :block="true" :disabled="!canSubmit">
        {{ props.mode === 'edit' ? 'Enregistrer' : 'Valider' }}
      </BaseButton>
    </form>
  </section>
</template>

<style scoped>
/* --- Layout page --- */
.wrap {
  width: 100%;
  box-sizing: border-box;
}

/* --- Card (le form) --- */
.card {
  background: var(--c-surface);
  padding: var(--sp-3);
  box-sizing: border-box;
  border-radius: var(--r-input);
}

/* --- Fields --- */
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

input {
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

input::placeholder {
  color: var(--c-border);
}

input[type='date'] {
  color: var(--c-border);
}

.input-wrap input[type='date'] {
  padding-right: 0.5rem;
}

/* upload */
.upload {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
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

.upload-text {
  font-size: var(--fs-caption);
}

.file-name {
  margin: 0.5rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}

.placeholder {
  margin: 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.55);
}
.gpx-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.gpx-picked {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}
</style>
