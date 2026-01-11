<script setup>
import { onMounted } from 'vue'
import { apiFetch } from '@/services/apiFetch'

async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) return
  if (!('PushManager' in window)) return

  //Get backend public key
  const { publicKey } = await apiFetch('/push/vapidPublicKey')

  //Ask for permission
  const registration = await navigator.serviceWorker.ready

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

  console.log('User has successfully subscribed to push notifications')
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

async function sendTestPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    console.warn('Utilisateur pas encore abonné aux notifications')
    return
  }

  await apiFetch('/push/test', {
    method: 'POST',
    body: JSON.stringify({ subscription }),
  })

  console.log('Notification test envoyée depuis le front !')
}
</script>

<template>
  <button @click="subscribeUserToPush">Activer les notifications</button>
  <button @click="sendTestPush">Envoyer une notification test</button>
</template>
