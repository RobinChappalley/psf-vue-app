<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  event: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="event-card">
    <div class="date">
      <div class="day">
        {{ new Date(event['start-date']).getDate() }}
      </div>
      <div class="month">
        {{
          new Date(event['start-date']).toLocaleString('fr-FR', { month: 'short' }).toUpperCase()
        }}
      </div>
    </div>

    <div class="main">
      <h4 class="title">{{ event.name }}</h4>
      <p class="meta">Du {{ event['start-date'] }} au {{ event['end-date'] }}</p>
    </div>

    <div class="action">
      <BaseButton>S’inscrire</BaseButton>
    </div>
  </article>
</template>
