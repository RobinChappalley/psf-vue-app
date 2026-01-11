<script setup>
import { computed, ref, watch } from 'vue'
import { getCampItems } from '@/services/campItemsApi'

const props = defineProps({
  campId: { type: [String, Number], required: true },
  title: { type: String, default: 'Matériel du camp' },
  defaultOpen: { type: Boolean, default: false },
})

const isOpen = ref(!!props.defaultOpen)
const loading = ref(false)
const error = ref('')
const items = ref([])

function normalizeCampItems(data) {
  const list = Array.isArray(data) ? data : (data?.itemsList ?? data)
  return (Array.isArray(list) ? list : [])
    .map((x) => ({
      id: String(x?.item?._id ?? x?.item ?? x?.item_id ?? ''),
      name: String(x?.item?.name ?? x?.name ?? 'Sans nom'),
      quantity: Number(x?.quantity ?? 1) || 1,
    }))
    .filter((x) => x.id)
}

async function load() {
  if (!props.campId) return
  loading.value = true
  error.value = ''
  try {
    const data = await getCampItems(props.campId)
    items.value = normalizeCampItems(data)
  } catch (e) {
    error.value = e?.message ?? 'Impossible de charger le matériel.'
    items.value = []
  } finally {
    loading.value = false
  }
}

async function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value && items.value.length === 0 && !loading.value) {
    await load()
  }
}

function refresh() {
  return load()
}

defineExpose({ refresh })

const countLabel = computed(() => {
  if (loading.value) return 'Chargement…'
  return `${items.value.length} item(s)`
})

// si le campId change, c'est reset
watch(
  () => String(props.campId ?? ''),
  async () => {
    items.value = []
    error.value = ''
    if (isOpen.value) await load()
  },
)
</script>

<template>
  <div class="block">
    <button type="button" class="header" @click="toggle" :aria-expanded="isOpen">
      <span class="title">{{ title }}</span>
      <span class="meta">{{ countLabel }}</span>
      <span class="chev" aria-hidden="true">{{ isOpen ? '▾' : '▸' }}</span>
    </button>

    <div v-if="isOpen" class="panel">
      <p v-if="error" class="empty">{{ error }}</p>
      <p v-else-if="loading" class="empty">Chargement du matériel…</p>
      <p v-else-if="items.length === 0" class="empty">Aucun matériel pour ce camp.</p>

      <div v-else class="list">
        <div v-for="it in items" :key="it.id" class="row">
          <span class="name">{{ it.name }}</span>
          <span class="qty-label">x{{ it.quantity }}</span>
        </div>
      </div>

      <p class="hint">Liste du matériel lié au camp.</p>
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
  color: var(--c-bg-dark);
}

.chev {
  font-size: 1rem;
  color: var(--c-bg-dark);
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
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
}

.name {
  font-size: var(--fs-body);
  color: var(--c-text);
}

.qty-label {
  font-size: var(--fs-caption);
  color: var (--c-bg-dark);
}

.empty,
.hint {
  margin: 0.5rem 0 0;
  font-size: var(--fs-caption);
  color: var(--nav-inactive);
}
</style>
