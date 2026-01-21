import { ref, computed, onMounted, onUnmounted } from 'vue'

// Clé localStorage pour "ne plus afficher"
const DISMISSED_KEY = 'pwa-install-dismissed'

// Référence globale pour l'événement beforeinstallprompt
const deferredPrompt = ref(null)

// Détection OS
function detectOS() {
  const ua = navigator.userAgent

  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios'
  }
  if (/Android/.test(ua)) {
    return 'android'
  }
  if (/Windows/.test(ua)) {
    return 'windows'
  }
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
    return 'macos'
  }
  return 'other'
}

// Détection navigateur
function detectBrowser() {
  const ua = navigator.userAgent

  // Samsung Internet
  if (/SamsungBrowser/.test(ua)) {
    return 'samsung'
  }
  // Edge (Chromium)
  if (/Edg/.test(ua)) {
    return 'edge'
  }
  // Firefox
  if (/Firefox/.test(ua)) {
    return 'firefox'
  }
  // Chrome (doit être après Edge car Edge contient "Chrome")
  if (/Chrome/.test(ua) && !/Chromium/.test(ua)) {
    return 'chrome'
  }
  // Safari (doit être après Chrome car Chrome contient "Safari")
  if (/Safari/.test(ua)) {
    return 'safari'
  }
  return 'other'
}

// Détection mode standalone (app déjà installée)
function isRunningStandalone() {
  // iOS Safari
  if (window.navigator.standalone === true) {
    return true
  }
  // Autres navigateurs
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  // Android TWA
  if (document.referrer.includes('android-app://')) {
    return true
  }
  return false
}

export function useDeviceDetection() {
  const os = ref(detectOS())
  const browser = ref(detectBrowser())
  const isStandalone = ref(isRunningStandalone())
  const isDismissed = ref(localStorage.getItem(DISMISSED_KEY) === 'true')

  // Computed helpers
  const isIOS = computed(() => os.value === 'ios')
  const isAndroid = computed(() => os.value === 'android')
  const isDesktop = computed(() => ['windows', 'macos', 'other'].includes(os.value) && !isIOS.value && !isAndroid.value)
  const isSafari = computed(() => browser.value === 'safari')
  const isChrome = computed(() => browser.value === 'chrome')

  // Peut-on installer ?
  const canInstall = computed(() => {
    // Déjà installé
    if (isStandalone.value) return false
    // Utilisateur a fermé définitivement
    if (isDismissed.value) return false
    return true
  })

  // iOS mais pas Safari = doit utiliser Safari
  const needsSafari = computed(() => isIOS.value && !isSafari.value)

  // Peut utiliser le prompt natif (Android Chrome principalement)
  const hasNativePrompt = computed(() => deferredPrompt.value !== null)

  // Nom lisible de la plateforme
  const platformName = computed(() => {
    const osNames = {
      ios: 'iPhone/iPad',
      android: 'Android',
      windows: 'Windows',
      macos: 'Mac',
      other: 'votre appareil',
    }
    const browserNames = {
      safari: 'Safari',
      chrome: 'Chrome',
      firefox: 'Firefox',
      edge: 'Edge',
      samsung: 'Samsung Internet',
      other: 'votre navigateur',
    }
    return `${browserNames[browser.value]} sur ${osNames[os.value]}`
  })

  // Déclencher l'installation native (Android)
  async function triggerInstall() {
    if (!deferredPrompt.value) return false

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    // Reset le prompt après utilisation
    deferredPrompt.value = null

    return outcome === 'accepted'
  }

  // Marquer comme "ne plus afficher"
  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    isDismissed.value = true
  }

  // Réinitialiser (pour les tests ou si l'utilisateur veut revoir)
  function reset() {
    localStorage.removeItem(DISMISSED_KEY)
    isDismissed.value = false
  }

  // Écouter l'événement beforeinstallprompt
  function handleBeforeInstallPrompt(e) {
    e.preventDefault()
    deferredPrompt.value = e
  }

  // Écouter le changement de display-mode
  function handleDisplayModeChange(e) {
    isStandalone.value = e.matches
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', handleDisplayModeChange)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  return {
    // État
    os,
    browser,
    isStandalone,
    isDismissed,

    // Computed
    isIOS,
    isAndroid,
    isDesktop,
    isSafari,
    isChrome,
    canInstall,
    needsSafari,
    hasNativePrompt,
    platformName,

    // Actions
    triggerInstall,
    dismiss,
    reset,
  }
}
