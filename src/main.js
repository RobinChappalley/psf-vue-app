import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style/normalize.css'
import './assets/style/variables.css'
import './assets/style/base.css'

const app = createApp(App)

app.use(router)

app.mount('#app')

//Save service worker in navigator for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/serviceWorker.js')
      console.log('Service Worker enregistré', registration)
    } catch (err) {
      console.error('Erreur Service Worker:', err)
    }
  })
}
