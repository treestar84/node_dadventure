<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">🐾</div>
        </div>
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Continue your Dadventure journey</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="name" class="form-label">Character Name</label>
          <input
            id="name"
            v-model="loginData.name"
            type="text"
            required
            class="form-input"
            placeholder="Enter your character name"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="loginData.password"
            type="password"
            required
            class="form-input"
            placeholder="Enter your password"
          />
          <p class="form-hint">This is the password generated when you created your character</p>
        </div>

        <button
          type="submit"
          :disabled="!isFormValid || loading"
          class="auth-button primary"
        >
          <span v-if="loading" class="button-content">
            <div class="spinner"></div>
            <span>Logging in...</span>
          </span>
          <span v-else class="button-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6"/>
              <path d="M21 3l-7 7"/>
              <path d="M9 21H3v-6"/>
            </svg>
            <span>Enter Game</span>
          </span>
        </button>
      </form>

      <div v-if="errorMessage" class="error-message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="auth-divider">
        <span>New to Dadventure?</span>
      </div>

      <button @click="$emit('switchToCreate')" class="auth-button secondary">
        <span class="button-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Create New Character</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSupabaseCharacterStore } from '@/stores/supabase-character'

const characterStore = useSupabaseCharacterStore()

const loginData = ref({
  name: '',
  password: ''
})

const errorMessage = ref('')
const loading = computed(() => characterStore.loading)

const isFormValid = computed(() => {
  return loginData.value.name.trim().length > 0 && loginData.value.password.length > 0
})

async function handleLogin() {
  errorMessage.value = ''
  
  const result = await characterStore.loginCharacter(
    loginData.value.name.trim(),
    loginData.value.password
  )
  
  if (result.success) {
    emit('loginSuccess')
  } else {
    errorMessage.value = result.error || 'Login failed'
  }
}

const emit = defineEmits<{
  switchToCreate: [void]
  loginSuccess: [void]
}>()
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #2a2a2a;
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  color: #888888;
  font-size: 0.95rem;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.form-input {
  padding: 0.875rem 1rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  background: #262626;
}

.form-input::placeholder {
  color: #666666;
}

.form-hint {
  font-size: 0.75rem;
  color: #666666;
  margin: 0;
}

.auth-button {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.auth-button.primary {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
}

.auth-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  transform: translateY(-1px);
}

.auth-button.secondary {
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  color: #cccccc;
}

.auth-button.secondary:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
  color: #ffffff;
  transform: translateY(-1px);
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.auth-divider {
  text-align: center;
  margin: 2rem 0 1rem 0;
  position: relative;
}

.auth-divider span {
  background: rgba(26, 26, 26, 0.8);
  color: #666666;
  font-size: 0.875rem;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #3a3a3a;
  transform: translateY(-50%);
}
</style>