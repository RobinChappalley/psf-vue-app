const BASE_URL = import.meta.env.VITE_API_URL // ex: http://localhost:2001

function joinUrl(base, path) {
  if (!base) throw new Error('VITE_API_URL is missing')
  if (!path) return base
  return `${base.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

/**
 * apiFetch("/login", { method: "POST", body: { ... } })
 * - ajoute automatiquement Content-Type si body est un objet
 * - ajoute automatiquement Authorization si token présent en localStorage
 * - parse JSON si possible
 */
export async function apiFetch(path, options = {}) {
  const url = joinUrl(BASE_URL, path)

  const headers = new Headers(options.headers || {})
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  // si on passe un objet JS, on le JSON-encode
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const res = await fetch(url, { ...options, headers, body })

  // tente de parser en JSON, sinon texte
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (!res.ok) {
    if (res.status === 401) {
      // token expiré / invalide
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    const msg =
      (data && typeof data === 'object' && data.message) || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
