<template>
  <div class="auth-container">
    <div class="auth-card large">
      <div class="auth-header">
        <h1 class="auth-title">Create Character</h1>
        <p class="auth-subtitle">Design your unique companion</p>
      </div>
      
      <form @submit.prevent="handleCreateCharacter" class="creation-form">
        <!-- Character Preview -->
        <div class="character-preview">
          <div class="character-display">
            <div class="character-sprite">
              {{ getSpeciesEmoji(characterData.species || 'cat') }}
            </div>
            <div class="character-info">
              <h3>{{ characterData.name || 'Your Character' }}</h3>
              <p>
                {{ formatSpeciesName(characterData.species || 'cat') }} • 
                {{ formatJobName(characterData.job || 'warrior') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Character Name -->
        <div class="form-group">
          <label for="name" class="form-label">Character Name</label>
          <input
            id="name"
            v-model="characterData.name"
            type="text"
            required
            maxlength="50"
            class="form-input"
            placeholder="Choose a unique name"
          />
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="characterData.password"
            type="password"
            required
            minlength="4"
            class="form-input"
            placeholder="Create a password (minimum 4 characters)"
          />
          <p class="form-hint">You'll use this password to log in to your character</p>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="characterData.confirmPassword"
            type="password"
            required
            minlength="4"
            class="form-input"
            placeholder="Confirm your password"
          />
          <p v-if="characterData.password && characterData.confirmPassword && !passwordsMatch" class="form-error">
            Passwords do not match
          </p>
        </div>

        <!-- Species Selection -->
        <div class="form-group">
          <label class="form-label">Species</label>
          <div class="selection-grid">
            <button
              v-for="species in SPECIES_OPTIONS"
              :key="species"
              type="button"
              @click="characterData.species = species"
              :class="[
                'selection-item',
                characterData.species === species ? 'selected' : ''
              ]"
            >
              <span class="selection-icon">{{ getSpeciesEmoji(species) }}</span>
              <span class="selection-label">{{ formatSpeciesName(species) }}</span>
            </button>
          </div>
        </div>

        <!-- Job Selection -->
        <div class="form-group">
          <label class="form-label">Profession</label>
          <div class="selection-grid">
            <button
              v-for="job in JOB_OPTIONS"
              :key="job"
              type="button"
              @click="characterData.job = job"
              :class="[
                'selection-item',
                characterData.job === job ? 'selected' : ''
              ]"
            >
              <span class="selection-icon">{{ getJobEmoji(job) }}</span>
              <span class="selection-label">{{ formatJobName(job) }}</span>
            </button>
          </div>
        </div>

        <!-- Stats Preview -->
        <div class="stats-preview">
          <h3>Starting Stats</h3>
          <div class="stats-grid">
            <div class="stat-group">
              <h4>Combat</h4>
              <p>All stats start at 10</p>
            </div>
            <div class="stat-group">
              <h4>Personality</h4>
              <p>All traits start at 10</p>
            </div>
          </div>
        </div>

        <!-- Create Button -->
        <button
          type="submit"
          :disabled="!isFormValid || loading"
          class="auth-button primary large"
        >
          <span v-if="loading" class="button-content">
            <div class="spinner"></div>
            <span>Creating Character...</span>
          </span>
          <span v-else class="button-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span>Create Character</span>
          </span>
        </button>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccess" class="modal-overlay">
      <div class="success-modal">
        <div class="success-header">
          <div class="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <h2>Character Created!</h2>
          <p>{{ characterData.name }} has been created successfully</p>
        </div>
        
        <div class="character-summary">
          <div class="summary-item">
            <span class="summary-icon">{{ getSpeciesEmoji(characterData.species) }}</span>
            <div class="summary-info">
              <h4>{{ formatSpeciesName(characterData.species) }}</h4>
              <p>{{ formatJobName(characterData.job) }}</p>
            </div>
          </div>
        </div>
        
        <button @click="completeCreation" class="auth-button primary large">
          <span class="button-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6"/>
              <path d="M21 3l-7 7"/>
              <path d="M9 21H3v-6"/>
            </svg>
            <span>Start Adventure</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMockCharacterStore } from '@/stores/mock-character'
import { useQuestStore } from '@/stores/quest'
import { SPECIES_OPTIONS, JOB_OPTIONS, type Species, type Job } from '@/types'

