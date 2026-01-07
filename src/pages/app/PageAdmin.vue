<script setup>
import { computed, ref } from 'vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'
import BackButton from '@/components/ui/BackButton.vue'

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

/*
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
*/

const hasCamps = computed(() => (camps.value?.length ?? 0) > 0)

function onCreateCamp() {
  // TODO plus tard: ouvrir form / step "create-camp"
  console.log('Créer un nouveau camp')
}

function onOpenCamp(camp) {
  // TODO plus tard: step "camp-details"
  console.log('Ouvrir camp', camp)
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
            icon="clipboard"
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

      <!-- Bloc gris comme sur tes screens -->
      <section class="events-panel">
        <h3 class="panel-title">ÉVÈNEMENTS EXISTANTS</h3>

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

        <button class="cta" type="button" @click="onCreateCamp">Créer un nouveau camp</button>
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

.panel-title {
  margin: 0 0 var(--sp-2);
  font-family: var(--font-title);
  font-size: var(--fs-body);
  font-weight: var(--fw-title);
  letter-spacing: 0.02em;
  text-transform: uppercase;
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
</style>
