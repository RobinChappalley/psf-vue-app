<script setup>
import { computed, ref, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { apiFetch } from '@/services/apiFetch'

// -----------------------------------
// Camp public (API) format DB
// -----------------------------------
const camp = ref(null)
const loading = ref(false)
const error = ref(null)

function toTime(x) {
  const t = new Date(x).getTime()
  return Number.isNaN(t) ? null : t
}

onMounted(async () => {
  loading.value = true
  error.value = null
  camp.value = null

  try {
    const data = await apiFetch('/camps', { method: 'GET' })
    const list = Array.isArray(data) ? data : []

    const now = Date.now()

    // published + startDate dans le futur (ou aujourd'hui)
    const next =
      list
        .filter((c) => c?.status === 'published')
        .map((c) => ({ camp: c, start: toTime(c.startDate) }))
        .filter((x) => x.start !== null && x.start >= now)
        .sort((a, b) => a.start - b.start)[0]?.camp ?? null

    // Normalise id si Mongo renvoie _id
    camp.value = next ? { ...next, id: next.id ?? next._id } : null
  } catch (e) {
    error.value = e?.message ?? 'Erreur chargement camp'
    camp.value = null
    console.warn('PublicCamp: cannot load camps:', e)
  } finally {
    loading.value = false
  }
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
  const start = fmtDate(camp.value.startDate)
  const end = fmtDate(camp.value.endDate)
  if (!start || !end) return ''
  return `du ${start} au ${end}`
})

const subscriptionStatus = computed(() => {
  if (!camp.value) return null
  const start = new Date(camp.value.subStartDatetime)
  const end = new Date(camp.value.subEndDatetime)
  const now = new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'unknown'
  if (now < start) return 'soon'
  if (now >= start && now <= end) return 'open'
  return 'closed'
})

const subscriptionLabel = computed(() => {
  if (!camp.value) return ''
  const start = fmtDate(camp.value.subStartDatetime)
  const end = fmtDate(camp.value.subEndDatetime)

  if (subscriptionStatus.value === 'soon') return `Inscriptions dès le ${start}`
  if (subscriptionStatus.value === 'open') return `Inscriptions ouvertes jusqu’au ${end}`
  if (subscriptionStatus.value === 'closed') return `Inscriptions fermées (fin : ${end})`
  return ''
})

const infoEveningLabel = computed(() => {
  if (!camp.value?.infoEvening?.dateTime) return ''
  const d = fmtDate(camp.value.infoEvening.dateTime)
  const loc = camp.value.infoEvening.location
  return loc ? `${d} – ${loc}` : d
})
</script>

<template>
  <!--  il y a un camp -->
  <template v-if="hasCamp">
    <section class="section intro">
      <h1>{{ camp.title }}</h1>
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

      <BaseButton
        as="link"
        :to="{ name: 'public.signup' }"
        variant="primary"
        size="md"
        :block="true"
      >
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

        <BaseButton
          as="link"
          :to="{ name: 'public.signup' }"
          variant="primary"
          size="md"
          :block="true"
        >
          Créer un compte
        </BaseButton>
      </section>
    </section>
  </template>
</template>

<style scoped>
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

p + p {
  padding-top: 01rem;
}
</style>
