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

const emit = defineEmits([
  'open-camp-details', // quand inscrit + camp (ouvre nouvelle section)
  'select', // optionnel si tu veux généraliser plus tard
])

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

  // 🔜 Plus tard: popup / modal selon type
  console.log('Popup info à faire plus tard pour:', props.event.type, props.event)
}

// ✅ rendre la card cliquable au clic (et accessible clavier)
// - on ouvre les détails si inscrit + camp
// - sinon, même comportement que le bouton
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
  // tu peux mettre true pour tous, mais là on met cliquable si :
  // - camp inscrit (details)
  // - ou camp non inscrit (inscription page)
  return props.event.type === 'camp'
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
    <div class="date">
      <div class="day">{{ new Date(event['start-date']).getDate() }}</div>
      <div class="month">
        {{ new Date(event['start-date']).toLocaleString('fr-FR', { month: 'short' }) }}
      </div>
    </div>

    <div class="main">
      <h4 class="title">{{ event.name }}</h4>
      <p class="meta">{{ event.location ?? '' }}</p>
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
  grid-template-columns: 62px 1fr auto;
  gap: var(--sp-2);
  align-items: center;

  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
}

/* mini calendrier */
.date {
  width: 56px;
  overflow: hidden;
  border-radius: var(--r-input);
  border: 1px solid rgba(0, 0, 0, 0.08);
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
