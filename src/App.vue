<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // 1) LOGIN
  const loginRes = await fetch('http://localhost:2001/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jane.dupont@example.com',
      password: 'test1234',
    }),
  })

  const loginData = await loginRes.json()
  console.log('LOGIN STATUS:', loginRes.status)
  console.log('LOGIN DATA:', loginData)

  if (!loginRes.ok) return

  const token = loginData.token
  const userId = loginData.user.id

  // 2) CALL PROTECTED ENDPOINT
  const userRes = await fetch(`http://localhost:2001/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const userData = await userRes.json()
  console.log('GET USER STATUS:', userRes.status)
  console.log('GET USER DATA:', userData)
})
</script>

<template>
  <RouterView />
</template>
