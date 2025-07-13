<template>
  <div class="quest-detail-panel">
    <!-- Active Quests Section -->
    <div class="active-quests-section">
      <div class="section-header">
        <h2>진행 중인 퀘스트</h2>
        <div class="quest-count">{{ acceptedQuests.length }}/{{ maxAccepted }}</div>
      </div>
      
      <div v-if="acceptedQuests.length === 0" class="empty-state">
        <p>진행 중인 퀘스트가 없습니다</p>
        <p class="empty-subtitle">왼쪽에서 퀘스트를 수락해보세요!</p>
      </div>
      
      <div v-else class="active-quests-list">
        <div
          v-for="quest in acceptedQuests"
          :key="quest.id"
          class="active-quest-item"
          @click="selectQuest(quest)"
        >
          <div class="quest-header">
            <h3>{{ quest.title }}</h3>
            <span class="quest-reward">🐛 {{ quest.reward_food_count }}</span>
          </div>
          
          <div class="quest-progress">
            <div class="progress-info">
              <span class="time-remaining">{{ formatTimeRemaining(quest.expires_at) }}</span>
              <span class="progress-percentage">{{ Math.round(getProgressPercentage(quest)) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgressPercentage(quest) + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="quest-actions">
            <button
              @click.stop="completeQuest(quest.id)"
              class="complete-button"
            >
              즉시 완료
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Quest Details -->
    <div v-if="selectedQuest" class="selected-quest-section">
      <div class="section-header">
        <h2>퀘스트 상세</h2>
      </div>
      
      <div class="quest-detail-card">
        <div class="quest-detail-header">
          <h3>{{ selectedQuest.title }}</h3>
          <div class="quest-status" :class="getQuestStatusClass(selectedQuest)">
            {{ getQuestStatusText(selectedQuest) }}
          </div>
        </div>
        
        <div class="quest-detail-content">
          <div class="detail-row">
            <span class="detail-label">설명:</span>
            <span class="detail-value">{{ selectedQuest.description }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">소요 시간:</span>
            <span class="detail-value">{{ selectedQuest.duration_hours }}시간</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">보상:</span>
            <span class="detail-value">🐛 {{ selectedQuest.reward_food_count }}개</span>
          </div>
          
          <div v-if="selectedQuest.accepted_at" class="detail-row">
            <span class="detail-label">수락 시간:</span>
            <span class="detail-value">{{ formatDateTime(selectedQuest.accepted_at) }}</span>
          </div>
          
          <div v-if="selectedQuest.expires_at" class="detail-row">
            <span class="detail-label">완료 예정:</span>
            <span class="detail-value">{{ formatDateTime(selectedQuest.expires_at) }}</span>
          </div>
          
          <div v-if="selectedQuest.completed_at" class="detail-row">
            <span class="detail-label">완료 시간:</span>
            <span class="detail-value">{{ formatDateTime(selectedQuest.completed_at) }}</span>
          </div>
        </div>
        
        <div v-if="selectedQuest.state === 'received'" class="quest-detail-actions">
          <button
            @click="acceptQuest(selectedQuest.id)"
            :disabled="!canAcceptMoreQuests"
            class="action-button accept"
          >
            수락
          </button>
          <button
            @click="rejectQuest(selectedQuest.id)"
            class="action-button reject"
          >
            거절
          </button>
        </div>
        
        <div v-else-if="selectedQuest.state === 'accepted'" class="quest-detail-actions">
          <button
            @click="completeQuest(selectedQuest.id)"
            class="action-button complete"
          >
            즉시 완료
          </button>
        </div>
      </div>
    </div>

    <!-- No Quest Selected -->
    <div v-else class="no-selection-section">
      <div class="section-header">
        <h2>퀘스트 상세</h2>
      </div>
      
      <div class="no-selection-card">
        <div class="no-selection-icon">📋</div>
        <h3>퀘스트를 선택하세요</h3>
        <p>왼쪽 패널에서 퀘스트를 클릭하여 상세 정보를 확인하세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuestStore } from '@/stores/quest'
import type { Quest } from '@/types'

const props = defineProps<{
  selectedQuest: Quest | null
  canAcceptMoreQuests: boolean
}>()

const emit = defineEmits<{
  acceptQuest: [string]
  rejectQuest: [string]
  completeQuest: [string]
  questSelected: [Quest]
}>()

const questStore = useQuestStore()

// Computed properties
const acceptedQuests = computed(() => questStore.acceptedQuests)
const maxAccepted = computed(() => questStore.questProgress.maxAccepted)

// Methods
function selectQuest(quest: Quest) {
  emit('questSelected', quest)
}

function acceptQuest(questId: string) {
  emit('acceptQuest', questId)
}

function rejectQuest(questId: string) {
  emit('rejectQuest', questId)
}

function completeQuest(questId: string) {
  emit('completeQuest', questId)
}

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

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '알 수 없음'
  
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR')
}

function getQuestStatusClass(quest: Quest): string {
  switch (quest.state) {
    case 'received': return 'status-received'
    case 'accepted': return 'status-accepted'
    case 'completed': return 'status-completed'
    default: return 'status-unknown'
  }
}

function getQuestStatusText(quest: Quest): string {
  switch (quest.state) {
    case 'received': return '수락 대기'
    case 'accepted': return '진행 중'
    case 'completed': return '완료됨'
    default: return '알 수 없음'
  }
}
</script>

<style scoped>
.quest-detail-panel {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: transparent;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
}

.section-header h2 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.quest-count {
  font-size: 0.75rem;
  color: #63b3ed;
  font-weight: 700;
  background: rgba(99, 179, 237, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(99, 179, 237, 0.3);
}

.active-quests-section {
  flex: 1;
  min-height: 0;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
  color: #a0aec0;
}

.empty-subtitle {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.7;
}

.active-quests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.active-quest-item {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border: 1px solid #63b3ed;
  border-radius: 0.5rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.active-quest-item:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 16px rgba(99, 179, 237, 0.2);
  transform: translateY(-1px);
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.quest-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.quest-reward {
  font-size: 0.8rem;
  color: #fbbf24;
  font-weight: 700;
}

.quest-progress {
  margin-bottom: 0.75rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.time-remaining {
  font-size: 0.75rem;
  color: #a0aec0;
}

.progress-percentage {
  font-size: 0.75rem;
  color: #63b3ed;
  font-weight: 700;
}

.progress-bar {
  height: 0.5rem;
  background: #4a5568;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #63b3ed 0%, #4299e1 100%);
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.quest-actions {
  display: flex;
  justify-content: flex-end;
}

.complete-button {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.complete-button:hover {
  background: linear-gradient(135deg, #63b3ed 0%, #90cdf4 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
}

.selected-quest-section {
  flex: 1;
  min-height: 0;
}

.quest-detail-card {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  padding: 1rem;
}

.quest-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #4a5568;
}

.quest-detail-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.quest-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-received {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-accepted {
  background: rgba(99, 179, 237, 0.1);
  color: #63b3ed;
  border: 1px solid rgba(99, 179, 237, 0.3);
}

.status-completed {
  background: rgba(104, 211, 145, 0.1);
  color: #68d391;
  border: 1px solid rgba(104, 211, 145, 0.3);
}

.quest-detail-content {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.detail-label {
  font-size: 0.8rem;
  color: #a0aec0;
  font-weight: 600;
}

.detail-value {
  font-size: 0.8rem;
  color: #e2e8f0;
  text-align: right;
  max-width: 60%;
  word-wrap: break-word;
}

.quest-detail-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.action-button.accept {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  color: #ffffff;
  border: 1px solid #48bb78;
}

.action-button.accept:hover {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.action-button.accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-button.reject {
  background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%);
  color: #ffffff;
  border: 1px solid #f56565;
}

.action-button.reject:hover {
  background: linear-gradient(135deg, #f56565 0%, #fc8181 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.action-button.complete {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
  border: 1px solid #63b3ed;
}

.action-button.complete:hover {
  background: linear-gradient(135deg, #63b3ed 0%, #90cdf4 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
}

.no-selection-section {
  flex: 1;
  min-height: 0;
}

.no-selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border-radius: 0.5rem;
  border: 1px solid #4a5568;
  text-align: center;
  color: #a0aec0;
}

.no-selection-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-selection-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
}

.no-selection-card p {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.7;
}
</style> 