<script setup>
import { computed } from 'vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import { getTypeEvent } from '@/composables/getTypeEvent'

const props = defineProps({
  // objet normalisé venant de tes archives:
  event: { type: Object, required: true },

  //fonction passée depuis AdminPage
  displayUserName: { type: Function, required: false },
})

function fmt(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'object') return '—'
  return String(value)
}

function fmtDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return fmt(raw)
  return d.toLocaleDateString('fr-CH', { dateStyle: 'medium' })
}

function fmtDateTime(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return fmt(raw)
  return d.toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtGps(gpsTrack) {
  if (!gpsTrack || (typeof gpsTrack === 'object' && Object.keys(gpsTrack).length === 0)) return '—'
  return gpsTrack.fileName ?? '✅'
}

function fmtParticipants(participants) {
  if (!Array.isArray(participants) || participants.length === 0) return '—'
  if (typeof participants[0] === 'object') {
    return participants.map((p) => `${p.email ?? '—'} (${p.nbOfParticipants ?? '—'})`).join(', ')
  }
  return participants.map(String).join(', ')
}

/* ======================================================
   RESPONSABLE — helpers
====================================================== */
function getResponsibleId(d) {
  // Standard backend: responsiblePerson (id)
  // Supporte aussi: responsiblePersonId (legacy) et populate (objet user)
  return (
    d?.responsiblePerson ??
    d?.responsiblePerson?._id ??
    d?.responsiblePerson?.id ??
    d?.responsiblePersonId ??
    d?.responsiblePersonId?._id ??
    d?.responsiblePersonId?.id ??
    null
  )
}

function fmtResponsible(d) {
  const rid = getResponsibleId(d)

  if (props.displayUserName && rid) return props.displayUserName(rid)

  return fmt(rid ?? d?.responsiblePerson ?? d?.responsiblePersonId)
}

const title = computed(() => {
  const meta = getTypeEvent({ type: props.event?.type, data: props.event?.data })
  return (meta?.title ?? 'DÉTAILS').toUpperCase()
})

/**
 * rows à la façon UserDetailsPanel:
 * [{label, value}]
 */
const rows = computed(() => {
  const ev = props.event ?? {}
  const type = ev.type
  const d = ev.data ?? {}

  const base = ev.__campTitle ? [{ label: 'Camp', value: ev.__campTitle }] : []

  // --- CAMP ---
  if (type === 'camp') {
    return base.concat([
      { label: 'Début', value: fmtDate(d.startDate) },
      { label: 'Fin', value: fmtDate(d.endDate) },
      { label: 'Début inscriptions', value: fmtDateTime(d.subStartDatetime) },
      { label: 'Fin inscriptions', value: fmtDateTime(d.subEndDatetime) },
    ])
  }

  // --- TRAINING ---
  if (type === 'training') {
    return base.concat([
      { label: 'Date', value: fmtDate(d.date) },
      { label: 'Heure rdv', value: fmt(d.meetingTime) },
      { label: 'Lieu rdv', value: fmt(d.meetingPoint) },
      { label: 'Heure retour', value: fmt(d.returnTime) },
      { label: 'Distance', value: d.distance !== undefined ? `${d.distance} km` : '—' },
      { label: 'D+ (m)', value: fmt(d.elevationGain) },
      { label: 'Responsable', value: fmtResponsible(d) },
      { label: 'Trace GPX', value: fmtGps(d.gpsTrack) },
    ])
  }

  // --- INFO EVENING ---
  if (type === 'infoEvening') {
    return base.concat([
      { label: 'Date & heure', value: fmtDateTime(d.dateTime) },
      { label: 'Lieu', value: fmt(d.location) },
      { label: 'Participants', value: fmtParticipants(d.participants) },
    ])
  }

  // --- AG ---
  if (type === 'generalMeeting') {
    const p = d.items
    const participants = p ? `${p.email ?? '—'} (${p.nbOfParticipants ?? '—'})` : '—'

    return base.concat([
      { label: 'Date & heure', value: fmtDateTime(d.dateTime) },
      { label: 'Lieu', value: fmt(d.location) },
      { label: 'Participants', value: participants },
    ])
  }

  // --- FUNDRAISING ---
  if (type === 'fundraisings') {
    return base.concat([
      { label: 'Numéro', value: fmt(d.number) },
      { label: 'Date & heure', value: fmtDateTime(d.dateTime) },
      { label: 'Lieu', value: fmt(d.location) },
      { label: 'Participants', value: fmtParticipants(d.participants) },
    ])
  }

  // --- STAGE ---
  if (type === 'stages') {
    return base.concat([
      { label: 'Numéro', value: fmt(d.number) },
      { label: 'Date', value: fmtDate(d.date) },
      { label: 'Départ', value: fmt(d.startPoint) },
      { label: 'Arrivée', value: fmt(d.endPoint) },
      { label: 'Distance', value: d.distance !== undefined ? `${d.distance} km` : '—' },
      { label: 'D+ (m)', value: fmt(d.elevationGain) },
      { label: 'D- (m)', value: fmt(d.elevationLoss) },
    ])
  }

  // fallback
  return base.concat([{ label: 'Données', value: '—' }])
})
</script>

<template>
  <AdminPanel :title="title" :is-empty="false">
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
  white-space: pre-line;
}
</style>
