<template>
  <div class="quest-detail-panel">
    <div class="panel-header">
      <h2>퀘스트 상세</h2>
    </div>

    <!-- No Quest Selected -->
    <div v-if="!selectedQuest" class="no-quest-selected">
      <div class="empty-state">
        <div class="empty-icon">⚔️</div>
        <h3>퀘스트를 선택하세요</h3>
        <p>왼쪽 패널에서 퀘스트를 클릭하여 상세 정보를 확인하세요.</p>
      </div>
    </div>

    <!-- Quest Detail -->
    <div v-else class="quest-detail">
      <!-- Quest Header -->
      <div class="quest-detail-header" :class="selectedQuest.status">
        <div class="quest-title-section">
          <h3>{{ selectedQuest.title }}</h3>
          <div class="quest-status-badge" :class="selectedQuest.status">
            {{ getStatusText(selectedQuest.status) }}
          </div>
        </div>
        <div class="quest-reward-section">
          <div class="reward-display">
            <span class="reward-icon">🐛</span>
            <span class="reward-amount">{{ selectedQuest.reward_food_count }}</span>
          </div>
        </div>
      </div>

      <!-- Quest Description -->
      <div class="quest-description-section">
        <h4>퀘스트 설명</h4>
        <p>{{ selectedQuest.description }}</p>
      </div>

      <!-- Quest Details -->
      <div class="quest-details-section">
        <div class="detail-item">
          <span class="detail-label">소요 시간:</span>
          <span class="detail-value">{{ selectedQuest.duration_hours }}시간</span>
        </div>
        
        <div v-if="selectedQuest.status === 'accepted'" class="detail-item">
          <span class="detail-label">남은 시간:</span>
          <span class="detail-value time-remaining">{{ formatTimeRemaining(selectedQuest.expires_at) }}</span>
        </div>
        
        <div v-if="selectedQuest.status === 'accepted'" class="detail-item">
          <span class="detail-label">진행률:</span>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgressPercentage(selectedQuest) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(getProgressPercentage(selectedQuest)) }}%</span>
          </div>
        </div>
        
        <div v-if="selectedQuest.status === 'completed'" class="detail-item">
          <span class="detail-label">완료 시간:</span>
          <span class="detail-value">{{ formatCompletionTime(selectedQuest.completed_at) }}</span>
        </div>
        
        <div v-if="selectedQuest.accepted_at" class="detail-item">
          <span class="detail-label">수락 시간:</span>
          <span class="detail-value">{{ formatCompletionTime(selectedQuest.accepted_at) }}</span>
        </div>
      </div>

      <!-- Quest Actions -->
      <div class="quest-actions-section">
        <div v-if="selectedQuest.status === 'received'" class="action-buttons">
          <button
            @click="acceptQuest(selectedQuest.id)"
            :disabled="!canAcceptMoreQuests"
            class="action-button accept"
          >
            <span class="button-icon">✅</span>
            퀘스트 수락
          </button>
          <button
            @click="rejectQuest(selectedQuest.id)"
            class="action-button reject"
          >
            <span class="button-icon">❌</span>
            퀘스트 거절
          </button>
        </div>
        
        <div v-else-if="selectedQuest.status === 'available'" class="action-buttons">
          <button
            @click="acceptQuest(selectedQuest.id)"
            :disabled="!canAcceptMoreQuests"
            class="action-button accept"
          >
            <span class="button-icon">✅</span>
            퀘스트 수락
          </button>
        </div>
        
        <div v-else-if="selectedQuest.status === 'accepted'" class="action-buttons">
          <button
            @click="completeQuest(selectedQuest.id)"
            class="action-button complete"
          >
            <span class="button-icon">⚡</span>
            즉시 완료
          </button>
        </div>
        
        <div v-else-if="selectedQuest.status === 'completed'" class="action-buttons">
          <div class="completion-message">
            <span class="completion-icon">🎉</span>
            <span>퀘스트 완료!</span>
          </div>
        </div>
      </div>

      <!-- Quest Tips -->
      <div class="quest-tips-section">
        <h4>퀘스트 팁</h4>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-icon">💡</span>
            <span>퀘스트는 시간이 지나면 자동으로 완료됩니다</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🎯</span>
            <span>즉시 완료로 보상을 바로 받을 수 있습니다</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📦</span>
            <span>완료 시 먹이 아이템을 보상으로 받습니다</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Quest } from '@/types'

