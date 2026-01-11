<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
})

const emit = defineEmits(['submit'])

// Form local (évite de modifier directement le store)
const form = reactive({
  email: '',
  firstname: '',
  lastname: '',
  address: {
    street: '',
    city: '',
    postalCode: '',
    country: '',
  },
})

function hydrateFromUser(u) {
  form.email = u?.email ?? ''
  form.firstname = u?.firstname ?? ''
  form.lastname = u?.lastname ?? ''
  form.address.street = u?.address?.street ?? ''
  form.address.city = u?.address?.city ?? ''
  form.address.postalCode =
    u?.address?.postalCode !== undefined && u?.address?.postalCode !== null
      ? String(u.address.postalCode)
      : ''
  form.address.country = u?.address?.country ?? ''
}

watch(
  () => props.user,
  (u) => hydrateFromUser(u),
  { immediate: true, deep: true },
)

function onSubmit() {
  // Normalisation: postalCode en number si possible
  const postalCodeNum =
    form.address.postalCode.trim() === '' ? null : Number(form.address.postalCode)

  emit('submit', {
    email: form.email || null,
    firstname: form.firstname,
    lastname: form.lastname,
    address: {
      street: form.address.street || null,
      city: form.address.city || null,
      postalCode: Number.isFinite(postalCodeNum) ? postalCodeNum : null,
      country: form.address.country || null,
    },
  })
}
</script>
<template>
  <section class="wrap">
    <form class="card" @submit.prevent="onSubmit">
      <div class="field">
        <label for="email">E-mail</label>
        <input
          id="email"
          v-model.trim="form.email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="votre.adresse@example.com"
        />
      </div>

      <div class="field">
        <label for="firstname">Prénom</label>
        <input
          id="firstname"
          v-model.trim="form.firstname"
          type="text"
          autocomplete="given-name"
          placeholder="Prénom"
        />
      </div>

      <div class="field">
        <label for="lastname">Nom</label>
        <input
          id="lastname"
          v-model.trim="form.lastname"
          type="text"
          autocomplete="family-name"
          placeholder="Nom"
        />
      </div>

      <div class="field">
        <label for="street">Adresse (Rue et numéro)</label>
        <input
          id="street"
          v-model.trim="form.address.street"
          type="text"
          autocomplete="street-address"
          placeholder="Rue de l’Exemple 10"
        />
      </div>

      <div class="grid-2">
        <div class="field cp">
          <label for="postalCode">Code postal</label>
          <input
            id="postalCode"
            v-model="form.address.postalCode"
            type="text"
            inputmode="numeric"
            autocomplete="postal-code"
            placeholder="1700"
          />
        </div>

        <div class="field">
          <label for="city">Localité</label>
          <input
            id="city"
            v-model.trim="form.address.city"
            type="text"
            autocomplete="address-level2"
            placeholder="Fribourg"
          />
        </div>
      </div>

      <div class="field">
        <label for="country">Pays</label>
        <input
          id="country"
          v-model.trim="form.address.country"
          type="text"
          autocomplete="country-name"
          placeholder="Suisse"
        />
      </div>

      <BaseButton type="submit" variant="primary" size="md" :block="true">
        Valider les modifications
      </BaseButton>
    </form>
  </section>
</template>

<style scoped>
.wrap {
  padding: var(--sp-3);
  width: 100%;
}

.section-title {
  font-family: var(--font-title);
  font-size: var(--fs-h3);
  letter-spacing: 0.02em;
  margin: 0 0 var(--sp-2);
  color: var(--c-text);
}

.card {
  background: var(--c-surface);
  padding: var(--sp-3);
}

.field {
  margin-bottom: var(--sp-2);
}

label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  line-height: 1.2;
  margin-bottom: 0.35rem;
  color: var(--c-bg-dark);
}

input {
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
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

input::placeholder {
  color: var(--nav-inactive);
}

input:focus {
  border-color: var(--c-info);
  box-shadow: 0 0 0 3px var(--c-info);
}

/* --- Grid postal code + city --- */
.grid-2 {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.grid-2 .field {
  margin-bottom: 0;
  flex: 1;
}

/* Code postal un peu plus étroit comme sur ta capture */
.grid-2 .field.cp {
  flex: 0.85;
}
</style>
