<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmer' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmer' },
  cancelText: { type: String, default: 'Annuler' },
  dangerous: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

function onBackdropClick(e) {
  // ferme uniquement si click sur l’overlay
  if (e.target === e.currentTarget) emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="overlay" role="dialog" aria-modal="true" @click="onBackdropClick">
      <div class="modal" @keydown="onKeydown" tabindex="-1">
        <h3 class="title">{{ title }}</h3>

        <p v-if="message" class="message">{{ message }}</p>
        <div v-if="$slots.default" class="slot">
          <slot />
        </div>

        <div class="actions">
          <button class="btn secondary" type="button" :disabled="loading" @click="emit('cancel')">
            {{ cancelText }}
          </button>

          <button
            class="btn"
            :class="{ danger: dangerous }"
            type="button"
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? '...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 999;
}

.modal {
  width: min(520px, 100%);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-3);
  display: grid;
  gap: var(--sp-2);
}

.title {
  margin: 0;
  font-size: var(--fs-body);
}

.message {
  margin: 0;
  font-size: var(--fs-caption);
  opacity: 0.85;
  line-height: 1.35rem;
}

.slot {
  margin-top: 0.25rem;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.btn {
  height: 44px;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
  background: var(--c-primary);
  color: var(--c-bg);
  cursor: pointer;
  font: inherit;
}

.btn.secondary {
  background: var(--c-bg);
  color: inherit;
}

.btn.danger {
  background: var(--c-primary); /* tu peux remplacer par var(--c-danger) si tu l’as */
  border-color: transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
