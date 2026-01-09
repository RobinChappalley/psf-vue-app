<script setup>
import { computed, ref } from 'vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BackButton from '@/components/ui/BackButton.vue'
import CampForm from '@/components/admin/CampForm.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

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
    id: 'string',
    title: 'Camp 2026',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    subStartDatetime: '2026-03-01T09:00:00Z',
    subEndDatetime: '2026-05-31T23:59:59Z',
    gpsTrack: {},
    itemsList: [{ item_id: 'string', quantity: 'string' }],
    'information-evening': {
      dateTime: '2026-06-15T18:00:00Z',
      location: 'Salle des fêtes, Lausanne',
      participants: [{ email: 'parent@example.com', nbOfParticipants: 2 }],
    },
    trainings: [],
    fundraisings: [],
    generalMeeting: null,
    stages: [],
  },
]

const hasCamps = computed(() => (camps.value?.length ?? 0) > 0)

function onCreateCamp(payload) {
  if (hasCamps.value) {
    console.warn('Un camp existe déjà, création bloquée.')
    step.value = 'events'
    return
  }

  console.log('payload camp', payload)
  // TODO: envoyer au backend
  step.value = 'events'
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
    <!-- ÉCRAN 2 : ÉVÈNEMENTS -->
    <!-- ========================= -->
    <template v-else-if="step === 'events'">
      <header>
        <BackButton @click="goHome" />
      </header>

      <section class="events-panel">
        <h2>ÉVÈNEMENTS EXISTANTS</h2>

        <!-- État vide -->
        <p v-if="!hasCamps" class="empty">Aucun évènement pour le moment</p>

        <!-- État avec camp(s) -->
        <div v-else class="events-list">
          <DashboardCard
            v-for="camp in camps"
            :key="camp.id"
            icon="camp"
            :title="(camp.title ?? 'Camp').toUpperCase()"
            asButton
            @click="onOpenCamp(camp)"
          />
        </div>

        <!-- Important : ici, tu dois ouvrir la section camp-create -->
        <BaseButton
          variant="primary"
          size="md"
          :block="true"
          :disabled="hasCamps"
          @click="openCampCreate"
        >
          Créer un nouveau camp
        </BaseButton>

        <p v-if="hasCamps" class="hint">
          Un camp est déjà actif. Archivez ou supprimez le camp existant avant d’en créer un
          nouveau.
        </p>
      </section>
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
            description="Ajouter, modifier ou supprimer du matériel"
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
            title="Gérer les inscription du camp"
            description="Créer, modifier ou archiver les camps, entraînements, AG, soirées d'information"
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
