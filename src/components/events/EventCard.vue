<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['open-camp-details', 'open-training-details', 'select'])

const router = useRouter()

const isRegistered = computed(() => props.event.userStatus === 'registered')

function openDetailsIfAllowed() {
  if (isRegistered.value && props.event.type === 'camp') {
    emit('open-camp-details', props.event)
    return true
  }

  if (isRegistered.value && props.event.type === 'training') {
    emit('open-training-details', props.event)
    return true
  }

  return false
}

const goToEvent = () => {
  // si inscrit + camp : details
  if (openDetailsIfAllowed()) return

  // si inscrit (autres types), pour l’instant on ne fait rien (comme avant)
  if (isRegistered.value) return

  // Cas camp : redirection vers la page camp (inscription)
  if (props.event.type === 'camp') {
    router.push({ name: 'app.camp' })
    return
  }

  //Plus tard: popup / modal selon type
  console.log('Popup info à faire plus tard pour:', props.event.type, props.event)
}

function onCardClick() {
  // évite d’ouvrir si l’event n’a pas de date par ex.
  goToEvent()
}

function onKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    goToEvent()
  }
}

const cardClickable = computed(() => {
  // on met cliquable si :
  // - camp inscrit (details)
  // - ou camp non inscrit (inscription page)
  // - training inscrit (details)
  return props.event.type === 'camp' || (props.event.type === 'training' && isRegistered.value)
})

// Infos enrichies pour les trainings
const isTraining = computed(() => props.event.type === 'training')
const trainingMeta = computed(() => {
  if (!isTraining.value) return null
  const parts = []
  if (props.event.meetingTime) parts.push(props.event.meetingTime)
  if (props.event.distance) parts.push(`${props.event.distance} km`)
  if (props.event.elevationGain) parts.push(`D+ ${props.event.elevationGain}m`)
  return parts.join(' • ')
})

// Countdown en jours
const daysUntil = computed(() => {
  const startDate = props.event['start-date']
  if (!startDate) return null

  const eventDate = new Date(startDate)
  const today = new Date()
  // Normaliser à minuit pour comparer les jours
  eventDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffMs = eventDate - today
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return null // Passé
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Demain'
  if (diffDays <= 7) return `Dans ${diffDays} jours`
  return null // Plus de 7 jours, pas de badge
})
</script>

<template>
  <article
    class="event-card"
    :role="cardClickable ? 'button' : undefined"
    :tabindex="cardClickable ? 0 : undefined"
    @click="onCardClick"
    @keydown="onKeydown"
  >
    <div class="date-wrapper">
      <div class="date">
        <div class="day">{{ new Date(event['start-date']).getDate() }}</div>
        <div class="month">
          {{ new Date(event['start-date']).toLocaleString('fr-FR', { month: 'short' }) }}
        </div>
      </div>
      <span v-if="daysUntil" class="countdown-badge">{{ daysUntil }}</span>
    </div>

    <div class="main">
      <h4 class="title">{{ event.name }}</h4>
      <p class="meta">{{ event.location ?? '' }}</p>
      <p v-if="trainingMeta" class="training-meta">{{ trainingMeta }}</p>
    </div>

    <div class="action">
      <BaseButton
        :disabled="isRegistered"
        :variant="isRegistered ? 'secondary' : 'primary'"
        @click.stop="goToEvent"
      >
        {{ isRegistered ? 'Inscrit' : 'S’inscrire' }}
      </BaseButton>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: var(--sp-2);

  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sp-2);
  align-items: center;

  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
}

.date-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 62px;
}

.countdown-badge {
  background: var(--c-primary);
  color: white;
  font-size: 0.65rem;
  font-weight: var(--fw-semibold, 600);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
  text-transform: uppercase;
}

.date {
  width: 56px;
  overflow: hidden;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
  text-align: center;
}

.day {
  background: var(--c-primary);
  color: var(--c-bg);
  font-weight: var(--fw-semibold);
  font-size: 1.25rem;
  line-height: 1;
  padding: var(--sp-1) 0;
}

.month {
  background: var(--c-surface);
  color: var(--c-text);
  font-size: var(--fs-caption);
  letter-spacing: 0.02em;
  padding: calc(var(--sp-1) / 1.2) 0;
  text-transform: uppercase;
}

/* contenu */
.main {
  min-width: 0;
}

.title {
  margin: 0;
  font-family: var(--font-title);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-h3);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.meta {
  margin-top: 0.25rem;
  font-size: var(--fs-body);
  color: var(--c-text);
  opacity: 0.85;
}

.training-meta {
  margin-top: 0.25rem;
  font-size: var(--fs-caption);
  color: var(--c-primary);
  font-weight: var(--fw-medium, 500);
}

/* bouton */
.action {
  display: flex;
  align-items: center;
}

.btn {
  border-radius: var(--r-button);
  padding: 0.5rem 1rem;
  white-space: nowrap;
}
</style>
