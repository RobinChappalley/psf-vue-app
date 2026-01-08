<script setup>
import { computed, reactive, ref } from 'vue'

const emit = defineEmits(['submit'])

const form = reactive({
  name: '',
  startDate: '', // YYYY-MM-DD
  endDate: '',
  subscriptionStartDate: '',
  subscriptionDeadline: '',
})

const gpxFile = ref(null)

function onPickGpx(e) {
  gpxFile.value = e.target.files?.[0] ?? null
}

const canSubmit = computed(() => form.name.trim().length > 0)

function onSubmit() {
  if (!canSubmit.value) return

  // Payload conforme à ton modèle (clé-kebab-case)
  const payload = {
    name: form.name.trim(),
    'start-date': form.startDate || null,
    'end-date': form.endDate || null,
    'subscription-start-date': form.subscriptionStartDate || null,
    'subscription-deadline': form.subscriptionDeadline || null,

    // Mock : on met le fichier dans l'objet.
    // Plus tard: envoyer le fichier séparément (FormData) et stocker un lien ou un id.
    'GPS-track': gpxFile.value ? { file: gpxFile.value } : {},
  }

  emit('submit', payload)
}
</script>

<template>
  <section class="wrap">
    <h2>Création d'un nouveau camp</h2>

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

        <label class="upload">
          <input class="upload-input" type="file" accept=".gpx" @change="onPickGpx" />
          <span class="upload-btn" aria-hidden="true">＋</span>
          <span class="upload-text">Ajouter un fichier</span>
        </label>

        <p v-if="gpxFile" class="file-name">{{ gpxFile.name }}</p>
      </div>

      <!-- Matériel (placeholder comme ton screen) -->
      <div class="field">
        <label>Matériel pour le camp</label>
        <p class="placeholder">??????????????????</p>
      </div>

      <button class="cta" type="submit" :disabled="!canSubmit">Valider</button>
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

/* CTA button */
.cta {
  width: 100%;
  border: 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--fs-button);
  font-weight: var(--fw-semibold);
  padding: 0.9rem 1rem;
  border-radius: var(--r-button);
  background: var(--c-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