const characterStore = useMockCharacterStore()
const questStore = useQuestStore()

const characterData = ref({
  name: '',
  password: '',
  confirmPassword: '',
  species: '' as Species,
  job: '' as Job
})

const errorMessage = ref('')
const showSuccess = ref(false)
const generatedPassword = ref('')
const loading = computed(() => characterStore.loading)

const passwordsMatch = computed(() => {
  return characterData.value.password === characterData.value.confirmPassword
})

const isFormValid = computed(() => {
  return characterData.value.name.trim().length > 0 &&
         characterData.value.password.length >= 4 &&
         passwordsMatch.value &&
         characterData.value.species &&
         characterData.value.job
})

function getSpeciesEmoji(species: Species): string {
  const emojis = {
    cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹',
    bird: '🐦', fish: '🐠', turtle: '🐢', fox: '🦊'
  }
  return emojis[species] || '🐾'
}

function getJobEmoji(job: Job): string {
  const emojis = {
    warrior: '⚔️', mage: '🔮', archer: '🏹', thief: '🗡️',
    cleric: '✨', bard: '🎵', scholar: '📚', merchant: '💰'
  }
  return emojis[job] || '💼'
}

function formatSpeciesName(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

function formatJobName(job: string): string {
  return job.charAt(0).toUpperCase() + job.slice(1)
}

async function handleCreateCharacter() {
  errorMessage.value = ''
  
  if (!passwordsMatch.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  
  const result = await characterStore.createCharacterWithPassword(
    characterData.value.name.trim(),
    characterData.value.password,
    characterData.value.species,
    characterData.value.job
  )
  
  if (result.success) {
    // Initialize quests for new character
    if (result.characterId) {
      await questStore.initializeQuests(result.characterId)
    }
    showSuccess.value = true
  } else {
    errorMessage.value = result.error || 'Failed to create character'
  }
}

function completeCreation() {
  showSuccess.value = false
}

defineEmits<{
  characterCreated: [void]
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
  max-width: 500px;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #2a2a2a;
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  padding: 2rem;
}

.auth-card.large {
  max-width: 600px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
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

.creation-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.character-preview {
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 1rem;
  padding: 1.5rem;
}

.character-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.character-sprite {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}

.character-info {
  text-align: center;
}

.character-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
}

.character-info p {
  font-size: 0.875rem;
  color: #888888;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.selection-item {
  padding: 1rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selection-item:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.selection-item.selected {
  background: linear-gradient(135deg, #1a2332 0%, #2d3748 100%);
  border-color: #4299e1;
  transform: translateY(-1px);
}

.selection-icon {
  font-size: 2rem;
}

.selection-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #cccccc;
}

.selection-item.selected .selection-label {
  color: #ffffff;
}

.stats-preview {
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.stats-preview h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-group h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #cccccc;
  margin: 0 0 0.25rem 0;
}

.stat-group p {
  font-size: 0.75rem;
  color: #888888;
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

.auth-button.large {
  padding: 1rem 1.5rem;
  font-size: 1rem;
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

/* Success Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.success-modal {
  width: 100%;
  max-width: 400px;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid #2a2a2a;
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  padding: 2rem;
}

.success-header {
  text-align: center;
  margin-bottom: 2rem;
}

.success-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  margin-bottom: 1rem;
}

.success-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.success-header p {
  color: #888888;
  font-size: 0.9rem;
  margin: 0;
}

.password-display {
  margin-bottom: 1.5rem;
}

.password-display label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.password-value {
  padding: 1rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #4299e1;
  text-align: center;
  letter-spacing: 0.1em;
}

.warning-message {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.warning-message svg {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-message strong {
  color: #f59e0b;
  font-size: 0.875rem;
  display: block;
  margin-bottom: 0.25rem;
}

.warning-message p {
  color: #d97706;
  font-size: 0.8rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .selection-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .character-sprite {
    font-size: 3rem;
  }
}

/* Form validation styles */
.form-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin: 0;
  font-weight: 500;
}

/* Character summary in success modal */
.character-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  font-size: 3rem;
}

.summary-info h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
}

.summary-info p {
  font-size: 0.875rem;
  color: #888888;
  margin: 0;
}
</style>