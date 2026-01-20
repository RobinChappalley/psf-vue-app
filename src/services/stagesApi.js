import { apiFetch } from '@/services/apiFetch'

function appendIfDefined(fd, key, value) {
  if (value === undefined || value === null || value === '') return
  fd.append(key, value)
}

export function getStages(campId) {
  return apiFetch(`/camps/${campId}/stages`, { method: 'GET' })
}

export function createStage(campId, payload) {
  const fd = new FormData()

  appendIfDefined(fd, 'date', payload?.date)
  appendIfDefined(fd, 'startPoint', payload?.startPoint)
  appendIfDefined(fd, 'endPoint', payload?.endPoint)
  appendIfDefined(fd, 'routeDescription', payload?.routeDescription)

  if (payload?.distance != null) fd.append('distance', String(payload.distance))
  if (payload?.elevationGain != null) fd.append('elevationGain', String(payload.elevationGain))
  if (payload?.elevationLoss != null) fd.append('elevationLoss', String(payload.elevationLoss))

  // GPX file
  const file = payload?.gpsTrack?.file
  if (file instanceof File) {
    fd.append('gpxFile', file)
  }

  return apiFetch(`/camps/${campId}/stages`, {
    method: 'POST',
    body: fd,
  })
}

export function updateStage(campId, stageId, payload) {
  return apiFetch(`/camps/${campId}/stages/${stageId}`, { method: 'PUT', body: payload })
}

export function deleteStage(campId, stageId) {
  return apiFetch(`/camps/${campId}/stages/${stageId}`, { method: 'DELETE' })
}
