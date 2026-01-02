<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventsBlock from '@/components/events/EventsBlock.vue'

const router = useRouter()

// 1 = email, 2 = formulaire complet, 3 = confirmation
const step = ref(1)

// ✅ "DB" mock (plus tard: API)
const existingUsers = ref([
  { id: 'u1', email: 'jane.doe@example.com' },
  { id: 'u2', email: 'robin@test.ch' },
])

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

const emailExists = computed(() => {
  if (!normalizedEmail.value) return false
  return existingUsers.value.some(
    (u) => (u.email || '').trim().toLowerCase() === normalizedEmail.value,
  )
})

const canGoStep2 = computed(() => {
  // email non vide + n'existe pas déjà
  return !!normalizedEmail.value && !emailExists.value
})

const passwordOk = computed(() => (form.value.password || '').length >= 8)

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

const createAccount = () => {
  if (!isFormValid.value) return

  // ✅ Simulation DB (plus tard: backend)
  existingUsers.value.push({
    id: String(Date.now()),
    email: normalizedEmail.value,
  })

  step.value = 3
}

const goHome = () => router.push({ name: 'public.home' })
const goToCamp = () => router.push({ name: 'public.subscription' })
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

          <p v-if="emailExists" class="error">Un compte existe déjà pour cette adresse e-mail.</p>

          <BaseButton class="cta" type="button" :disabled="!canGoStep2" @click="goStep2">
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

          <BaseButton class="cta" type="submit" :disabled="!isFormValid">
            Créer le compte
          </BaseButton>

          <p v-if="!isFormValid" class="help muted">Veuillez remplir tous les champs.</p>
        </form>
      </EventsBlock>
    </template>

    <!-- STEP 3 : confirmation -->
    <template v-else>
      <h1>CONFIRMATION DE CRÉATION DE COMPTE</h1>
      <p>Merci pour la création de votre compte !</p>
      <p>
        Vous allez recevoir un e-mail de confirmation, avec toutes les informations importantes.
      </p>

      <div class="content confirm">
        <BaseButton class="cta" :class="`btn--secondary`" type="button" @click="goHome">
          Retour à la page d’accueil
        </BaseButton>

        <BaseButton class="cta" type="button" @click="goToCamp">
          Inscrire un enfant à un camp
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

/* Buttons */
.cta {
  margin: var(--sp-4) auto 0;
  display: block;
  max-width: 20rem;
}

.confirm {
  text-align: left;
}
</style>
