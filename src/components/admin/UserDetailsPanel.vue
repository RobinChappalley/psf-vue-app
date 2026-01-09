<script setup>
import { computed, ref, watch } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { updateUserRole, deleteUser } from '@/api/users'

const props = defineProps({
  user: { type: Object, required: true },
})

const emit = defineEmits(['updated', 'deleted'])

/* =========================
   STATE
========================= */

const mode = ref('view') // 'view' | 'role'

// rôles possibles (alignés backend)
const roleOptions = [
  { key: 'admin', label: 'Admin' },
  { key: 'accompagnant', label: 'Accompagnant' },
  { key: 'parent', label: 'Parent' },
  { key: 'child', label: 'Enfant' },
]

// draft des rôles
const selectedRole = ref('')

/* reset quand l’utilisateur change */
watch(
  () => props.user,
  (u) => {
    selectedRole.value = (u?.role ?? [])[0] ?? ''
    mode.value = 'view'
  },
  { immediate: true },
)

/* =========================
   COMPUTED EXISTANTS
========================= */

const isParent = computed(() => props.user?.role?.includes('parent') === true)

const fullName = computed(() =>
  `${props.user?.firstname ?? ''} ${props.user?.lastname ?? ''}`.trim(),
)

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

const addressLine = computed(() => {
  const a = props.user?.address
  if (!a) return '—'
  const parts = [a.street, [a.postalCode, a.city].filter(Boolean).join(' '), a.country].filter(
    Boolean,
  )
  return parts.length ? parts.join('\n') : '—'
})

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

  if (isParent.value) {
    return [...base, { label: 'Enfants', value: fmt(u.children?.map(String)) }]
  }

  const extra = !p
    ? [{ label: 'Infos participation', value: '—' }]
    : [
        { label: 'Date de naissance', value: fmt(p.birthDate) },
        { label: 'Genre', value: fmt(p.tshirtInfo?.gender) },
        { label: 'Taille T-shirt', value: fmt(p.tshirtInfo?.size) },
        { label: 'Allergies', value: fmt(p.allergies) },
        { label: 'Médicaments', value: fmt(p.medication) },
        { label: 'No AVS', value: fmt(p.insuranceNumber) },
        { label: 'Assurance', value: fmt(p.insuranceName) },
        { label: "Échéance pièce d'identité", value: fmt(p.idExpireDate) },
        { label: 'Membre CAS', value: yesNo(p.isCASMember) },
        { label: 'Assurance hélicoptère', value: yesNo(p.isHelicopterInsured) },
        { label: 'Consentement photos', value: yesNo(p.hasPhotoConsent) },
        { label: 'AG', value: yesNo(p.publicTransportPass === 'AG') },
        {
          label: '1/2 tarif',
          value: yesNo(p.publicTransportPass === 'HALF' || p.publicTransportPass === '1/2'),
        },
        { label: 'A payé', value: yesNo(p.hasPaid) },
      ]

  return base.concat(extra)
})

/* =========================
   ACTIONS
========================= */

function openRoleEdit() {
  selectedRole.value = (props.user.role ?? [])[0] ?? ''
  mode.value = 'role'
}

function cancelRoleEdit() {
  selectedRole.value = (props.user.role ?? [])[0] ?? ''
  mode.value = 'view'
}

async function confirmRoleEdit() {
  if (!selectedRole.value) return

  const updated = await updateUserRole(props.user.id, [selectedRole.value])
  emit('updated', updated)
  mode.value = 'view'
}

async function removeUser() {
  const ok = confirm('Supprimer définitivement ce membre ?')
  if (!ok) return

  await deleteUser(props.user.id, { deleteChildren: false })
  emit('deleted', props.user.id)
}
</script>

<template>
  <!-- ========================= -->
  <!-- MODE LECTURE -->
  <!-- ========================= -->
  <AdminPanel v-if="mode === 'view'" :title="fullName.toUpperCase()" :is-empty="false">
    <div class="table">
      <div v-for="r in rows" :key="r.label" class="row">
        <div class="label">{{ r.label }}</div>
        <div class="value" :class="{ pre: String(r.value).includes('\n') }">
          {{ r.value }}
        </div>
      </div>
    </div>

    <template #actions>
      <BaseButton variant="primary" :block="true" @click="openRoleEdit">
        Modifier le rôle
      </BaseButton>

      <BaseButton variant="tertiary" :block="true" @click="removeUser">
        Supprimer le membre
      </BaseButton>
    </template>
  </AdminPanel>

  <!-- ========================= -->
  <!-- MODE MODIFICATION RÔLE -->
  <!-- ========================= -->
  <AdminPanel v-else title="MODIFIER LE RÔLE" :is-empty="false">
    <div class="roles">
      <label v-for="r in roleOptions" :key="r.key" class="role">
        <input type="radio" name="user-role" :value="r.key" v-model="selectedRole" />
        <span>{{ r.label }}</span>
      </label>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :block="true" @click="confirmRoleEdit">
        Confirmer la modification
      </BaseButton>

      <BaseButton variant="primary" :block="true" @click="cancelRoleEdit"> Annuler </BaseButton>
    </template>
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
  white-space: pre-line;
}

/* --- Role edit --- */
.roles {
  display: grid;
  gap: 0.75rem;
}

.role {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: var(--fs-body);
}
</style>
