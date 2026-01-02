<script setup>
import HomeHero from '@/components/home/HomeHero.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PeopleBubble from '@/components/home/PeopleBubble.vue'
import BaseCard from '@/components/home/BaseCard.vue'
import { useEventsFeed } from '@/composables/useEventsFeed'
import CampHighlight from '@/components/events/CampHighlight.vue'

const people = ['Robin', 'Robin', 'Robin', 'Robin', 'Robin', 'Robin', 'Robin']
const { nextOpenCamp } = useEventsFeed({
  initialEvents: [
    // pour tester
    {
      id: 'c1',
      type: 'camp',
      name: 'Camp 2026',
      userStatus: 'none',
      'start-date': '2026-07-12',
      'end-date': '2026-07-31',
      'subscription-deadline-date-time': '2026-06-15T23:59:00',
    },
  ],
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
  <section v-if="nextOpenCamp">
    <CampHighlight :event="nextOpenCamp" />
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
    <BaseButton class="cta" as="link" :to="{ name: 'public.signup' }">
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
    <BaseButton class="cta" as="link" :to="{ name: 'public.signup' }">
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

.cta {
  margin: 2rem auto 0;
  display: block;
  max-width: 20rem;
}
</style>
