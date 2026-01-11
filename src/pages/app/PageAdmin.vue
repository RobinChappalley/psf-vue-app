<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { authStore } from '@/stores/auth'
import { campsStore } from '@/stores/camps'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
import { getUser as apiGetUser } from '@/services/usersApi'

// API Camp
import {
  createCamp as apiCreateCamp,
  updateCamp as apiUpdateCamp,
  deleteCamp as apiDeleteCamp,
} from '@/services/campsApi'

// API trainings
import {
  createTraining as apiCreateTraining,
  updateTraining as apiUpdateTraining,
  deleteTraining as apiDeleteTraining,
  getTrainings as apiGetTrainings,
} from '@/services/trainingsApi'

//API items
import { getItems as apiGetItems } from '@/services/itemsApi'
import { getCampItems, addCampItem, deleteCampItem } from '@/services/campItemsApi'

// Components
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BackButton from '@/components/ui/BackButton.vue'
import CampForm from '@/components/admin/CampForm.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import CampEventsSection from '@/components/admin/CampEventsSection.vue'
import CreateCampEventSection from '@/components/admin/CreateCampEventSection.vue'
import EventForm from '@/components/admin/EventForm.vue'
import CampParticipantsSection from '@/components/admin/CampParticipantsSection.vue'
import UserDetailsPanel from '@/components/admin/UserDetailsPanel.vue'
import CampArchivesSection from '@/components/admin/CampArchivesSection.vue'
import CampArchiveEventSection from '@/components/admin/CampArchiveEventSection.vue'
import EventDetailsPanel from '@/components/ui/EventDetailsPanel.vue'
import MemberSection from '@/components/admin/MemberSection.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import CampItemsPicker from '@/components/admin/CampItemsPicker.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

/* ======================================================
   UI STATE
====================================================== */
const selectedUser = ref(null)
const step = ref('home')
const previousStep = ref('home')
const isEditingItems = computed(() => step.value === 'camp-items')

const availableItems = ref([])
const loadingItems = ref(false)
const itemsError = ref(null)

const savingItems = ref(false)
const saveItemsError = ref(null)

function goHome() {
  step.value = 'home'
}

async function openUserDetails(u, fromStep) {
  previousStep.value = fromStep

  selectedUser.value = null

  const id = authStore.getUserId ? authStore.getUserId(u) : (u?.id ?? u?._id ?? null)

  try {
    selectedUser.value = id ? await apiGetUser(id) : u
  } catch (e) {
    console.error('GET USER ERROR:', e)
    selectedUser.value = u
  }

  step.value = fromStep === 'members' ? 'user-management' : 'user-details'
}

const deleteDialogOpen = ref(false)
const deleteDialogLoading = ref(false)

/* ======================================================
   CAMPS: SOURCE DE VÉRITÉ = BACKEND VIA STORE
====================================================== */
const camps = campsStore.camps

onMounted(async () => {
  await Promise.all([
    campsStore.ensureCampsLoaded(),
    authStore.fetchResponsibleUsers(),
    fetchAvailableItems(),
  ])
})

/* ======================================================
   RESPONSABLES (admins + accompagnants)
====================================================== */
const responsibleOptions = computed(() =>
  (authStore.responsibleUsers.value ?? []).map((u) => ({
    value: u.id ?? u._id,
    label: `${u.firstname} ${u.lastname}`,
  })),
)

// Dictionnaire id -> user (pour afficher le nom au lieu de l'id)
const usersById = computed(() => {
  const list = authStore.responsibleUsers?.value ?? []
  const map = new Map()
  list.forEach((u) => {
    const id = u?.id ?? u?._id
    if (id) map.set(String(id), u)
  })
  return map
})

function displayUserNameById(id) {
  if (!id) return ''
  const u = usersById.value.get(String(id))
  if (!u) return String(id) // fallback: affiche l'id si pas trouvé
  const name = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim()
  return name || String(id)
}

