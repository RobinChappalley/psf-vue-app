<script setup>
import { onMounted } from 'vue'
import { apiFetch } from '@/services/apiFetch'

onMounted(async () => {
  try {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: { email: 'jane.dupont@example.com', password: 'test1234' },
    })
    console.log('apiFetch login OK:', data)
  } catch (e) {
    console.log('apiFetch login ERROR:', e.status, e.message, e.data)
  }
})
</script>

<template>
  <RouterView />
</template>
