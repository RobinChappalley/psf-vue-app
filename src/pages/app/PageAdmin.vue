<script setup>
import { computed, ref } from 'vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BackButton from '@/components/ui/BackButton.vue'
import CampForm from '@/components/admin/CampForm.vue'

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
  step.value = 'camp-edit' // ou 'camp-details'
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
            icon="profile"
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
        <button class="cta" type="button" :disabled="hasCamps" @click="openCampCreate">
          Créer un nouveau camp
        </button>

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
      <header class="page-header">
        <BackButton @click="step = 'events'" />
      </header>

      <section class="section">
        <CampForm @submit="onCreateCamp" />
      </section>
    </template>
    <!-- ========================= -->
    <!-- ÉCRAN 2ter : MODIFIER UN CAMP -->
    <!-- ========================= -->
    <template v-else-if="step === 'camp-edit'">
      <header class="page-header">
        <BackButton @click="step = 'events'" />
      </header>

      <section class="section">
        <CampForm :initialValue="selectedCamp" @submit="onEditCamp" />
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

.cards {
  display: grid;
  gap: var(--sp-2);
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

/* CTA rouge */
.cta {
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 0.85rem 1rem;
  background: var(--c-primary);
  color: var(--c-bg);
  font-size: var(--fs-body);
  cursor: pointer;
}
.cta:active {
  opacity: 0.85;
}

.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  margin: 0.75rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.65);
}
</style>
