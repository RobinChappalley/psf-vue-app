import { apiFetch } from '@/services/apiFetch'

function normalizeCamp(c) {
  if (!c || typeof c !== 'object') return c
  return {
    ...c,
    id: c.id ?? c._id, // mapping principal
  }
}

function normalizeTraining(t) {
  if (!t || typeof t !== 'object') return t
  return {
    ...t,
    id: t.id ?? t._id, // pratique côté front
  }
}

// helper pour FormData
function appendIfDefined(fd, key, value) {
  if (value === undefined || value === null || value === '') return
  fd.append(key, value)
}

/* ======================================================
   CAMPS CRUD
====================================================== */
export async function listCamps() {
  const data = await apiFetch('/camps', { method: 'GET' })
  return Array.isArray(data) ? data.map(normalizeCamp) : []
}

export async function getCamp(id) {
  const data = await apiFetch(`/camps/${id}`, { method: 'GET' })
  return normalizeCamp(data?.camp ?? data)
}

export async function createCamp(payload) {
  const data = await apiFetch('/camps', { method: 'POST', body: payload })
  return normalizeCamp(data?.camp ?? data)
}

export async function updateCamp(id, payload) {
  const data = await apiFetch(`/camps/${id}`, { method: 'PUT', body: payload })
  return normalizeCamp(data?.camp ?? data)
}

export async function deleteCamp(id) {
  return apiFetch(`/camps/${id}`, { method: 'DELETE' })
}

/* ======================================================
   TRAININGS (subdocs)
====================================================== */

export async function listCampTrainings(campId) {
  const data = await apiFetch(`/camps/${campId}/trainings`, { method: 'GET' })
  return Array.isArray(data) ? data.map(normalizeTraining) : []
}

export async function getCampTraining(campId, trainingId) {
  const data = await apiFetch(`/camps/${campId}/trainings/${trainingId}`, { method: 'GET' })
  return normalizeTraining(data)
}

export async function createCampTraining(campId, payload) {
  const fd = new FormData()

  // required/optional fields
  appendIfDefined(fd, 'date', payload?.date)

  appendIfDefined(fd, 'meetingPoint', payload?.meetingPoint)
  appendIfDefined(fd, 'meetingTime', payload?.meetingTime)

  // UI -> backend mapping
  appendIfDefined(fd, 'returnTime', payload?.arrivalTime)
  appendIfDefined(fd, 'responsiblePersonId', payload?.responsiblePerson)

  // numbers -> string
  if (payload?.distance != null) fd.append('distance', String(payload.distance))
  if (payload?.elevationGain != null) fd.append('elevationGain', String(payload.elevationGain))
  if (payload?.elevationLoss != null) fd.append('elevationLoss', String(payload.elevationLoss))

  // optional extra fields (si tu les ajoutes plus tard dans l'UI)
  appendIfDefined(fd, 'remark', payload?.remark)
  appendIfDefined(fd, 'trainGoingTime', payload?.trainGoingTime)
  appendIfDefined(fd, 'trainReturnTime', payload?.trainReturnTime)

  // file
  const file = payload?.gpsTrack?.file
  if (file instanceof File) {
    fd.append('gpxFile', file)
  }

  const data = await apiFetch(`/camps/${campId}/trainings`, {
    method: 'POST',
    body: fd,
  })

  return normalizeTraining(data)
}

/**
 * Update training with optional GPX file upload
 */
export async function updateCampTraining(campId, trainingId, payload) {
  const file = payload?.gpsTrack?.file

  // Si un fichier GPX est fourni, utiliser FormData
  if (file instanceof File) {
    const fd = new FormData()

    appendIfDefined(fd, 'date', payload?.date)
    appendIfDefined(fd, 'meetingPoint', payload?.meetingPoint)
    appendIfDefined(fd, 'meetingTime', payload?.meetingTime)
    appendIfDefined(fd, 'returnTime', payload?.returnTime ?? payload?.arrivalTime)
    appendIfDefined(fd, 'responsiblePerson', payload?.responsiblePerson)
    appendIfDefined(fd, 'remark', payload?.remark)

    if (payload?.distance != null) fd.append('distance', String(payload.distance))
    if (payload?.elevationGain != null) fd.append('elevationGain', String(payload.elevationGain))
    if (payload?.elevationLoss != null) fd.append('elevationLoss', String(payload.elevationLoss))

    fd.append('gpxFile', file)

    const data = await apiFetch(`/camps/${campId}/trainings/${trainingId}`, {
      method: 'PUT',
      body: fd,
    })
    return normalizeTraining(data)
  }

  // Sinon, envoyer en JSON classique
  const data = await apiFetch(`/camps/${campId}/trainings/${trainingId}`, {
    method: 'PUT',
    body: payload,
  })
  return normalizeTraining(data)
}

export async function deleteCampTraining(campId, trainingId) {
  return apiFetch(`/camps/${campId}/trainings/${trainingId}`, { method: 'DELETE' })
}
