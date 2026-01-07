<script setup>
import { ref } from 'vue'
import DashboardCard from '@/components/admin/DashboardCard.vue'

const step = ref('home')

function goHome() {
  step.value = 'home'
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
      <header class="page-header">
        <button class="back" @click="goHome">←</button>
        <h2>ÉVÈNEMENTS</h2>
      </header>

      <section class="mock">
        <p>📅 Liste des évènements (mock)</p>
        <p>➕ Bouton “Créer un évènement”</p>
      </section>
    </template>

    <!-- ========================= -->
    <!-- ÉCRAN 3 : MEMBRES -->
    <!-- ========================= -->
    <template v-else-if="step === 'members'">
      <header class="page-header">
        <button class="back" @click="goHome">←</button>
        <h2>MEMBRES</h2>
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
      <header class="page-header">
        <button class="back" @click="goHome">←</button>
        <h2>ARCHIVES</h2>
      </header>

      <section class="mock">
        <p>🗂️ Archives (mock)</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin {
  background: var(--c-surface);
  border-radius: var(--r-card);
  padding: var(--sp-2);
}
.cards {
  display: grid;
  gap: var(--sp-2);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.back {
  background: none;
  border: none;
  font-size: var(--fs-body);
  cursor: pointer;
}
.back:active {
  opacity: 0.7;
}

.mock {
  padding: var(--sp-2);
  box-shadow: var(--shadow-sm);
}
</style>
