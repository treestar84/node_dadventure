<template>
  <div class="quest-panel">
    <!-- Quest Progress Header -->
    <div class="quest-progress-header">
      <h2>퀘스트</h2>
      <div class="quest-stats">
        <div class="stat-item">
          <span class="stat-label">일일:</span>
          <span class="stat-value">{{ questProgress.dailyCompleted }}/{{ questProgress.dailyLimit }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">진행:</span>
          <span class="stat-value">{{ questProgress.acceptedCount }}/{{ questProgress.maxAccepted }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>퀘스트를 불러오는 중...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="refreshQuests" class="retry-button">다시 시도</button>
      <button @click="generateNewQuests" class="generate-button">새 퀘스트 생성</button>
    </div>

    <!-- Quest Content -->
    <div v-else class="quest-content">
      <!-- Received Quests (새로 받은 퀘스트) -->
      <div class="quest-section">
        <h3>새로 받은 퀘스트</h3>
        <div v-if="receivedQuests.length === 0" class="empty-state">
          <p>새로 받은 퀘스트가 없습니다</p>
          <button @click="generateNewQuests" class="generate-button">새 퀘스트 생성</button>
        </div>
        <div v-else class="quest-list">
          <div
            v-for="quest in receivedQuests"
            :key="quest.id"
            class="quest-item received"
            @click="selectQuest(quest)"
          >
            <div class="quest-info">
              <h4>{{ quest.title }}</h4>
              <div class="quest-meta">
                <span class="duration">{{ quest.duration_hours }}시간</span>
                <span class="reward">🐛 {{ quest.reward_food_count }}</span>
              </div>
            </div>
            <div class="quest-actions">
              <button
                @click.stop="acceptQuest(quest.id)"
                :disabled="!canAcceptMoreQuests"
                class="quest-button accept"
              >
                수락
              </button>
              <button
                @click.stop="rejectQuest(quest.id)"
                class="quest-button reject"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Quests -->
      <div class="quest-section">
        <h3>사용 가능한 퀘스트</h3>
        <div v-if="availableQuests.length === 0" class="empty-state">
          <p>사용 가능한 퀘스트가 없습니다</p>
        </div>
        <div v-else class="quest-list">
          <div
            v-for="quest in availableQuests"
            :key="quest.id"
            class="quest-item available"
            @click="selectQuest(quest)"
          >
            <div class="quest-info">
              <h4>{{ quest.title }}</h4>
              <div class="quest-meta">
                <span class="duration">{{ quest.duration_hours }}시간</span>
                <span class="reward">🐛 {{ quest.reward_food_count }}</span>
              </div>
            </div>
            <button
              @click.stop="acceptQuest(quest.id)"
              :disabled="!canAcceptMoreQuests"
              class="quest-button accept"
            >
              수락
            </button>
          </div>
        </div>
      </div>

      <!-- Active Quests -->
      <div class="quest-section">
        <h3>진행 중인 퀘스트</h3>
        <div v-if="acceptedQuests.length === 0" class="empty-state">
          <p>진행 중인 퀘스트가 없습니다</p>
        </div>
        <div v-else class="quest-list">
          <div
            v-for="quest in acceptedQuests"
            :key="quest.id"
            class="quest-item active"
            @click="selectQuest(quest)"
          >
            <div class="quest-info">
              <h4>{{ quest.title }}</h4>
              <div class="quest-meta">
                <span class="time-remaining">{{ formatTimeRemaining(quest.expires_at) }}</span>
                <span class="reward">🐛 {{ quest.reward_food_count }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: getProgressPercentage(quest) + '%' }"
                ></div>
              </div>
            </div>
            <button
              @click.stop="completeQuest(quest.id)"
              class="quest-button complete"
            >
              즉시 완료
            </button>
          </div>
        </div>
      </div>

      <!-- Completed Quests (Today) -->
      <div class="quest-section">
        <h3>오늘 완료된 퀘스트</h3>
        <div v-if="todayCompletedQuests.length === 0" class="empty-state">
          <p>오늘 완료된 퀘스트가 없습니다</p>
        </div>
        <div v-else class="quest-list">
          <div
            v-for="quest in todayCompletedQuests"
            :key="quest.id"
            class="quest-item completed"
            @click="selectQuest(quest)"
          >
            <div class="quest-info">
              <h4>{{ quest.title }}</h4>
              <div class="quest-meta">
                <span class="completion-time">{{ formatCompletionTime(quest.completed_at) }}</span>
                <span class="reward">✅ {{ quest.reward_food_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useQuestStore } from '@/stores/quest'
import type { Quest } from '@/types'

const props = defineProps<{
  characterId: string
}>()

const emit = defineEmits<{
  questCompleted: [{ message: string }]
  questSelected: [Quest]
}>()

const questStore = useQuestStore()

// Computed properties
const loading = computed(() => questStore.loading)
const error = computed(() => questStore.error)
const receivedQuests = computed(() => questStore.receivedQuests)
const availableQuests = computed(() => questStore.availableQuests)
const acceptedQuests = computed(() => questStore.acceptedQuests)
const completedQuests = computed(() => questStore.completedQuests)
const canAcceptMoreQuests = computed(() => questStore.canAcceptMoreQuests)
const questProgress = computed(() => questStore.questProgress)

// 오늘 완료된 퀘스트만 필터링
const todayCompletedQuests = computed(() => {
  const today = new Date().toDateString()
  return completedQuests.value.filter(quest => 
    quest.completed_at && new Date(quest.completed_at).toDateString() === today
  )
})

// 타이머
let progressTimer: NodeJS.Timeout | null = null

// Methods
function selectQuest(quest: Quest) {
  emit('questSelected', quest)
}

async function acceptQuest(questId: string) {
  const success = await questStore.acceptQuest(questId, props.characterId)
  if (success) {
    console.log('Quest accepted successfully!')
  }
}

async function rejectQuest(questId: string) {
  const success = await questStore.rejectQuest(questId, props.characterId)
  if (success) {
    console.log('Quest rejected successfully!')
  }
}

async function completeQuest(questId: string) {
  const success = await questStore.completeQuest(questId, props.characterId)
  if (success) {
    console.log('Quest completed successfully!')
    // 성공 메시지 표시 (부모 컴포넌트로 이벤트 전달)
    emit('questCompleted', { message: 'Quest completed! Food rewards gained!' })
  }
}

async function generateNewQuests() {
  await questStore.generateNewQuests(props.characterId)
}

async function refreshQuests() {
  await questStore.loadQuests(props.characterId)
}

// 시간 포맷팅
function formatTimeRemaining(expiresAt: string | undefined): string {
  if (!expiresAt) return '알 수 없음'
  
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()
  
  if (diff <= 0) return '완료됨!'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}시간 ${minutes}분`
}

function getProgressPercentage(quest: Quest): number {
  if (!quest.accepted_at || !quest.expires_at) return 0
  
  const now = new Date()
  const accepted = new Date(quest.accepted_at)
  const expires = new Date(quest.expires_at)
  
  const totalDuration = expires.getTime() - accepted.getTime()
  const elapsed = now.getTime() - accepted.getTime()
  
  if (elapsed >= totalDuration) return 100
  if (elapsed <= 0) return 0
  
  return Math.min(100, (elapsed / totalDuration) * 100)
}

function formatCompletionTime(completedAt: string | undefined): string {
  if (!completedAt) return '알 수 없음'
  
  const date = new Date(completedAt)
  return date.toLocaleTimeString('ko-KR')
}

// Lifecycle
onMounted(async () => {
  await questStore.loadQuests(props.characterId)
  
  // 진행 상황 업데이트를 위한 타이머
  progressTimer = setInterval(async () => {
    await questStore.checkCompletedQuests(props.characterId)
  }, 60000) // 1분마다 체크
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})
</script>

<style scoped>
.quest-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quest-progress-header {
  padding: 1rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.75rem;
  border: 1px solid #4a5568;
  margin-bottom: 1rem;
}

.quest-progress-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
}

.quest-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #a0aec0;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #63b3ed;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  flex: 1;
}

.error-state p {
  color: #e53e3e;
  margin-bottom: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #4a5568;
  border-top: 2px solid #63b3ed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button,
.generate-button {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  border: none;
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0.25rem;
}

.retry-button:hover,
.generate-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.quest-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.quest-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid #4a5568;
}

.empty-state {
  text-align: center;
  padding: 1rem;
  color: #a0aec0;
  font-size: 0.875rem;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quest-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid;
  transition: all 0.2s ease;
  cursor: pointer;
  background: rgba(26, 26, 26, 0.8);
}

.quest-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.quest-item.received {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #744210 0%, #975a16 100%);
  animation: pulse 2s infinite;
}

.quest-item.available {
  border-color: #4a5568;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

.quest-item.active {
  border-color: #63b3ed;
  background: linear-gradient(135deg, #2a4a6b 0%, #3d5a80 100%);
}

.quest-item.completed {
  border-color: #68d391;
  background: linear-gradient(135deg, #2d5a2d 0%, #4a7c4a 100%);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.quest-info {
  margin-bottom: 0.5rem;
}

.quest-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.quest-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.duration,
.time-remaining,
.completion-time {
  color: #a0aec0;
}

.reward {
  color: #fbbf24;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #2d3748;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #63b3ed 0%, #4299e1 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.quest-actions {
  display: flex;
  gap: 0.25rem;
}

.quest-button {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.quest-button.accept {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  color: #ffffff;
}

.quest-button.accept:hover:not(:disabled) {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.quest-button.reject {
  background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%);
  color: #ffffff;
}

.quest-button.reject:hover {
  background: linear-gradient(135deg, #f56565 0%, #fc8181 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.quest-button.complete {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
}

.quest-button.complete:hover {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.quest-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Scrollbar styling */
.quest-content::-webkit-scrollbar {
  width: 4px;
}

.quest-content::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 2px;
}

.quest-content::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 2px;
}

.quest-content::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style> 