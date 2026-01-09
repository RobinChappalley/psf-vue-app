<script setup>
import { computed, ref, watch } from 'vue'
import { authStore } from '@/stores/auth'
import { getCurrentCamp } from '@/composables/getCurrentCamp'
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
import { mockArchivedCamps } from '@/assets/mocks/camps'
import CampArchiveEventSection from '@/components/admin/CampArchiveEventSection.vue'
import EventDetailsPanel from '@/components/ui/EventDetailsPanel.vue'
import MemberSection from '@/components/admin/MemberSection.vue'

//navigation
const previousStep = ref('home')

function openUserDetails(u, fromStep) {
  selectedUser.value = u
  previousStep.value = fromStep
  step.value = 'user-details'
}

////début des trucs
const selectedUser = ref(null)
const step = ref('home')

function goHome() {
  step.value = 'home'
}
const camps = ref([])
camps.value = [...mockArchivedCamps]

// Admin users options
const responsibleOptions = computed(() =>
  authStore.adminUsers.value.map((u) => ({
    value: u.id,
    label: `${u.firstname} ${u.lastname}`,
  })),
)

// Camps visibles dans "events" (non archivés)
const activeCamps = computed(() => (camps.value ?? []).filter((c) => c.status !== 'archived'))
const hasCamps = computed(() => activeCamps.value.length > 0)

// Camp "courant" dans l'admin: draft > published
const currentAdminCamp = computed(() => getCurrentCamp(activeCamps.value, 'admin'))

// Camp sélectionné dans l’UI (menu camp, events etc.)
const selectedCamp = ref(null)

// Initialiser selectedCamp automatiquement sur le camp courant (draft/published)
watch(
  currentAdminCamp,
  (camp) => {
    // si le camp sélectionné n’existe plus (supprimé/archivé), ou n’est pas set => on resync
    const stillExists =
      camp && (camps.value ?? []).some((c) => c.id === camp.id && c.status !== 'archived')

    if (!selectedCamp.value || !stillExists) {
      selectedCamp.value = camp
    }
  },
  { immediate: true },
)

// Helpers statut
const campStatus = computed(() => selectedCamp.value?.status ?? 'draft')
const anotherPublishedCamp = computed(() =>
  (camps.value ?? []).find((c) => c.status === 'published' && c.id !== selectedCamp.value?.id),
)

/**
 * Navigation camp
 */
function onOpenCamp(camp) {
  selectedCamp.value = camp
  step.value = 'camp-menu'
}

function openCampCreate() {
  if (hasCamps.value) return
  step.value = 'camp-create'
}

/**
 * Actions statut
 */

function onCreateCamp(payload) {
  console.log('payload create camp', payload)

  // sécurité (cohérente avec ton UX)
  if (hasCamps.value) {
    alert("Un camp est déjà actif. Archivez-le avant d'en créer un nouveau.")
    step.value = 'events'
    return
  }

  const newCamp = {
    id: `camp-${Date.now()}`, // temporaire, remplacé par l’ID backend plus tard
    title: payload.name,
    status: 'draft',

    startDate: payload['start-date'] ?? null,
    endDate: payload['end-date'] ?? null,

    subStartDatetime: payload['subscription-start-date']
      ? `${payload['subscription-start-date']}T00:00:00Z`
      : null,

    subEndDatetime: payload['subscription-deadline']
      ? `${payload['subscription-deadline']}T23:59:59Z`
      : null,

    gpsTrack: (() => {
      const file = payload?.['GPS-track']?.file
      return file ? { fileName: file.name } : {}
    })(),

    itemsList: [],
    infoEvening: null,
    trainings: [],
    fundraisings: [],
    generalMeeting: null,
    stages: [],
  }

  // ajout à la liste
  camps.value = [...camps.value, newCamp]

  // sélection + navigation
  selectedCamp.value = newCamp
  step.value = 'camp-menu'
}

function publishCamp() {
  if (!selectedCamp.value) return

  if (anotherPublishedCamp.value) {
    alert(
      `Un camp est déjà publié (${anotherPublishedCamp.value.title}). ` +
        `Archivez-le avant d'en publier un autre.`,
    )
    return
  }

  selectedCamp.value.status = 'published'
  console.log('Camp publié', selectedCamp.value)
}

function archiveCamp() {
  if (!selectedCamp.value) return

  selectedCamp.value.status = 'archived'
  console.log('Camp archivé', selectedCamp.value)

  // reset pour laisser le watch re-sélectionner si besoin
  selectedCamp.value = null
  step.value = 'events'
}

