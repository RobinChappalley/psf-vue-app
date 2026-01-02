<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { authStore } from '@/stores/auth'

// Mock DB : mets null pour simuler "pas de camp"
// const camp = ref(null)

// Décommente pour simuler "camp existant"
const camp = ref({
  id: 'c1',
  name: 'Camp 2026',
  'start-date': '2026-07-12',
  'end-date': '2026-07-31',
  'subscription-start-date-time': '2026-05-01T08:00:00',
  'subscription-deadline-date-time': '2026-06-15T23:59:00',
  'GPS-track': {},
  'items-list': [{ item_id: 'i1', quantity: 1 }],
  'information-evening': {
    'date-time': '2026-06-16T18:30:00',
    location: 'Neuchâtel',
    participants: [],
  },
})

// Mock enfants (plus tard: viendra de la DB via parent.children)
const children = ref([
  { id: '1', firstname: 'Lucas', selected: true },
  { id: '2', firstname: 'Jane', selected: true },
  { id: '3', firstname: 'Zoé', selected: false },
])

// navigation interne (comme création de compte)
const step = ref('camp') // 'camp' | 'signup' | 'confirm'

// section pour afficher le camp
const hasCamp = computed(() => !!camp.value)

// --- helpers dates ---
const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

const campDateLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value['start-date'])
  const end = fmtDate(camp.value['end-date'])
  if (!start || !end) return ''
  return `du ${start} au ${end}`
})

const subscriptionStatus = computed(() => {
  if (!camp.value) return null
  const start = new Date(camp.value['subscription-start-date-time'])
  const end = new Date(camp.value['subscription-deadline-date-time'])
  const now = new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'unknown'
  if (now < start) return 'soon'
  if (now >= start && now <= end) return 'open'
  return 'closed'
})

const subscriptionLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value['subscription-start-date-time'])
  const end = fmtDate(camp.value['subscription-deadline-date-time'])

  if (subscriptionStatus.value === 'soon') return `Inscriptions dès le ${start}`
  if (subscriptionStatus.value === 'open') return `Inscriptions ouvertes jusqu’au ${end}`
  if (subscriptionStatus.value === 'closed') return `Inscriptions fermées (fin : ${end})`
  return ''
})

const infoEveningLabel = computed(() => {
  if (!camp.value?.['information-evening']?.['date-time']) return ''
  const d = fmtDate(camp.value['information-evening']['date-time'])
  const loc = camp.value['information-evening'].location
  return loc ? `${d} – ${loc}` : d
})

// --- user + roles ---
const currentUser = computed(() => authStore.user.value)

const isStaff = computed(() => {
  const roles = currentUser.value?.role || []
  return roles.includes('admin') || roles.includes('accompagnant')
})

// --- signup list (enfants + éventuellement user staff) ---
const signupPeople = ref([])

const buildSignupPeople = () => {
  const list = (children.value || []).map((c) => ({
    key: `child-${c.id}`,
    id: c.id,
    firstname: c.firstname,
    selected: !!c.selected,
    kind: 'child',
  }))

  //si admin/accompagnant => se rajoute dans la liste
  if (isStaff.value && currentUser.value) {
    list.unshift({
      key: `user-${currentUser.value.id}`,
      id: currentUser.value.id,
      firstname: currentUser.value.firstname || 'Moi',
      selected: false, // mets true si tu veux le pré-sélectionner
      kind: 'user',
    })
  }

  return list
}

const selectedPeople = computed(() => signupPeople.value.filter((p) => p.selected))

// --- navigation actions ---
const openSignup = () => {
  signupPeople.value = buildSignupPeople()
  step.value = 'signup'
}

const goBackToCamp = () => {
  step.value = 'camp'
}

const addChild = () => {
  console.log('Ajouter un enfant')
}

const editPerson = (person) => {
  console.log('Modifier', person)
}

const continueSignup = () => {
  if (selectedPeople.value.length === 0) return
  console.log('Continuer avec', selectedPeople.value)
  step.value = 'confirm'
}

// confirmation actions
const goHome = () => {
  console.log('Retour accueil')
  step.value = 'camp'
}

const updateData = () => {
  console.log('Mettre à jour les données')
}
</script>

