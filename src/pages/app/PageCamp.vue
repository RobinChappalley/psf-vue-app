<script setup>
import { computed, ref, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import FullDataForm from '@/components/profile/FullDataForm.vue'
import { authStore } from '@/stores/auth'
import { campsStore } from '@/stores/camps'
import { useChildrenEditor } from '@/composables/useChildrenEditor'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { getUser, updateUser } from '@/services/usersApi'
import CampItemsSection from '@/components/camp/CampItemsSection.vue'

// -------------------------------------------------
// Charger les camps (lazy) via store
// -------------------------------------------------
onMounted(() => {
  campsStore.ensureCampsLoaded()
})

const camps = computed(() => campsStore.camps.value)

// -------------------------------------------------
// Camp courant (HOME => published only)
// -------------------------------------------------
const camp = computed(() => getCurrentCamp(camps.value, 'home'))
const hasCamp = computed(() => !!camp.value)
const campSignupLoading = ref(false)
const campSignupError = ref('')

// -------------------------------------------------
// Navigation interne
// -------------------------------------------------
const step = ref('camp') // 'camp' | 'signup' | 'child-create' | 'confirm'

// -------------------------------------------------
// Helpers dates
// -------------------------------------------------
const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

const campDateLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value.startDate)
  const end = fmtDate(camp.value.endDate)
  if (!start || !end) return ''
  return `du ${start} au ${end}`
})

const subscriptionStatus = computed(() => {
  if (!camp.value) return null
  const start = new Date(camp.value.subStartDatetime)
  const end = new Date(camp.value.subEndDatetime)
  const now = new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'unknown'
  if (now < start) return 'soon'
  if (now >= start && now <= end) return 'open'
  return 'closed'
})

const subscriptionLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value.subStartDatetime)
  const end = fmtDate(camp.value.subEndDatetime)

  if (subscriptionStatus.value === 'soon') return `Inscriptions dès le ${start}`
  if (subscriptionStatus.value === 'open') return `Inscriptions ouvertes jusqu’au ${end}`
  if (subscriptionStatus.value === 'closed') return `Inscriptions fermées (fin : ${end})`
  return ''
})

const infoEveningLabel = computed(() => {
  if (!camp.value?.infoEvening?.dateTime) return ''
  const d = fmtDate(camp.value.infoEvening.dateTime)
  const loc = camp.value.infoEvening.location
  return loc ? `${d} – ${loc}` : d
})

// -------------------------------------------------
// User + rôles
// -------------------------------------------------
const currentUser = computed(() => authStore.user.value)

const isStaff = computed(() => {
  const roles = currentUser.value?.role || []
  return roles.includes('admin') || roles.includes('accompagnant')
})

// -------------------------------------------------
// Composable enfants (création)
// -------------------------------------------------
const { children, selectedChild, openCreateChild, submitChild, closeChildEdit } =
  useChildrenEditor()

function openCreateChildFlow() {
  // selon ton modèle: parfois id = _id ; on sécurise
  const parentId = currentUser.value?.id ?? currentUser.value?._id ?? null
  openCreateChild(parentId)
  step.value = 'child-create'
}

async function onSubmitChildData(payload) {
  await submitChild(payload)

  // recharge depuis l’API (garanti à jour)
  await authStore.fetchChildren()

  // retour à la liste + rebuild
  step.value = 'signup'
  signupPeople.value = buildSignupPeople()
}

// être sûr que la liste est à jour quand on revient
function closeChildCreate() {
  closeChildEdit()
  step.value = 'signup'
  signupPeople.value = buildSignupPeople()
}

// -------------------------------------------------
// Signup list (enfants + éventuellement user staff)
// -------------------------------------------------
const signupPeople = ref([])
const signupLoading = ref(false)
const signupError = ref('')

const buildSignupPeople = () => {
  const campId = camp.value?.id ?? camp.value?._id

  const list = (children.value || []).map((c) => {
    const cid = c.id ?? c._id
    const already = campId
      ? (Array.isArray(c.camps) ? c.camps.map(String) : []).includes(String(campId))
      : false

    return {
      key: `child-${cid}`,
      id: cid,
      firstname: c.firstname,
      selected: already,
      kind: 'child',
    }
  })

  if (isStaff.value && currentUser.value) {
    const uid = currentUser.value.id ?? currentUser.value._id
    const already = campId
      ? (Array.isArray(currentUser.value.camps)
          ? currentUser.value.camps.map(String)
          : []
        ).includes(String(campId))
      : false

    list.unshift({
      key: `user-${uid}`,
      id: uid,
      firstname: currentUser.value.firstname || 'Moi',
      selected: already,
      kind: 'user',
    })
  }

  return list
}

