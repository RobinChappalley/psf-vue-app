# Analyse du projet PSF Vue.js

> Guide pour comprendre l'architecture et le fonctionnement du projet "Pieds Sans Frontières"

---

## Vue d'ensemble

**Stack technique :**
- Vue 3.5 avec Composition API (`<script setup>`)
- Vite 7 (build tool)
- Vue Router 4 (routing)
- PWA (Progressive Web App) - installable sur mobile
- Pas de librairie CSS (CSS custom avec variables)
- Pas de Pinia/Vuex (stores custom avec `ref()`)

**Structure des dossiers :**
```
src/
├── main.js              # Point d'entrée + enregistrement Service Worker
├── App.vue              # Composant racine (juste un <RouterView>)
├── router/index.js      # Routes + guards d'authentification
├── stores/              # État global (auth, camps, hikes, members)
├── services/            # Appels API (apiFetch, campsApi, usersApi...)
├── composables/         # Logique réutilisable (useEventsFeed, usePushNotification...)
├── components/          # 56 composants Vue
├── pages/               # Pages (layouts + vues)
└── assets/              # CSS + images
```

---

## 1. Gestion des utilisateurs

### Comment fonctionne l'authentification ?

**Fichiers concernés :**
- `/src/stores/auth.js` - toute la logique d'auth
- `/src/pages/public/PageLogin.vue` - formulaire de connexion
- `/src/pages/public/PageSignup.vue` - formulaire d'inscription

**Flux de connexion :**
```
1. User entre email/password
2. Appel POST /login via authStore.login()
3. Backend renvoie { token, user }
4. Token stocké dans localStorage
5. User stocké dans le store (ref)
6. Redirection vers /app/home
```

**Code clé (auth.js) :**
```javascript
// Stockage du token
const token = ref(localStorage.getItem('token'))

// Fonction login
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: { email, password }
  })
  token.value = data.token
  user.value = data.user
  localStorage.setItem('token', data.token)
}

// Vérifier si connecté
const isAuthenticated = computed(() => !!token.value && !!user.value)
```

**Où est injecté le token dans les requêtes ?**

Dans `/src/services/apiFetch.js` (ligne 19-20) :
```javascript
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```
Chaque appel API inclut automatiquement le token.

### Gestion des rôles

Il y a 3 rôles : `admin`, `accompagnant`, `parent`

```javascript
// Vérifier si l'user a un rôle (auth.js)
function hasAnyRole(roles) {
  return roles.some(role => user.value?.role?.includes(role))
}
```

---

## 2. Gestion des ressources (CRUD)

### Les 2 ressources principales

#### 1. Camps

**API :** `/src/services/campsApi.js`

| Action | Méthode | Endpoint |
|--------|---------|----------|
| Lister | GET | `/camps` |
| Détail | GET | `/camps/:id` |
| Créer | POST | `/camps` |
| Modifier | PUT | `/camps/:id` |
| Supprimer | DELETE | `/camps/:id` |

**Store :** `/src/stores/camps.js`
```javascript
const camps = ref([])           // Liste des camps
const loading = ref(false)      // État de chargement
const error = ref(null)         // Erreur éventuelle

// Filtres computed
const publishedCamps = computed(() => camps.value.filter(c => c.status === 'published'))
const archivedCamps = computed(() => camps.value.filter(c => c.status === 'archived'))
const draftCamps = computed(() => camps.value.filter(c => c.status === 'draft'))
```

#### 2. Trainings (randonnées d'entraînement)

Ce sont des sous-ressources des camps.

**API :** `/src/services/campsApi.js` (lignes 56-122)

| Action | Méthode | Endpoint |
|--------|---------|----------|
| Lister | GET | `/camps/:campId/trainings` |
| Créer | POST | `/camps/:campId/trainings` |
| Modifier | PUT | `/camps/:campId/trainings/:id` |
| Supprimer | DELETE | `/camps/:campId/trainings/:id` |

### Autres ressources

- **Users** : `/src/services/usersApi.js`
- **Children** (enfants des parents) : `/src/services/children.js`
- **Hikes** : `/src/services/hikesApi.js`
- **Items** (équipement) : `/src/services/itemsApi.js`

### Pagination

Les hikes supportent la pagination :
```javascript
// stores/hikes.js
const pagination = ref({})

async function fetchHikes() {
  const data = await apiFetch('/hikes')
  hikes.value = data.data
  pagination.value = data.pagination  // { page, limit, total }
}
```

### Filtres

