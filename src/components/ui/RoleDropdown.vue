<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  placeholder: { type: String, default: 'Tous les rôles' },
  options: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  return found?.label ?? ''
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function pick(o) {
  emit('update:modelValue', o.value)
  close()
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

function onClickOutside(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) close()
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="dd">
    <button
      type="button"
      class="control"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="value">{{ selectedLabel || placeholder }}</span>
      <span class="chev" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="menu" role="listbox">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="item"
        :class="{ active: o.value === modelValue }"
        @click="pick(o)"
      >
        <span class="label">{{ o.label }}</span>
        <span v-if="o.value === modelValue" class="check" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dd {
  position: relative;
  width: 100%;
}

.control {
  width: 100%;
  height: 44px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  background: var(--c-bg);
  padding: 0 14px;

  font-family: var(--font-body);
  font-size: var(--fs-body);
  cursor: pointer;
}

.value {
  color: var(--c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chev {
  opacity: 0.6;
}

.menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 50;

  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.item {
  width: 100%;
  text-align: left;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0.9rem 0.85rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--fs-caption);
}

.item + .item {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.item.active {
  background: rgba(0, 0, 0, 0.03);
}

.check {
  opacity: 0.7;
}
</style>
