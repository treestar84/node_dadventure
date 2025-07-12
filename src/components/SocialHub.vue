<template>
  <div class="social-hub">
    <!-- Social Hub Header -->
    <div class="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30 mb-4">
      <h3 class="text-lg font-bold text-white mb-3">👥 소셜</h3>
      <div class="flex gap-6">
        <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
          <span class="text-lg">👫</span>
          <span class="text-sm font-medium text-white">친구 {{ friends.length }}명</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
          <span class="text-lg">🚪</span>
          <span class="text-sm font-medium text-white">방문 {{ visitStats.totalVisitsGiven }}회</span>
        </div>
      </div>
    </div>

    <!-- Social Tabs -->
    <div class="flex gap-2 mb-4">
      <button 
        @click="activeTab = 'discover'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'discover' 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        🌍 탐색
      </button>
      <button 
        @click="activeTab = 'friends'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'friends' 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        👫 친구
        <span v-if="onlineFriends.length > 0" class="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{{ onlineFriends.length }}</span>
      </button>
      <button 
        @click="activeTab = 'visits'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'visits' 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        📖 방문 기록
      </button>
    </div>

    <!-- Discover Tab -->
    <div v-if="activeTab === 'discover'" class="tab-content">
      <!-- Search Bar -->
      <div class="flex gap-3 mb-4">
        <input
          v-model="searchTerm"
          @input="onSearch"
          placeholder="캐릭터 이름으로 검색..."
          class="flex-1 px-4 py-3 border border-gray-600/50 rounded-xl text-sm bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <button @click="refreshDiscoverable" class="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors text-gray-300 border border-gray-600/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <!-- Discoverable Characters List -->
      <div class="character-list">
        <div v-if="loading" class="text-center py-12 text-gray-400">
          <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm">캐릭터를 찾는 중...</p>
        </div>
        
        <div v-else-if="filteredCharacters.length === 0" class="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-600/30">
          <div class="text-4xl mb-3">💭</div>
          <p class="text-gray-400 text-sm">찾을 수 있는 캐릭터가 없습니다</p>
        </div>
        
        <div 
          v-else
          v-for="character in filteredCharacters" 
          :key="character.id"
          class="character-card"
        >
          <div class="character-info">
            <div class="character-avatar">
              {{ getSpeciesEmoji(character.species) }}
              <div :class="['status-indicator', character.online_status]"></div>
            </div>
            
            <div class="character-details">
              <div class="character-header">
                <h4 class="character-name">{{ character.name }}</h4>
                <div class="character-badges">
                  <span class="level-badge">Lv.{{ character.level }}</span>
                  <span v-if="character.is_friend" class="friend-badge">친구</span>
                </div>
              </div>
              
              <div class="character-meta">
                <span class="species-job">{{ formatSpecies(character.species) }} {{ formatJob(character.job) }}</span>
                <span class="popularity">⭐ {{ character.popularity_score }}</span>
              </div>
              
              <p v-if="character.public_message" class="public-message">
                "{{ character.public_message }}"
              </p>
              
              <div class="last-active">
                {{ formatLastActive(character.last_active_at) }}
              </div>
            </div>
          </div>
          
          <div class="character-actions">
            <button 
              @click="visitCharacter(character.name)"
              :disabled="visitingCharacter === character.name"
              class="action-button visit"
            >
              <span v-if="visitingCharacter === character.name">...</span>
              <span v-else>🚪 방문</span>
            </button>
            
            <button 
              v-if="!character.is_friend && character.friendship_status === 'none'"
              @click="sendFriendRequest(character.name)"
              :disabled="sendingRequest === character.name"
              class="action-button friend"
            >
              <span v-if="sendingRequest === character.name">...</span>
              <span v-else>➕ 친구 요청</span>
            </button>
            
            <span v-else-if="character.friendship_status === 'pending'" class="status-text">
              요청 중...
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Friends Tab -->
    <div v-if="activeTab === 'friends'" class="tab-content">
      <div v-if="friends.length === 0" class="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-600/30">
        <div class="text-4xl mb-3">👋</div>
        <p class="text-gray-400 text-sm mb-2">아직 친구가 없습니다</p>
        <p class="text-xs text-gray-500">탐색 탭에서 다른 캐릭터들을 찾아보세요!</p>
      </div>
      
      <div v-else class="friend-list">
        <div 
          v-for="friend in friends" 
          :key="friend.friend_id"
          class="friend-card"
        >
          <div class="friend-info">
            <div class="friend-avatar">
              {{ getSpeciesEmoji(friend.friend_species) }}
              <div :class="['status-indicator', friend.online_status]"></div>
            </div>
            
            <div class="friend-details">
              <h4 class="friend-name">{{ friend.friend_name }}</h4>
              <div class="friend-meta">
                <span class="species-job">{{ formatSpecies(friend.friend_species) }} {{ formatJob(friend.friend_job) }}</span>
                <span class="level">Lv.{{ friend.friend_level }}</span>
              </div>
              <div class="friendship-date">
                친구 since {{ formatDate(friend.friendship_created_at) }}
              </div>
            </div>
          </div>
          
          <div class="friend-actions">
            <button 
              @click="visitCharacter(friend.friend_name)"
              :disabled="visitingCharacter === friend.friend_name"
              class="action-button visit"
            >
              <span v-if="visitingCharacter === friend.friend_name">...</span>
              <span v-else>🚪 방문</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Visits Tab -->
    <div v-if="activeTab === 'visits'" class="tab-content">
      <div v-if="recentVisits.length === 0" class="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-600/30">
        <div class="text-4xl mb-3">📝</div>
        <p class="text-gray-400 text-sm">아직 방문 기록이 없습니다</p>
      </div>
      
      <div v-else class="visit-list">
        <div 
          v-for="visit in recentVisits" 
          :key="visit.id"
          class="visit-card"
        >
          <div class="visit-info">
            <div class="visit-icon">
              {{ visit.visit_type === 'greeting' ? '👋' : visit.visit_type === 'play' ? '🎮' : visit.visit_type === 'help' ? '🤝' : '🚪' }}
            </div>
            
            <div class="visit-details">
              <div v-if="visit.visitor_id === currentCharacter?.id" class="visit-description">
                <strong>{{ visit.visited?.name }}</strong>을(를) 방문했습니다
              </div>
              <div v-else class="visit-description">
                <strong>{{ visit.visitor?.name }}</strong>이(가) 방문했습니다
              </div>
              
              <div class="visit-meta">
                <span class="visit-time">{{ formatVisitTime(visit.visited_at) }}</span>
                <span class="visit-type-badge">{{ formatVisitType(visit.visit_type) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSocialStore } from '../stores/social'
import { useCharacterStore } from '../stores/character'
import { useNotificationStore } from '../stores/notification'

const socialStore = useSocialStore()
const characterStore = useCharacterStore()
const notificationStore = useNotificationStore()

const activeTab = ref('discover')
const searchTerm = ref('')
const visitingCharacter = ref<string | null>(null)
const sendingRequest = ref<string | null>(null)
const visitStats = ref({ totalVisitsGiven: 0, totalVisitsReceived: 0, popularityScore: 0 })

const currentCharacter = computed(() => characterStore.currentCharacter)
const loading = computed(() => socialStore.loading)
const discoverableCharacters = computed(() => socialStore.discoverableCharacters)
const friends = computed(() => socialStore.friends)
const onlineFriends = computed(() => socialStore.onlineFriends)
const recentVisits = computed(() => socialStore.recentVisits)

const filteredCharacters = computed(() => {
  if (!searchTerm.value.trim()) {
    return discoverableCharacters.value
  }
  return discoverableCharacters.value.filter(char =>
    char.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

async function refreshDiscoverable() {
  if (currentCharacter.value) {
    await socialStore.loadDiscoverableCharacters(currentCharacter.value.id)
  }
}

async function onSearch() {
  if (currentCharacter.value) {
    const results = await socialStore.searchCharacters(currentCharacter.value.id, searchTerm.value)
    // Update the displayed characters with search results
  }
}

async function visitCharacter(characterName: string) {
  if (!currentCharacter.value || visitingCharacter.value) return
  
  visitingCharacter.value = characterName
  
  try {
    const result = await socialStore.visitCharacter(
      currentCharacter.value.id,
      characterName,
      'casual',
      { message: 'Hello! Nice to meet you!' }
    )
    
    if (result.success) {
      // Show success notification
      console.log('✅ Visit successful:', result.message)
      
      // Refresh data
      await refreshDiscoverable()
      await loadVisitStats()
    } else {
      console.error('❌ Visit failed:', result.error)
    }
  } catch (error) {
    console.error('Error visiting character:', error)
  } finally {
    visitingCharacter.value = null
  }
}

async function sendFriendRequest(characterName: string) {
  if (!currentCharacter.value || sendingRequest.value) return
  
  sendingRequest.value = characterName
  
  try {
    const result = await socialStore.sendFriendRequest(currentCharacter.value.id, characterName)
    
    if (result.success) {
      console.log('✅ Friend request sent:', result.message)
    } else {
      console.error('❌ Friend request failed:', result.error)
    }
  } catch (error) {
    console.error('Error sending friend request:', error)
  } finally {
    sendingRequest.value = null
  }
}

async function loadVisitStats() {
  if (currentCharacter.value) {
    visitStats.value = await socialStore.getVisitStatistics(currentCharacter.value.id)
  }
}

function getSpeciesEmoji(species: string): string {
  const emojis = {
    cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹',
    bird: '🐦', fish: '🐠', turtle: '🐢', fox: '🦊'
  }
  return emojis[species as keyof typeof emojis] || '🐾'
}

function formatSpecies(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

function formatJob(job: string): string {
  return job.charAt(0).toUpperCase() + job.slice(1)
}

function formatLastActive(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) {
    return `${diffMins}분 전 활동`
  } else if (diffHours < 24) {
    return `${diffHours}시간 전 활동`
  } else {
    return `${diffDays}일 전 활동`
  }
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatVisitTime(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatVisitType(type: string): string {
  const types = {
    casual: '일반 방문',
    greeting: '인사',
    play: '놀이',
    help: '도움'
  }
  return types[type as keyof typeof types] || '방문'
}

// Watch for tab changes to load appropriate data
watch(activeTab, async (newTab) => {
  if (!currentCharacter.value) return
  
  switch (newTab) {
    case 'discover':
      await socialStore.loadDiscoverableCharacters(currentCharacter.value.id)
      break
    case 'friends':
      await socialStore.loadFriends(currentCharacter.value.id)
      break
    case 'visits':
      await socialStore.loadRecentVisits(currentCharacter.value.id)
      break
  }
})

onMounted(async () => {
  if (currentCharacter.value) {
    // Update activity status to online
    await socialStore.updateActivityStatus(currentCharacter.value.id, 'online')
    
    // Load initial data
    await socialStore.loadDiscoverableCharacters(currentCharacter.value.id)
    await socialStore.loadFriends(currentCharacter.value.id)
    await loadVisitStats()
  }
})
</script>

<style scoped>
.social-hub {
  @apply bg-transparent;
  padding: 0;
  height: 100%;
  overflow-y: auto;
  border: none;
  box-shadow: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.social-header {
  @apply mb-3;
}

.section-title {
  @apply text-base font-bold text-white mb-1;
}

.social-stats {
  @apply flex gap-4;
}

.stat-item {
  @apply flex items-center gap-1 text-sm text-gray-300;
}

.stat-icon {
  @apply text-base;
}

.social-tabs {
  @apply flex gap-1 mb-3;
}

.tab-button {
  @apply px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 border relative;
  @apply bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600;
}

.tab-button.active {
  @apply bg-blue-600 text-white border-blue-500 shadow-md;
}

.online-indicator {
  @apply absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center;
}

.tab-content {
  @apply space-y-3;
}

.search-bar {
  @apply flex gap-2;
}

.search-input {
  @apply flex-1 px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.refresh-button {
  @apply p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300;
}

.character-list, .friend-list, .visit-list {
  @apply space-y-2 max-h-80 overflow-y-auto;
}

.character-card, .friend-card {
  @apply flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600;
  @apply hover:shadow-md transition-all duration-200;
}

.character-info, .friend-info {
  @apply flex items-start gap-3 flex-1;
}

.character-avatar, .friend-avatar {
  @apply relative text-2xl flex-shrink-0;
}

.status-indicator {
  @apply absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white;
}

.status-indicator.online {
  @apply bg-green-500;
}

.status-indicator.away {
  @apply bg-yellow-500;
}

.status-indicator.offline {
  @apply bg-gray-400;
}

.character-details, .friend-details {
  @apply flex-1 min-w-0;
}

.character-header {
  @apply flex items-center justify-between mb-1;
}

.character-name, .friend-name {
  @apply font-semibold text-white text-sm;
}

.character-badges {
  @apply flex gap-1;
}

.level-badge {
  @apply text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full;
}

.friend-badge {
  @apply text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full;
}

.character-meta, .friend-meta {
  @apply flex items-center justify-between text-xs text-gray-300 mb-1;
}

.public-message {
  @apply text-xs italic text-gray-400 mb-1;
}

.last-active, .friendship-date {
  @apply text-xs text-gray-400;
}

.character-actions, .friend-actions {
  @apply flex flex-col gap-2;
}

.action-button {
  @apply px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200;
}

.action-button.visit {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50;
}

.action-button.friend {
  @apply bg-green-500 text-white hover:bg-green-600 disabled:opacity-50;
}

.status-text {
  @apply text-xs text-gray-500 text-center;
}

.visit-card {
  @apply flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600;
}

.visit-icon {
  @apply text-xl flex-shrink-0;
}

.visit-details {
  @apply flex-1;
}

.visit-description {
  @apply text-sm text-white mb-1;
}

.visit-meta {
  @apply flex items-center gap-2 text-xs text-gray-400;
}

.visit-type-badge {
  @apply bg-gray-700 text-gray-300 px-2 py-1 rounded-full;
}

.loading-state, .empty-state {
  @apply text-center py-8 text-gray-400;
}

.spinner {
  @apply w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2;
}

.hint {
  @apply text-xs mt-1 text-gray-400;
}
</style>