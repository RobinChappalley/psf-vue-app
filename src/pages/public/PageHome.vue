<script setup>
import { ref, computed, onMounted } from 'vue'
import HomeHero from '@/components/home/HomeHero.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PeopleBubble from '@/components/home/PeopleBubble.vue'
import BaseCard from '@/components/home/BaseCard.vue'
import CampHighlight from '@/components/events/CampHighlight.vue'
import { apiFetch } from '@/services/apiFetch'

const people = ['Robin', 'Robin', 'Robin', 'Robin', 'Robin', 'Robin', 'Robin']

// --- Camp public (API) ---
const loadingCamp = ref(false)
const campError = ref(null)
const campEvent = ref(null)

function toTime(x) {
  const t = new Date(x).getTime()
  return Number.isNaN(t) ? null : t
}

function campToEvent(camp) {
  if (!camp) return null
  return {
    id: camp.id ?? camp._id,
    type: 'camp',
    name: camp.title,
    userStatus: 'none',
    'start-date': camp.startDate,
    'end-date': camp.endDate,
    'subscription-deadline-date-time': camp.subEndDatetime,
  }
}

onMounted(async () => {
  loadingCamp.value = true
  campError.value = null
  campEvent.value = null

  try {
    const data = await apiFetch('/camps', { method: 'GET' })
    const list = Array.isArray(data) ? data : []

    const now = Date.now()

    // seulement published + startDate dans le futur (ou aujourd'hui)
    const candidates = list
      .filter((c) => c?.status === 'published')
      .map((c) => ({ camp: c, start: toTime(c.startDate) }))
      .filter((x) => x.start !== null && x.start >= now)
      .sort((a, b) => a.start - b.start)
      .map((x) => x.camp)

    const next = candidates[0] || null
    campEvent.value = campToEvent(next)

    // Debug (tu peux enlever)
    // console.log('PublicHome next published future camp:', next)
  } catch (e) {
    campError.value = e?.message ?? 'Erreur chargement camp'
    campEvent.value = null
    console.warn('PublicHome: cannot load camps:', e)
  } finally {
    loadingCamp.value = false
  }
})
</script>

<template>
  <section class="page">
    <HomeHero />
  </section>
  <section class="section whoweare">
    <h1>Qui sommes-nous?</h1>
    <div>
      <p>
        Pieds Sans Frontière (PSF) est une association qui organise des camps de marche pour les
        8-16 ans. Nous accompagnons des enfants et des adolescents dans une aventure humaine,
        sportive et éducative.
      </p>
    </div>
    <div>
      <p>
        Nos camps et entrainements sont encadrés par une équipe d’accompagnants formés et
        passionnés.
      </p>
    </div>
    <div class="people">
      <PeopleBubble v-for="(name, index) in people" :key="index" :name="name" />
    </div>
  </section>
  <section v-if="campEvent">
    <CampHighlight :event="campEvent" />
  </section>

  <section class="section whythisapp">
    <h1>Ce que propose l'application</h1>
    <div>
      <p>L’application PSF vous accompagnera dans la préparation du camp de votre enfant.</p>
    </div>
    <div>
      <p>Vous y trouverez :</p>
    </div>
    <div>
      <ul>
        <li>Les informations essentielles sur les camps et les entrainements</li>
        <li>La liste du matériel nécessaire</li>
        <li>Les dates importantes</li>
        <li>Un espace parent sécurisé pour suivre les étapes de la préparation au camp</li>
      </ul>
    </div>
    <BaseButton as="link" :to="{ name: 'public.signup' }" variant="primary" size="md" :block="true">
      Créer un compte parent
    </BaseButton>
  </section>
  <section class="section specific">
    <h1>Ce qui fait notre particularité</h1>
    <BaseCard title="Un cadre naturel exceptionnel">
      <p>Nos itinéraires suivent des sentiers de montagne adaptés aux jeunes.</p>
    </BaseCard>
    <BaseCard title="Une équipe engagée">
      <p>
        Accompagnants et responsables passionnés, tous formés à l'encadrement en terrain naturel.
      </p>
    </BaseCard>
    <BaseCard title="Une expérience humaine forte">
      <p>Vivre ensemble, marcher ensemble, grandir ensemble.</p>
    </BaseCard>
    <div>
      <p>Prêt à faire découvrir à vos enfants l'aventure qu'est Pieds Sans Frontières ?</p>
    </div>
    <BaseButton as="link" :to="{ name: 'public.signup' }" variant="primary" size="md" :block="true">
      Créer un compte parent
    </BaseButton>
  </section>
</template>

<style scoped>
div {
  margin-bottom: 1rem;
}
li {
  margin-bottom: 0.5rem;
}
.people {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
  justify-items: center;
  margin-top: 2rem;
}
</style>
