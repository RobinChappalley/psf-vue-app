<script setup>
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BackButton from '@/components/ui/BackButton.vue'
import CampForm from '@/components/admin/CampForm.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import CampEventsSection from '@/components/admin/CampEventsSection.vue'
import CreateCampEventSection from '@/components/admin/CreateCampEventSection.vue'
import EventForm from '@/components/admin/EventForm.vue'
import CampParticipantsSection from '@/components/admin/CampParticipantsSection.vue'

const step = ref('home')

function goHome() {
  step.value = 'home'
}

/**
 * MOCK API — Camps
 * Laisse vide => écran "Aucun évènement pour le moment"
 * Décommente => 1 camp dans la liste
 */
const camps = ref([])

camps.value = [
  {
    id: '1',
    title: 'Camp 2026',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    subStartDatetime: '2026-03-01T09:00:00Z',
    subEndDatetime: '2026-05-31T23:59:59Z',
    gpsTrack: { fileName: 'camp-2026-trace.gpx' },
    itemsList: [{ item_id: 'string', quantity: 'string' }],
    'information-evening': {
      dateTime: '2026-06-15T18:00:00Z',
      location: 'Salle des fêtes, Lausanne',
      participants: [{ email: 'parent@example.com', nbOfParticipants: 2 }],
    },
    trainings: [
      {
        number: 1,
        date: '2026-07-02',
        trainGoingTime: '08:00',
        trainReturnTime: '18:00',
        meetingTime: '08:30',
        meetingPoint: 'Gare centrale',
        returnTime: '17:30',
        distance: 12.5,
        elevationGain: 300,
        elevationLoss: 200,
        responsiblePerson: 'Julie Martin',
        // si tu veux garder le nom exact backend:
        'items-list': [{ item_id: 'water-bottle', quantity: '1' }],
        remark: 'Prévoir des chaussures imperméables',
      },
    ],
    fundraisings: [],
    generalMeeting: null,
    stages: [],
  },
]

//Récupérer les admins
const responsibleOptions = computed(() =>
  authStore.adminUsers.value.map((u) => ({
    value: u.id, // ou email si tu préfères
    label: `${u.firstname} ${u.lastname}`,
  })),
)

const hasCamps = computed(() => (camps.value?.length ?? 0) > 0)

function onCreateCampEvent(payload) {
  console.log('NEW EVENT', payload)

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
      // tu peux mapper plus précisément comme tu veux
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

  // retour à la liste
  step.value = 'camp-events'
}

function openCampCreate() {
  if (hasCamps.value) return
  step.value = 'camp-create'
}

const selectedCamp = ref(null)

function onOpenCamp(camp) {
  selectedCamp.value = camp
  step.value = 'camp-menu'
}

function archiveCamp() {
  console.log('Archiver le camp', selectedCamp.value)
  // TODO: appel API + update camps.value
  step.value = 'events'
}

function deleteCamp() {
  console.log('Supprimer le camp', selectedCamp.value)
  // TODO: appel API + update camps.value
  step.value = 'events'
}

//Fonctions propres à un camp
function onUpdateCamp(payload) {
  if (!selectedCamp.value) return

  console.log('payload update camp', payload)

  // MOCK update local (en attendant le backend)
  // Ici payload est en kebab-case (comme ton submit), donc on remappe vers ton objet camp
  selectedCamp.value.title = payload.name
  selectedCamp.value.startDate = payload['start-date']
  selectedCamp.value.endDate = payload['end-date']

  // tes champs mock sont en datetime ISO, ton form renvoie date YYYY-MM-DD
  // on peut stocker en date simple, ou reconstruire un ISO. Je te montre simple :
  selectedCamp.value.subStartDatetime = payload['subscription-start-date']
    ? `${payload['subscription-start-date']}T00:00:00Z`
    : null

  selectedCamp.value.subEndDatetime = payload['subscription-deadline']
    ? `${payload['subscription-deadline']}T23:59:59Z`
    : null

  // gps track
  if ('GPS-track' in payload) {
    // null => suppression
    if (payload['GPS-track'] === null) {
      selectedCamp.value.gpsTrack = {}
    } else {
      // remplacement => ici on n'a pas de vrai upload, donc on stocke le nom
      const file = payload['GPS-track']?.file
      selectedCamp.value.gpsTrack = file ? { fileName: file.name } : {}
    }
  }

  // Retour menu camp
  step.value = 'camp-menu'
}

//Pour mettre à jour un évènement (ici uniquement un training)
const selectedEvent = ref(null) // { type: 'trainings', data: training }

function onOpenTraining(training) {
  selectedEvent.value = { type: 'trainings', data: training }
  step.value = 'camp-event-edit'
}

function onUpdateCampEvent(payload) {
  if (!selectedCamp.value || !selectedEvent.value) return

  // v1: uniquement trainings
  if (selectedEvent.value.type === 'trainings') {
    const old = selectedEvent.value.data
    const list = selectedCamp.value.trainings ?? []

    const updated = {
      ...old, // garde number + items-list + tout ce que tu ne modifies pas
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

    // update immuable
    selectedCamp.value.trainings = list.map((t) => (t.number === old.number ? updated : t))

    // keep selection in sync
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

  // reset selection + retour liste
  selectedEvent.value = null
  step.value = 'camp-events'
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
            v-for="camp in camps"
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
          <BaseButton type="button" variant="primary" size="md" :block="true" @click="archiveCamp">
            Archiver le camp
          </BaseButton>
          <BaseButton type="button" variant="secondary" size="md" :block="true" @click="deleteCamp">
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
      <header class="page-header">
        <BackButton @click="step = 'camp-menu'" />
      </header>

      <CampParticipantsSection :camp="selectedCamp" />
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 3 : MEMBRES -->
    <!-- ========================= -->
    <template v-else-if="step === 'members'">
      <header>
        <BackButton @click="goHome" />
      </header>

      <section class="mock">
        <p>👤 Liste des membres (mock)</p>
        <p>🔍 Recherche / filtres</p>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 4 : ARCHIVES -->
    <!-- ========================= -->
    <template v-else-if="step === 'archives'">
      <header>
        <BackButton @click="goHome" />
      </header>

      <section class="mock">
        <p>🗂️ Archives (mock)</p>
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
