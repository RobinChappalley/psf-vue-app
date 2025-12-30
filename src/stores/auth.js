import { reactive, computed } from 'vue'

const state = reactive({
  user: null,
  token: null,
})

export const authStore = {
  state,
  isAuthenticated: computed(() => !!state.token),

  hasAnyRole(roles) {
    return roles.some((r) => state.user?.roles?.includes(r))
  },

  mockLogin(roles = ['parent']) {
    state.user = { id: '1', roles }
    state.token = 'fake-jwt'
  },

  logout() {
    state.user = null
    state.token = null
  },
}
