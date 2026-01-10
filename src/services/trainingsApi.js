// src/services/trainingsApi.js
import { apiFetch } from '@/services/apiFetch'

export function getTrainings(campId) {
  return apiFetch(`/camps/${campId}/trainings`, { method: 'GET' })
}

export function createTraining(campId, payload) {
  return apiFetch(`/camps/${campId}/trainings`, {
    method: 'POST',
    body: payload,
  })
}

export function updateTraining(campId, trainingId, payload) {
  return apiFetch(`/camps/${campId}/trainings/${trainingId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteTraining(campId, trainingId) {
  return apiFetch(`/camps/${campId}/trainings/${trainingId}`, {
    method: 'DELETE',
  })
}