**Filtres disponibles sur /users :**
- `?role=admin` ou `?role=accompagnant` ou `?role=parent`
- `?hasPaid=true` ou `?hasPaid=false`
- `?search=mot-clé`
- `?parentId=xxx` (pour récupérer les enfants d'un parent)

**Exemple d'utilisation :**
```javascript
// services/usersApi.js
export async function getUsers({ role, hasPaid, search, page, limit } = {}) {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (hasPaid !== undefined) params.append('hasPaid', hasPaid)
  // ...
  return apiFetch(`/users?${params}`)
}
```

---

## 3. Fonctionnalités temps réel

### Push Notifications

**Fichier principal :** `/src/composables/usePushNotification.js`

**Comment ça marche :**
1. Le Service Worker est enregistré au démarrage (`main.js`)
2. L'app demande la permission de notifier
3. Si accepté, on souscrit au Push Manager du navigateur
4. On envoie la souscription au backend (`POST /push/subscribe`)
5. Le backend peut ensuite envoyer des notifications

**Code simplifié :**
```javascript
// Demander la permission et souscrire
async function subscribeUserToPush() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey
  })

  // Envoyer au backend
  await apiFetch('/push/subscribe', {
    method: 'POST',
    body: subscription
  })
}
```

**UI dans l'app :**
- Boutons "Activer" / "Désactiver" dans la page Profil
- `/src/pages/app/PageProfile.vue` (lignes 212-223)

### Animations

Des transitions CSS simples :
```css
/* Boutons */
transition: transform 120ms ease;

/* Cards au clic */
transform: scale(0.98);
```

---

## 4. Bonnes pratiques Vue.js

### Structure des composants

**56 composants** organisés par domaine :

```
components/
├── admin/          # Composants d'administration
│   ├── CampForm.vue
│   ├── EventForm.vue
│   ├── UserManagement.vue
│   └── ...
├── ui/             # Composants réutilisables
│   ├── BaseButton.vue
│   ├── ConfirmDialog.vue
│   ├── BackButton.vue
│   └── ...
├── events/         # Affichage des événements
│   ├── EventCard.vue
│   └── EventsBlock.vue
└── profile/        # Formulaires profil
    ├── PersonalDataForm.vue
    └── ChildrenList.vue
```

### Gestion d'état centralisée (Stores)

On utilise des stores custom avec `ref()` et `computed()` (pas Pinia) :

```
stores/
├── auth.js      # 337 lignes - authentification, users, enfants
├── camps.js     # 65 lignes - liste des camps avec cache
├── hikes.js     # 47 lignes - randonnées
└── members.js   # 56 lignes - gestion des membres (admin)
```

**Pattern utilisé :**
```javascript
// stores/camps.js
import { ref, computed } from 'vue'

const camps = ref([])
const loading = ref(false)

// Computed pour filtrer
const publishedCamps = computed(() =>
  camps.value.filter(c => c.status === 'published')
)

// Fonction pour charger
async function fetchCamps() {
  loading.value = true
  camps.value = await apiFetch('/camps')
  loading.value = false
}

// Export pour utiliser dans les composants
export { camps, loading, publishedCamps, fetchCamps }
```

### Router avec guards

**Fichier :** `/src/router/index.js`

**Structure des routes :**
```
/                    → Pages publiques (PublicLayout)
├── /login
├── /signup
└── /contact

/app                 → Pages authentifiées (AppLayout)
├── /app/home
├── /app/camp
├── /app/profil
├── /app/hike        → Réservé aux accompagnants et admins
└── /app/admin       → Réservé aux admins
```

**Guard d'authentification (lignes 99-129) :**
```javascript
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)

  // Si route protégée et pas connecté → login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'public.login' })
  }

  // Si route avec rôles requis
  const roles = to.meta.roles
  if (roles && !authStore.hasAnyRole(roles)) {
    return next({ name: 'app.home' })  // Pas autorisé
  }

  next()
})
```

**Exemple de route protégée par rôle :**
```javascript
{
  path: 'admin',
  name: 'app.admin',
  component: PageAdmin,
  meta: { roles: ['admin'] }  // Seuls les admins peuvent accéder
}
```

### Props, Emits, Slots

**Props (données parent → enfant) :**
```javascript
// components/events/EventCard.vue
const props = defineProps({
  event: { type: Object, required: true }
})
```

**Emits (événements enfant → parent) :**
```javascript
// components/events/EventCard.vue
const emit = defineEmits(['open-camp-details', 'open-training-details'])

// Utilisation
emit('open-camp-details', event.id)
```

**Slots (contenu personnalisable) :**
```vue
<!-- components/ui/ConfirmDialog.vue -->
<template>
  <div class="dialog">
    <slot></slot>  <!-- Le parent peut injecter du contenu ici -->
  </div>
</template>

<!-- Utilisation -->
<ConfirmDialog>
  <p>Êtes-vous sûr de vouloir supprimer ?</p>
</ConfirmDialog>
```

---

## 5. UX Mobile

### Design responsive

**Variables CSS :** `/src/assets/style/variables.css`
```css
:root {
  --nav-height: 4.5rem;    /* Hauteur de la navbar */
  --sp-1: 0.5rem;          /* Espacement de base */
  --sp-2: 1rem;
  --fs-body: 1rem;         /* Taille de police */
  --r-card: 0.75rem;       /* Border radius des cards */
}
```

**Support des encoches (iPhone) :**
```css
/* components/TheNavbar.vue */
padding-bottom: env(safe-area-inset-bottom);
```

### Navigation mobile

**Navbar fixe en bas :** `/src/components/TheNavbar.vue`
```css
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
}
```

### PWA (Progressive Web App)

**Configuration :** `vite.config.js`
```javascript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Pieds sans Frontières',
    short_name: 'PSF',
    icons: [
      { src: '/icon-192.png', sizes: '192x192' },
      { src: '/icon-512.png', sizes: '512x512' }
    ]
  }
})
```

L'app peut être installée sur l'écran d'accueil et fonctionne offline.

### Formulaires tactiles

```html
<!-- Clavier adapté sur mobile -->
<input type="email" autocomplete="email" />
<input type="tel" autocomplete="tel" />
```

---

## 6. Gestion de l'asynchrone

### Client HTTP personnalisé

**Fichier :** `/src/services/apiFetch.js`

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2001'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.message || 'Erreur')
    err.status = res.status
    throw err
  }

  return data
}
```

**Ce que fait ce client :**
1. Ajoute automatiquement le token Bearer
2. Sérialise le body en JSON
3. Parse la réponse JSON
4. Lance une erreur avec le status si échec

### Éviter les requêtes doubles

```javascript
// stores/camps.js
let inFlight = null  // Promise en cours

