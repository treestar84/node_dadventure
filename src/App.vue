<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMockCharacterStore } from '@/stores/mock-character'
import { useNotificationStore } from '@/stores/notification'
import CharacterLogin from '@/components/CharacterLogin.vue'
import CharacterCreation from '@/components/CharacterCreation.vue'
import GameMain from '@/components/GameMain.vue'
import AchievementNotification from '@/components/AchievementNotification.vue'

const characterStore = useMockCharacterStore()
const notificationStore = useNotificationStore()
const showCreateForm = ref(false)

onMounted(() => {
  // Check if user has a saved session (could be implemented later)
})

function switchToCreate() {
  showCreateForm.value = true
}

function switchToLogin() {
  showCreateForm.value = false
}

function onLoginSuccess() {
  // Already handled by the store
}

function onCharacterCreated() {
  // Already handled by the store
}
</script>

<template>
  <div id="app">
    <!-- Authentication Flow -->
    <div v-if="!characterStore.isLoggedIn">
      <CharacterLogin 
        v-if="!showCreateForm"
        @switch-to-create="switchToCreate"
        @login-success="onLoginSuccess"
      />
      <CharacterCreation 
        v-else
        @character-created="onCharacterCreated"
      />
      
      <!-- Toggle link -->
      <div class="fixed bottom-4 left-4">
        <button
          @click="switchToLogin"
          v-if="showCreateForm"
          class="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Login
        </button>
      </div>
    </div>

    <!-- Main Game -->
    <GameMain v-else />
    
    <!-- Achievement Notifications -->
    <AchievementNotification 
      :achievement="notificationStore.currentAchievement"
      :visible="notificationStore.showAchievementNotification"
      @close="notificationStore.closeAchievementNotification"
    />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