const openSignup = async () => {
  signupError.value = ''
  signupLoading.value = true
  try {
    await authStore.fetchChildren() // parentId pris depuis user.value
    signupPeople.value = buildSignupPeople()
    step.value = 'signup'
  } catch (e) {
    signupError.value = e?.message || 'Impossible de charger les enfants.'
  } finally {
    signupLoading.value = false
  }
}

const selectedPeople = computed(() => signupPeople.value.filter((p) => p.selected))

// -------------------------------------------------
// Navigation actions
// -------------------------------------------------
const goBackToCamp = () => {
  step.value = 'camp'
}

const addChild = () => {
  openCreateChildFlow()
}
const campIdsSet = computed(() => {
  const arr = campsStore.camps.value || []
  return new Set(arr.map((c) => String(c.id ?? c._id)))
})

const isMongoId = (v) => /^[a-f\d]{24}$/i.test(String(v))

const continueSignup = async () => {
  if (selectedPeople.value.length === 0) return
  if (!camp.value) return

  const campId = camp.value.id ?? camp.value._id
  if (!campId) {
    campSignupError.value = 'Camp invalide (id manquant).'
    return
  }

  campSignupError.value = ''
  campSignupLoading.value = true

  try {
    const campIdStr = String(campId)

    // ✅ ensemble des camps existants en DB (chargés via /camps)
    const existingCampIds = campIdsSet.value

    await Promise.all(
      selectedPeople.value.map(async (p) => {
        const u = await getUser(p.id)

        // ✅ garde seulement les ids mongo valides ET qui existent vraiment
        const existing = Array.isArray(u.camps)
          ? u.camps
              .map(String)
              .filter(isMongoId)
              .filter((id) => existingCampIds.has(id))
          : []

        const next = Array.from(new Set([...existing, campIdStr]))

        await updateUser(p.id, { camps: next })
      }),
    )

    await authStore.refreshMe()
    step.value = 'confirm'
  } catch (e) {
    console.log('UPDATE ERROR DATA:', e?.data)
    console.log('UPDATE ERROR FIRST:', e?.data?.errors?.[0])
    campSignupError.value =
      e?.data?.message || e?.data?.error || e?.message || "Impossible d'inscrire au camp."
  } finally {
    campSignupLoading.value = false
  }
}

//Items
const campId = computed(() => camp.value?.id ?? camp.value?._id ?? null)
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
        <h1>{{ camp.title }}</h1>
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
        <CampItemsSection v-if="campId" :camp-id="campId" />
      </section>

      <section class="section">
        <BaseButton type="button" variant="primary" size="md" :block="true" @click="openSignup">
          Inscrire un enfant
        </BaseButton>
      </section>
    </template>

    <!-- ÉCRAN 2 : inscription enfants -->
    <template v-else-if="step === 'signup'">
      <section class="section signup">
        <BackButton @click="goBackToCamp" />

        <h2>INSCRIPTION AU {{ camp.title.toUpperCase() }}</h2>

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
              </div>

              <label class="toggle">
                <input v-model="person.selected" type="checkbox" />
                <span class="track" />
              </label>
            </article>
          </div>

          <BaseButton type="button" variant="secondary" size="md" :block="true" @click="addChild">
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
          type="button"
          variant="primary"
          size="md"
          :block="true"
          :disabled="selectedPeople.length === 0 || campSignupLoading"
          @click="continueSignup"
        >
          {{ campSignupLoading ? 'Inscription…' : 'Continuer' }}
        </BaseButton>
      </section>
    </template>

    <!-- NOUVEL ÉCRAN : création enfant -->
    <template v-else-if="step === 'child-create'">
      <section class="section signup">
        <BackButton @click="closeChildCreate" />

        <h2>AJOUTER UN ENFANT</h2>

        <FullDataForm
          v-if="selectedChild"
          :user="selectedChild"
          @submit="onSubmitChildData"
          @close="closeChildCreate"
        />
      </section>
    </template>

    <!--ÉCRAN 3 : confirmation -->
    <template v-else>
      <section class="section confirm">
        <h1>CONFIRMATION D’INSCRIPTION AU {{ camp.title.toUpperCase() }}</h1>

        <p>Un grand merci !</p>

        <p>
          La prochaine étape est de s’assurer que les données des enfants inscrits sont toujours
          valables.
        </p>

        <p class="note">
          Si vous souhaitez le faire plus tard, vous pourrez retrouver toutes les informations dans
          votre profil, sous la rubrique Enfants
        </p>

        <BaseButton
          as="link"
          :to="{ name: 'app.home' }"
          variant="secondary"
          size="md"
          :block="true"
        >
          Retour à l'accueil
        </BaseButton>

        <BaseButton
          as="link"
          :to="{ name: 'app.profile' }"
          variant="primary"
          size="md"
          :block="true"
        >
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
  padding-bottom: var(--sp-2);
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
  border: 1px solid var(--c-border);
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
  margin-bottom: var(--sp-3);
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
  padding: 0.5rem 1rem;
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
