<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
<template>
  <section class="section intro">
    <h1>Camp 2026</h1>
    <div>
      <p>Cette année, le camp se déroulera du de 12 au 31 juillet 2026.</p>
      <p>
        Nous aurons la chance de traverser les Alpes et d'arriver en Italie, au rythme de la marche
        et de la vie du groupe
      </p>
    </div>
  </section>
  <section class="section">
    <h2>Informations clés</h2>

    <dl class="facts">
      <div class="row">
        <dt>Date</dt>
        <dd>du 12 au 31 juillet 2026</dd>
      </div>

      <div class="row">
        <dt>Âge</dt>
        <dd>Entre 8 et 16 ans</dd>
      </div>
      <div class="row">
        <dt>Prix</dt>
        <dd>CHF 250.-</dd>
      </div>
    </dl>
    <p>
      Le parcours est adapté aux jeunes participants et préparé tout au long de l'année, grâce à des
      entrainements.
    </p>
  </section>
  <section class="section">
    <h2>Comment inscrire son enfant ?</h2>
    <div>
      <p>Le camp est accessible à tous les jeunes entre 8 et 16 ans.</p>
      <p>
        Pour inscrire votre enfant au camp, vous devez d'abord créer un compte parent. Ensuite, vous
        pourrez inscrire votre enfant.
      </p>
    </div>
    <BaseButton class="cta" as="link" :to="{ name: 'public.login' }">
      Créer un compte parent
    </BaseButton>
  </section>
</template>

<style scoped>
/* tableau "Date / Âge" */
.facts {
  margin: 0 0 var(--sp-4);
}

.row {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: var(--sp-2);
  align-items: baseline;
  margin-bottom: var(--sp-2);
}

dt {
  font-weight: var(--fw-semibold);
}

dd {
  margin: 0;
}
.cta {
  margin: 2rem auto 0;
  display: block;
  max-width: 20rem;
}
</style>
