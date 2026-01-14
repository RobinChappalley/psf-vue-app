<script setup>
import { usePushNotifications } from '@/composables/usePushNotification.js'

// On récupère tout ce dont on a besoin depuis le composable
const {
  supported,
  permission,
  hasSubscription,
  isLoading,
  error,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  sendWelcomePush,
} = usePushNotifications()
</script>

<template>
  <div class="push-wrapper">
    <!-- Message d'erreur -->
    <div v-if="error" class="text-error error-message">
      {{ error }}
    </div>

    <!-- 1. Si le navigateur ne gère pas les notifs -->
    <div v-if="!supported" class="text-error">
      Votre navigateur ne supporte pas les notifications.
    </div>

    <!-- 2. Si l'utilisateur a bloqué les notifs -->
    <div v-else-if="permission === 'denied'" class="denied-zone">
      <p class="text-error">Notifications bloquées</p>
      <p class="denied-instructions">
        Pour réactiver les notifications, ouvrez les paramètres de votre navigateur
        et autorisez les notifications pour ce site.
      </p>
    </div>

    <!-- 3. Si tout est OK -->
    <div v-else>
      <!-- Cas A : Déjà Abonné -->
      <div v-if="hasSubscription" class="subscribed-zone">
        <p>Notifications actives</p>

        <div class="buttons">
          <button
            @click="sendWelcomePush"
            class="btn-test"
            :disabled="isLoading"
          >
            Tester
          </button>

          <button
            @click="unsubscribeUserFromPush"
            class="btn-stop"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Désactivation...</span>
            <span v-else>Désactiver</span>
          </button>
        </div>
      </div>

      <!-- Cas B : Pas encore Abonné -->
      <div v-else>
        <button
          @click="subscribeUserToPush"
          class="btn-start"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Activation...</span>
          <span v-else>Activer les notifications</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.push-wrapper {
  padding: 1rem;
  text-align: center;
}

.text-error {
  color: var(--c-error, #d32f2f);
  font-size: 0.9em;
}

.error-message {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: var(--c-error-bg, #ffebee);
  border-radius: 4px;
}

.denied-zone {
  padding: 1rem;
}

.denied-instructions {
  font-size: 0.85em;
  color: var(--c-text-secondary, #666);
  margin-top: 0.5rem;
}

.subscribed-zone p {
  color: var(--c-success, #388e3c);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-start {
  background-color: var(--c-primary, #4caf50);
  color: white;
}

.btn-test {
  background-color: var(--c-info, #2196f3);
  color: white;
}

.btn-stop {
  background-color: var(--c-border, #ccc);
  color: var(--c-text, #333);
}
</style>
