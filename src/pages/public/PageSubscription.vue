<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

// Mock DB : mets null pour simuler "pas de camp"
//const camp = ref(null)

// Décommente pour simuler "camp existant"
const camp = ref({
  id: 'c1',
  name: 'Camp 2026',
  'start-date': '2026-07-12',
  'end-date': '2026-07-31',
  'subscription-start-date-time': '2026-05-01T08:00:00',
  'subscription-deadline-date-time': '2026-06-15T23:59:00',
  'GPS-track': {},
  'items-list': [{ item_id: 'i1', quantity: 1 }],
  'information-evening': {
    'date-time': '2026-06-16T18:30:00',
    location: 'Neuchâtel',
    participants: [],
  },
})

const hasCamp = computed(() => !!camp.value)

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

const campDateLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value['start-date'])
  const end = fmtDate(camp.value['end-date'])
  if (!start || !end) return ''
  return `du ${start} au ${end}`
})

const subscriptionStatus = computed(() => {
  if (!camp.value) return null
  const start = new Date(camp.value['subscription-start-date-time'])
  const end = new Date(camp.value['subscription-deadline-date-time'])
  const now = new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'unknown'
  if (now < start) return 'soon'
  if (now >= start && now <= end) return 'open'
  return 'closed'
})

const subscriptionLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value['subscription-start-date-time'])
  const end = fmtDate(camp.value['subscription-deadline-date-time'])

  if (subscriptionStatus.value === 'soon') return `Inscriptions dès le ${start}`
  if (subscriptionStatus.value === 'open') return `Inscriptions ouvertes jusqu’au ${end}`
  if (subscriptionStatus.value === 'closed') return `Inscriptions fermées (fin : ${end})`
  return ''
})

const infoEveningLabel = computed(() => {
  if (!camp.value?.['information-evening']?.['date-time']) return ''
  const d = fmtDate(camp.value['information-evening']['date-time'])
  const loc = camp.value['information-evening'].location
  return loc ? `${d} – ${loc}` : d
})
</script>

<template>
  <!--  il y a un camp -->
  <template v-if="hasCamp">
    <section class="section intro">
      <h1>{{ camp.name }}</h1>
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
      <h2>Comment inscrire son enfant ?</h2>
      <div>
        <p>Le camp est accessible à tous les jeunes entre 8 et 16 ans.</p>
        <p>
          Pour inscrire votre enfant au camp, vous devez d'abord créer un compte parent. Ensuite,
          vous pourrez inscrire votre enfant.
        </p>
      </div>

      <BaseButton class="cta" as="link" :to="{ name: 'public.signup' }">
        Créer un compte parent
      </BaseButton>
    </section>
  </template>

  <!-- pas de camp -->
  <template v-else>
    <section class="empty-page">
      <section class="section">
        <h1>Camp</h1>
        <p>
          Le prochain camp est en préparation. Nous travaillons actuellement à la définition du
          parcours et du programme.
        </p>
        <p>Créez un compte parent pour rester informé et suivre l’ouverture des inscriptions.</p>

        <BaseButton class="cta" as="link" :to="{ name: 'public.signup' }">
          Créer un compte
        </BaseButton>
      </section>
    </section>
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

.cta {
  margin: var(--sp-4) auto 0;
  display: block;
  max-width: 20rem;
}
p + p {
  padding-top: 01rem;
}
</style>
