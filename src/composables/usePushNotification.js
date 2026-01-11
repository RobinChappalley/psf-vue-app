import { onMounted, ref } from 'vue'
import { apiFetch } from '@/services/apiFetch'

export function usePushNotifications() {
  //Check if service workers, push api and notifications are supported by browser
  const supported =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  //Check permission for notifications in browser
  const permission = ref(supported ? Notification.permission : 'unsupported')
  //Check if a subscription is registered in PushManager
  const hasSubscription = ref(false)

  //Handle state of both hasSubscription (PushManager) and permission (Notification)
  async function updateSubscriptionStatus() {
    if (!supported) return
    permission.value = Notification.permission
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    hasSubscription.value = !!sub
  }

  onMounted(() => {
    updateSubscriptionStatus()
  })

  async function subscribeUserToPush() {
    if (!supported) return

    //Update permission value
    permission.value = Notification.permission

    //Check permission
    if (permission.value === 'denied') {
      console.warn('Permission denied for notifications')
      return
    }

    //Ask for permission if necessary
    if (permission.value === 'default') {
      const result = await Notification.requestPermission()
      permission.value = result
      await updateSubscriptionStatus()
      if (permission.value !== 'granted') {
        console.warn('Permission denied for notifications')
        return
      }
    }

    const registration = await navigator.serviceWorker.ready

    //Check if subscription already exists
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      hasSubscription.value = true
      return
    }

    //Get backend public key
    const { publicKey } = await apiFetch('/push/vapidPublicKey')

    //Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    //Send subscription to backend
    await apiFetch('/push/subscribe', {
      method: 'POST',
      body: subscription,
    })

    //Update subscription status
    await updateSubscriptionStatus()

    //Send a welcome notification
    sendWelcomePush()
  }

  async function unsubscribeUserFromPush() {
    if (!supported) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      console.warn('User is not subscribed to notifications')
      return
    }

    if (!subscription.endpoint) {
      console.warn('Subscription endpoint is missing')
      return
    }

    const successful = await subscription.unsubscribe()
    if (!successful) {
      console.warn('Failed to unsubscribe from push notifications')
      return
    }

    console.log('User unsubscribed from push notifications')

    try {
      await apiFetch('/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint }, // <-- NE PAS JSON.stringify
      })
    } catch (err) {
      console.error('Failed to remove subscription from backend', err)
    }

    //Update subscription status
    await updateSubscriptionStatus()
  }

  //Translate public key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  }

  async function sendWelcomePush() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      console.warn('User has not yet subscribed to notifications')
      return
    }

    await apiFetch('/push/welcome', { method: 'POST' })
  }

  return {
    permission,
    supported,
    hasSubscription,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    sendWelcomePush,
  }
}
