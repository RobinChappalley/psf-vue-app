// src/composables/useChildrenEditor.js
import { computed, ref } from 'vue'
import { childrenStore } from '@/stores/childrenStore'

/**
 * Gère:
 * - liste enfants (objects)
 * - ouverture édition / création
 * - submit (create/update)
 * - fermeture
 *
 * IMPORTANT: Ce composable est découplé de authStore.
 * Le parentId doit être passé par le composant appelant.
 *
 * Utilisation:
 * const {
 *   children, selectedChild, isCreatingChild,
 *   openEditChild, openCreateChild,
 *   submitChild, closeChildEdit
 * } = useChildrenEditor()
 */
export function useChildrenEditor() {
  const children = computed(() => childrenStore.childrenObjects.value)

  const selectedChild = ref(null)
  const isCreatingChild = ref(false)

  function openEditChild(child) {
    isCreatingChild.value = false
    selectedChild.value = child
  }

  function openCreateChild(parentId) {
    if (!parentId) throw new Error('parentId requis pour openCreateChild')
    isCreatingChild.value = true
    selectedChild.value = childrenStore.createEmptyChild(parentId)
  }

  /**
   * Soumet les données d'un enfant (création ou mise à jour)
   * @param {string|number} parentId - ID du parent (OBLIGATOIRE)
   * @param {Object} payload - Données de l'enfant
   */
  async function submitChild(parentId, payload) {
    if (!parentId) throw new Error('parentId requis pour submitChild')

    if (isCreatingChild.value) {
      const created = await childrenStore.createChild(parentId, payload)
      selectedChild.value = created
      isCreatingChild.value = false
      return created
    }

    const updated = await childrenStore.updateChild(parentId, payload)
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
    submitChild, // Signature changée: (parentId, payload)
    closeChildEdit,
  }
}
