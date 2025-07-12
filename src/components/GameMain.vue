<template>
  <div class="game-container">
    <!-- Modern Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="logo">MyTamaLife</h1>
          <div class="player-badge">
            <span class="player-name">{{ character?.name }}</span>
            <span class="level-indicator">Level {{ character?.level }}</span>
          </div>
        </div>
        <button @click="logout" class="logout-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Exit
        </button>
      </div>
    </header>

    <!-- Main Dashboard -->
    <div class="dashboard">
      <!-- Left Panel: Character Stats -->
      <div class="panel stats-panel">
        <div class="panel-header">
          <h2>Character Overview</h2>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-value">{{ character?.level }}</div>
            <div class="stat-label">Level</div>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: expPercentage + '%' }"></div>
              </div>
              <span class="progress-text">{{ Math.max(0, expToNextLevel) }} XP to next</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ character?.coins?.toLocaleString() }}</div>
            <div class="stat-label">Coins</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ character?.age }}</div>
            <div class="stat-label">Days Old</div>
          </div>
        </div>

        <!-- Character Profile -->
        <div class="character-profile">
          <div class="character-avatar-container">
            <div class="character-avatar">{{ getSpeciesEmoji(character?.species) }}</div>
            <div class="character-info">
              <h3>{{ character?.name }}</h3>
              <p>{{ formatJobName(character?.job) }} • {{ formatSpeciesName(character?.species) }}</p>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="resources-section">
          <h3>Resources</h3>
          <div class="resource-grid">
            <button
              v-for="bug in availableBugs"
              :key="bug.id"
              @click="feedBug(bug.id)"
              class="resource-item available"
            >
              <div class="resource-icon">🐛</div>
              <span>Food</span>
            </button>
            <div 
              v-for="n in Math.max(0, 3 - availableBugs.length)" 
              :key="'empty-' + n"
              class="resource-item empty"
            >
              <div class="resource-icon">⭕</div>
              <span>Empty</span>
            </div>
          </div>
          <div class="resource-info">
            <p>Resources replenish every 30 minutes</p>
            <p v-if="bugStore.timeUntilNextBug > 0" class="timer-info">
              Next bug in: {{ formatTime(bugStore.timeUntilNextBug) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Center Panel: Character Display -->
      <div class="panel character-panel">
        <div class="character-stage">
          <div class="character-display">
            <div class="character-sprite">
              {{ getSpeciesEmoji(character?.species) }}
            </div>
            <div class="level-badge">{{ character?.level }}</div>
          </div>
          
          <div class="character-status">
            <div class="status-bubble">
              <p>{{ currentMessage }}</p>
            </div>
            
            <div class="emotion-control">
              <div class="current-emotion">
                <span class="emotion-icon">{{ getEmotionEmoji(character?.emotion) }}</span>
                <span>{{ formatEmotionName(character?.emotion) }}</span>
              </div>
              <select
                v-model="character.emotion"
                @change="updateEmotion"
                class="emotion-select"
              >
                <option v-for="emotion in EMOTION_OPTIONS" :key="emotion" :value="emotion">
                  {{ getEmotionEmoji(emotion) }} {{ formatEmotionName(emotion) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="playWithCharacter" class="action-button primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Interact
          </button>
          <button @click="refreshMessage" class="action-button secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23,4 23,10 17,10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Right Panel: Attributes -->
      <div class="panel attributes-panel">
        <div class="panel-header">
          <h2>Attributes</h2>
          <div v-if="availableStatPoints > 0" class="points-badge">
            {{ availableStatPoints }} available
          </div>
        </div>
        
        <!-- Combat Stats -->
        <div class="attribute-section">
          <h3>Combat</h3>
          <div class="attribute-list">
            <div v-for="stat in ['str', 'dex', 'int', 'vit', 'agi', 'luk']" :key="stat" class="attribute-row">
              <div class="attribute-info">
                <span class="attribute-name">{{ formatStatName(stat) }}</span>
                <span class="attribute-value">{{ character?.stats?.[stat as keyof typeof character.stats] || 0 }}</span>
              </div>
              <button
                v-if="availableStatPoints > 0"
                @click="increaseStat(stat)"
                class="increase-button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Personality Stats -->
        <div class="attribute-section">
          <h3>Personality</h3>
          <div class="attribute-list">
            <div v-for="stat in ['playfulness', 'curiosity', 'sensitivity', 'awareness', 'meddling', 'pragmatism', 'appetite', 'anger_control', 'clumsiness']" :key="stat" class="attribute-row">
              <div class="attribute-info">
                <span class="attribute-name">{{ formatStatName(stat) }}</span>
                <span class="attribute-value">{{ character?.stats?.[stat as keyof typeof character.stats] || 0 }}</span>
              </div>
              <button
                v-if="availableStatPoints > 0"
                @click="increaseStat(stat)"
                class="increase-button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Game Features -->
        <div class="features-section">
          <h3>Features</h3>
          <div class="feature-list">
            <div class="feature-item disabled">
              <span>Achievements</span>
              <span class="feature-status">Coming Soon</span>
            </div>
            <div class="feature-item disabled">
              <span>Knowledge Base</span>
              <span class="feature-status">Coming Soon</span>
            </div>
            <div class="feature-item disabled">
              <span>Social</span>
              <span class="feature-status">Coming Soon</span>
            </div>
            <div class="feature-item disabled">
              <span>Marketplace</span>
              <span class="feature-status">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useBugStore } from '@/stores/bug'
import { EMOTION_OPTIONS, type Species, type Job, type Bug } from '@/types'

const characterStore = useCharacterStore()
const bugStore = useBugStore()

const character = computed(() => characterStore.currentCharacter)
const availableStatPoints = computed(() => characterStore.availableStatPoints)
const availableBugs = computed(() => bugStore.availableBugs)

const currentMessage = ref('')
const messageInterval = ref<NodeJS.Timeout | null>(null)

const expForNextLevel = computed(() => {
  if (!character.value) return 0
  return Math.pow(character.value.level, 2) * 100
})

const expPercentage = computed(() => {
  if (!character.value) return 0
  const currentLevelExp = Math.pow(character.value.level - 1, 2) * 100
  const nextLevelExp = expForNextLevel.value
  const progress = (character.value.exp - currentLevelExp) / (nextLevelExp - currentLevelExp) * 100
  return Math.min(100, Math.max(0, progress))
})

const expToNextLevel = computed(() => {
  if (!character.value) return 0
  return expForNextLevel.value - character.value.exp
})

onMounted(async () => {
  if (character.value?.id) {
    await bugStore.initializeBugs(character.value.id)
  }
  generateMessage()
  startMessageRotation()
})

onUnmounted(() => {
  if (messageInterval.value) {
    clearInterval(messageInterval.value)
  }
  bugStore.stopBugTimer()
})

function getSpeciesEmoji(species: string | undefined): string {
  if (!species) return '🐾'
  const emojis = {
    cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹',
    bird: '🐦', fish: '🐠', turtle: '🐢', fox: '🦊'
  }
  return emojis[species as Species] || '🐾'
}

function getJobEmoji(job: string | undefined): string {
  if (!job) return '💼'
  const emojis = {
    warrior: '⚔️', mage: '🔮', archer: '🏹', thief: '🗡️',
    cleric: '✨', bard: '🎵', scholar: '📚', merchant: '💰'
  }
  return emojis[job as Job] || '💼'
}

function getEmotionEmoji(emotion: string): string {
  const emojis = {
    happy: '😊', sad: '😢', angry: '😠', excited: '😆',
    tired: '😴', confused: '😕', proud: '😤', anxious: '😰',
    peaceful: '😌', curious: '🤔'
  }
  return emojis[emotion as keyof typeof emojis] || '😊'
}

function formatStatName(stat: string): string {
  const names = {
    str: 'Strength', dex: 'Dexterity', int: 'Intelligence',
    vit: 'Vitality', agi: 'Agility', luk: 'Luck',
    playfulness: 'Playfulness', curiosity: 'Curiosity',
    sensitivity: 'Sensitivity', awareness: 'Awareness',
    meddling: 'Meddling', pragmatism: 'Pragmatism',
    appetite: 'Appetite', anger_control: 'Anger Control',
    clumsiness: 'Clumsiness'
  }
  return names[stat as keyof typeof names] || stat
}

function formatJobName(job: string | undefined): string {
  if (!job) return 'Unknown'
  return job.charAt(0).toUpperCase() + job.slice(1)
}

function formatSpeciesName(species: string | undefined): string {
  if (!species) return 'Unknown'
  return species.charAt(0).toUpperCase() + species.slice(1)
}

function formatEmotionName(emotion: string): string {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

function formatTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
  return `${minutes}m ${seconds}s`
}

async function feedBug(bugId: string) {
  if (!character.value) return
  
  const expGain = Math.floor(Math.random() * 40) + 10
  const success = await bugStore.feedBug(bugId, character.value.id)
  
  if (success) {
    await characterStore.gainExperience(expGain)
    generateMessage(`Gained ${expGain} experience points!`)
  }
}

async function increaseStat(statName: string) {
  if (!character.value || availableStatPoints.value <= 0) return
  
  const newStats = { ...character.value.stats }
  newStats[statName as keyof typeof newStats] += 1
  
  await characterStore.updateCharacterStats(newStats)
}

async function updateEmotion() {
  if (!character.value) return
  await characterStore.updateCharacterEmotion(character.value.emotion)
  generateMessage()
}

function generateMessage(customMessage?: string) {
  if (customMessage) {
    currentMessage.value = customMessage
    return
  }
  
  if (!character.value) return
  
  const emotion = character.value.emotion
  const messages = {
    happy: [
      "Everything feels perfect right now.",
      "I'm radiating positive energy today.",
      "Life is treating me well.",
      "Feeling grateful for this moment.",
      "What a beautiful day to be alive."
    ],
    sad: [
      "Things feel a bit heavy today.",
      "I could use some comfort right now.",
      "Sometimes the world feels overwhelming.",
      "Taking things one step at a time.",
      "Tomorrow might be brighter."
    ],
    angry: [
      "I need to channel this energy properly.",
      "Deep breaths are helping me focus.",
      "Working through these frustrations.",
      "Finding my center again.",
      "Transforming this intensity into growth."
    ],
    excited: [
      "The possibilities are endless!",
      "I can't contain this energy!",
      "Ready to take on any challenge.",
      "This feeling is incredible.",
      "Let's make something amazing happen."
    ],
    tired: [
      "Rest is calling my name.",
      "Recharging for tomorrow's adventures.",
      "Even heroes need their downtime.",
      "Finding peace in stillness.",
      "Restoring my energy reserves."
    ],
    confused: [
      "Processing all the information.",
      "Sometimes questions are more valuable than answers.",
      "Navigating through uncertainty.",
      "Learning as I go.",
      "Clarity will come with time."
    ],
    proud: [
      "Look how far I've come.",
      "Achievement feels incredible.",
      "Hard work is paying off.",
      "Progress is my middle name.",
      "Setting new standards for myself."
    ],
    anxious: [
      "Taking things one breath at a time.",
      "Finding calm in the storm.",
      "Grounding myself in the present.",
      "Anxiety is temporary; I am resilient.",
      "Breathing through the uncertainty."
    ],
    peaceful: [
      "Inner harmony flows through me.",
      "Centered and balanced.",
      "Finding beauty in simplicity.",
      "At one with the universe.",
      "Serenity is my natural state."
    ],
    curious: [
      "What mysteries await discovery?",
      "Knowledge is the greatest adventure.",
      "Questions lead to amazing places.",
      "Exploring new possibilities.",
      "Every day brings new learning."
    ]
  }
  
  const emotionMessages = messages[emotion as keyof typeof messages] || messages.happy
  currentMessage.value = emotionMessages[Math.floor(Math.random() * emotionMessages.length)]
}

function refreshMessage() {
  generateMessage()
}

function startMessageRotation() {
  messageInterval.value = setInterval(() => {
    generateMessage()
  }, 15000)
}

function logout() {
  characterStore.logout()
}

function playWithCharacter() {
  const playMessages = [
    "That interaction was meaningful.",
    "Connection deepens understanding.",
    "Shared moments create lasting bonds.",
    "Communication builds bridges.",
    "Together we grow stronger."
  ]
  const randomMessage = playMessages[Math.floor(Math.random() * playMessages.length)]
  generateMessage(randomMessage)
  characterStore.gainExperience(5)
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  overflow-x: hidden;
}

/* Header */
.header {
  border-bottom: 1px solid #2a2a2a;
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.player-badge {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
}

.level-indicator {
  font-size: 0.75rem;
  color: #888888;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  color: #cccccc;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
  color: #ffffff;
}

/* Dashboard */
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 380px 1fr 380px;
  gap: 2rem;
  align-items: start;
}

/* Panels */
.panel {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #2a2a2a;
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.panel-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #2a2a2a;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

/* Stats Panel */
.stats-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%);
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.stat-card.primary {
  background: linear-gradient(135deg, #1a2332 0%, #2d3748 100%);
  border-color: #4a5568;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #888888;
  margin-bottom: 1rem;
}

.stat-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 0.5rem;
  background: #2a2a2a;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1 0%, #63b3ed 100%);
  border-radius: 0.25rem;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #888888;
}

/* Character Profile */
.character-profile {
  padding: 1.5rem;
  border-top: 1px solid #2a2a2a;
}

.character-avatar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.character-avatar {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.character-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.character-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #888888;
}

/* Resources */
.resources-section {
  padding: 1.5rem;
  border-top: 1px solid #2a2a2a;
}

.resources-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.resource-item {
  padding: 1rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  color: #888888;
}

.resource-item.available {
  border-color: #4a5568;
  color: #ffffff;
}

.resource-item.available:hover {
  background: #2a2a2a;
  border-color: #63b3ed;
  transform: translateY(-1px);
}

.resource-item.empty {
  opacity: 0.5;
  cursor: not-allowed;
}

.resource-icon {
  font-size: 1.25rem;
}

.resource-info {
  margin: 0;
  font-size: 0.75rem;
  color: #666666;
  text-align: center;
}

.timer-info {
  margin: 0.25rem 0 0 0;
  font-size: 0.7rem;
  color: #4299e1;
  font-weight: 500;
}

/* Character Panel */
.character-stage {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.character-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: linear-gradient(135deg, #1a2332 0%, #2d3748 100%);
  border: 1px solid #4a5568;
  border-radius: 1rem;
  overflow: hidden;
}

.character-sprite {
  font-size: 6rem;
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.level-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  backdrop-filter: blur(10px);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.character-status {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-bubble {
  padding: 1.5rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 1rem;
  position: relative;
}

.status-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #1f1f1f;
}

.status-bubble p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #cccccc;
  text-align: center;
  font-style: italic;
}

.emotion-control {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.current-emotion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 2rem;
  font-weight: 500;
  color: #ffffff;
}

.emotion-icon {
  font-size: 1.25rem;
}

.emotion-select {
  padding: 0.75rem 1rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 0.875rem;
  min-width: 200px;
}

.emotion-select:focus {
  outline: none;
  border-color: #4a5568;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 150px;
  justify-content: center;
}

.action-button.primary {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  border-color: #4299e1;
  color: #ffffff;
}

.action-button.primary:hover {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #1f1f1f;
  color: #cccccc;
}

.action-button.secondary:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
  color: #ffffff;
  transform: translateY(-1px);
}

/* Attributes Panel */
.points-badge {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  margin-top: 0.5rem;
  text-align: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.attribute-section {
  padding: 1.5rem;
  border-top: 1px solid #2a2a2a;
}

.attribute-section:first-child {
  border-top: none;
}

.attribute-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.attribute-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attribute-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.attribute-row:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
}

.attribute-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.attribute-name {
  font-size: 0.875rem;
  color: #cccccc;
  font-weight: 500;
}

.attribute-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-right: 1rem;
}

.increase-button {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  border: none;
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.increase-button:hover {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  transform: scale(1.05);
}

/* Features */
.features-section {
  padding: 1.5rem;
  border-top: 1px solid #2a2a2a;
}

.features-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  opacity: 0.5;
}

.feature-item span:first-child {
  font-size: 0.875rem;
  color: #cccccc;
  font-weight: 500;
}

.feature-status {
  font-size: 0.75rem;
  color: #666666;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard {
    grid-template-columns: 320px 1fr 320px;
    gap: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .dashboard {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .character-panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
    gap: 1rem;
  }
  
  .header-content {
    padding: 1rem;
  }
  
  .header-left {
    gap: 1rem;
  }
  
  .character-sprite {
    font-size: 4rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-button {
    max-width: none;
  }
}
</style>