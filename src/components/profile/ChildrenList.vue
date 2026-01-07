<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  // Liste d'enfants : [{ id, firstname, lastname? }]
  children: { type: Array, default: () => [] },
})

const emit = defineEmits(['edit', 'add'])

const hasChildren = computed(() => (props.children?.length || 0) > 0)
</script>

<template>
  <section class="wrap">
    <template v-if="!hasChildren">
      <section class="empty">
        <p>Aucun enfant.</p>
      </section>
    </template>

    <template v-else>
      <div class="list">
        <article v-for="c in children" :key="c.id" class="child-card">
          <p class="name">
            {{ c.firstname || '—' }}
          </p>

          <button class="edit" type="button" @click="$emit('edit', c)">Modifier</button>
        </article>
      </div>
    </template>

    <BaseButton class="cta btn--secondary" type="button" @click="$emit('add')">
      Ajouter un enfant
    </BaseButton>
  </section>
</template>

<style scoped>
.wrap {
  width: 100%;
  margin: 0 auto;
  padding: var(--sp-3);
  padding-bottom: var(--sp-2); /* réduit seulement le bas */
  background: var(--c-surface);
  border-radius: var(--r-card);
  box-sizing: border-box;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.child-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: var(--sp-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  margin: 0;
  font-weight: var(--fw-semibold);
  font-size: var(--fs-body);
  color: var(--c-text);
}

.edit {
  border: none;
  background: none;
  color: var(--c-primary);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
}
.edit:active {
  opacity: 0.7;
}

/* petit état vide */
.empty {
  background: var(--c-surface);
  border-radius: var(--r-card);
  padding: var(--sp-2);
  margin-bottom: var(--sp-3);
}

/* bouton largeur figma-ish */
.cta {
  width: 100%;
}
</style>
