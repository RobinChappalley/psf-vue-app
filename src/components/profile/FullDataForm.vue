<script setup>
import { computed, reactive, ref, watch } from 'vue'
import StepperBubbles from '@/components/ui/StepperBubbles.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  user: { type: Object, required: true },
})

const emit = defineEmits(['submit', 'close'])

function cloneUser(u) {
  try {
    return structuredClone(u)
  } catch {
    return JSON.parse(JSON.stringify(u))
  }
}

/**
 * Helpers dates
 */
function isoToYmd(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function ymdToIso(dateStr) {
  if (!dateStr) return undefined
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

const form = reactive(cloneUser(props.user))

watch(
  () => props.user,
  (u) => {
    const fresh = cloneUser(u)
    Object.keys(form).forEach((k) => delete form[k])
    Object.assign(form, fresh)
    ensureAddress()
    ensureParticipationInfo()
  },
  { deep: true, immediate: true },
)

const steps = [
  { key: 'general', label: 'Général' },
  { key: 'medical', label: 'Médical' },
  { key: 'other', label: 'Autres' },
  { key: 'confirm', label: 'C’est fait !' },
]

const stepIndex = ref(0)
const step = computed(() => steps[stepIndex.value]?.key ?? 'general')

const currentTitle = computed(() => {
  switch (step.value) {
    case 'general':
      return 'INFORMATIONS GÉNÉRALES'
    case 'medical':
      return 'INFORMATIONS MÉDICALES'
    case 'other':
      return 'AUTRES INFORMATIONS'
    case 'confirm':
      return 'MODIFICATIONS ENREGISTRÉES'
    default:
      return ''
  }
})

const errors = reactive({ firstname: '', lastname: '' })

function validateGeneralStep() {
  errors.firstname = ''
  errors.lastname = ''
  const fn = String(form.firstname ?? '').trim()
  const ln = String(form.lastname ?? '').trim()
  if (!fn) errors.firstname = 'Le prénom est obligatoire.'
  if (!ln) errors.lastname = 'Le nom est obligatoire.'
  return !errors.firstname && !errors.lastname
}

const allergyDraft = ref('')
const medDraft = ref('')

function ensureAddress() {
  if (!form.address) form.address = { street: '', city: '', postalCode: '', country: '' }
  form.address.street ??= ''
  form.address.city ??= ''
  form.address.country ??= ''
  if (form.address.postalCode === null || form.address.postalCode === undefined) {
    form.address.postalCode = ''
  }
}

function ensureParticipationInfo() {
  if (!form.participationInfo) {
    form.participationInfo = {
      birthDate: '',
      tshirtInfo: { size: '', gender: '' },
      allergies: [],
      medication: [],
      insuranceNumber: '',
      insuranceName: '',
      idExpireDate: '',
      publicTransportPass: '',
      isCASMember: false,
      isHelicopterInsured: false,
      hasPhotoConsent: false,
      hasPaid: false,
    }
  }

  form.participationInfo.birthDate ??= ''
  form.participationInfo.tshirtInfo ??= { size: '', gender: '' }
  form.participationInfo.tshirtInfo.size ??= ''
  form.participationInfo.tshirtInfo.gender ??= ''
  if (!Array.isArray(form.participationInfo.allergies)) form.participationInfo.allergies = []
  if (!Array.isArray(form.participationInfo.medication)) form.participationInfo.medication = []
  form.participationInfo.insuranceNumber ??= ''
  form.participationInfo.insuranceName ??= ''
  form.participationInfo.idExpireDate ??= ''
  form.participationInfo.publicTransportPass ??= ''
  form.participationInfo.isCASMember ??= false
  form.participationInfo.isHelicopterInsured ??= false
  form.participationInfo.hasPhotoConsent ??= false
  form.participationInfo.hasPaid ??= false

  form.participationInfo.birthDate = isoToYmd(form.participationInfo.birthDate)
  form.participationInfo.idExpireDate = isoToYmd(form.participationInfo.idExpireDate)
}

ensureAddress()
ensureParticipationInfo()

function addAllergy() {
  ensureParticipationInfo()
  const v = allergyDraft.value.trim()
  if (!v) return
  if (!form.participationInfo.allergies.includes(v)) form.participationInfo.allergies.push(v)
  allergyDraft.value = ''
}

function removeAllergy(i) {
  ensureParticipationInfo()
  form.participationInfo.allergies.splice(i, 1)
}

function addMedication() {
  ensureParticipationInfo()
  const v = medDraft.value.trim()
  if (!v) return
  if (!form.participationInfo.medication.includes(v)) form.participationInfo.medication.push(v)
  medDraft.value = ''
}

function removeMedication(i) {
  ensureParticipationInfo()
  form.participationInfo.medication.splice(i, 1)
}

function goToStep(i) {
  stepIndex.value = Math.max(0, Math.min(i, steps.length - 1))
}

const isChild = computed(() => (props.user?.role || []).includes('enfant'))

function nonEmptyString(v) {
  const s = String(v ?? '').trim()
  return s ? s : undefined
}

function buildApiPayload() {
  const payload = {}

  payload.firstname = nonEmptyString(form.firstname)
  payload.lastname = nonEmptyString(form.lastname)

  if (Array.isArray(form.role) && form.role.length) payload.role = form.role
  if (form.parent) payload.parent = form.parent

  if (!isChild.value) {
    const email = nonEmptyString(form.email)
    if (email) payload.email = email
  }

  const street = nonEmptyString(form.address?.street)
  const city = nonEmptyString(form.address?.city)
  const country = nonEmptyString(form.address?.country)

  let postalCode
  const pcRaw = nonEmptyString(form.address?.postalCode)
  if (pcRaw) {
    const n = Number(pcRaw)
    if (!Number.isNaN(n)) postalCode = n
  }

  const address = {}
  if (street) address.street = street
  if (city) address.city = city
  if (country) address.country = country
  if (postalCode !== undefined) address.postalCode = postalCode
  if (Object.keys(address).length) payload.address = address

  const pi = {}

  const birthIso = ymdToIso(form.participationInfo?.birthDate)
  if (birthIso) pi.birthDate = birthIso

  const idExpireIso = ymdToIso(form.participationInfo?.idExpireDate)
  if (idExpireIso) pi.idExpireDate = idExpireIso

  const insNum = nonEmptyString(form.participationInfo?.insuranceNumber)
  if (insNum) pi.insuranceNumber = insNum

  const insName = nonEmptyString(form.participationInfo?.insuranceName)
  if (insName) pi.insuranceName = insName

  const allergies = (form.participationInfo?.allergies || []).map((a) => a.trim()).filter(Boolean)
  if (allergies.length) pi.allergies = allergies

  const medication = (form.participationInfo?.medication || []).map((m) => m.trim()).filter(Boolean)
  if (medication.length) pi.medication = medication

  const pass = nonEmptyString(form.participationInfo?.publicTransportPass)
  if (pass && ['AG', 'demi-tarif', 'aucun'].includes(pass)) pi.publicTransportPass = pass

  const tshirtSize = nonEmptyString(form.participationInfo?.tshirtInfo?.size)
  const tshirtGender = nonEmptyString(form.participationInfo?.tshirtInfo?.gender)
  const tshirt = {}
  if (tshirtSize && ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'].includes(tshirtSize))
    tshirt.size = tshirtSize
  if (tshirtGender && ['m', 'f'].includes(tshirtGender)) tshirt.gender = tshirtGender
  if (Object.keys(tshirt).length) pi.tshirtInfo = tshirt

  // ✅ booleans
  pi.isCASMember = !!form.participationInfo?.isCASMember
  pi.isHelicopterInsured = !!form.participationInfo?.isHelicopterInsured
  pi.hasPhotoConsent = !!form.participationInfo?.hasPhotoConsent
  pi.hasPaid = !!form.participationInfo?.hasPaid

  // ✅ miroir au root pour filtrage backend
  payload.hasPaid = pi.hasPaid

  if (Object.keys(pi).length) payload.participationInfo = pi

  return payload
}

function onNext() {
  if (step.value === 'general') {
    if (!validateGeneralStep()) return
  }

  if (step.value === 'other') {
    const payload = buildApiPayload()
    console.log('FORM SUBMIT PAYLOAD:', payload) // ✅ log au moment du clic
    emit('submit', payload)
    stepIndex.value = steps.findIndex((s) => s.key === 'confirm')
    return
  }

  if (stepIndex.value < steps.length - 1) stepIndex.value += 1
}

function finish() {
  emit('close')
}
</script>

<template>
  <section class="wrap">
    <!-- Header : flèche + titre -->
    <header class="page-header">
      <h2 class="">{{ currentTitle }}</h2>
    </header>

    <!-- Stepper -->
    <div class="stepper">
      <StepperBubbles :steps="steps" :activeIndex="stepIndex" @go="goToStep" />
    </div>

    <!-- Card contenant les "pages" -->
    <form class="card" @submit.prevent="onNext">
      <Transition name="slide" mode="out-in">
        <!-- Étape 1 : Informations générales -->
        <section v-if="step === 'general'" key="general" class="page">
          <!-- Slots optionnels : si tu les fournis, ça remplace -->
          <slot name="general" :form="form">
            <!-- Contenu par défaut minimal (pour éviter une page vide) -->
            <div class="field" v-if="!isChild">
              <label>E-mail</label>
              <input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                placeholder="votre.adresse@example.com"
              />
            </div>

            <div class="field">
              <label>Prénom</label>
              <input
                v-model.trim="form.firstname"
                type="text"
                autocomplete="given-name"
                placeholder="Jon"
              />
              <p v-if="errors.firstname" class="error">{{ errors.firstname }}</p>
            </div>

            <div class="field">
              <label>Nom</label>
              <input
                v-model.trim="form.lastname"
                type="text"
                autocomplete="family-name"
                placeholder="Doe"
              />
              <p v-if="errors.lastname" class="error">{{ errors.lastname }}</p>
            </div>

            <div class="field">
              <label>Adresse (Rue et numéro)</label>
              <input
                v-model.trim="form.address.street"
                type="text"
                autocomplete="street-address"
                placeholder="Rue de l'Exemple 1"
              />
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Code postal</label>
                <input
                  v-model="form.address.postalCode"
                  type="text"
                  inputmode="numeric"
                  placeholder="1000"
                />
              </div>
              <div class="field">
                <label>Localité</label>
                <input
                  v-model.trim="form.address.city"
                  type="text"
                  autocomplete="address-level2"
                  placeholder="Lausanne"
                />
              </div>
            </div>

            <div class="field">
              <label>Pays</label>
              <input
                v-model.trim="form.address.country"
                type="text"
                autocomplete="country-name"
                placeholder="Suisse"
              />
            </div>
          </slot>

          <BaseButton type="submit" variant="primary" size="md" :block="true"> Valider </BaseButton>
        </section>

        <!-- Étape 2 : Informations médicales -->
        <section v-else-if="step === 'medical'" key="medical" class="page">
          <slot name="medical" :form="form">
            <div class="field">
              <label>Date de naissance</label>
              <input v-model="form.participationInfo.birthDate" type="date" />
            </div>

            <div class="field">
              <label>Allergies</label>
              <div class="chips">
                <span v-for="(a, i) in form.participationInfo.allergies" :key="a" class="chip">
                  {{ a }}
                  <button
                    type="button"
                    class="chip-x"
                    aria-label="Supprimer"
                    @click="removeAllergy(i)"
                  >
                    ✕
                  </button>
                </span>
              </div>

              <div class="add-row">
                <input v-model.trim="allergyDraft" type="text" placeholder="Ajouter une allergie" />
                <button type="button" class="add-btn" @click="addAllergy">Ajouter</button>
              </div>
            </div>

            <div class="field">
              <label>Médication</label>
              <div class="chips">
                <span v-for="(m, i) in form.participationInfo.medication" :key="m" class="chip">
                  {{ m }}
                  <button
                    type="button"
                    class="chip-x"
                    aria-label="Supprimer"
                    @click="removeMedication(i)"
                  >
                    ✕
                  </button>
                </span>
              </div>

              <div class="add-row">
                <input v-model.trim="medDraft" type="text" placeholder="Ajouter une médication" />
                <button type="button" class="add-btn" @click="addMedication">Ajouter</button>
              </div>
            </div>
          </slot>

          <BaseButton type="submit" variant="primary" size="md" :block="true"> Valider </BaseButton>
        </section>

        <!-- Étape 3 : Autres informations -->
        <section v-else-if="step === 'other'" key="other" class="page">
          <slot name="other" :form="form">
            <div class="field">
              <label>Numéro d’assurance</label>
              <input
                v-model.trim="form.participationInfo.insuranceNumber"
                type="text"
                placeholder="756.1234.1234.56.78"
              />
            </div>

            <div class="field">
              <label>Nom de l’assurance</label>
              <input
                v-model.trim="form.participationInfo.insuranceName"
                type="text"
                placeholder="Assurance"
              />
            </div>

            <div class="field">
              <label>Date d’expiration ID</label>
              <input v-model="form.participationInfo.idExpireDate" type="date" />
            </div>

            <div class="toggle-row">
              <span>Membre CAS</span>
              <label class="switch">
                <input v-model="form.participationInfo.isCASMember" type="checkbox" />
                <span class="track"></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Assurance hélicoptère</span>
              <label class="switch">
                <input v-model="form.participationInfo.isHelicopterInsured" type="checkbox" />
                <span class="track"></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Consentement photo</span>
              <label class="switch">
                <input v-model="form.participationInfo.hasPhotoConsent" type="checkbox" />
                <span class="track"></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Paiement effectué</span>
              <label class="switch">
                <input v-model="form.participationInfo.hasPaid" type="checkbox" />
                <span class="track"></span>
              </label>
            </div>
          </slot>

          <BaseButton type="submit" variant="primary" size="md" :block="true"> Valider </BaseButton>
        </section>

        <!-- Étape 4 : Confirmation -->
        <section v-else key="confirm" class="page confirm">
          <h3 class="confirm-title">MODIFICATIONS ENREGISTRÉES</h3>
          <p class="confirm-text">Les modifications apportées ont bien été enregistrées.</p>

          <BaseButton type="button" variant="primary" size="md" :block="true" @click="finish">
            Retourner au profil
          </BaseButton>
        </section>
      </Transition>
    </form>
  </section>
</template>

<style scoped>
/* --- Layout page --- */
.wrap {
  padding: var(--sp-3);
  margin: 0 auto;
  max-width: clamp(22rem, 92vw, 34rem);
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.back {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--c-text);
  display: flex;
  align-items: center;
}
.back:active {
  opacity: 0.7;
}

/* --- Card (form container) --- */
.card {
  background: var(--c-surface);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-3);
}

/* --- Page sections inside card --- */
.page {
  min-height: 26rem;
  display: flex;
  flex-direction: column;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: var(--sp-2);
}

label {
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.7);
}

input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  padding: 0.75rem 0.9rem;
  font-size: var(--fs-body);
  font-family: var(--font-body);
  color: var(--c-text);
  background: var(--c-bg);
  outline: none;
}

