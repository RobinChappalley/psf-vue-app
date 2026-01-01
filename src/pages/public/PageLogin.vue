<script setup>
import { ref } from 'vue'
import EventsBlock from '@/components/events/EventsBlock.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const email = ref('')
const password = ref('')
</script>

<template>
  <main class="section">
    <h1>Connexion</h1>
    <!-- Block (réutilise EventsBlock) -->
    <EventsBlock title="" :has-items="true" class="login-block">
      <form class="form" @submit.prevent>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          class="input"
          type="email"
          placeholder="jane.doe@example.com"
          autocomplete="email"
        />

        <label class="label" for="password">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          class="input"
          type="password"
          placeholder="••••••••••••"
          autocomplete="current-password"
        />

        <BaseButton class="submit" type="submit"> Se connecter </BaseButton>

        <p class="hint">
          Pas encore de compte ?
          <RouterLink class="link" :to="{ name: 'public.subscription' }"
            >Enregistrez-vous</RouterLink
          >
        </p>
      </form>
    </EventsBlock>
  </main>
</template>

<style scoped>
/* Form */
.form {
  padding-inline: var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.label {
  font-size: var(--fs-caption);
  opacity: 0.85;
}

.input {
  width: 100%;
  border: 1px solid var(--c-secondary);
  border-radius: var(--r-input);
  padding: var(--sp-1);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  background: var(--c-bg);
  outline: none;
}

.input::placeholder {
  opacity: 0.5;
}

.submit {
  width: 100%;
  margin-top: var(--sp-2);
  border-radius: var(--r-button);
}

.hint {
  margin-top: var(--sp-2);
  text-align: center;
  font-size: var(--fs-caption);
  opacity: 0.8;
}

.link {
  color: var(--c-text);
  text-decoration: underline;
}
</style>
