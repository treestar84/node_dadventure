<template>
  <div class="game-container">
    <!-- Modern Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="logo">Dadventure</h1>
          <div class="player-badge">
            <span class="player-name">{{ character?.name }}</span>
            <span class="level-indicator">Level {{ character?.level }}</span>
          </div>
        </div>
        
        <!-- Navigation Menu -->
        <nav class="navigation-menu">
          <button 
            v-for="menu in menuItems" 
            :key="menu.id"
            @click="activeMenu = menu.id"
            :class="['nav-button', { active: activeMenu === menu.id }]"
          >
            <span class="nav-icon">{{ menu.icon }}</span>
            <span class="nav-label">{{ menu.label }}</span>
          </button>
        </nav>
        
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
      <!-- Left Panel: Dynamic Content -->
      <div class="panel left-panel">
        <!-- Character Stats (Home) -->
        <div v-if="activeMenu === 'home'" class="panel-content home-content">
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

          <!-- Resources -->
          <div class="resources-section">
            <h3>Resources</h3>
            
            <!-- Food Counters -->
            <div class="food-counters">
              <div class="food-counter">
                <span class="food-icon">🐛</span>
                <span class="food-count">{{ smallFoodCount }}</span>
                <span class="food-label">Small Food</span>
              </div>
              <div class="food-counter">
                <span class="food-icon">🍖</span>
                <span class="food-count">{{ largeFoodCount }}</span>
                <span class="food-label">Large Food</span>
              </div>
              <div class="food-counter">
                <span class="food-icon">📦</span>
                <span class="food-count">{{ availableBoxes.length }}</span>
                <span class="food-label">Boxes</span>
              </div>
            </div>
            
            <!-- Food Grid -->
            <div class="resource-grid">
              <!-- Large Food Items -->
              <button
                v-for="food in availableFood.filter(f => f.type === 'large')"
                :key="food.id"
                @click="useFood(food.id)"
                class="resource-item available large-food"
              >
                <div class="resource-icon">🍖</div>
                <span>Large Food</span>
              </button>
              
              <!-- Small Food Items (show up to 10) -->
              <button
                v-for="food in availableFood.filter(f => f.type === 'small').slice(0, 10)"
                :key="food.id"
                @click="useFood(food.id)"
                class="resource-item available small-food"
              >
                <div class="resource-icon">🐛</div>
                <span>Small Food</span>
              </button>
              
              <!-- Empty slots -->
              <div 
                v-for="n in Math.max(0, 10 - availableFood.length)" 
                :key="'empty-' + n"
                class="resource-item empty"
              >
                <div class="resource-icon">⭕</div>
                <span>Empty</span>
              </div>
            </div>
            
            <!-- Box Section -->
            <div v-if="availableBoxes.length > 0" class="box-section">
              <h4>Mystery Boxes</h4>
              <div class="box-grid">
                <button
                  v-for="box in availableBoxes"
                  :key="box.id"
                  @click="openBox(box.id)"
                  class="box-item-standalone"
                >
                  <div class="box-icon">📦</div>
                  <span>Open Box</span>
                </button>
              </div>
            </div>
            
            <div class="resource-info">
              <p>Small food generates every 30 minutes</p>
              <p>10 small foods = 1 large food</p>
              <p v-if="bugStore.timeUntilNextFood > 0" class="timer-info">
                Next food in: {{ formatTime(bugStore.timeUntilNextFood) }}
              </p>
              <p class="storage-info">
                Storage: {{ smallFoodCount }}/100 small foods ({{ Math.round(storageUsage) }}% full)
              </p>
              <p class="storage-info">
                Total Food: {{ totalFoodCapacity }} items
              </p>
            </div>
          </div>
        </div>

        <!-- Stats Panel (Stats) -->
        <div v-else-if="activeMenu === 'stats'" class="panel-content stats-content">
          <div class="panel-header">
            <h2>Character Stats</h2>
            <p class="available-points" v-if="availableStatPoints > 0">
              Available Points: {{ availableStatPoints }}
            </p>
          </div>
          
          <!-- Basic Stats -->
          <div class="stats-section">
            <h3>Combat Stats</h3>
            <div class="stat-list">
              <div v-for="stat in combatStats" :key="stat" class="stat-item">
                <span class="stat-name">{{ formatStatName(stat) }}</span>
                <div class="stat-controls">
                  <span class="stat-value">{{ character?.stats[stat] }}</span>
                  <button 
                    v-if="availableStatPoints > 0"
                    @click="increaseStat(stat)"
                    class="stat-button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Personality Stats -->
          <div class="stats-section">
            <h3>Personality Traits</h3>
            <div class="stat-list">
              <div v-for="stat in personalityStats" :key="stat" class="stat-item">
                <span class="stat-name">{{ formatStatName(stat) }}</span>
                <div class="stat-controls">
                  <span class="stat-value">{{ character?.stats[stat] }}</span>
                  <button 
                    v-if="availableStatPoints > 0"
                    @click="increaseStat(stat)"
                    class="stat-button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quest Panel (Quests) -->
        <div v-else-if="activeMenu === 'quests'" class="panel-content quests-content">
          <QuestPanel 
            v-if="character?.id" 
            :character-id="character.id" 
            @quest-completed="handleQuestCompleted"
            @quest-selected="handleQuestSelected"
          />
        </div>

        <!-- Achievement Stats (Achievements) -->
        <div v-else-if="activeMenu === 'achievements'" class="panel-content achievements-content">
          <div class="panel-header">
            <h2>Achievement Progress</h2>
          </div>
          
          <div class="achievement-summary-card">
            <div class="summary-row">
              <span class="summary-label">Total Achievements:</span>
              <span class="summary-value">{{ achievementStats.unlockedAchievements }}/{{ achievementStats.totalAchievements }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Completion Rate:</span>
              <span class="summary-value">{{ achievementStats.completionRate }}%</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Points:</span>
              <span class="summary-value achievement-points">{{ achievementStats.totalPoints }}</span>
            </div>
          </div>

          <!-- Next Achievements -->
          <div class="next-achievements-section">
            <h3>Next Targets</h3>
            <div class="next-achievement-list">
              <div 
                v-for="next in nextAchievements.slice(0, 3)" 
                :key="next.definition.key"
                class="next-achievement-item"
              >
                <span class="achievement-icon">{{ next.definition.icon || '🏆' }}</span>
                <div class="achievement-info">
                  <div class="achievement-title">{{ next.definition.title }}</div>
                  <div class="achievement-progress-bar">
                    <div class="progress-fill" :style="{ width: next.progress + '%' }"></div>
                  </div>
                  <div class="achievement-progress-text">{{ Math.round(next.progress) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Social Stats (Social) -->
        <div v-else-if="activeMenu === 'social'" class="panel-content social-content">
          <div class="panel-header">
            <h2>Social Overview</h2>
          </div>
          
          <div class="social-stats-grid">
            <div class="social-stat-card">
              <div class="stat-icon">👫</div>
              <div class="stat-info">
                <div class="stat-number">{{ friends.length }}</div>
                <div class="stat-label">Friends</div>
              </div>
            </div>
            
            <div class="social-stat-card">
              <div class="stat-icon">🌟</div>
              <div class="stat-info">
                <div class="stat-number">{{ onlineFriends.length }}</div>
                <div class="stat-label">Online</div>
              </div>
            </div>
            
            <div class="social-stat-card">
              <div class="stat-icon">🚪</div>
              <div class="stat-info">
                <div class="stat-number">{{ visitStats.totalVisitsGiven }}</div>
                <div class="stat-label">Visits Given</div>
              </div>
            </div>
            
            <div class="social-stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-number">{{ visitStats.totalVisitsReceived }}</div>
                <div class="stat-label">Visitors</div>
              </div>
            </div>
          </div>

          <!-- Quick Friend List -->
          <div class="quick-friends-section">
            <h3>Online Friends</h3>
            <div v-if="onlineFriends.length === 0" class="empty-state">
              <p>No friends online</p>
            </div>
            <div v-else class="friend-quick-list">
              <div 
                v-for="friend in onlineFriends.slice(0, 3)" 
                :key="friend.friend_id"
                class="friend-quick-item"
              >
                <span class="friend-avatar">{{ getSpeciesEmoji(friend.friend_species) }}</span>
                <div class="friend-info">
                  <div class="friend-name">{{ friend.friend_name }}</div>
                  <div class="friend-level">Level {{ friend.friend_level }}</div>
                </div>
                <div class="friend-status online"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Knowledge Seeds Stats (Seeds) -->
        <div v-else-if="activeMenu === 'seeds'" class="panel-content seeds-content">
          <div class="panel-header">
            <h2>Knowledge Garden</h2>
          </div>
          
          <div class="seeds-stats-grid">
            <div class="seed-stat-card">
              <div class="stat-icon">🌱</div>
              <div class="stat-info">
                <div class="stat-number">{{ seedStats.totalSeeds }}</div>
                <div class="stat-label">Total Seeds</div>
              </div>
            </div>
            
            <div class="seed-stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-info">
                <div class="stat-number">{{ seedStats.mySeeds }}</div>
                <div class="stat-label">My Seeds</div>
              </div>
            </div>
            
            <div class="seed-stat-card">
              <div class="stat-icon">💧</div>
              <div class="stat-info">
                <div class="stat-number">{{ seedStats.totalComments }}</div>
                <div class="stat-label">Comments</div>
              </div>
            </div>
            
            <div class="seed-stat-card">
              <div class="stat-icon">🌳</div>
              <div class="stat-info">
                <div class="stat-number">{{ seedStats.avgTreeSize }}</div>
                <div class="stat-label">Avg Tree Size</div>
              </div>
            </div>
          </div>

          <!-- Knowledge Tips -->
          <div class="knowledge-tips-section">
            <h3>Knowledge Tips</h3>
            <div class="tip-list">
              <div class="tip-item">
                <span class="tip-icon">💡</span>
                <div class="tip-content">
                  <div class="tip-title">Share Your Knowledge</div>
                  <div class="tip-subtitle">Plant seeds to help others</div>
                </div>
              </div>
              <div class="tip-item">
                <span class="tip-icon">💧</span>
                <div class="tip-content">
                  <div class="tip-title">Water Others' Seeds</div>
                  <div class="tip-subtitle">Comment to help them grow</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Panel: Character Display -->
      <div class="panel character-panel">
        <!-- Character Profile -->
        <div class="character-profile-section">
          <div class="character-avatar-large">
            <div class="character-sprite">
              {{ getSpeciesEmoji(character?.species) }}
            </div>
            <div class="level-badge">{{ character?.level }}</div>
          </div>
          
          <div class="character-info-card">
            <h3 class="character-name">{{ character?.name }}</h3>
            <p class="character-details">{{ formatJobName(character?.job) }} • {{ formatSpeciesName(character?.species) }}</p>
          </div>
        </div>

        <div class="character-stage">
          <div class="character-status">
            <div class="status-bubble">
              <p>{{ currentMessage }}</p>
            </div>
            
            <!-- Large Food Animation -->
            <div v-if="showLargeFoodAnimation" class="large-food-animation">
              <div class="animation-text">🍖 Large Food!</div>
              <div class="animation-subtext">10 Actions in Progress...</div>
              <div class="action-counter">
                <span v-for="i in 10" :key="i" class="action-dot" :style="{ animationDelay: (i * 0.1) + 's' }">•</span>
              </div>
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

      <!-- Right Panel: Dynamic Content -->
      <div class="panel right-panel">
        <!-- Quick Actions (Home) -->
        <div v-if="activeMenu === 'home'" class="panel-content home-content">
          <div class="panel-header">
            <h2>Quick Actions</h2>
          </div>
          
          <div class="quick-actions-grid">
            <button @click="activeMenu = 'stats'" class="quick-action-card">
              <div class="action-icon">📊</div>
              <div class="action-title">Stats</div>
              <div class="action-subtitle">{{ availableStatPoints }} points available</div>
            </button>
            
            <button @click="activeMenu = 'achievements'" class="quick-action-card">
              <div class="action-icon">🏆</div>
              <div class="action-title">Achievements</div>
              <div class="action-subtitle">{{ achievementStats.unlockedAchievements }}/{{ achievementStats.totalAchievements }}</div>
            </button>
            
            <button @click="activeMenu = 'social'" class="quick-action-card">
              <div class="action-icon">👥</div>
              <div class="action-title">Social</div>
              <div class="action-subtitle">{{ onlineFriends.length }} friends online</div>
            </button>
          </div>

          <!-- Character Profile Card -->
          <div class="character-summary-card">
            <h3>Character Summary</h3>
            <div class="summary-stats">
              <div class="summary-stat">
                <span class="summary-label">Experience:</span>
                <span class="summary-value">{{ character?.exp?.toLocaleString() }}</span>
              </div>
              <div class="summary-stat">
                <span class="summary-label">Coins:</span>
                <span class="summary-value">{{ character?.coins?.toLocaleString() }}</span>
              </div>
              <div class="summary-stat">
                <span class="summary-label">Age:</span>
                <span class="summary-value">{{ character?.age }} days</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stat Management (Stats) -->
        <div v-else-if="activeMenu === 'stats'" class="panel-content stats-content">
          <div class="panel-header">
            <h2>Stat Management</h2>
            <div v-if="availableStatPoints > 0" class="points-badge">
              {{ availableStatPoints }} available
            </div>
          </div>
          
          <!-- Stat Distribution Chart -->
          <div class="stat-distribution">
            <h3>Stat Distribution</h3>
            <div class="stat-bars">
              <div v-for="stat in [...combatStats, ...personalityStats]" :key="stat" class="stat-bar-item">
                <div class="stat-bar-info">
                  <span class="stat-bar-name">{{ formatStatName(stat).slice(0, 3) }}</span>
                  <span class="stat-bar-value">{{ character?.stats[stat] }}</span>
                </div>
                <div class="stat-bar">
                  <div 
                    class="stat-bar-fill" 
                    :style="{ width: Math.min(100, (character?.stats[stat] || 0) * 2) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stat Recommendations -->
          <div class="stat-recommendations">
            <h3>Recommendations</h3>
            <div class="recommendation-list">
              <div class="recommendation-item">
                <span class="rec-icon">⚔️</span>
                <div class="rec-content">
                  <div class="rec-title">Combat Focus</div>
                  <div class="rec-subtitle">Boost STR, VIT for {{ character?.job }}</div>
                </div>
              </div>
              <div class="recommendation-item">
                <span class="rec-icon">🧠</span>
                <div class="rec-content">
                  <div class="rec-title">Balanced Growth</div>
                  <div class="rec-subtitle">Even distribution recommended</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quest Detail Panel (Quests) -->
        <div v-else-if="activeMenu === 'quests'" class="panel-content quests-content">
          <QuestDetailPanel 
            :selected-quest="selectedQuest"
            :can-accept-more-quests="questStore.canAcceptMoreQuests"
            @accept-quest="handleAcceptQuest"
            @reject-quest="handleRejectQuest"
            @complete-quest="handleCompleteQuest"
            @quest-selected="handleQuestSelected"
          />
        </div>

        <!-- Achievement Details (Achievements) -->
        <div v-else-if="activeMenu === 'achievements'" class="panel-content achievements-content">
          <AchievementPanel />
        </div>

        <!-- Social Hub (Social) -->
        <div v-else-if="activeMenu === 'social'" class="panel-content social-content">
          <SocialHub />
        </div>

        <!-- Knowledge Seeds (Seeds) -->
        <div v-else-if="activeMenu === 'seeds'" class="panel-content seeds-content">
          <KnowledgeSeeds />
        </div>
      </div>
    </div>
  </div>

  <!-- Reward Animation Overlay -->
  <div v-if="showRewardAnimation" class="reward-animation-overlay">
    <div class="reward-animation" :class="rewardType">
      <div class="reward-icon">
        <span v-if="rewardType === 'coins'">💰</span>
        <span v-else-if="rewardType === 'box'">📦</span>
      </div>
      <div class="reward-text">
        <div class="reward-title">
          <span v-if="rewardType === 'coins'">Coins Earned!</span>
          <span v-else-if="rewardType === 'box'">Box Found!</span>
        </div>
        <div class="reward-amount">
          <span v-if="rewardType === 'coins'">+{{ rewardAmount }}</span>
          <span v-else-if="rewardType === 'box'">+1 Box</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSupabaseCharacterStore } from '@/stores/supabase-character'
import { useSupabaseFoodStore } from '@/stores/supabase-food'
import { useQuestStore } from '@/stores/quest'
import { useAchievementStore } from '@/stores/achievement'
import { useSocialStore } from '@/stores/social'
import { useSeedStore } from '@/stores/seed'
import { EMOTION_OPTIONS, type Species, type Job, type Bug, type Quest } from '@/types'
import AchievementPanel from './AchievementPanel.vue'
import QuestPanel from './QuestPanel.vue'
import QuestDetailPanel from './QuestDetailPanel.vue'
import SocialHub from './SocialHub.vue'
import KnowledgeSeeds from './KnowledgeSeeds.vue'

const characterStore = useSupabaseCharacterStore()
const bugStore = useSupabaseFoodStore()
const questStore = useQuestStore()
const achievementStore = useAchievementStore()
const socialStore = useSocialStore()
const seedStore = useSeedStore()

// Menu state
const activeMenu = ref('home')

// Menu configuration
const menuItems = ref([
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'quests', label: 'Quests', icon: '⚔️' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'seeds', label: 'Knowledge', icon: '🌱' }
])

// Stat arrays for easier iteration
const combatStats = ['str', 'dex', 'int', 'vit', 'agi', 'luk']
const personalityStats = ['playfulness', 'curiosity', 'sensitivity', 'awareness', 'meddling', 'pragmatism', 'appetite', 'anger_control', 'clumsiness']

// Visit statistics
const visitStats = ref({ totalVisitsGiven: 0, totalVisitsReceived: 0, popularityScore: 0 })

const character = computed(() => characterStore.currentCharacter)
const availableStatPoints = computed(() => characterStore.availableStatPoints)
const availableFood = computed(() => bugStore.availableFood)
const availableBoxes = computed(() => bugStore.availableBoxes)
const smallFoodCount = computed(() => bugStore.smallFoodCount)
const largeFoodCount = computed(() => bugStore.largeFoodCount)
const totalFoodCapacity = computed(() => bugStore.totalFoodCapacity)
const storageUsage = computed(() => bugStore.storageUsage)
const achievementStats = computed(() => achievementStore.achievementStats)
const friends = computed(() => socialStore.friends)
const onlineFriends = computed(() => socialStore.onlineFriends)
const seedStats = computed(() => seedStore.seedStats)
const nextAchievements = computed(() => {
  if (!character.value) return []
  return achievementStore.getNextAchievements(character.value, 3)
})

const currentMessage = ref('')
const messageInterval = ref<NodeJS.Timeout | null>(null)
const selectedQuest = ref<Quest | null>(null)

// 보상 연출 상태
const showRewardAnimation = ref(false)
const rewardType = ref<'coins' | 'box' | null>(null)
const rewardAmount = ref(0)
const rewardAnimationTimer = ref<NodeJS.Timeout | null>(null)

// Large food 연출 상태
const showLargeFoodAnimation = ref(false)
const largeFoodAnimationTimer = ref<NodeJS.Timeout | null>(null)

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
    bugStore.loadFood(character.value.id)
    await questStore.loadQuests(character.value.id)
    await achievementStore.loadAchievements(character.value.id)
    await socialStore.loadFriends(character.value.id)
    await socialStore.updateActivityStatus(character.value.id, 'online')
    await seedStore.loadSeeds(character.value.id)
    
    // Load visit statistics
    visitStats.value = await socialStore.getVisitStatistics(character.value.id)
  }
  generateMessage()
  startMessageRotation()
})

