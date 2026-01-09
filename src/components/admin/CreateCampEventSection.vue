<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventDropdown from '@/components/ui/EventDropdown.vue'

const props = defineProps({
  camp: { type: Object, required: true },

  // v1: on n’autorise que trainings (mais l’UI peut afficher d’autres options plus tard)
  allowedKeys: { type: Array, default: () => ['trainings'] },
})

const emit = defineEmits(['select'])

const selectedKey = ref('')

// mapping clé -> label UI
const LABELS = {
  trainings: 'Entrainement',
  'information-evening': "Soirée d'information",
  fundraisings: 'Vente de pâtisserie',
  generalMeeting: 'Assemblée générale',
  stages: 'Stage',
}

// types potentiels dans le camp (on se base sur TON modèle)
const POSSIBLE_KEYS = [
  'trainings',
  'information-evening',
  'fundraisings',
  'generalMeeting',
  'stages',
]

// options visibles = clés présentes dans camp (même si vides) + label
const options = computed(() => {
  return POSSIBLE_KEYS.filter((k) => k in (props.camp ?? {})).map((k) => ({
    key: k,
    label: LABELS[k] ?? k,
    enabled: props.allowedKeys.includes(k),
  }))
})

// validation
const canContinue = computed(
  () => !!selectedKey.value && options.value.some((o) => o.key === selectedKey.value && o.enabled),
)

function onContinue() {
  if (!canContinue.value) return
  emit('select', selectedKey.value)
}
</script>

<template>
  <AdminPanel
    :title="`CRÉATION D’UN ÉVÈNEMENT POUR LE ${(camp?.title ?? 'CAMP').toUpperCase()}`"
    :is-empty="false"
  >
    <div class="card">
      <div class="field">
        <label>Évènement</label>
        <EventDropdown v-model="selectedKey" :options="options" />
      </div>

      <BaseButton
        variant="primary"
        size="md"
        :block="true"
        :disabled="!canContinue"
        @click="onContinue"
      >
        Continuer
      </BaseButton>
    </div>
  </AdminPanel>
</template>

<style scoped>
.card {
  border-radius: var(--r-input);
  padding: var(--sp-3);
  display: grid;
  gap: var(--sp-2);
}

.field label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  line-height: 1.2;
  margin-bottom: 0.35rem;
  color: var(--c-text);
}

.select {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  padding: 0.65rem 0.75rem;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text);
  outline: none;
}
</style>
