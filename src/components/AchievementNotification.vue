<template>
  <teleport to="body">
    <div v-if="visible" class="achievement-notification-overlay">
      <div class="achievement-notification" :class="{ show: show }">
        <div class="notification-content">
          <div class="achievement-icon-large">
            {{ achievement?.icon || '🏆' }}
          </div>
          <div class="notification-text">
            <h2 class="notification-title">업적 달성!</h2>
            <h3 class="achievement-name">{{ achievement?.title }}</h3>
            <p class="achievement-desc">{{ achievement?.description }}</p>
          </div>
          <div class="achievement-rewards">
            <div v-if="achievement?.reward?.coins" class="reward-item">
              <span class="reward-icon">💰</span>
              <span class="reward-text">{{ achievement.reward.coins }} 코인</span>
            </div>
            <div v-if="achievement?.reward?.exp" class="reward-item">
              <span class="reward-icon">⭐</span>
              <span class="reward-text">{{ achievement.reward.exp }} 경험치</span>
            </div>
            <div v-if="achievement?.reward?.title" class="reward-item">
              <span class="reward-icon">👑</span>
              <span class="reward-text">칭호: {{ achievement.reward.title }}</span>
            </div>
          </div>
        </div>
        <button @click="close" class="close-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Achievement } from '../types'

interface Props {
  achievement: Achievement | null
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const show = ref(false)

watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    await nextTick()
    setTimeout(() => {
      show.value = true
    }, 50)
  } else {
    show.value = false
  }
})

function close() {
  show.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

// Auto close after 5 seconds
watch(() => props.visible, (visible) => {
  if (visible) {
    setTimeout(() => {
      if (props.visible) {
        close()
      }
    }, 5000)
  }
})
</script>

<style scoped>
.achievement-notification-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
  backdrop-filter: blur(4px);
}

.achievement-notification {
  @apply relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4;
  @apply transform transition-all duration-300 ease-out;
  @apply scale-75 opacity-0 translate-y-8;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e  50%, #ffd700 100%);
  border: 3px solid #f59e0b;
  box-shadow: 0 20px 40px rgba(245, 158, 11, 0.3);
}

.achievement-notification.show {
  @apply scale-100 opacity-100 translate-y-0;
}

.notification-content {
  @apply text-center space-y-4;
}

.achievement-icon-large {
  @apply text-6xl mb-4;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.notification-title {
  @apply text-2xl font-bold text-gray-800 mb-2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.achievement-name {
  @apply text-lg font-semibold text-gray-700 mb-1;
}

.achievement-desc {
  @apply text-sm text-gray-600 mb-4;
}

.achievement-rewards {
  @apply space-y-2;
}

.reward-item {
  @apply flex items-center justify-center gap-2 px-4 py-2 bg-white/50 rounded-lg;
}

.reward-icon {
  @apply text-lg;
}

.reward-text {
  @apply font-medium text-gray-700;
}

.close-button {
  @apply absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors;
  @apply text-gray-700 hover:text-gray-900;
}

/* Animation keyframes */
@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.achievement-notification::before {
  content: '';
  @apply absolute inset-0 rounded-2xl;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%);
  animation: sparkle 2s ease-in-out infinite;
}
</style>