const props = defineProps<{
  selectedQuest: Quest | null
  canAcceptMoreQuests: boolean
}>()

const emit = defineEmits<{
  acceptQuest: [string]
  rejectQuest: [string]
  completeQuest: [string]
}>()

// Methods
function acceptQuest(questId: string) {
  emit('acceptQuest', questId)
}

function rejectQuest(questId: string) {
  emit('rejectQuest', questId)
}

function completeQuest(questId: string) {
  emit('completeQuest', questId)
}

function getStatusText(status: string): string {
  switch (status) {
    case 'received': return '새로 받음'
    case 'available': return '사용 가능'
    case 'accepted': return '진행 중'
    case 'completed': return '완료됨'
    case 'expired': return '만료됨'
    default: return status
  }
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

function formatCompletionTime(completedAt: string | undefined): string {
  if (!completedAt) return '알 수 없음'
  
  const date = new Date(completedAt)
  return date.toLocaleString('ko-KR')
}
</script>

<style scoped>
.quest-detail-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #2a2a2a;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

.no-quest-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  color: #a0aec0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #e2e8f0;
}

.empty-state p {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.quest-detail {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.quest-detail-header {
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.quest-detail-header.received {
  background: linear-gradient(135deg, #744210 0%, #975a16 100%);
  border: 1px solid #fbbf24;
}

.quest-detail-header.available {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  border: 1px solid #4a5568;
}

.quest-detail-header.accepted {
  background: linear-gradient(135deg, #2a4a6b 0%, #3d5a80 100%);
  border: 1px solid #63b3ed;
}

.quest-detail-header.completed {
  background: linear-gradient(135deg, #2d5a2d 0%, #4a7c4a 100%);
  border: 1px solid #68d391;
}

.quest-title-section {
  flex: 1;
}

.quest-title-section h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.quest-status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.quest-status-badge.received {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid #fbbf24;
}

.quest-status-badge.available {
  background: rgba(113, 128, 150, 0.2);
  color: #a0aec0;
  border: 1px solid #a0aec0;
}

.quest-status-badge.accepted {
  background: rgba(99, 179, 237, 0.2);
  color: #63b3ed;
  border: 1px solid #63b3ed;
}

.quest-status-badge.completed {
  background: rgba(104, 211, 145, 0.2);
  color: #68d391;
  border: 1px solid #68d391;
}

.quest-reward-section {
  text-align: right;
}

.reward-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.reward-icon {
  font-size: 1.5rem;
}

.reward-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fbbf24;
}

.quest-description-section {
  margin-bottom: 1.5rem;
}

.quest-description-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.75rem 0;
}

.quest-description-section p {
  font-size: 0.875rem;
  color: #a0aec0;
  line-height: 1.6;
  margin: 0;
}

.quest-details-section {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #2a2a2a;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.875rem;
  color: #a0aec0;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #ffffff;
  font-weight: 600;
}

.detail-value.time-remaining {
  color: #63b3ed;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 200px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #2d3748;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #63b3ed 0%, #4299e1 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #63b3ed;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.quest-actions-section {
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.accept {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  color: #ffffff;
}

.action-button.accept:hover:not(:disabled) {
  background: linear-gradient(135deg, #48bb78 0%, #68d391 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.action-button.reject {
  background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%);
  color: #ffffff;
}

.action-button.reject:hover {
  background: linear-gradient(135deg, #f56565 0%, #fc8181 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.action-button.complete {
  background: linear-gradient(135deg, #4299e1 0%, #63b3ed 100%);
  color: #ffffff;
}

.action-button.complete:hover {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.button-icon {
  font-size: 1rem;
}

.completion-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #2d5a2d 0%, #4a7c4a 100%);
  border: 1px solid #68d391;
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 600;
}

.completion-icon {
  font-size: 1.25rem;
}

.quest-tips-section {
  border-top: 1px solid #2a2a2a;
  padding-top: 1.5rem;
}

.quest-tips-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 1rem 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid #2a2a2a;
  border-radius: 0.5rem;
}

.tip-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.tip-item span:last-child {
  font-size: 0.875rem;
  color: #a0aec0;
  line-height: 1.4;
}

/* Scrollbar styling */
.quest-detail::-webkit-scrollbar {
  width: 4px;
}

.quest-detail::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 2px;
}

.quest-detail::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 2px;
}

.quest-detail::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style> 