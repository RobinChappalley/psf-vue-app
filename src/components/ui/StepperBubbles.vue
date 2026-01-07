<template>
  <nav class="bubbles" aria-label="Progression">
    <button
      v-for="(s, i) in steps"
      :key="s.key"
      type="button"
      :class="['bubble', i < activeIndex && 'is-done', i === activeIndex && 'is-active']"
      :aria-current="i === activeIndex ? 'step' : undefined"
      @click="$emit('go', i)"
    >
      <span class="bubble-n">{{ i + 1 }}</span>
      <span class="bubble-label">{{ s.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  activeIndex: { type: Number, required: true },
})

defineEmits(['go'])
</script>

<style scoped>
/* Container */
.bubbles {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-1);
  margin-bottom: 2rem;
}

/* Each step button */
.bubble {
  flex: 1;
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: center;

  /* couleurs par défaut (étape à venir) */
  --ring: var(--c-primary);
  --fill: transparent;
  --num: var(--c-primary);
  --label: rgba(38, 38, 24, 0.55);

  /* style de ligne par défaut (à venir) */
  --line-color: rgba(38, 38, 24, 0.25);
  --line-style: dotted;
}

/* Ligne entre les bulles (sauf dernière) */
.bubble:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 1.05rem; /* aligne au centre du cercle */
  left: calc(50% + 1.15rem);
  right: calc(-50% + 1.15rem);
  border-top: 2px var(--line-style) var(--line-color);
}

/* Cercle */
.bubble-n {
  width: 2.1rem;
  height: 2.1rem;
  margin: 0 auto;
  border-radius: 999px;
  border: 2px solid var(--ring);
  background: var(--fill);
  color: var(--num);
  display: grid;
  place-items: center;
  font-family: var(--font-body);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-caption);
}

/* Label */
.bubble-label {
  display: block;
  margin-top: 0.35rem;
  font-size: var(--fs-caption);
  color: var(--label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ------- States ------- */

/* DONE = rempli secondary + ligne pleine */
.bubble.is-done {
  --ring: var(--c-secondary);
  --fill: var(--c-secondary);
  --num: var(--c-text);
  --label: rgba(38, 38, 24, 0.65);
  --line-color: rgba(38, 38, 24, 0.25);
  --line-style: solid;
}

/* ACTIVE = rempli primary + label un peu plus visible + ligne pointillée */
.bubble.is-active {
  --ring: var(--c-primary);
  --fill: var(--c-primary);
  --num: var(--c-bg);
  --label: rgba(38, 38, 24, 0.75);
  --line-color: rgba(38, 38, 24, 0.25);
  --line-style: dotted;
}

/* Accessibilité / feedback */
.bubble:active {
  opacity: 0.85;
}
</style>