onUnmounted(() => {
  if (messageInterval.value) {
    clearInterval(messageInterval.value)
  }
  if (rewardAnimationTimer.value) {
    clearTimeout(rewardAnimationTimer.value)
  }
  if (largeFoodAnimationTimer.value) {
    clearTimeout(largeFoodAnimationTimer.value)
  }
  bugStore.unloadFood()
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
    str: 'STR', dex: 'DEX', int: 'INT',
    vit: 'VIT', agi: 'AGI', luk: 'LUK',
    playfulness: 'Play', curiosity: 'Curious',
    sensitivity: 'Sensitive', awareness: 'Aware',
    meddling: 'Meddle', pragmatism: 'Pragma',
    appetite: 'Appetite', anger_control: 'Anger',
    clumsiness: 'Clumsy'
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

async function useFood(foodId: string) {
  if (!character.value) return
  
  const result = await bugStore.useFood(foodId, character.value.id)
  
  if (result.success) {
    // 경험치 획득
    if (result.expGained) {
      await characterStore.gainExperience(result.expGained)
    }
    
    // 코인 획득
    if (result.coinsGained) {
      await characterStore.spendCoins(-result.coinsGained) // 음수로 전달하여 코인 증가
    }
    
    // 상자 획득 (이미 store에서 처리됨)
    
    // 메시지 생성
    let message = ''
    if (result.isLargeFood) {
      message = `Large food used! Gained ${result.expGained} experience points (${result.totalActions} actions)!`
    } else {
      message = `Gained ${result.expGained} experience points!`
    }
    
    if (result.coinsGained) {
      message += ` +${result.coinsGained} coins!`
    }
    if (result.boxGained) {
      message += ` +1 box!`
    }
    
    // Large food 사용 시 특별한 연출
    if (result.isLargeFood) {
      console.log('Large food used! Results:', result)
      // 캐릭터 애니메이션 효과
      showLargeFoodAnimation.value = true
      
      // 2초 후 애니메이션 종료
      if (largeFoodAnimationTimer.value) {
        clearTimeout(largeFoodAnimationTimer.value)
      }
      largeFoodAnimationTimer.value = setTimeout(() => {
        showLargeFoodAnimation.value = false
      }, 2000)
      
      // 캐릭터 애니메이션 효과 (메시지로 표현)
      generateMessage('🍖 Large food consumed! Processing 10 actions...')
      
      // 잠시 후 최종 결과 메시지
      setTimeout(() => {
        generateMessage(message)
      }, 1500)
      
      // 보상 애니메이션 (라지 먹이용 특별 버전) - 라지 먹이 애니메이션 후에 표시
      if (result.coinsGained || result.boxGained) {
        setTimeout(() => {
          showRewardAnimation.value = true
          rewardType.value = result.coinsGained ? 'coins' : 'box'
          rewardAmount.value = result.coinsGained || 1
          
          // 3초 후 애니메이션 숨김
          if (rewardAnimationTimer.value) {
            clearTimeout(rewardAnimationTimer.value)
          }
          rewardAnimationTimer.value = setTimeout(() => {
            showRewardAnimation.value = false
            rewardType.value = null
            rewardAmount.value = 0
          }, 3000)
        }, 2000) // 라지 먹이 애니메이션 완료 후
      }
    } else {
      // 작은 먹이용 보상 애니메이션
      if (result.coinsGained) {
        showRewardAnimation.value = true
        rewardType.value = 'coins'
        rewardAmount.value = result.coinsGained
        
        // 3초 후 애니메이션 숨김
        if (rewardAnimationTimer.value) {
          clearTimeout(rewardAnimationTimer.value)
        }
        rewardAnimationTimer.value = setTimeout(() => {
          showRewardAnimation.value = false
          rewardType.value = null
          rewardAmount.value = 0
        }, 3000)
      }
      
      if (result.boxGained) {
        showRewardAnimation.value = true
        rewardType.value = 'box'
        rewardAmount.value = 1
        
        // 3초 후 애니메이션 숨김
        if (rewardAnimationTimer.value) {
          clearTimeout(rewardAnimationTimer.value)
        }
        rewardAnimationTimer.value = setTimeout(() => {
          showRewardAnimation.value = false
          rewardType.value = null
          rewardAmount.value = 0
        }, 3000)
      }
      
      generateMessage(message)
    }
  }
}

async function openBox(boxId: string) {
  if (!character.value) return
  
  const result = await bugStore.openBox(boxId, character.value.id)
  
  if (result.success) {
    generateMessage(result.message || 'Box opened!')
  } else {
    generateMessage(result.message || 'Failed to open box')
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

function handleQuestCompleted(event: { message: string }) {
  generateMessage(event.message)
}

function handleQuestSelected(quest: Quest) {
  selectedQuest.value = quest
}

async function handleAcceptQuest(questId: string) {
  if (character.value?.id) {
    await questStore.acceptQuest(questId, character.value.id)
    // 선택된 퀘스트 업데이트
    const updatedQuest = questStore.acceptedQuests.find(q => q.id === questId) ||
                        questStore.receivedQuests.find(q => q.id === questId)
    if (updatedQuest) {
      selectedQuest.value = updatedQuest
    }
  }
}

async function handleRejectQuest(questId: string) {
  if (character.value?.id) {
    await questStore.rejectQuest(questId, character.value.id)
    // 선택된 퀘스트를 null로 설정
    selectedQuest.value = null
  }
}

async function handleCompleteQuest(questId: string) {
  if (character.value?.id) {
    const success = await questStore.completeQuest(questId, character.value.id)
    if (success) {
      generateMessage('퀘스트 완료! 먹이 보상을 받았습니다!')
      // 선택된 퀘스트 업데이트
      const updatedQuest = questStore.completedQuests.find(q => q.id === questId)
      if (updatedQuest) {
        selectedQuest.value = updatedQuest
      }
    }
  }
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

/* Navigation Menu */
.navigation-menu {
  display: flex;
  gap: 0.5rem;
}

.nav-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  color: #888888;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #4a4a4a;
  color: #cccccc;
}

.nav-button.active {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Dashboard */
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 380px 1fr 380px;
  gap: 2rem;
  align-items: stretch;
  min-height: calc(100vh - 8rem);
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
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem;
}

.stat-card {
  padding: 0.5rem;
  background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%);
  border: 1px solid #3a3a3a;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  text-align: center;
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
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.125rem;
}

.stat-label {
  font-size: 0.625rem;
  color: #888888;
  margin-bottom: 0.5rem;
}

.stat-progress {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  padding: 0.75rem;
  border-top: 1px solid #2a2a2a;
  margin-top: 0.5rem;
}

.resources-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.resource-item {
  padding: 0.5rem;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.625rem;
  color: #888888;
  min-height: 60px;
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
  font-size: 1rem;
}

.resource-info {
  margin: 0;
  font-size: 0.625rem;
  color: #666666;
  text-align: center;
  line-height: 1.2;
}

.resource-info p {
  margin: 0 0 0.25rem 0;
  font-size: 0.625rem;
}

.timer-info {
  margin: 0;
  font-size: 0.625rem;
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

/* Dynamic Panel Content Styles */
.panel-content {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* Home menu - no scroll needed */
.panel-content.home-content {
  overflow: hidden;
}

/* Stats menu - no scroll needed */
.panel-content.stats-content {
  overflow: hidden;
}

/* Achievements menu - scroll needed for long lists */
.panel-content.achievements-content {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.panel-content.achievements-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content.achievements-content::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.panel-content.achievements-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.panel-content.achievements-content::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Social menu - scroll needed for long lists */
.panel-content.social-content {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.panel-content.social-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content.social-content::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.panel-content.social-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.panel-content.social-content::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Seeds menu - scroll needed for long lists */
.panel-content.seeds-content {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.panel-content.seeds-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content.seeds-content::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.panel-content.seeds-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.panel-content.seeds-content::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Stats sections */
.stats-section {
  margin-bottom: 0.75rem;
}

.stats-section h3 {
  font-size: 0.75rem;
  margin-bottom: 0.375rem;
  color: #ffffff;
  font-weight: 600;
}

.stat-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.125rem 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem 0;
  font-size: 0.625rem;
}

.stat-name {
  color: #cccccc;
  font-size: 0.625rem;
  flex: 1;
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.stat-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.stat-value {
  color: #ffffff;
  font-weight: 600;
  min-width: 16px;
  text-align: right;
  font-size: 0.625rem;
}

.stat-button {
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 0.125rem;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  cursor: pointer;
  line-height: 1;
}

.stat-button:hover {
  background: #357abd;
}

/* Component Content Styles - for embedded components */
.panel-content.component-content {
  height: auto;
  overflow: visible;
  padding: 0;
}

.left-panel, .right-panel {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid #3a3a3a;
  border-radius: 1rem;
  padding: 1rem;
  height: 600px;
  overflow: hidden;
}

/* Right panel specific adjustments for components */
.right-panel .component-content {
  margin: -1rem;
  height: calc(100% + 2rem);
}

/* Character Profile Section */
.character-profile-section {
  text-align: center;
  margin-bottom: 2rem;
}

.character-avatar-large {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.character-avatar-large .character-sprite {
  font-size: 5rem;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.character-avatar-large .level-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid #1a1a1a;
}

.character-info-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  padding: 1rem;
}

.character-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #ffffff;
}

.character-details {
  font-size: 0.875rem;
  color: #888888;
  margin: 0;
}

/* Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.quick-action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.action-subtitle {
  font-size: 0.75rem;
  color: #888888;
}

/* Character Summary Card */
.character-summary-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  padding: 1rem;
}

.character-summary-card h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #888888;
}

.summary-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
}

/* Achievement Summary Card */
.achievement-summary-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-size: 0.75rem;
  color: #888888;
}

.summary-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
}

.achievement-points {
  color: #f59e0b;
}

/* Next Achievements */
.next-achievements-section h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.next-achievement-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.next-achievement-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
}

.achievement-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.achievement-progress-bar {
  width: 100%;
  height: 4px;
  background: #3a3a3a;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.achievement-progress-bar .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.achievement-progress-text {
  font-size: 0.625rem;
  color: #888888;
}

/* Social Stats Grid */
.social-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.social-stat-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
}