<template>
  <!-- pas de camp -->
  <template v-if="!hasCamp">
    <section class="empty-page">
      <section class="section">
        <h1>Camp</h1>
        <p>
          Le prochain camp est en préparation. Nous travaillons actuellement à la définition du
          parcours et du programme.
        </p>
      </section>
    </section>
  </template>

  <!-- il y a un camp -->
  <template v-else>
    <!-- ÉCRAN 1 : infos camp -->
    <template v-if="step === 'camp'">
      <section class="section intro">
        <h1>{{ camp.name }}</h1>
        <div>
          <p v-if="campDateLabel">Cette année, le camp se déroulera {{ campDateLabel }}.</p>
          <p v-if="subscriptionLabel">{{ subscriptionLabel }}</p>
        </div>
      </section>

      <section class="section">
        <h2>Informations clés</h2>

        <dl class="facts">
          <div class="row">
            <dt>Date</dt>
            <dd>{{ campDateLabel || '—' }}</dd>
          </div>

          <div class="row">
            <dt>Âge</dt>
            <dd>Entre 8 et 16 ans</dd>
          </div>

          <div class="row">
            <dt>Soirée info</dt>
            <dd>{{ infoEveningLabel || '—' }}</dd>
          </div>

          <div class="row">
            <dt>Prix</dt>
            <dd>CHF 250.-</dd>
          </div>
        </dl>

        <p>
          Le parcours est adapté aux jeunes participants et préparé tout au long de l’année, grâce à
          des entrainements.
        </p>
      </section>

      <section class="section">
        <BaseButton class="cta" type="button" @click="openSignup"> Inscrire un enfant </BaseButton>
      </section>
    </template>

    <!-- ÉCRAN 2 : inscription enfants -->
    <template v-else-if="step === 'signup'">
      <section class="section signup">
        <button class="back" type="button" @click="goBackToCamp">← {{ camp.name }}</button>

        <h1>INSCRIPTION AU {{ camp.name.toUpperCase() }}</h1>

        <p>Sélectionnez les personnes que vous souhaitez inscrire pour le camp 2026.</p>
        <p>Les personnes ayant déjà participés sont pré-sélectionnées.</p>

        <div class="block">
          <div class="list">
            <article v-for="person in signupPeople" :key="person.key" class="child-card">
              <div class="child-main">
                <p class="child-name">
                  {{ person.firstname }}
                  <span v-if="person.kind === 'user'" class="tag">(vous)</span>
                </p>
                <button class="edit" type="button" @click="editPerson(person)">
                  Modifier les données
                </button>
              </div>

              <label class="toggle">
                <input v-model="person.selected" type="checkbox" />
                <span class="track" />
              </label>
            </article>
          </div>

          <BaseButton class="cta btn--secondary" type="button" @click="addChild">
            Ajouter un enfant
          </BaseButton>
        </div>

        <div>
          <p>Vous pouvez modifier votre sélection jusqu'à la date limite d'inscription au camp</p>
          <div class="selection">
            <h3>VOTRE SÉLECTION</h3>
            <p>
              {{ selectedPeople.length }} personne{{
                selectedPeople.length > 1 ? 's' : ''
              }}
              sélectionnée{{ selectedPeople.length > 1 ? 's' : '' }} pour le camp 2026
            </p>
          </div>
        </div>

        <BaseButton
          class="cta"
          type="button"
          :disabled="selectedPeople.length === 0"
          @click="continueSignup"
        >
          Continuer
        </BaseButton>
      </section>
    </template>

    <!--ÉCRAN 3 : confirmation -->
    <template v-else>
      <section class="section confirm">
        <h1>CONFIRMATION D’INSCRIPTION AU {{ camp.name.toUpperCase() }}</h1>

        <p>Un grand merci !</p>

        <p>
          La prochaine étape est de s’assurer que les données des enfants inscrits sont toujours
          valables.
        </p>

        <p class="note">
          Si vous souhaitez le faire plus tard, vous pourrez retrouver toutes les informations dans
          votre profil, sous la rubrique Enfants
        </p>
        <BaseButton class="cta btn--secondary" as="link" :to="{ name: 'app.home' }">
          Retour à l'accueil
        </BaseButton>
        <BaseButton class="cta" as="link" :to="{ name: 'app.profile' }">
          Mettre à jour les données
        </BaseButton>
      </section>
    </template>
  </template>
</template>

<style scoped>
/* tableau "Date / Âge" */
.facts {
  margin: 0 0 var(--sp-4);
}

.row {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: var(--sp-2);
  align-items: baseline;
  margin-bottom: var(--sp-2);
}

dt {
  font-weight: var(--fw-semibold);
}

dd {
  margin: 0;
}

.cta {
  margin: var(--sp-4) auto 0;
  display: block;
  max-width: 20rem;
}

p + p {
  padding-top: 1rem;
}

/* --- Signup screen --- */
.signup h1 {
  margin-top: var(--sp-2);
}

.back {
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: var(--sp-2);
  font: inherit;
  color: var(--c-text);
  opacity: 0.9;
  cursor: pointer;
}

.tag {
  font-size: var(--fs-caption);
  opacity: 0.75;
  margin-left: 0.25rem;
}

.list {
  margin-top: var(--sp-3);
  display: grid;
  gap: var(--sp-2);
}

.child-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  padding: var(--sp-2);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-left: 1rem;
  margin-right: 1rem;
}

.child-main {
  min-width: 0;
}

.child-name {
  margin: 0;
  font-family: var(--font-title);
  text-transform: uppercase;
}

.edit {
  margin-top: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-primary);
  font-size: var(--fs-caption);
  text-decoration: underline;
  cursor: pointer;
}

/* Toggle */
.toggle {
  position: relative;
  width: 3.25rem;
  height: 1.75rem;
  flex: 0 0 auto;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  transition: all 0.2s ease;
}

.track::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.2rem;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: var(--c-bg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.toggle input:checked + .track {
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.toggle input:checked + .track::after {
  left: calc(100% - 1.25rem - 0.2rem);
}

/* bloc sélection */
.selection {
  margin-top: var(--sp-3);
  background: var(--c-bg);
  border: 1px solid var(--c-secondary);
  border-radius: var(--r-input);
  padding: var(--sp-2);
}

.selection h3 {
  margin: 0 0 var(--sp-1);
}

.block {
  background: var(--c-surface);
  border: 1px solid var(--c-surface);
  border-radius: var(--r-input);
  box-shadow: none;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/* --- Confirm screen --- */
.confirm h1 {
  margin-bottom: var(--sp-2);
}

.note {
  margin-top: var(--sp-2);
  opacity: 0.75;
}
</style>