input:focus {
  border-color: rgba(177, 67, 41, 0.6);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

/* Chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-bg);
  font-size: var(--fs-caption);
}

.chip-x {
  border: none;
  background: none;
  cursor: pointer;
  line-height: 1;
  font-size: 0.95rem;
  opacity: 0.7;
}
.chip-x:active {
  opacity: 0.5;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sp-1);
  margin-top: 0.5rem;
}

.add-btn {
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  border-radius: var(--r-input);
  padding: 0.75rem 0.9rem;
  cursor: pointer;
  font-weight: var(--fw-semibold);
}
.add-btn:active {
  opacity: 0.85;
}

/* Toggle rows */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: 0.25rem 0;
  margin-bottom: var(--sp-1);
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.track {
  width: 3rem;
  height: 1.6rem;
  background: rgba(38, 38, 24, 0.15);
  border-radius: 999px;
  position: relative;
  transition: opacity 160ms ease;
}

.track::after {
  content: '';
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: var(--c-bg);
  box-shadow: var(--shadow-sm);
  transition: transform 160ms ease;
}

.switch input:checked + .track {
  background: rgba(177, 67, 41, 0.35);
}

.switch input:checked + .track::after {
  transform: translateX(1.4rem);
}

/* Confirm */
.confirm-title {
  margin: 0 0 var(--sp-1);
  font-family: var(--font-title);
  font-size: var(--fs-h3);
}

.confirm-text {
  margin: 0 0 var(--sp-3);
  color: rgba(38, 38, 24, 0.75);
}

/* Transition "nouvelle page" */
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.slide-enter-from {
  transform: translateX(10px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.error {
  margin: 0.25rem 0 0;
  font-size: var(--fs-caption);
  color: #b00020;
}
</style>
