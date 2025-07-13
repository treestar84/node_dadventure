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
        <div v-else class="quest-list compact-grid">
          <div
            v-for="quest in receivedQuests"
            :key="quest.id"
            class="quest-item received compact"
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
                class="quest-button accept compact"
              >
                수락
              </button>
              <button
                @click.stop="rejectQuest(quest.id)"
                class="quest-button reject compact"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Quests (Today) -->
      <div class="quest-section">
        <h3>오늘 완료된 퀘스트</h3>
        <div v-if="todayCompletedQuests.length === 0" class="empty-state">
          <p>오늘 완료된 퀘스트가 없습니다</p>
        </div>
        <div v-else class="quest-list compact-grid">
          <div
            v-for="quest in todayCompletedQuests"
            :key="quest.id"
            class="quest-item completed compact"
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
  padding: 0.75rem;
  font-size: 0.9rem;
  background: transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quest-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
}

.quest-progress-header h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.quest-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-item {
  font-size: 0.85em;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-weight: 600;
}

.stat-value {
  color: #63b3ed;
  font-weight: 700;
}

.quest-section {
  margin-bottom: 0.75rem;
}

.quest-section h3 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.quest-list.compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.quest-item.compact {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  margin-bottom: 0;
  font-size: 0.9em;
  min-height: 70px;
  transition: all 0.2s ease;
}

.quest-item.compact:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

/* 상태별 강조 */
.quest-item.received {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

.quest-item.received:hover {
  border-color: #f6ad55;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
}

.quest-item.active {
  border-color: #63b3ed;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

.quest-item.active:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 16px rgba(99, 179, 237, 0.2);
}

.quest-item.completed {
  border-color: #68d391;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

.quest-item.completed:hover {
  border-color: #48bb78;
  box-shadow: 0 4px 16px rgba(104, 211, 145, 0.2);
}

.quest-info h4 {
  font-size: 0.95em;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #e2e8f0;
}

.quest-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85em;
  color: #a0aec0;
  margin-bottom: 0.25rem;
}

.quest-actions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.quest-button.compact {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  min-width: 0;
  border-radius: 0.25rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.quest-button.accept.compact {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  color: #ffffff;
  border: 1px solid #48bb78;
}

.quest-button.accept.compact:hover {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.quest-button.accept.compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quest-button.reject.compact {
  background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%);
  color: #ffffff;
  border: 1px solid #f56565;
}

.quest-button.reject.compact:hover {
  background: linear-gradient(135deg, #f56565 0%, #fc8181 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.quest-button.complete.compact {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
  border: 1px solid #63b3ed;
}

.quest-button.complete.compact:hover {
  background: linear-gradient(135deg, #63b3ed 0%, #90cdf4 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
}

.progress-bar.compact {
  height: 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  background: #4a5568;
  width: 100%;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #63b3ed 0%, #4299e1 100%);
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.empty-state {
  font-size: 0.85em;
  color: #a0aec0;
  padding: 0.75rem;
  text-align: center;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #a0aec0;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #4a5568;
  border-top: 2px solid #63b3ed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  padding: 0.75rem;
  color: #f56565;
  text-align: center;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #f56565;
}

.retry-button, .generate-button {
  margin: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  font-size: 0.8rem;
}

.retry-button:hover, .generate-button:hover {
  background: linear-gradient(135deg, #63b3ed 0%, #90cdf4 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
}
</style> 