async function ensureCampsLoaded() {
  if (camps.value.length > 0) return  // Déjà chargé
  if (inFlight) return inFlight       // Requête en cours, on attend

  inFlight = fetchCamps()
  await inFlight
  inFlight = null
}
```

---

## 7. Gestion des erreurs

### Erreurs API

```javascript
// services/apiFetch.js
if (!res.ok) {
  const err = new Error(data.message || data.error || `Erreur ${res.status}`)
  err.status = res.status
  err.data = data
  throw err
}
```

### Gestion dans les composants

```javascript
// pages/public/PageLogin.vue
const error = ref('')

async function onSubmit() {
  error.value = ''  // Reset
  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'app.home' })
  } catch (e) {
    if (e?.status === 401) {
      error.value = 'Email ou mot de passe incorrect.'
    } else if (e?.status === 400) {
      error.value = 'Veuillez vérifier les champs.'
    } else {
      error.value = e?.message || 'Erreur de connexion'
    }
  }
}
```

### Affichage des erreurs

```vue
<template>
  <form @submit.prevent="onSubmit">
    <!-- Champs... -->
    <p v-if="error" class="error">{{ error }}</p>
    <button :disabled="loading">Connexion</button>
  </form>
</template>
```

### Validation côté client

```javascript
// stores/auth.js - création d'enfant
const firstname = String(childPayload?.firstname ?? '').trim()
const lastname = String(childPayload?.lastname ?? '').trim()

if (!firstname || !lastname) {
  throw new Error('Prénom et nom sont obligatoires.')
}
```

---

## Résumé : Comment retrouver les choses

| Tu cherches... | Va dans... |
|----------------|------------|
| Logique d'authentification | `/src/stores/auth.js` |
| Comment les requêtes API sont faites | `/src/services/apiFetch.js` |
| Les routes et guards | `/src/router/index.js` |
| Le CRUD des camps | `/src/services/campsApi.js` + `/src/pages/app/PageAdmin.vue` |
| Les notifications push | `/src/composables/usePushNotification.js` |
| Un composant réutilisable | `/src/components/ui/` |
| Les variables CSS | `/src/assets/style/variables.css` |
| La config PWA | `vite.config.js` |

---

## Points forts à mentionner en présentation

1. **Architecture propre** : séparation stores / services / composables / components
2. **Authentification complète** : JWT, localStorage, guards de routes, gestion des rôles
3. **CRUD complet** sur Camps et Trainings avec filtres et pagination
4. **PWA** : installable, notifications push, offline-ready
5. **Mobile-first** : navigation bottom, safe-area, formulaires tactiles
6. **Gestion d'erreurs** : messages explicites, validation client, états de chargement
