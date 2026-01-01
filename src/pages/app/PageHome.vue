<script setup>
import { computed } from 'vue'
import { authStore } from '@/stores/auth'
import EventsBlock from '@/components/ui/EventsBlock.vue'

const firstname = computed(() => authStore.user.value?.firstname || '')
</script>

<template>
  <section class="section">
    <h1 class="hello">BONJOUR {{ firstname }} !</h1>
    <p class="sub">Voici les évènements à venir</p>
  </section>

  <section class="section">
    <EventsBlock title="VOS PROCHAINS ÉVÈNEMENTS" />
  </section>

  <section class="section">
    <EventsBlock title="ÉVÈNEMENTS OUVERTS À L’INSCRIPTION" />
  </section>
</template>

<style scoped>
.hello {
  text-transform: uppercase;
}

.sub {
  opacity: 0.85;
  margin-top: var(--sp-1);
}
</style>
