<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  event: { type: Object, required: true },
})

const router = useRouter()

const startStr = computed(() => props.event['start-date'] || props.event.dateStart || '')
const endStr = computed(() => props.event['end-date'] || props.event.dateEnd || '')

const dateLabel = computed(() => {
  // si tu as déjà des strings type "12 juillet", on les affiche telles quelles
  if (startStr.value && endStr.value && startStr.value.includes(' ')) {
    return `du ${startStr.value} au ${endStr.value}`
  }
  // sinon ISO => on formate simple
  const s = startStr.value ? new Date(startStr.value) : null
  const e = endStr.value ? new Date(endStr.value) : null
  if (!s || Number.isNaN(s.getTime()) || !e || Number.isNaN(e.getTime())) return ''
  const fmt = (d) =>
    d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
  return `du ${fmt(s)} au ${fmt(e)}`
})

const goMoreInfo = () => {
  // 🔁 adapte selon tes routes
  router.push({ name: 'public.subscription', params: { id: props.event.id } })
}
</script>

<template>
  <section class="camp-highlight">
    <h2 class="title">{{ event.name }}</h2>

    <p class="lead" v-if="dateLabel">Cette année, le camp se déroulera {{ dateLabel }}.</p>

    <p class="text">
      Nous aurons la chance de traverser les Alpes et d’arriver en Italie, au rythme de la marche et
      de la vie en groupe.
    </p>

    <h3 class="subtitle">INFORMATIONS CLÉS</h3>

    <dl class="facts">
      <div class="row">
        <dt>Date</dt>
        <dd>{{ dateLabel || '—' }}</dd>
      </div>

      <div class="row">
        <dt>Âge</dt>
        <dd>Entre 8 et 16 ans</dd>
      </div>
    </dl>

    <p class="text">
      Le parcours est adapté aux jeunes participants, et préparé tout au long de l’année grâce à des
      entrainements.
    </p>

    <BaseButton variant="primary" size="md" :block="true" @click="goMoreInfo">
      Obtenir davantage d'information
    </BaseButton>
  </section>
</template>

<style scoped>
.camp-highlight {
  background: var(--c-info);
  color: var(--c-text);
  padding: var(--sp-4) var(--sp-2);
}

.title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  text-transform: uppercase;
  margin: 0 0 var(--sp-2);
}

.subtitle {
  font-family: var(--font-title);
  font-size: var(--fs-h3);
  text-transform: uppercase;
  margin: var(--sp-4) 0 var(--sp-2);
}

.lead,
.text {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-body);
  line-height: 1.35;
}

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
</style>