function deleteCamp() {
  if (!selectedCamp.value) return

  const ok = confirm(`Supprimer définitivement "${selectedCamp.value.title}" ?`)
  if (!ok) return

  camps.value = (camps.value ?? []).filter((c) => c.id !== selectedCamp.value.id)
  selectedCamp.value = null

  console.log('Camp supprimé')
  step.value = 'events'
}

/**
 * Update camp (mock)
 */
function onUpdateCamp(payload) {
  if (!selectedCamp.value) return

  selectedCamp.value.title = payload.name
  selectedCamp.value.startDate = payload['start-date']
  selectedCamp.value.endDate = payload['end-date']

  selectedCamp.value.subStartDatetime = payload['subscription-start-date']
    ? `${payload['subscription-start-date']}T00:00:00Z`
    : null

  selectedCamp.value.subEndDatetime = payload['subscription-deadline']
    ? `${payload['subscription-deadline']}T23:59:59Z`
    : null

  if ('GPS-track' in payload) {
    if (payload['GPS-track'] === null) {
      selectedCamp.value.gpsTrack = {}
    } else {
      const file = payload['GPS-track']?.file
      selectedCamp.value.gpsTrack = file ? { fileName: file.name } : {}
    }
  }

  step.value = 'camp-menu'
}

/**
 * Create camp event (mock)
 */
function onCreateCampEvent(payload) {
  if (!selectedCamp.value) return

  if (payload.type === 'trainings') {
    const nextNumber =
      (selectedCamp.value.trainings?.reduce((m, t) => Math.max(m, t.number ?? 0), 0) ?? 0) + 1

    const training = {
      number: nextNumber,
      date: payload.date,
      meetingTime: payload.meetingTime,
      meetingPoint: payload.meetingPoint,
      returnTime: payload.arrivalTime,
      trainGoingTime: payload.trainGoingTime ?? null,
      trainReturnTime: payload.trainReturnTime ?? null,
      distance: payload.distance,
      elevationGain: payload.elevationGain,
      elevationLoss: payload.elevationLoss,
      responsiblePerson: payload.responsiblePerson,
      remark: payload.remark,
      'items-list': [],
    }

    if (!Array.isArray(selectedCamp.value.trainings)) selectedCamp.value.trainings = []
    selectedCamp.value.trainings = [...selectedCamp.value.trainings, training]
  }

  step.value = 'camp-events'
}

/**
 * Edit camp event (trainings v1)
 */
const selectedEvent = ref(null) // { type: 'trainings', data: training }

function onOpenTraining(training) {
  selectedEvent.value = { type: 'trainings', data: training }
  step.value = 'camp-event-edit'
}

function onUpdateCampEvent(payload) {
  if (!selectedCamp.value || !selectedEvent.value) return

  if (selectedEvent.value.type === 'trainings') {
    const old = selectedEvent.value.data
    const list = selectedCamp.value.trainings ?? []

    const updated = {
      ...old,
      date: payload.date ?? old.date,
      remark: payload.remark ?? old.remark,
      meetingPoint: payload.meetingPoint ?? old.meetingPoint,
      meetingTime: payload.meetingTime ?? old.meetingTime,
      returnTime: payload.arrivalTime ?? old.returnTime,
      distance: payload.distance ?? old.distance,
      elevationGain: payload.elevationGain ?? old.elevationGain,
      elevationLoss: payload.elevationLoss ?? old.elevationLoss,
      responsiblePerson: payload.responsiblePerson ?? old.responsiblePerson,
    }

    selectedCamp.value.trainings = list.map((t) => (t.number === old.number ? updated : t))
    selectedEvent.value.data = updated
  }

  step.value = 'camp-events'
}

function onDeleteCampEvent() {
  if (!selectedCamp.value || !selectedEvent.value) return

  if (selectedEvent.value.type === 'trainings') {
    const old = selectedEvent.value.data
    const list = selectedCamp.value.trainings ?? []
    selectedCamp.value.trainings = list.filter((t) => t.number !== old.number)
  }

  selectedEvent.value = null
  step.value = 'camp-events'
}

//Archive section
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

          <BaseButton type="button" variant="tertiary" size="md" :block="true" @click="deleteCamp">
            Supprimer le camp
          </BaseButton>
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
          :initial-values="selectedCamp"
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
        <EventDetailsPanel v-if="selectedArchiveEvent" :event="selectedArchiveEvent" />
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
