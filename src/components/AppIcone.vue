<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <!-- HOME -->
  <svg v-if="name === 'home'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <path
      d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
    />
  </svg>

  <!-- CLIPBOARD (Inscription) -->
  <svg v-else-if="name === 'clipboard'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <!-- feuille -->
    <path
      d="M7 5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
    />
    <!-- pince -->
    <path d="M9 5a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-linecap="round" />
    <path d="M9 5h6" fill="none" stroke="currentColor" stroke-linecap="round" />
  </svg>

  <!-- MAIL (Contact) -->
  <svg v-else-if="name === 'mail'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <path
      d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
    />
    <path d="M22 8l-10 7L2 8" fill="none" stroke="currentColor" stroke-linejoin="round" />
  </svg>

  <!-- HISTORY (Historique) -->
  <svg v-else-if="name === 'history'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3-6.7" fill="none" stroke="currentColor" stroke-linecap="round" />
    <path
      d="M21 3v6h-6"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12 7v6l4 2"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- PROFILE -->
  <svg v-else-if="name === 'profile'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" />
    <path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-linecap="round" />
  </svg>

  <!-- RANDO -->
  <svg v-else-if="name === 'rando'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <path d="M3 20l7-12 4 7 2-3 5 8H3z" fill="none" stroke="currentColor" stroke-linejoin="round" />
    <circle cx="17" cy="6" r="1.5" fill="none" stroke="currentColor" />
  </svg>

  <!-- ADMIN -->
  <svg v-else-if="name === 'admin'" viewBox="0 0 24 24" class="icon" aria-hidden="true">
    <path d="M4 4h16v16H4V4z" fill="none" stroke="currentColor" stroke-linejoin="round" />
    <path
      d="M8 16l1-4 7-7 3 3-7 7-4 1z"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>

  <!-- fallback -->
  <span v-else class="missing" aria-hidden="true"></span>
</template>

<style scoped>
.icon {
  width: 1.85rem;
  height: 1.85rem;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.missing {
  display: inline-block;
  width: 1.85rem;
  height: 1.85rem;
}
</style>