.social-stat-card .stat-icon {
  font-size: 1.25rem;
}

.social-stat-card .stat-info {
  flex: 1;
}

.social-stat-card .stat-number {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.social-stat-card .stat-label {
  font-size: 0.625rem;
  color: #888888;
}

/* Quick Friends Section */
.quick-friends-section h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.friend-quick-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.friend-quick-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
}

.friend-avatar {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  line-height: 1;
}

.friend-level {
  font-size: 0.625rem;
  color: #888888;
}

.friend-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.friend-status.online {
  background: #10b981;
}

/* Stat Distribution */
.stat-distribution {
  margin-bottom: 1.5rem;
}

.stat-distribution h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-bar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-bar-info {
  display: flex;
  justify-content: space-between;
  width: 60px;
  flex-shrink: 0;
}

.stat-bar-name {
  font-size: 0.625rem;
  color: #888888;
  text-transform: uppercase;
}

.stat-bar-value {
  font-size: 0.625rem;
  font-weight: 500;
  color: #ffffff;
}

.stat-bar {
  flex: 1;
  height: 6px;
  background: #3a3a3a;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Stat Recommendations */
.stat-recommendations h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
}

.rec-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.rec-content {
  flex: 1;
}

.rec-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  line-height: 1;
}

.rec-subtitle {
  font-size: 0.625rem;
  color: #888888;
}

