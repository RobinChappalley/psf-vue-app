// src/composables/useChildrenEditor.js
import { computed, ref } from 'vue'
import { authStore } from '@/stores/auth'

/**
 * Gère:
 * - liste enfants (objects)
 * - ouverture édition / création
 * - submit (create/update)
 * - fermeture
 *
 * Utilisation:
 * const {
 *   children, selectedChild, isCreatingChild,
 *   openEditChild, openCreateChild,
 *   submitChild, closeChildEdit
 * } = useChildrenEditor()
 */
export function useChildrenEditor() {
  const children = computed(() => authStore.childrenObjects.value)

  const selectedChild = ref(null)
  const isCreatingChild = ref(false)

  function openEditChild(child) {
    isCreatingChild.value = false
    selectedChild.value = child
  }

  function openCreateChild(parentId) {
    isCreatingChild.value = true
    selectedChild.value = authStore.createEmptyChild(parentId)
  }

  async function submitChild(payload) {
    if (isCreatingChild.value) {
      const created = await authStore.createChild(payload)
      selectedChild.value = created
      isCreatingChild.value = false
      return created
    }

    const updated = await authStore.updateChild(payload)
    if (updated) selectedChild.value = updated
    return updated
  }

  function closeChildEdit() {
    selectedChild.value = null
    isCreatingChild.value = false
  }

  return {
    children,
    selectedChild,
    isCreatingChild,
    openEditChild,
    openCreateChild,
    submitChild,
    closeChildEdit,
  }
}
