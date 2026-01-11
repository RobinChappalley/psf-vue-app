<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventsBlock from '@/components/events/EventsBlock.vue'
import { authStore } from '@/stores/auth'

const router = useRouter()

// 1 = email, 2 = formulaire complet, 3 = confirmation
const step = ref(1)

// État pour la gestion des erreurs et du chargement
const isLoading = ref(false)
const errorMessage = ref('')

// données du formulaire
const form = ref({
  email: '',
  firstname: '',
  lastname: '',
  password: '',
  address: '',
  zip: '',
  city: '',
  country: '',
})

// --- Helpers validation ---
const normalizedEmail = computed(() => form.value.email.trim().toLowerCase())

const passwordOk = computed(() => (form.value.password || '').length >= 8)

const canGoStep2 = computed(() => !!normalizedEmail.value)

const isFormValid = computed(() => {
  return (
    !!normalizedEmail.value &&
    form.value.firstname.trim() !== '' &&
    form.value.lastname.trim() !== '' &&
    passwordOk.value &&
    form.value.address.trim() !== '' &&
    form.value.zip.trim() !== '' &&
    form.value.city.trim() !== '' &&
    form.value.country.trim() !== ''
  )
})

// --- Actions ---
const goStep2 = () => {
  if (!canGoStep2.value) return
  step.value = 2
}

const createAccount = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      email: normalizedEmail.value,
      firstname: form.value.firstname.trim(),
      lastname: form.value.lastname.trim(),
      password: form.value.password,
      address: {
        street: form.value.address.trim(),
        zip: form.value.zip.trim(),
        city: form.value.city.trim(),
        country: form.value.country.trim(),
      },
    }

    await authStore.signup(payload)
    step.value = 3
  } catch (err) {
    // Gestion des erreurs spécifiques
    if (err.status === 409) {
      errorMessage.value = 'Un compte existe déjà pour cette adresse e-mail.'
    } else {
      errorMessage.value = err.message || 'Erreur lors de la création du compte.'
    }
  } finally {
    isLoading.value = false
  }
}

const goHome = () => router.push({ name: 'public.home' })
const goToCamp = () => {
  // Si l'utilisateur est connecté après l'inscription, aller vers l'app
  if (authStore.isAuthenticated.value) {
    router.push({ name: 'app.camp' })
  } else {
    router.push({ name: 'public.subscription' })
  }
}
const goToLogin = () => router.push({ name: 'public.login' })
</script>

<template>
  <main class="section">
    <!-- STEP 1 : intro + email -->
    <template v-if="step === 1">
      <h1>Création de compte</h1>
      <p>Pour inscrire votre enfant à un camp, la création d’un compte parent est nécessaire.</p>
      <p>Ce compte vous permettra de gérer simplement les informations et les inscriptions.</p>

      <EventsBlock title="" :has-items="true" class="block">
        <div class="content">
          <label class="label" for="email">E-mail</label>
          <input
            id="email"
            v-model="form.email"
            class="input"
            type="email"
            placeholder="jane.doe@example.com"
          />

          <BaseButton
            type="button"
            variant="primary"
            size="md"
            :block="true"
            :disabled="!canGoStep2"
            @click="goStep2"
          >
            Continuer
          </BaseButton>
        </div>
      </EventsBlock>
    </template>

    <!-- STEP 2 : formulaire complet -->
    <template v-else-if="step === 2">
      <h1>S'inscrire</h1>
      <EventsBlock title="" :has-items="true" class="block">
        <form class="content form" @submit.prevent="createAccount">
          <label class="label" for="email2">E-mail</label>
          <input
            id="email2"
            v-model="form.email"
            class="input"
            type="email"
            placeholder="votre.adresse@example.com"
          />

          <label class="label" for="firstname">Prénom</label>
          <input
            id="firstname"
            v-model="form.firstname"
            class="input"
            type="text"
            placeholder="Jane"
          />

          <label class="label" for="lastname">Nom</label>
          <input
            id="lastname"
            v-model="form.lastname"
            class="input"
            type="text"
            placeholder="Doe"
          />

          <label class="label" for="password">Mot de passe</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            placeholder="••••••••"
          />

          <p class="help" :class="{ error: form.password.length > 0 && !passwordOk }">
            ⚠ Votre mot de passe doit comporter au moins 8 caractères
          </p>

          <label class="label" for="address">Adresse (Rue et numéro)</label>
          <input
            id="address"
            v-model="form.address"
            class="input"
            type="text"
            placeholder="Rue de l’exemple 10"
          />

          <div class="row2">
            <div>
              <label class="label" for="zip">Code postal</label>
              <input id="zip" v-model="form.zip" class="input" type="text" placeholder="1700" />
            </div>
            <div>
              <label class="label" for="city">Localité</label>
              <input
                id="city"
                v-model="form.city"
                class="input"
                type="text"
                placeholder="Fribourg"
              />
            </div>
          </div>

          <label class="label" for="country">Pays</label>
          <input
            id="country"
            v-model="form.country"
            class="input"
            type="text"
            placeholder="Suisse"
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="md"
            :block="true"
            :disabled="!isFormValid || isLoading"
          >
            {{ isLoading ? 'Création en cours...' : 'Créer le compte' }}
          </BaseButton>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <p v-else-if="!isFormValid" class="help muted">Veuillez remplir tous les champs.</p>
        </form>
      </EventsBlock>
    </template>

    <!-- STEP 3 : confirmation -->
    <template v-else>
      <h1>CONFIRMATION DE CRÉATION DE COMPTE</h1>
      <p>Merci pour la création de votre compte !</p>
      <p v-if="authStore.isAuthenticated.value">
        Vous êtes maintenant connecté et pouvez inscrire vos enfants à un camp.
      </p>
      <p v-else>
        Vous pouvez maintenant vous connecter et inscrire vos enfants à un camp.
      </p>

      <div class="content confirm">
        <BaseButton type="button" variant="secondary" size="md" :block="true" @click="goHome">
          Retour à la page d'accueil
        </BaseButton>

        <BaseButton
          v-if="authStore.isAuthenticated.value"
          type="button"
          variant="primary"
          size="md"
          :block="true"
          @click="goToCamp"
        >
          Inscrire un enfant à un camp
        </BaseButton>

        <BaseButton
          v-else
          type="button"
          variant="primary"
          size="md"
          :block="true"
          @click="goToLogin"
        >
          Se connecter
        </BaseButton>
      </div>
    </template>
  </main>
</template>

<style scoped>
/* Block */
.block {
  margin-top: var(--sp-3);
}

/* Content */
.content {
  padding-inline: var(--sp-2);
}

/* Paragraph spacing */
.content p + p {
  margin-top: var(--sp-2);
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.label {
  font-size: var(--fs-caption);
  opacity: 0.85;
  margin-top: var(--sp-1);
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

.help {
  margin: 0;
  font-size: var(--fs-caption);
  opacity: 0.75;
}

.help.error {
  color: var(--c-warning);
  opacity: 1;
}

.help.muted {
  opacity: 0.65;
}

.error {
  margin-top: var(--sp-1);
  font-size: var(--fs-caption);
  color: var(--c-warning);
  opacity: 1;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}

.confirm {
  text-align: left;
}
</style>
