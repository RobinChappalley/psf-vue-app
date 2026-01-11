<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])

// Ferme uniquement si click sur l'overlay
function onBackdropClick(e) {
  if (e.target === e.currentTarget) emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="overlay" @click="onBackdropClick" @keydown="onKeydown" tabindex="-1">
      <div class="bottom-sheet">
        <div class="header">
          <h3 class="title">{{ title }}</h3>

          <!-- Bouton fermeture via BaseButton -->
          <BaseButton variant="tertiary" size="sm" @click="emit('close')">✕</BaseButton>
        </div>

        <div class="content">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--c-bg-dark);
  display: grid;
  place-items: end;
  z-index: 1500;
}

.bottom-sheet {
  width: 100%;
  height: auto;
  background: var(--c-bg);
  border-top-left-radius: var(--r-card);
  border-top-right-radius: var(--r-card);
  box-shadow: 0 -4px 12px var(--shadow-sm);
  padding: 2rem 2rem 6rem 2rem;
  display: grid;
  gap: 1rem;
  animation: slideUp 0.3s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  font-size: var(--fs-body);
}

.content {
  max-height: 60vh;
  overflow-y: auto;
}

/* Animation */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0%);
  }
}
</style>
