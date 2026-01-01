import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style/normalize.css'
import './assets/style/variables.css'
import './assets/style/base.css'
import { authStore } from '@/stores/auth'
//authStore.mockLogin('admin') // ou "admin" / "accompagnant"

const app = createApp(App)

app.use(router)

app.mount('#app')
