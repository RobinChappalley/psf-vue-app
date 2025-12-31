<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="hero">
    <div class="overlay">
      <div class="content">
        <h1 class="title">
          PIEDS<br />
          SANS<br />
          FRONTIÈRES
        </h1>

        <p class="subtitle">des camps de marche pour les jeunes, depuis 1998</p>

        <BaseButton class="cta" as="link" :to="{ name: 'public.subscription' }">
          Découvrez les camps <br />des précédentes années
        </BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  background-image: url('/src/assets/img/hero-mountains.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* voile sombre pour lisibilité */
.overlay {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--sp-3);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.6));
}

.content {
  max-width: 36rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.title {
  font-family: var(--font-title);
  font-size: 5.75rem;
  line-height: 1.05;
  color: var(--c-bg);
  margin-bottom: var(--sp-2);
}

.subtitle {
  color: var(--c-bg);
  margin-bottom: var(--sp-3);
  font-size: 1rem;
}

.cta {
  margin: 2rem auto 0;
  display: block;
}
</style>
