<script setup>
import { computed } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'

const props = defineProps({
  user: { type: Object, required: true },
})

const isParent = computed(() => props.user?.role?.includes('parent') === true)

function yesNo(v) {
  if (v === true) return 'oui'
  if (v === false) return 'non'
  return '—'
}

function fmt(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return String(value)
}

const fullName = computed(() =>
  `${props.user?.firstname ?? ''} ${props.user?.lastname ?? ''}`.trim(),
)

const addressLine = computed(() => {
  const a = props.user?.address
  if (!a) return '—'
  const parts = [a.street, [a.postalCode, a.city].filter(Boolean).join(' '), a.country].filter(
    Boolean,
  )
  return parts.length ? parts.join('\n') : '—'
})

/**
 * On prépare une liste de lignes à afficher:
 * [{ label: 'Prénom', value: 'Lucas' }, ...]
 */
const rows = computed(() => {
  const u = props.user ?? {}
  const p = u.participationInfo ?? null

  const base = [
    { label: 'Prénom', value: fmt(u.firstname) },
    { label: 'Nom', value: fmt(u.lastname) },
    { label: 'Email', value: fmt(u.email) },
    { label: 'Téléphone', value: fmt(u.phoneNumber) },
    { label: 'Adresse', value: addressLine.value },
    { label: 'Rôle', value: fmt(u.role?.join(', ')) },
  ]

  // Parent: on s'arrête là + enfants
  if (isParent.value) {
    return [
      ...base,
      { label: 'Enfants', value: fmt(u.children?.map(String)) }, // tu pourras mapper vers les noms plus tard
    ]
  }

  // Autres rôles: on ajoute participationInfo (si présent)
  const extra = !p
    ? [{ label: 'Infos participation', value: '—' }]
    : [
        { label: 'Date de naissance', value: fmt(p.birthDate) },
        { label: 'Genre', value: fmt(p.tshirtInfo?.gender) },
        { label: 'Taille T-shirt', value: fmt(p.tshirtInfo?.size) },

        { label: 'Allergies', value: fmt(p.allergies) },
        { label: 'Médicaments', value: fmt(p.medication) },

        { label: 'No AVS', value: fmt(p.insuranceNumber) } /* adapte si tu as un vrai champ AVS */,
        { label: 'Assurance', value: fmt(p.insuranceName) },

        { label: "Échéance pièce d'identité", value: fmt(p.idExpireDate) },

        { label: 'Membre CAS', value: yesNo(p.isCASMember) },
        { label: 'Assurance hélicoptère', value: yesNo(p.isHelicopterInsured) },
        { label: 'Consentement photos', value: yesNo(p.hasPhotoConsent) },

        // AG / demi-tarif : selon ton modèle actuel tu as publicTransportPass
        { label: 'AG', value: yesNo(p.publicTransportPass === 'AG') },
        {
          label: '1/2 tarif',
          value: yesNo(p.publicTransportPass === 'HALF' || p.publicTransportPass === '1/2'),
        },

        { label: 'A payé', value: yesNo(p.hasPaid) },
      ]

  return base.concat(extra)
})
</script>

<template>
  <AdminPanel :title="fullName.toUpperCase()" :is-empty="false">
    <div class="table">
      <div v-for="r in rows" :key="r.label" class="row">
        <div class="label">{{ r.label }}</div>
        <div class="value" :class="{ pre: String(r.value).includes('\n') }">
          {{ r.value }}
        </div>
      </div>
    </div>
  </AdminPanel>
</template>

<style scoped>
.table {
  display: grid;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--c-primary) 55%, transparent);
}

.value {
  text-align: right;
  opacity: 0.9;
}

.value.pre {
  white-space: pre-line; /* pour l'adresse sur plusieurs lignes */
}
</style>
