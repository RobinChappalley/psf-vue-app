<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

// needRefresh : true si une mise à jour attend
// updateServiceWorker : la fonction qui déclenche le reload
const { needRefresh, updateServiceWorker } = useRegisterSW()

const close = async () => {
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" class="pwa-toast" role="alert">
    <div class="message">
      <span>Une mise à jour est disponible !</span>
    </div>
    <div class="buttons">
      <button @click="updateServiceWorker()">Mettre à jour</button>
      <button class="close-btn" @click="close()">Fermer</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 9999; /* Toujours au dessus */
  text-align: left;
  box-shadow: 3px 4px 5px 0px #8885;
  background-color: white;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.buttons {
  display: flex;
  gap: 10px;
}

button {
  cursor: pointer;
  padding: 5px 10px;
  border: 1px solid #333;
  background: white;
  border-radius: 4px;
  font-weight: bold;
}

button.close-btn {
  border: 1px solid #ccc;
  font-weight: normal;
}

button:hover {
  background-color: #f0f0f0;
}
</style>
