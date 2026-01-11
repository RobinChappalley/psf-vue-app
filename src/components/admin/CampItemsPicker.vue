<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  title: { type: String, default: 'Matériel pour le camp' },
  defaultOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

/**
 * IDs valides (ceux existant dans items)
 */
const validIds = computed(() => new Set(props.items.map((it) => String(it.id))))

/**
 * Normalisation + sécurité
 */
function normalizeList(list) {
  return (Array.isArray(list) ? list : [])
    .map((x) => ({
      item_id: String(x?.item_id ?? ''),
      quantity: Number(x?.quantity ?? 1),
    }))
    .filter((x) => x.item_id && validIds.value.has(x.item_id))
}

/**
 * State interne
 */
const selected = ref([])

/**
 * Sync depuis le parent
 */
function syncFromModel() {
  selected.value = normalizeList(props.modelValue)
}

watch(() => props.modelValue, syncFromModel, { deep: true, immediate: true })
watch(() => props.items, syncFromModel, { deep: true })

/**
 * Helpers
 */
const selectedSet = computed(() => new Set(selected.value.map((x) => x.item_id)))

function commit(next) {
  selected.value = next
  emit('update:modelValue', next)
}

function toggleItem(itemId, checked) {
  const id = String(itemId)

  if (checked) {
    if (selectedSet.value.has(id)) return
    commit([...selected.value, { item_id: id, quantity: 1 }])
  } else {
    commit(selected.value.filter((x) => x.item_id !== id))
  }
}

function updateQty(itemId, qty) {
  const id = String(itemId)
  const n = Number(qty)

  // on accepte vide/NaN pendant la frappe ? -> on garde l'ancien
  if (!Number.isFinite(n)) return

  commit(selected.value.map((x) => (x.item_id === id ? { ...x, quantity: n } : x)))
}

function getQty(itemId) {
  const id = String(itemId)
  return selected.value.find((x) => x.item_id === id)?.quantity ?? '1'
}

/**
 * UI
 */
const isOpen = ref(props.defaultOpen)
</script>

<template>
  <div class="block">
    <button type="button" class="header" @click="isOpen = !isOpen" :aria-expanded="isOpen">
      <span class="title">{{ title }}</span>
      <span class="meta">{{ selected.length }} sélectionné(s)</span>
      <span class="chev" aria-hidden="true">{{ isOpen ? '▾' : '▸' }}</span>
    </button>

    <div v-if="isOpen" class="panel">
      <p v-if="!items.length" class="empty">Aucun matériel disponible.</p>

      <div v-else class="list">
        <div v-for="it in items" :key="it.id" class="row">
          <label class="left">
            <input
              type="checkbox"
              :checked="selectedSet.has(String(it.id))"
              @change="toggleItem(it.id, $event.target.checked)"
            />
            <span class="name">{{ it.name }}</span>
          </label>

          <div class="right" v-if="selectedSet.has(String(it.id))">
            <span class="qty-label">Qté</span>
            <input
              class="qty"
              type="number"
              min="1"
              step="1"
              v-model.number="selected.find((x) => x.item_id === String(it.id)).quantity"
            />
          </div>
        </div>
      </div>

      <p class="hint">Coche un item pour l’ajouter, puis ajuste la quantité.</p>
    </div>
  </div>
</template>

<style scoped>
.block {
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  background: var(--c-bg);
}

.header {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem 0.9rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.title {
  font-size: var(--fs-body);
  color: var(--c-text);
}

.meta {
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.55);
}

.chev {
  font-size: 1rem;
  color: rgba(38, 38, 24, 0.65);
}

.panel {
  padding: 0.75rem 0.9rem 0.9rem;
  border-top: 1px solid var(--c-border);
}

.list {
  display: grid;
  gap: 0.5rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
}

.left {
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: 0.6rem;
  row-gap: 0.1rem;
  align-items: start;
  cursor: pointer;
}

.name {
  font-size: var(--fs-body);
  color: var(--c-text);
}

.right {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.qty-label {
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.55);
}

.qty {
  width: 90px;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  padding: 0.45rem 0.55rem;
  border-radius: var(--r-input);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text);
}

.empty,
.hint {
  margin: 0.5rem 0 0;
  font-size: var(--fs-caption);
  color: rgba(38, 38, 24, 0.55);
}
</style>