.available-points {
  font-size: 0.75rem;
  color: #f59e0b;
  margin: 0;
}

.points-badge {
  font-size: 0.75rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
}

/* Seeds Related Styles */
.seeds-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.seed-stat-card {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #4a5568;
}

.seed-stat-card .stat-icon {
  font-size: 1.5rem;
}

.seed-stat-card .stat-info {
  flex: 1;
}

.seed-stat-card .stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #63b3ed;
  margin-bottom: 0.25rem;
}

.seed-stat-card .stat-label {
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.knowledge-tips-section {
  margin-top: 1.5rem;
}

.knowledge-tips-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2a4a6b 0%, #3d5a80 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
}

.tip-subtitle {
  font-size: 0.75rem;
  color: #a0aec0;
}

/* Food System Styles */
.food-counters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.75rem;
  border: 1px solid #4a5568;
}

.food-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.food-icon {
  font-size: 1.5rem;
}

.food-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: #63b3ed;
}

.food-label {
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.large-food {
  background: linear-gradient(135deg, #d69e2e 0%, #f6ad55 100%) !important;
  border-color: #f6ad55 !important;
}

.large-food:hover {
  background: linear-gradient(135deg, #f6ad55 0%, #fbbf24 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

.small-food {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%) !important;
  border-color: #48bb78 !important;
}

.small-food:hover {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
}

.box-item {
  background: linear-gradient(135deg, #805ad5 0%, #9f7aea 100%) !important;
  border-color: #9f7aea !important;
}

.box-item:hover {
  background: linear-gradient(135deg, #9f7aea 0%, #b794f4 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(128, 90, 213, 0.3);
}

/* Box Section Styles */
.box-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #2d1b69 0%, #4c1d95 100%);
  border-radius: 0.75rem;
  border: 1px solid #7c3aed;
}

.box-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.box-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.box-item-standalone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #805ad5 0%, #9f7aea 100%);
  border: 2px solid #b794f4;
  border-radius: 0.75rem;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.box-item-standalone:hover {
  background: linear-gradient(135deg, #9f7aea 0%, #b794f4 100%);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(128, 90, 213, 0.4);
  border-color: #d6bcfa;
}

.box-item-standalone:active {
  transform: translateY(-1px);
}

.box-icon {
  font-size: 2rem;
  animation: boxGlow 2s ease-in-out infinite alternate;
}

@keyframes boxGlow {
  0% {
    filter: drop-shadow(0 0 5px rgba(159, 122, 234, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 15px rgba(159, 122, 234, 0.8));
  }
}

.storage-info {
  font-size: 0.75rem;
  color: #a0aec0;
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: rgba(160, 174, 192, 0.1);
  border-radius: 0.375rem;
  border: 1px solid rgba(160, 174, 192, 0.2);
}

/* Reward Animation Styles */
.reward-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.reward-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid;
  animation: rewardPop 0.5s ease-out, rewardFloat 3s ease-in-out;
  pointer-events: none;
}

.reward-animation.coins {
  border-color: #fbbf24;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
}

.reward-animation.box {
  border-color: #9f7aea;
  box-shadow: 0 0 30px rgba(159, 122, 234, 0.5);
}

.reward-icon {
  font-size: 4rem;
  animation: rewardBounce 0.6s ease-out 0.2s both;
}

.reward-text {
  text-align: center;
}

.reward-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.reward-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #fbbf24;
}

@keyframes rewardPop {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-90deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes rewardFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes rewardBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* Large Food Animation Styles */
.large-food-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #fbbf24;
  border-radius: 1rem;
  z-index: 1000;
  animation: largeFoodPop 0.3s ease-out;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
}

.animation-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
  text-align: center;
}

.animation-subtext {
  font-size: 1rem;
  color: #ffffff;
  text-align: center;
  opacity: 0.8;
}

.action-counter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}



@keyframes largeFoodPop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes actionDot {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.action-dot {
  font-size: 1.5rem;
  color: #fbbf24;
  animation: actionDot 0.5s ease-out both, actionPulse 1s ease-in-out infinite 0.5s;
}

@keyframes actionPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Panel Content Styles */
.panel-content {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}
</style>