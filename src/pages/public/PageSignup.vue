<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import EventsBlock from '@/components/events/EventsBlock.vue'
import { authStore } from '@/stores/auth'
import { getUsers } from '@/services/usersApi' // pour check email si search supporté

const router = useRouter()

const step = ref(1)
const loading = ref(false)
const apiError = ref('')

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

const normalizedEmail = computed(() => form.value.email.trim().toLowerCase())

// --- validation ---
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

// --- email exists (via backend si possible) ---
const emailExists = ref(false)

async function checkEmailExists() {
  emailExists.value = false
  apiError.value = ''
  if (!normalizedEmail.value) return

  try {
    // Si ton backend gère ?search=, ça marchera.
    // Sinon ça retournera tout le monde ou ignorera search → dans ce cas, ça ne sert à rien mais ne casse pas.
    const users = await getUsers({ search: normalizedEmail.value })
    emailExists.value = users.some(
      (u) =>
        String(u.email || '')
          .trim()
          .toLowerCase() === normalizedEmail.value,
    )
  } catch (e) {
    // si l'endpoint n'accepte pas search ou autre, on ignore (on laissera le backend trancher au moment du POST)
    emailExists.value = false
  }
}

const canGoStep2 = computed(() => {
  return !!normalizedEmail.value && !emailExists.value && !loading.value
})

const goStep2 = async () => {
  if (!normalizedEmail.value) return
  loading.value = true
  try {
    await checkEmailExists()
    if (!emailExists.value) step.value = 2
  } finally {
    loading.value = false
  }
}

async function createAccount() {
  apiError.value = ''
  if (!isFormValid.value) return

  loading.value = true
  try {
    const payload = {
      email: normalizedEmail.value,
      firstname: form.value.firstname.trim(),
      lastname: form.value.lastname.trim(),
      password: form.value.password,
      // selon ton backend / model: soit address string, soit objet
      // je te mets objet (plus propre), adapte si besoin:
      address: {
        address: form.value.address.trim(),
        zip: form.value.zip.trim(),
        city: form.value.city.trim(),
        country: form.value.country.trim(),
      },
      role: ['parent'], // si backend accepte
    }

    await authStore.signup(payload)
    step.value = 3
  } catch (e) {
    // apiFetch devrait throw une erreur; selon ton implémentation tu auras e.message ou e.data.message
    const msg = e?.data?.message || e?.message || 'Erreur lors de la création du compte. Réessaie.'
    // Si backend renvoie 409/400 sur email existant
    if (String(msg).toLowerCase().includes('exist')) {
      apiError.value = 'Un compte existe déjà pour cette adresse e-mail.'
      step.value = 1
    } else {
      apiError.value = msg
    }
  } finally {
    loading.value = false
  }
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
            :disabled="!isFormValid"
          >
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
        <BaseButton type="button" variant="secondary" size="md" :block="true" @click="goHome">
          Retour à la page d’accueil
        </BaseButton>

        <BaseButton type="button" variant="primary" size="md" :block="true" @click="goToCamp">
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

.confirm {
  text-align: left;
}
</style>
