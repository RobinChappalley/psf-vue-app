<script setup>
import { reactive, computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  /**
   * Optionnel: si un jour tu réutilises le form pour "éditer"
   * tu peux passer un camp initial.
   */
  initialValue: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const form = reactive({
  title: props.initialValue?.title ?? '',
  startDate: props.initialValue?.startDate ?? '', // YYYY-MM-DD
  endDate: props.initialValue?.endDate ?? '', // YYYY-MM-DD
  subStartDate: props.initialValue?.subStartDatetime?.slice(0, 10) ?? '', // YYYY-MM-DD
  subEndDate: props.initialValue?.subEndDatetime?.slice(0, 10) ?? '', // YYYY-MM-DD
})

const gpxFile = ref(null)

function onPickGpx(e) {
  const file = e.target.files?.[0] ?? null
  gpxFile.value = file
}

const canSubmit = computed(() => {
  if (!form.title.trim()) return false
  // tu peux renforcer plus tard (start<=end, subStart<=subEnd, etc.)
  return true
})

function toUtcISODateStart(dateStr) {
  // "YYYY-MM-DD" -> "YYYY-MM-DDT00:00:00Z"
  if (!dateStr) return null
  return `${dateStr}T00:00:00Z`
}

function toUtcISODateEnd(dateStr) {
  // "YYYY-MM-DD" -> "YYYY-MM-DDT23:59:59Z"
  if (!dateStr) return null
  return `${dateStr}T23:59:59Z`
}

function submit() {
  if (!canSubmit.value) return

  const payload = {
    title: form.title.trim(),
    startDate: form.startDate || null,
    endDate: form.endDate || null,

    // selon ton modèle API: subStartDatetime / subEndDatetime
    subStartDatetime: form.subStartDate ? toUtcISODateStart(form.subStartDate) : null,
    subEndDatetime: form.subEndDate ? toUtcISODateEnd(form.subEndDate) : null,

    // fichier GPX (à parser côté backend plus tard)
    gpxFile: gpxFile.value,
  }

  emit('submit', payload)
}
</script>

<template>
  <form class="camp-form" @submit.prevent="submit">
    <h1 class="title">CRÉATION D'UN CAMP</h1>

    <!-- Titre -->
    <div class="field">
      <label class="label">Titre *</label>
      <input
        v-model="form.title"
        class="input"
        type="text"
        placeholder="Titre du camp"
        autocomplete="off"
        required
      />
    </div>

    <!-- Date début -->
    <div class="field">
      <label class="label">Date de début</label>
      <div class="input-wrap">
        <input v-model="form.startDate" class="input input--date" type="date" />
        <span class="date-icon" aria-hidden="true">12</span>
      </div>
    </div>

    <!-- Date fin -->
    <div class="field">
      <label class="label">Date de fin</label>
      <div class="input-wrap">
        <input v-model="form.endDate" class="input input--date" type="date" />
        <span class="date-icon" aria-hidden="true">12</span>
      </div>
    </div>

    <!-- Début inscription -->
    <div class="field">
      <label class="label">Date de début d’inscription</label>
      <div class="input-wrap">
        <input v-model="form.subStartDate" class="input input--date" type="date" />
        <span class="date-icon" aria-hidden="true">12</span>
      </div>
    </div>

    <!-- Deadline inscription -->
    <div class="field">
      <label class="label">Date limite d’inscription</label>
      <div class="input-wrap">
        <input v-model="form.subEndDate" class="input input--date" type="date" />
        <span class="date-icon" aria-hidden="true">12</span>
      </div>
    </div>

    <!-- GPX -->
    <div class="field">
      <label class="label">GPX du tracé</label>

      <label class="upload">
        <input class="upload-input" type="file" accept=".gpx" @change="onPickGpx" />
        <span class="upload-btn" aria-hidden="true">＋</span>
        <span class="upload-text">Ajouter un fichier</span>
      </label>

      <p v-if="gpxFile" class="file-name">{{ gpxFile.name }}</p>
    </div>

    <!-- Matériel -->
    <div class="field">
      <label class="label">Matériel pour le camp</label>
      <p class="placeholder">??????????????????</p>
    </div>

    <BaseButton class="cta" type="submit" :disabled="!canSubmit || submitting">
      Valider
    </BaseButton>
  </form>
</template>

<style scoped>
.camp-form {
  display: grid;
  gap: var(--sp-3);
}

/* titre */
.title {
  margin: 0 0 var(--sp-2);
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  font-weight: var(--fw-title);
  text-transform: uppercase;
}

/* fields */
.field {
  display: grid;
  gap: 0.5rem;
}

.label {
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.85);
}

/* inputs */
.input {
  width: 100%;
  padding: 0.9rem 0.9rem;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-bg);
  font-size: var(--fs-body);
}

.input-wrap {
  position: relative;
}

.input--date {
  padding-right: 3rem;
}

/* mini "icon" à droite (placeholder style) */
.date-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  color: rgba(38, 38, 24, 0.8);
  background: var(--c-bg);
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
  margin: 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}

/* placeholder matériel */
.placeholder {
  margin: 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.55);
}

/* CTA */
.cta {
  margin-top: var(--sp-2);
}
</style>
