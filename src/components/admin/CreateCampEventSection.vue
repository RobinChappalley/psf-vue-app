<script setup>
import { computed, ref } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventDropdown from '@/components/ui/EventDropdown.vue'
import EventForm from '@/components/admin/EventForm.vue'

const props = defineProps({
  camp: { type: Object, required: true },
  allowedKeys: { type: Array, default: () => ['trainings'] }, // v1
  responsibleOptions: { type: Array, default: () => [] }, // optionnel
})

const emit = defineEmits(['submit'])

const phase = ref('pick') // 'pick' | 'form'
const selectedKey = ref('')

const LABELS = {
  trainings: 'Entrainement',
  stages: 'Etape',
  'information-evening': "Soirée d'information",
  generalMeeting: 'Assemblée générale',
  fundraisings: 'Vente de pâtisserie',
}

// clés connues du camp
const POSSIBLE_KEYS = [
  'trainings',
  'stages',
  'information-evening',
  'generalMeeting',
  'fundraisings',
]

const options = computed(() => {
  return POSSIBLE_KEYS.filter((k) => k in (props.camp ?? {})).map((k) => ({
    key: k,
    label: LABELS[k] ?? k,
    enabled: props.allowedKeys.includes(k),
  }))
})

const canContinue = computed(() => {
  const o = options.value.find((x) => x.key === selectedKey.value)
  return !!o && o.enabled
})

function onContinue() {
  if (!canContinue.value) return
  phase.value = 'form'
}

function onUpdateType(newType) {
  // si l’utilisateur change le type dans le form
  const o = options.value.find((x) => x.key === newType)
  if (!o?.enabled) return
  selectedKey.value = newType
}

function onSubmit(payload) {
  // payload contient { type: 'trainings', ... }
  emit('submit', payload)
}
</script>

<template>
  <AdminPanel
    :title="`CRÉATION D’UN ÉVÈNEMENT POUR LE ${(camp?.title ?? 'CAMP').toUpperCase()}`"
    :is-empty="false"
  >
    <!-- Phase 1: choix -->
    <div v-if="phase === 'pick'" class="card">
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

    <!-- Phase 2: formulaire adaptatif -->
    <EventForm
      v-else
      mode="create"
      :type="selectedKey || 'trainings'"
      :type-options="options"
      :responsible-options="responsibleOptions"
      @update:type="onUpdateType"
      @submit="onSubmit"
    />
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
</style>
