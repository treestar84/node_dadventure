<template>
  <div class="character-avatar-container" :class="containerClass">
    <div class="character-avatar" :style="avatarStyle">
      <!-- Base Character SVG -->
      <div class="character-base" v-html="characterSvg"></div>
      
      <!-- Job Equipment Overlay -->
      <div v-if="jobEquipment" class="equipment-overlay" v-html="jobEquipment"></div>
      
      <!-- Customization Layers -->
      <div v-if="customizations.clothing" class="customization-layer clothing" v-html="customizations.clothing"></div>
      <div v-if="customizations.accessory" class="customization-layer accessory" v-html="customizations.accessory"></div>
      <div v-if="customizations.background" class="customization-layer background" v-html="customizations.background"></div>
      
      <!-- Level Badge -->
      <div v-if="showLevel" class="level-badge">
        {{ level }}
      </div>
      
      <!-- Emotion Effect -->
      <div v-if="emotionEffect" class="emotion-effect" :class="emotion">
        {{ getEmotionEmoji(emotion) }}
      </div>
      
      <!-- Status Effects -->
      <div v-if="statusEffects.length > 0" class="status-effects">
        <div v-for="effect in statusEffects" :key="effect" class="status-effect" :class="effect">
          {{ getStatusEmoji(effect) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Species, Job, Emotion } from '@/types'

interface Props {
  species: Species
  job: Job
  emotion?: Emotion
  level?: number
  size?: 'small' | 'medium' | 'large' | 'xl'
  showLevel?: boolean
  showEmotion?: boolean
  customizations?: {
    clothing?: string
    accessory?: string
    background?: string
  }
  statusEffects?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  emotion: 'happy',
  level: 1,
  size: 'medium',
  showLevel: false,
  showEmotion: true,
  customizations: () => ({}),
  statusEffects: () => []
})

const characterSvg = ref('')
const jobEquipment = ref('')

// Size classes for responsive design
const containerClass = computed(() => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
    xl: 'w-64 h-64'
  }
  return sizeClasses[props.size]
})

const avatarStyle = computed(() => {
  const baseStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  
  // Add emotion-based effects
  if (props.emotion === 'excited') {
    return { ...baseStyle, animation: 'bounce 1s infinite' }
  } else if (props.emotion === 'angry') {
    return { ...baseStyle, animation: 'wiggle 0.5s infinite' }
  }
  
  return baseStyle
})

const emotionEffect = computed(() => props.showEmotion && props.emotion)

// Load character SVG based on species
const loadCharacterSvg = async () => {
  try {
    // For now, use emoji fallback since SVG loading in dev might have issues
    characterSvg.value = `<div style="font-size: 4rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${getSpeciesEmoji(props.species)}</div>`
  } catch (error) {
    console.error('Failed to load character SVG:', error)
    // Fallback to emoji
    characterSvg.value = `<div style="font-size: 4rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${getSpeciesEmoji(props.species)}</div>`
  }
}

// Load job equipment overlay
const loadJobEquipment = () => {
  const jobEquipments = {
    warrior: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <rect x="85" y="60" width="30" height="5" fill="#8B4513" rx="2"/>
      <rect x="95" y="55" width="10" height="15" fill="#C0C0C0"/>
    </svg>`,
    mage: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <circle cx="70" cy="50" r="8" fill="#9370DB" opacity="0.7"/>
      <line x1="70" y1="45" x2="70" y2="35" stroke="#8B4513" stroke-width="2"/>
    </svg>`,
    archer: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <rect x="130" y="80" width="25" height="3" fill="#8B4513"/>
      <rect x="155" y="75" width="8" height="13" fill="#CD853F"/>
    </svg>`,
    thief: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <rect x="60" y="65" width="80" height="15" fill="#2F4F4F" opacity="0.8"/>
    </svg>`,
    cleric: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <circle cx="100" cy="45" r="12" fill="#FFD700" opacity="0.8"/>
      <rect x="98" y="35" width="4" height="10" fill="#FFD700"/>
      <rect x="95" y="38" width="10" height="4" fill="#FFD700"/>
    </svg>`,
    bard: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <ellipse cx="130" cy="70" rx="15" ry="8" fill="#8B4513"/>
      <line x1="130" y1="62" x2="130" y2="78" stroke="#000" stroke-width="1"/>
    </svg>`,
    scholar: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <rect x="75" y="55" width="20" height="2" fill="#000"/>
      <rect x="105" y="55" width="20" height="2" fill="#000"/>
      <circle cx="85" cy="56" r="8" fill="none" stroke="#000" stroke-width="1"/>
      <circle cx="115" cy="56" r="8" fill="none" stroke="#000" stroke-width="1"/>
    </svg>`,
    merchant: `<svg viewBox="0 0 200 200" class="absolute inset-0">
      <rect x="85" y="50" width="30" height="15" fill="#FFD700" opacity="0.8"/>
      <circle cx="100" cy="57" r="3" fill="#FF6347"/>
    </svg>`
  }
  
  jobEquipment.value = jobEquipments[props.job] || ''
}

function getSpeciesEmoji(species: Species): string {
  const emojis = {
    cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹',
    bird: '🐦', fish: '🐠', turtle: '🐢', fox: '🦊'
  }
  return emojis[species] || '🐾'
}

function getEmotionEmoji(emotion: Emotion): string {
  const emojis = {
    happy: '😊', sad: '😢', angry: '😠', excited: '😆',
    tired: '😴', confused: '😕', proud: '😤', anxious: '😰',
    peaceful: '😌', curious: '🤔'
  }
  return emojis[emotion] || '😊'
}

function getStatusEmoji(status: string): string {
  const emojis = {
    hungry: '🍽️',
    sleeping: '💤',
    sick: '🤒',
    happy: '✨',
    leveling: '⬆️',
    evolving: '🌟'
  }
  return emojis[status as keyof typeof emojis] || '❓'
}

// Initialize component
loadCharacterSvg()
loadJobEquipment()
</script>

<style scoped>
.character-avatar-container {
  @apply relative overflow-hidden rounded-full bg-gradient-to-br from-white to-gray-100 shadow-lg;
}

.character-avatar {
  transition: all 0.3s ease;
}

.character-base {
  @apply absolute inset-0 flex items-center justify-center;
}

.equipment-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.customization-layer {
  @apply absolute inset-0 pointer-events-none;
}

.level-badge {
  @apply absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md;
}

.emotion-effect {
  @apply absolute -top-1 -right-1 text-lg animate-pulse;
}

.status-effects {
  @apply absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1;
}

.status-effect {
  @apply bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
  70% { transform: translateY(-4px); }
  90% { transform: translateY(-2px); }
}

.character-avatar:hover {
  @apply scale-105;
}
</style>