/* ======================================================
   CAMPS computed
====================================================== */
const activeCamps = computed(() => (camps.value ?? []).filter((c) => c.status !== 'archived'))
const hasCamps = computed(() => activeCamps.value.length > 0)

const currentAdminCamp = computed(() => getCurrentCamp(activeCamps.value, 'admin'))
const activeCamp = computed(() => currentAdminCamp.value)

/* ======================================================
   Selected camp (menu camp, events, etc.)
====================================================== */
const selectedCamp = ref(null)

watch(
  currentAdminCamp,
  (camp) => {
    if (isEditingItems.value) return

    const stillExists =
      camp &&
      (camps.value ?? []).some((c) => String(c.id) === String(camp.id) && c.status !== 'archived')

    if (!selectedCamp.value || !stillExists) {
      selectedCamp.value = camp ?? null
    }
  },
  { immediate: true },
)

const campStatus = computed(() => selectedCamp.value?.status ?? 'draft')

const anotherPublishedCamp = computed(() =>
  (camps.value ?? []).find(
    (c) => c.status === 'published' && String(c.id) !== String(selectedCamp.value?.id),
  ),
)

/* ======================================================
   Helpers
====================================================== */
function mapCampFormToApi(payload) {
  const title = String(payload?.name ?? '').trim()

  const out = {
    title,
    startDate: dateOnlyToIsoStart(payload?.startDate),
    endDate: dateOnlyToIsoStart(payload?.endDate),
  }

  // n'ajoute ces champs que s'ils existent (pas null)
  if (payload?.subscriptionStartDate) {
    out.subStartDatetime = dateOnlyToIsoStart(payload.subscriptionStartDate)
  }
  if (payload?.subscriptionDeadline) {
    out.subEndDatetime = dateOnlyToIsoEnd(payload.subscriptionDeadline)
  }

  return out
}

function resyncSelectedCampById(id) {
  if (!id) return
  selectedCamp.value =
    (camps.value ?? []).find((c) => String(c.id) === String(id)) ?? selectedCamp.value
}

function getTrainingId(t) {
  return t?.id ?? t?._id ?? null
}

