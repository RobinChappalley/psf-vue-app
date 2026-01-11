<script setup>
import { onMounted, ref } from 'vue'
import { apiFetch } from '@/services/apiFetch'

async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) return
  if (!('PushManager' in window)) return

  //Check permission
  if (Notification.permission === 'denied') {
    console.warn('Permission denied for notifications')
    return
  }

  const registration = await navigator.serviceWorker.ready

  //Check if subscription already exists
  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    console.log('User has already subscribed to notifications')
    return
  }

  //Ask for permission if necessary
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Permission denied for notifications')
      return
    }
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

  //Send a welcome notification
  sendWelcomePush()
}

//Translate public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

onMounted(() => {
  subscribeUserToPush().catch(console.error)
})

async function sendWelcomePush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    console.warn('User has not yet subscribed to notifications')
    return
  }

  await apiFetch('/push/welcome', {
    method: 'POST',
    body: JSON.stringify({ subscription }),
  })
}
</script>

<template>
  <button @click="subscribeUserToPush">Activer les notifications</button>
  <button @click="sendWelcomePush">Envoyer une notification test</button>
</template>
