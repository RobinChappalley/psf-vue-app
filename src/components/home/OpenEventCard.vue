<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  camp: { type: Object, required: true },
})
</script>

<template>
  <section class="camp-open">
    <h2 class="title">{{ camp.name }}</h2>
    <div>
      <p>Cette année, le camp se déroulera du {{ camp.dateStart }} au {{ camp.dateEnd }}.</p>
      <p>
        Nous aurons la chance de traverser les Alpes et d’arriver en Italie, au rythme de la marche
        et de la vie en groupe.
      </p>
    </div>
    <div>
      <h3>Informations clés</h3>
      <div class="info-row">
        <span class="label">Date</span>
        <span class="value"> {{ `du ${camp.dateStart} au ${camp.dateEnd}` }}</span>
      </div>

      <div class="info-row">
        <span class="label">Âge</span>
        <span class="value">{{ camp.age }}</span>
      </div>

      <p>
        Le parcours est adapté aux jeunes participants, et préparé tout au long de l’année grâce à
        des entrainements.
      </p>
    </div>

    <BaseButton class="cta" as="link" :to="{ name: 'public.subscription' }">
      Obtenir davantage d'information
    </BaseButton>
  </section>
</template>

<style scoped>
.camp-open {
  background: var(--c-secondary);

  padding: var(--sp-3) var(--sp-2);
  display: grid;
  gap: var(--sp-2);
}

.title {
  margin: 0;
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  color: var(--c-text);
}

.text {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--c-text);
  opacity: 0.9;
  line-height: 1.45;
}

.cta {
  margin: var(--sp-2) auto 0;
  display: block;
}
.info-row {
  text-align: center;
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: var(--sp-2);
}
p {
  margin-bottom: 1rem;
}

div p {
  margin-top: 1rem;
}
</style>
