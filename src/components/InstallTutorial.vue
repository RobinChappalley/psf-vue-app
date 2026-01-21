<script setup>
import { ref, computed } from 'vue'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const {
  isIOS,
  isAndroid,
  isDesktop,
  isSafari,
  needsSafari,
  hasNativePrompt,
  isStandalone,
  platformName,
  triggerInstall,
  dismiss,
} = useDeviceDetection()

const showAllInstructions = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function close() {
  isOpen.value = false
}

function closeAndDismiss() {
  dismiss()
  close()
}

async function handleNativeInstall() {
  const accepted = await triggerInstall()
  if (accepted) {
    close()
  }
}

function copyUrl() {
  navigator.clipboard.writeText(window.location.href)
  alert('Lien copié !')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="overlay" @click.self="close">
        <div class="modal">
          <!-- Header -->
          <div class="header">
            <h2>Installer l'application</h2>
            <button class="close-btn" @click="close" aria-label="Fermer">&times;</button>
          </div>

          <!-- Contenu -->
          <div class="content">
            <!-- Déjà installé -->
            <template v-if="isStandalone">
              <div class="message success">
                <span class="icon">✓</span>
                <p>L'application est déjà installée sur votre appareil.</p>
              </div>
            </template>

            <!-- Instructions selon la plateforme -->
            <template v-else-if="!showAllInstructions">
              <p class="platform-info">Vous utilisez <strong>{{ platformName }}</strong></p>

              <!-- iOS Safari -->
              <template v-if="isIOS && isSafari">
                <ol class="steps">
                  <li>
                    <span class="step-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                      </svg>
                    </span>
                    Appuyez sur le bouton <strong>Partager</strong> (en bas de l'écran)
                  </li>
                  <li>
                    <span class="step-icon">+</span>
                    Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong>
                  </li>
                  <li>
                    <span class="step-icon">✓</span>
                    Appuyez sur <strong>Ajouter</strong>
                  </li>
                </ol>
              </template>

              <!-- iOS mais pas Safari -->
              <template v-else-if="needsSafari">
                <div class="message warning">
                  <span class="icon">!</span>
                  <p>Sur iPhone/iPad, l'installation n'est possible que depuis <strong>Safari</strong>.</p>
                </div>
                <div class="safari-redirect">
                  <p>Ouvrez ce lien dans Safari :</p>
                  <div class="url-box">
                    <code>{{ window.location.href }}</code>
                    <button class="copy-btn" @click="copyUrl">Copier</button>
                  </div>
                </div>
              </template>

              <!-- Android avec prompt natif -->
              <template v-else-if="isAndroid && hasNativePrompt">
                <p class="install-native-text">Cliquez sur le bouton ci-dessous pour installer l'application :</p>
                <button class="install-btn" @click="handleNativeInstall">
                  Installer l'application
                </button>
              </template>

              <!-- Android sans prompt (instructions manuelles) -->
              <template v-else-if="isAndroid">
                <ol class="steps">
                  <li>
                    <span class="step-icon">⋮</span>
                    Appuyez sur le menu <strong>⋮</strong> (en haut à droite)
                  </li>
                  <li>
                    <span class="step-icon">+</span>
                    Appuyez sur <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>
                  </li>
                  <li>
                    <span class="step-icon">✓</span>
                    Confirmez l'installation
                  </li>
                </ol>
              </template>

              <!-- Desktop -->
              <template v-else-if="isDesktop">
                <ol class="steps">
                  <li>
                    <span class="step-icon">⊕</span>
                    Cliquez sur l'icône <strong>d'installation</strong> dans la barre d'adresse
                  </li>
                  <li>
                    <span class="step-icon">✓</span>
                    Cliquez sur <strong>"Installer"</strong>
                  </li>
                </ol>
                <p class="hint">L'icône ressemble à un écran avec une flèche ou un "+" selon votre navigateur.</p>
              </template>

              <!-- Fallback -->
              <template v-else>
                <p>Utilisez le menu de votre navigateur pour ajouter cette page à votre écran d'accueil.</p>
              </template>

              <button class="link-btn" @click="showAllInstructions = true">
                Autre appareil ou navigateur ?
              </button>
            </template>

            <!-- Toutes les instructions -->
            <template v-else>
              <button class="link-btn back" @click="showAllInstructions = false">
                ← Retour
              </button>

              <div class="all-instructions">
                <section>
                  <h3>iPhone / iPad (Safari)</h3>
                  <ol class="steps-compact">
                    <li>Bouton <strong>Partager</strong> → <strong>"Sur l'écran d'accueil"</strong> → <strong>Ajouter</strong></li>
                  </ol>
                </section>

                <section>
                  <h3>Android (Chrome)</h3>
                  <ol class="steps-compact">
                    <li>Menu <strong>⋮</strong> → <strong>"Installer l'application"</strong></li>
                  </ol>
                </section>

                <section>
                  <h3>Android (Firefox)</h3>
                  <ol class="steps-compact">
                    <li>Menu <strong>⋮</strong> → <strong>"Installer"</strong></li>
                  </ol>
                </section>

                <section>
                  <h3>Ordinateur</h3>
                  <ol class="steps-compact">
                    <li>Icône dans la barre d'adresse → <strong>"Installer"</strong></li>
                  </ol>
                </section>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="footer">
            <button class="dismiss-btn" @click="closeAndDismiss">Ne plus afficher</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal {
  background: var(--c-bg, #fff);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (min-width: 600px) {
  .overlay {
    align-items: center;
  }
  .modal {
    border-radius: 16px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border, #e0e0e0);
}

.header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: var(--c-text, #333);
  padding: 0;
  line-height: 1;
}

.content {
  padding: 1.5rem;
}

.platform-info {
  margin-bottom: 1.5rem;
  color: var(--c-text-secondary, #666);
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.warning {
  background: #fff3cd;
  color: #856404;
}

.message .icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.message p {
  margin: 0;
}

.steps {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  counter-reset: step;
}

.steps li {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--c-border, #eee);
}

.steps li:last-child {
  border-bottom: none;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--c-primary, #007bff);
  color: white;
  border-radius: 50%;
  font-size: 1.1rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-icon svg {
  width: 20px;
  height: 20px;
}

.safari-redirect {
  margin-top: 1rem;
}

.url-box {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
}

.url-box code {
  flex: 1;
  padding: 0.75rem;
  background: var(--c-surface, #f5f5f5);
  border-radius: 8px;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  padding: 0.75rem 1rem;
  background: var(--c-primary, #007bff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.install-native-text {
  margin-bottom: 1rem;
}

.install-btn {
  width: 100%;
  padding: 1rem;
  background: var(--c-primary, #007bff);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.install-btn:hover {
  opacity: 0.9;
}

.hint {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--c-text-secondary, #666);
}

.link-btn {
  background: none;
  border: none;
  color: var(--c-primary, #007bff);
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  text-decoration: underline;
}

.link-btn.back {
  margin-bottom: 1rem;
}

.all-instructions section {
  margin-bottom: 1.5rem;
}

.all-instructions h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: var(--c-primary, #007bff);
}

.steps-compact {
  list-style: none;
  padding: 0;
  margin: 0;
}

.steps-compact li {
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--c-border, #e0e0e0);
  text-align: center;
}

.dismiss-btn {
  background: none;
  border: none;
  color: var(--c-text-secondary, #666);
  cursor: pointer;
  font-size: 0.875rem;
}

.dismiss-btn:hover {
  text-decoration: underline;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
