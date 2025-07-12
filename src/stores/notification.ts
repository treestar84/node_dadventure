import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Achievement } from '../types'

export const useNotificationStore = defineStore('notification', () => {
  const currentAchievement = ref<Achievement | null>(null)
  const showAchievementNotification = ref(false)
  const notificationQueue = ref<Achievement[]>([])

  function showAchievement(achievement: Achievement) {
    notificationQueue.value.push(achievement)
    processQueue()
  }

  function processQueue() {
    if (showAchievementNotification.value || notificationQueue.value.length === 0) {
      return
    }

    const nextAchievement = notificationQueue.value.shift()
    if (nextAchievement) {
      currentAchievement.value = nextAchievement
      showAchievementNotification.value = true
    }
  }

  function closeAchievementNotification() {
    showAchievementNotification.value = false
    currentAchievement.value = null
    
    // Process next in queue after a short delay
    setTimeout(() => {
      processQueue()
    }, 500)
  }

  return {
    currentAchievement,
    showAchievementNotification,
    showAchievement,
    closeAchievementNotification
  }
})