import { onMounted, ref, readonly } from 'vue'
import { apiFetch } from '@/services/apiFetch'
import { authStore } from '@/stores/auth'

/**
 * Composable pour gérer les notifications push
 * Gère tous les cas: acceptation, refus, réactivation, expiration
 */
export function usePushNotifications() {
  // Vérification du support navigateur
  const supported =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  // États réactifs
  const permission = ref(supported ? Notification.permission : 'unsupported')
  const hasSubscription = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Met à jour l'état de la subscription et de la permission
   */
  async function updateSubscriptionStatus() {
    if (!supported) return

    permission.value = Notification.permission

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      hasSubscription.value = !!sub

      // Si on a une subscription mais permission révoquée, nettoyer
      if (sub && permission.value === 'denied') {
        await cleanupExpiredSubscription(sub)
      }
    } catch (err) {
      console.error('Error checking subscription status:', err)
      hasSubscription.value = false
    }
  }

  /**
   * Nettoie une subscription expirée ou révoquée
   */
  async function cleanupExpiredSubscription(subscription) {
    try {
      // Unsubscribe côté navigateur
      await subscription.unsubscribe()

      // Notifier le backend
      await apiFetch('/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint },
      }).catch(() => {}) // Ignorer les erreurs backend

      hasSubscription.value = false
    } catch (err) {
      console.error('Error cleaning up subscription:', err)
    }
  }

  /**
   * Vérifie si la subscription est toujours valide
   * (utile après un long moment sans utiliser l'app)
   */
  async function checkSubscriptionValidity() {
    if (!supported || !hasSubscription.value) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        hasSubscription.value = false
        return
      }

      // Tenter un test silencieux pour vérifier si la subscription est valide
      // Note: Cette vérification se fait côté serveur lors de l'envoi
    } catch (err) {
      console.error('Error checking subscription validity:', err)
    }
  }

  /**
   * Active les notifications push
   */
  async function subscribeUserToPush() {
    if (!supported) {
      error.value = 'Votre navigateur ne supporte pas les notifications'
      return false
    }

    // Vérifier l'authentification
    if (!authStore.isAuthenticated.value) {
      error.value = 'Vous devez être connecté pour activer les notifications'
      return false
    }

    // Éviter les doubles souscriptions
    if (isLoading.value) return false

    isLoading.value = true
    error.value = null

    try {
      // Mettre à jour l'état de la permission
      permission.value = Notification.permission

      // Si bloqué, on ne peut rien faire
      if (permission.value === 'denied') {
        error.value = 'Les notifications sont bloquées dans votre navigateur'
        return false
      }

      // Demander la permission si nécessaire
      if (permission.value === 'default') {
        const result = await Notification.requestPermission()
        permission.value = result

        if (result !== 'granted') {
          error.value = 'Permission refusée'
          return false
        }
      }

      const registration = await navigator.serviceWorker.ready

      // Vérifier si déjà abonné
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Récupérer la clé publique VAPID
        const { publicKey } = await apiFetch('/push/vapidPublicKey')

        // Créer la subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      // Envoyer la subscription au backend (avec userId via auth cookie)
      await apiFetch('/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth,
          },
        },
      })

      hasSubscription.value = true

      // Envoyer une notification de bienvenue
      await sendWelcomePush()

      return true
    } catch (err) {
      console.error('Error subscribing to push:', err)
      error.value = err.message || 'Erreur lors de l\'activation des notifications'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Désactive les notifications push
   */
  async function unsubscribeUserFromPush() {
    if (!supported) return false
    if (isLoading.value) return false

    isLoading.value = true
    error.value = null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        hasSubscription.value = false
        return true
      }

      // Unsubscribe côté navigateur
      const successful = await subscription.unsubscribe()
      if (!successful) {
        throw new Error('Échec de la désinscription')
      }

      // Notifier le backend
      await apiFetch('/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint },
      })

      hasSubscription.value = false
      return true
    } catch (err) {
      console.error('Error unsubscribing from push:', err)
      error.value = err.message || 'Erreur lors de la désactivation'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Envoie une notification de test/bienvenue
   */
  async function sendWelcomePush() {
    if (!authStore.isAuthenticated.value) return

    try {
      await apiFetch('/push/welcome', { method: 'POST' })
    } catch (err) {
      // Silencieux - ce n'est pas critique
      console.warn('Could not send welcome notification:', err.message)
    }
  }

  /**
   * Convertit une clé base64 en Uint8Array pour l'API Push
   */
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  }

  /**
   * Rafraîchit l'état (utile après changement de permission hors app)
   */
  async function refreshStatus() {
    await updateSubscriptionStatus()
  }

  // Initialisation au montage
  onMounted(() => {
    updateSubscriptionStatus()

    // Écouter les changements de permission (si supporté)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        status.onchange = () => {
          permission.value = Notification.permission
          updateSubscriptionStatus()
        }
      }).catch(() => {
        // Fallback: pas de listener, l'utilisateur devra refresh
      })
    }
  })

  return {
    // États (readonly pour éviter modifications externes)
    permission: readonly(permission),
    supported,
    hasSubscription: readonly(hasSubscription),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    subscribeUserToPush,
    unsubscribeUserFromPush,
    sendWelcomePush,
    refreshStatus,
    checkSubscriptionValidity,
  }
}
