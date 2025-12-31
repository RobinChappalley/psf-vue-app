<template>
  <div class="person">
    <div class="avatar"></div>
    <span class="name">{{ name }}</span>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.avatar {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background-color: var(--c-border);
}

.name {
  font-size: var(--fs-caption);
  color: var(--c-text);
  text-align: center;
}
</style>