/* ======================================================
   Version "safe" du camp pour les <input type="date">
====================================================== */
function toDateInputValue(v) {
  if (!v) return null

  // déjà au bon format YYYY-MM-DD
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null

  // IMPORTANT : UTC → YYYY-MM-DD
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const selectedCampForForm = computed(() => {
  if (!selectedCamp.value) return null

  return {
    ...selectedCamp.value,
    startDate: toDateInputValue(selectedCamp.value.startDate),
    endDate: toDateInputValue(selectedCamp.value.endDate),
    subscriptionStartDate: toDateInputValue(selectedCamp.value.subStartDatetime),
    subscriptionDeadline: toDateInputValue(selectedCamp.value.subEndDatetime),
  }
})

function dateOnlyToIsoStart(v) {
  if (!v) return null
  return `${String(v).slice(0, 10)}T00:00:00.000Z`
}

function dateOnlyToIsoEnd(v) {
  if (!v) return null
  return `${String(v).slice(0, 10)}T23:59:59.999Z`
}

/* ======================================================
   Navigation camp
====================================================== */
async function onOpenCamp(camp) {
  selectedCamp.value = camp

  // hydrate trainings depuis l'endpoint dédié
  const campId = camp.id
  const res = await apiGetTrainings(campId)
  const trainings = res?.trainings ?? res
  selectedCamp.value.trainings = Array.isArray(trainings) ? trainings : []

  step.value = 'camp-menu'
}

function openCampCreate() {
  if (hasCamps.value) return
  step.value = 'camp-create'
}

/* ======================================================
   ITEMS (matériel) + AUTO SAVE
====================================================== */
const itemsLoading = ref(false)

async function fetchAvailableItems() {
  itemsLoading.value = true
  itemsError.value = null
  try {
    const items = await apiGetItems()

    // Normalisation : ton picker attend { id, name }
    availableItems.value = items
      .map((it) => ({
        id: String(it._id ?? it.id ?? ''), // Mongo => _id
        name: String(it.name ?? it.title ?? 'Sans nom'),
      }))
      .filter((it) => it.id)
  } catch (e) {
    console.error('GET ITEMS ERROR:', e)
    itemsError.value = e?.message ?? 'Erreur chargement items'
    availableItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

const activeCampItemsModel = computed({
  get() {
    const list = selectedCamp.value?.itemsList ?? []
    return (Array.isArray(list) ? list : [])
      .map((x) => ({
        item_id: String(x?.item?._id ?? x?.item ?? x?.item_id ?? ''),
      }))
      .filter((x) => x.item_id)
  },
  set(next) {
    // ✅ IMPORTANT : next est le paramètre du setter
    if (!selectedCamp.value) return

    const cleanIds = (Array.isArray(next) ? next : [])
      .map((x) => String(x?.item_id ?? ''))
      .filter(Boolean)

    // Picker -> Backend (quantity forcée à 1)
    selectedCamp.value.itemsList = cleanIds.map((id) => ({
      item: id,
      quantity: 1,
    }))
  },
})

/**
 * Empêche l'autosave pendant la première synchro
 */
const itemsHydrated = ref(false)

watch(
  () => selectedCamp.value?.id,
  (id) => {
    itemsHydrated.value = !!id
  },
  { immediate: true },
)

function buildCampUpdatePayloadForItems(camp, itemsList) {
  const payload = {
    // 🔒 force types attendus
    title: String(camp?.title ?? '').trim(),
    status: String(camp?.status ?? 'draft'),

    startDate: toIsoOrNull(camp?.startDate),
    endDate: toIsoOrNull(camp?.endDate),

    // souvent optionnels, mais si ton backend les valide, ils doivent être ISO
    subStartDatetime: camp?.subStartDatetime ? toIsoOrNull(camp.subStartDatetime) : undefined,
    subEndDatetime: camp?.subEndDatetime ? toIsoOrNull(camp.subEndDatetime) : undefined,

    itemsList,
  }

  //ne jamais envoyer undefined
  const cleaned = cleanUndefined(payload)

  // si title vide -> on n'essaie même pas (sinon 400)
  if (!cleaned.title) {
    throw new Error('Camp invalide: title manquant (backend refuse le PUT).')
  }

  return cleaned
}

/**
 * (optionnel) bouton "enregistrer" manuel si tu le gardes
 */
async function onSaveCampItems() {
  try {
    if (!selectedCamp.value) throw new Error('selectedCamp is null')
    const campId = selectedCamp.value.id ?? selectedCamp.value._id
    if (!campId) throw new Error('campId missing on selectedCamp')

    // ids désirés (ce que l’UI veut)
    const desiredIds = new Set(
      (selectedCamp.value.itemsList ?? [])
        .map((x) => String(x?.item?._id ?? x?.item ?? x?.item_id ?? ''))
        .filter(Boolean),
    )

    // ids actuels (DB)
    const current = await getCampItems(campId)
    const currentList = Array.isArray(current) ? current : (current?.itemsList ?? current)

    const currentIds = new Set(
      (Array.isArray(currentList) ? currentList : [])
        .map((x) => String(x?.item?._id ?? x?.item ?? x?.item_id ?? ''))
        .filter(Boolean),
    )

    const toAdd = [...desiredIds].filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !desiredIds.has(id))

    console.log('[camp items] desiredIds:', [...desiredIds])
    console.log('[camp items] currentIds:', [...currentIds])
    console.log('[camp items] toAdd:', toAdd)
    console.log('[camp items] toRemove:', toRemove)

    // Apply
    await Promise.all([
      ...toAdd.map((itemId) => addCampItem(campId, itemId)),
      ...toRemove.map((itemId) => deleteCampItem(campId, itemId)),
    ])

    await campsStore.fetchCamps()
    resyncSelectedCampById(campId)
  } catch (e) {
    console.error('onSaveCampItems ERROR:', e)
    alert(e?.message ?? 'Erreur enregistrement matériel')
  }
}

/* ======================================================
   CREATE camp (POST /camps)
====================================================== */
async function onCreateCamp(payload) {
  if (hasCamps.value) {
    alert("Un camp est déjà actif. Archivez-le avant d'en créer un nouveau.")
    step.value = 'events'
    return
  }

  try {
    const apiPayload = mapCampFormToApi(payload)

    // ⚠️ pour isoler l’erreur 400, envoie MINIMAL comme dans tes tests
    const minimal = {
      title: apiPayload.title,
      startDate: apiPayload.startDate,
      endDate: apiPayload.endDate,
    }

    const created = await apiCreateCamp(minimal)

    await campsStore.fetchCamps()
    selectedCamp.value =
      (camps.value ?? []).find((c) => String(c.id) === String(created.id)) ?? created

    step.value = 'camp-menu'
  } catch (e) {
    console.error('CREATE CAMP ERROR:', e)
    console.error('message:', e?.message)
    console.error('status:', e?.status)
    console.error('data:', e?.data)
    alert(e?.message ?? 'Erreur création camp')
  }
}

/* ======================================================
   UPDATE camp (PUT /camps/:id)
====================================================== */
async function onUpdateCamp(payload) {
  if (!selectedCamp.value) return

  try {
    const id = selectedCamp.value.id
    const apiPayload = mapCampFormToApi(payload)

    await apiUpdateCamp(id, apiPayload)

    await campsStore.fetchCamps()
    resyncSelectedCampById(id)
    step.value = 'camp-menu'
  } catch (e) {
    console.error('UPDATE CAMP ERROR:', e)
    console.error('message:', e?.message)
    console.error('status:', e?.status)
    console.error('data:', e?.data)
    alert(e?.message ?? 'Erreur update camp')
  }
}

/* ======================================================
   STATUS actions (publish / archive)
====================================================== */
async function publishCamp() {
  if (!selectedCamp.value) return

  if (anotherPublishedCamp.value) {
    alert(
      `Un camp est déjà publié (${anotherPublishedCamp.value.title}). ` +
        `Archivez-le avant d'en publier un autre.`,
    )
    return
  }

  try {
    const id = selectedCamp.value.id
    await apiUpdateCamp(id, { status: 'published' })
    await campsStore.fetchCamps()
    resyncSelectedCampById(id)
  } catch (e) {
    console.error(e)
    alert(e?.message ?? 'Erreur publication camp')
  }
}

async function archiveCamp() {
  if (!selectedCamp.value) return

  try {
    const id = selectedCamp.value.id
    await apiUpdateCamp(id, { status: 'archived' })
    await campsStore.fetchCamps()

    selectedCamp.value = null
    selectedEvent.value = null
    step.value = 'events'
  } catch (e) {
    console.error(e)
    alert(e?.message ?? 'Erreur archivage camp')
  }
}

/* ======================================================
   DELETE camp (DELETE /camps/:id)
====================================================== */
function requestDeleteCamp() {
  if (!selectedCamp.value) return
  deleteDialogOpen.value = true
}

async function confirmDeleteCamp() {
  if (!selectedCamp.value) return

  deleteDialogLoading.value = true
  try {
    const id = selectedCamp.value.id
    await apiDeleteCamp(id)
    await campsStore.fetchCamps()

    selectedCamp.value = null
    selectedEvent.value = null
    step.value = 'events'
    deleteDialogOpen.value = false
  } catch (e) {
    console.error(e)
    alert(e?.message ?? 'Erreur suppression camp')
  } finally {
    deleteDialogLoading.value = false
  }
}

function cancelDeleteCamp() {
  deleteDialogOpen.value = false
}

/* ======================================================
   EVENTS (trainings) — persist auto
====================================================== */
const selectedEvent = ref(null) // { type: 'trainings', data: training }

async function onCreateCampEvent(payload) {
  if (!selectedCamp.value) return
  if (payload.type !== 'trainings') return

  const campId = selectedCamp.value.id

  const apiPayload = {
    date: payload.date,
    trainGoingTime: payload.trainGoingTime ?? null,
    trainReturnTime: payload.trainReturnTime ?? null,
    meetingTime: payload.meetingTime ?? null,
    meetingPoint: payload.meetingPoint ?? null,
    returnTime: payload.arrivalTime ?? null,
    distance: payload.distance ?? null,
    elevationGain: payload.elevationGain ?? null,
    elevationLoss: payload.elevationLoss ?? null,

    // ✅ BACKEND CREATE attend responsiblePersonId
    responsiblePersonId: payload.responsiblePerson ?? null,
  }

  try {
    const created = await apiCreateTraining(campId, apiPayload)
    const createdTraining = created?.training ?? created

    if (!Array.isArray(selectedCamp.value.trainings)) selectedCamp.value.trainings = []
    selectedCamp.value.trainings = [...selectedCamp.value.trainings, createdTraining]

    await campsStore.fetchCamps()
    resyncSelectedCampById(campId)

    step.value = 'camp-events'
  } catch (e) {
    console.error('CREATE TRAINING ERROR:', e)
    console.error('status:', e?.status)
    console.error('data:', e?.data)
    alert(e?.message ?? 'Erreur création entraînement')
  }
}

function onOpenTraining(training) {
  selectedEvent.value = { type: 'trainings', data: training }
  step.value = 'camp-event-edit'
}

async function onUpdateCampEvent(payload) {
  if (!selectedCamp.value || !selectedEvent.value) return
  if (selectedEvent.value.type !== 'trainings') return

  const campId = selectedCamp.value.id
  const old = selectedEvent.value.data
  const trainingId = old?.id ?? old?._id

  if (!trainingId) {
    alert("Impossible de modifier: l'entraînement n'a pas d'id.")
    return
  }

  const apiPayload = {
    date: payload.date ?? undefined,
    trainGoingTime: payload.trainGoingTime ?? undefined,
    trainReturnTime: payload.trainReturnTime ?? undefined,
    meetingTime: payload.meetingTime ?? undefined,
    meetingPoint: payload.meetingPoint ?? undefined,
    returnTime: payload.arrivalTime ?? undefined,
    distance: payload.distance ?? undefined,
    elevationGain: payload.elevationGain ?? undefined,
    elevationLoss: payload.elevationLoss ?? undefined,

    // ✅ BACKEND UPDATE attend responsiblePerson
    responsiblePerson: payload.responsiblePerson ?? undefined,
  }

  const updatedRes = await apiUpdateTraining(campId, trainingId, apiPayload)
  const updated = updatedRes?.training ?? updatedRes

  const list = selectedCamp.value.trainings ?? []
  selectedCamp.value.trainings = list.map((t) =>
    String(getTrainingId(t)) === String(trainingId) ? updated : t,
  )
  selectedEvent.value.data = updated

  await campsStore.fetchCamps()
  resyncSelectedCampById(campId)

  step.value = 'camp-events'
}

async function onDeleteCampEvent() {
  if (!selectedCamp.value || !selectedEvent.value) return
  if (selectedEvent.value.type !== 'trainings') return

  const campId = selectedCamp.value.id
  const trainingId = selectedEvent.value.data?.id ?? selectedEvent.value.data?._id

  if (!trainingId) {
    alert("Impossible de supprimer: l'entraînement n'a pas d'id.")
    return
  }

  await apiDeleteTraining(campId, trainingId)

  // resync local
  selectedCamp.value.trainings = (selectedCamp.value.trainings ?? []).filter(
    (t) => String(getTrainingId(t)) !== String(trainingId),
  )

  selectedEvent.value = null

  await campsStore.fetchCamps()
  resyncSelectedCampById(campId)

  step.value = 'camp-events'
}

/* ======================================================
   ARCHIVES
====================================================== */
const archiveYear = ref(null)
const archiveYearCamps = ref([])
const selectedArchiveEvent = ref(null)

function onOpenArchiveYear({ year, camps }) {
  archiveYear.value = year
  archiveYearCamps.value = camps
  step.value = 'archives-year'
}

function onOpenArchiveEvent(ev) {
  selectedArchiveEvent.value = ev
  step.value = 'archive-event-details'
}

/* ======================================================
   USER delete callback
====================================================== */
function onUserDeleted(deletedId) {
  if (selectedUser.value && String(selectedUser.value.id) === String(deletedId)) {
    selectedUser.value = null
  }
  step.value = 'members'
}

// User : refresh quand on a fait une modification sur un user
async function onUserUpdated(updatedUser) {
  try {
    if (!updatedUser) return

    // refresh panneau détails
    selectedUser.value = updatedUser

    // si l'utilisateur modifié = moi, refresh mon profil
    const my = authStore.user?.value ?? null
    const myId = authStore.getUserId ? authStore.getUserId(my) : (my?.id ?? my?._id ?? null)
    const updatedId = authStore.getUserId
      ? authStore.getUserId(updatedUser)
      : (updatedUser?.id ?? updatedUser?._id ?? null)

    if (myId && updatedId && String(myId) === String(updatedId)) {
      await authStore.refreshMe().catch(() => {})
    }
  } catch (e) {
    console.error('onUserUpdated ERROR:', e)
  }
}
</script>

<template>
  <div class="section">
    <!-- ========================= -->
    <!-- ÉCRAN 1 : ACCUEIL -->
    <!-- ========================= -->
    <template v-if="step === 'home'">
      <header class="top">
        <h1>DASHBOARD</h1>
      </header>

      <div class="admin">
        <section class="cards">
          <DashboardCard
            icon="calendarPlus"
            title="Gérer les évènements"
            description="Créer, modifier ou archiver les camps, entraînements, AG, soirées d'information"
            asButton
            @click="step = 'events'"
          />

          <DashboardCard
            icon="users"
            title="Gérer les membres"
            description="Gérer tous les comptes utilisateurs"
            asButton
            @click="step = 'members'"
          />

          <DashboardCard
            icon="history"
            title="Archives"
            description="Archives des camps, entraînements, AG, et soirées d'information"
            asButton
            @click="step = 'archives'"
          />
        </section>
      </div>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 2 : ÉVÈNEMENTS (CAMPS) -->
    <!-- ========================= -->
    <template v-else-if="step === 'events'">
      <header>
        <BackButton @click="goHome" />
      </header>

      <AdminPanel
        title="ÉVÈNEMENTS EXISTANTS"
        :is-empty="!hasCamps"
        empty-text="Aucun évènement pour le moment"
      >
        <template v-if="hasCamps">
          <DashboardCard
            v-for="camp in activeCamps"
            :key="camp.id"
            icon="camp"
            :title="(camp.title ?? 'Camp').toUpperCase()"
            asButton
            @click="onOpenCamp(camp)"
          />
        </template>

        <template #actions>
          <BaseButton
            variant="primary"
            size="md"
            :block="true"
            :disabled="hasCamps"
            @click="openCampCreate"
          >
            Créer un nouveau camp
          </BaseButton>
        </template>

        <template v-if="hasCamps" #hint>
          Un camp est déjà actif. Archivez ou supprimez le camp existant avant d’en créer un
          nouveau.
        </template>
      </AdminPanel>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 2bis : CRÉER UN CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-create'">
      <header>
        <BackButton @click="step = 'events'" />
      </header>

      <section class="section">
        <CampForm @submit="onCreateCamp" />
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : MENU CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-menu'">
      <header class="page-header">
        <BackButton @click="step = 'events'" />
      </header>

      <section class="camp-panel">
        <section class="cards">
          <DashboardCard
            icon="edit"
            title="Modifier le camp"
            description="Modifier les informations du camp"
            asButton
            @click="step = 'camp-edit'"
          />

          <DashboardCard
            icon="boots"
            title="Ajouter du matériel pour le camp"
            description="Ajouter, modifier ou supprimer du matériel"
            asButton
            @click="step = 'camp-items'"
          />

          <DashboardCard
            icon="calendarPlus"
            title="Ajouter des évènements liés au camp"
            description="Créer, modifier ou archiver les entraînements, AG, soirées d'information"
            asButton
            @click="step = 'camp-events'"
          />

          <DashboardCard
            icon="users"
            title="Inscriptions du camp"
            description="Voir les personnes inscrites au camp"
            asButton
            @click="step = 'camp-signups'"
          />
        </section>

        <div class="actions">
          <BaseButton
            v-if="campStatus !== 'published'"
            type="button"
            variant="primary"
            size="md"
            :block="true"
            @click="publishCamp"
          >
            Publier le camp
          </BaseButton>

          <BaseButton v-else type="button" variant="primary" size="md" :block="true" disabled>
            Camp publié
          </BaseButton>

          <BaseButton
            type="button"
            variant="secondary"
            size="md"
            :block="true"
            @click="archiveCamp"
          >
            Archiver le camp
          </BaseButton>

          <BaseButton
            type="button"
            variant="tertiary"
            size="md"
            :block="true"
            @click="requestDeleteCamp"
          >
            Supprimer le camp
          </BaseButton>
          <ConfirmDialog
            :open="deleteDialogOpen"
            title="Supprimer le camp"
            :message="`Supprimer définitivement « ${selectedCamp?.title ?? 'ce camp'} » ? Cette action est irréversible.`"
            confirm-text="Supprimer"
            cancel-text="Annuler"
            :dangerous="true"
            :loading="deleteDialogLoading"
            @confirm="confirmDeleteCamp"
            @cancel="cancelDeleteCamp"
            @close="cancelDeleteCamp"
          />
        </div>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : ÉVÈNEMENTS DU CAMP (TRAININGS) -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-events'">
      <header class="page-header">
        <BackButton @click="step = 'camp-menu'" />
      </header>

      <CampEventsSection
        :camp-title="selectedCamp?.title ?? ''"
        :trainings="selectedCamp?.trainings ?? []"
        @create="step = 'camp-event-create'"
        @openTraining="onOpenTraining"
      />
    </template>
    <!-- ========================= -->
    <!-- ÉCRAN : MODIFIER CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-edit'">
      <header class="page-header">
        <BackButton @click="step = 'camp-menu'" />
      </header>

      <section class="section">
        <CampForm
          mode="edit"
          :initial-values="selectedCampForForm"
          :existing-gpx="selectedCamp?.gpsTrack ?? null"
          @submit="onUpdateCamp"
        />
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : CRÉER UN ÉVÈNEMENT (CHOIX TYPE) -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-event-create'">
      <header class="page-header">
        <BackButton @click="step = 'camp-events'" />
      </header>

      <CreateCampEventSection
        :camp="selectedCamp"
        :allowed-keys="['trainings']"
        :responsible-options="responsibleOptions"
        @submit="onCreateCampEvent"
      />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : MODIFIER ÉVÈNEMENT -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-event-edit'">
      <header class="page-header">
        <BackButton @click="step = 'camp-events'" />
      </header>

      <EventForm
        mode="edit"
        :type="selectedEvent?.type ?? 'trainings'"
        :initial-values="selectedEvent?.data ?? null"
        :type-options="[
          { key: 'trainings', label: 'Entrainement', enabled: true },
          { key: 'stages', label: 'Etape', enabled: false },
          { key: 'information-evening', label: `Soirée d'information`, enabled: false },
          { key: 'generalMeeting', label: 'Assemblée générale', enabled: false },
          { key: 'fundraisings', label: 'Vente de pâtisserie', enabled: false },
        ]"
        :responsible-options="responsibleOptions"
        @update:type="() => {}"
        @submit="onUpdateCampEvent"
        @delete="onDeleteCampEvent"
      />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : INSCRIPTIONS DU CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-signups'">
      <!-- Header / retour -->
      <header class="page-header">
        <BackButton @click="step = 'camp-menu'" />
      </header>

      <!-- Contenu principal -->
      <section>
        <CampParticipantsSection
          v-if="selectedCamp"
          :camp="selectedCamp"
          @openUser="(u) => openUserDetails(u, 'camp-signups')"
        />
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : DÉTAIL UTILISATEUR -->
    <!-- ========================= -->
    <template v-else-if="step === 'user-details'">
      <header class="page-header">
        <BackButton @click="step = previousStep" />
      </header>

      <section class="section">
        <UserDetailsPanel v-if="selectedUser" :user="selectedUser" />
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN : MATÉRIEL DU CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-items'">
      <header class="page-header">
        <BackButton @click="step = 'camp-menu'" />
      </header>

      <section class="section">
        <AdminPanel title="MATÉRIEL DU CAMP" :is-empty="!activeCamp" empty-text="Aucun camp actif">
          <template v-if="activeCamp">
            <p class="hint">
              Camp actif : <strong>{{ activeCamp.title }}</strong>
            </p>

            <CampItemsPicker
              :items="availableItems"
              v-model="activeCampItemsModel"
              title="Matériel pour le camp"
              :defaultOpen="true"
            />

            <BaseButton @click="onSaveCampItems"> Enregistrer le matériel </BaseButton>
          </template>
        </AdminPanel>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 3 : MEMBRES -->
    <!-- ========================= -->
    <template v-else-if="step === 'members'">
      <header class="page-header">
        <BackButton @click="goHome" />
      </header>

      <section>
        <MemberSection @openUser="(u) => openUserDetails(u, 'members')" />
      </section>
    </template>
    <!-- ========================= -->
    <!-- ÉCRAN : USER MANAGEMENT -->
    <!-- ========================= -->
    <template v-else-if="step === 'user-management'">
      <header class="page-header">
        <BackButton @click="step = previousStep" />
      </header>

      <section class="section">
        <UserManagement
          v-if="selectedUser"
          :key="selectedUser.id ?? selectedUser._id"
          :user="selectedUser"
          @updated="onUserUpdated"
          @deleted="onUserDeleted"
        />
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 4 : ARCHIVES -->
    <!-- ========================= -->
    <template v-else-if="step === 'archives'">
      <header>
        <BackButton @click="goHome" />
      </header>

      <CampArchivesSection :camps="camps" @openYear="onOpenArchiveYear" />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 4bis : ARCHIVES — ANNÉE (LISTE DES ÉVÈNEMENTS) -->
    <!-- ========================= -->
    <template v-else-if="step === 'archives-year'">
      <header class="page-header">
        <BackButton @click="step = 'archives'" />
      </header>

      <CampArchiveEventSection
        v-if="archiveYear"
        :year="archiveYear"
        :camps="archiveYearCamps"
        @openEvent="onOpenArchiveEvent"
      />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 4ter : ARCHIVES — DÉTAIL ÉVÈNEMENT -->
    <!-- ========================= -->
    <template v-else-if="step === 'archive-event-details'">
      <header class="page-header">
        <BackButton @click="step = 'archives-year'" />
      </header>

      <section class="section">
        <EventDetailsPanel
          v-if="selectedArchiveEvent"
          :event="selectedArchiveEvent"
          :display-user-name="displayUserNameById"
        />
      </section>
    </template>
  </div>
</template>

<style scoped>
/* Tu gardes tes styles existants si tu en as déjà.
   J’ajoute seulement ceux nécessaires pour l’écran ÉVÈNEMENTS. */

.admin {
  background-color: var(--c-surface);
  border-radius: var(--r-input);
}
.cards {
  display: grid;
  gap: var(--sp-2);
  background-color: var(--c-surface);
  border-radius: var(--r-input);
  padding: 1rem;
}

/* ====== EVENTS (match screenshots) ====== */
.events-panel {
  background: var(--c-surface);
  border-radius: var(--r-card);
  padding: var(--sp-3);
}

.empty {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}

.events-list {
  display: grid;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.hint {
  margin: 0.75rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}

.camp-panel {
  display: grid;
  gap: var(--sp-3);
}

.actions {
  display: grid;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
</style>
