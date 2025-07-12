<template>
  <div class="knowledge-seeds">
    <!-- Header -->
    <div class="seeds-header">
      <h3 class="section-title">🌱 지식의 씨앗</h3>
      <div class="seeds-stats">
        <div class="stat-item">
          <span class="stat-icon">🌱</span>
          <span class="stat-text">총 {{ seedStats.totalSeeds }}개</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">💧</span>
          <span class="stat-text">댓글 {{ seedStats.totalComments }}개</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📚</span>
          <span class="stat-text">내 씨앗 {{ seedStats.mySeeds }}개</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="seeds-tabs">
      <button 
        @click="activeTab = 'explore'"
        :class="['tab-button', { active: activeTab === 'explore' }]"
      >
        🌍 탐색
      </button>
      <button 
        @click="activeTab = 'create'"
        :class="['tab-button', { active: activeTab === 'create' }]"
      >
        ➕ 씨앗 심기
      </button>
      <button 
        @click="activeTab = 'myseeds'"
        :class="['tab-button', { active: activeTab === 'myseeds' }]"
      >
        📚 내 씨앗
      </button>
    </div>

    <!-- Explore Tab -->
    <div v-if="activeTab === 'explore'" class="tab-content">
      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            @input="onSearch"
            placeholder="지식의 씨앗을 검색해보세요..."
            class="search-input"
          />
          <button @click="refreshSeeds" class="refresh-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23,4 23,10 17,10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        
        <!-- Filter Buttons -->
        <div class="filter-buttons">
          <button 
            @click="setFilter('recent')"
            :class="['filter-btn', { active: currentFilter === 'recent' }]"
          >
            🕒 최신
          </button>
          <button 
            @click="setFilter('popular')"
            :class="['filter-btn', { active: currentFilter === 'popular' }]"
          >
            🔥 인기
          </button>
          <button 
            @click="setFilter('all')"
            :class="['filter-btn', { active: currentFilter === 'all' }]"
          >
            📋 전체
          </button>
        </div>
      </div>

      <!-- Seeds List -->
      <div class="seeds-list">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>지식의 씨앗을 불러오는 중...</p>
        </div>
        
        <div v-else-if="filteredSeeds.length === 0" class="empty-state">
          <p>🌱 아직 심어진 씨앗이 없습니다</p>
          <p class="hint">첫 번째 지식의 씨앗을 심어보세요!</p>
        </div>
        
        <div 
          v-else
          v-for="seed in filteredSeeds" 
          :key="seed.id"
          class="seed-card"
        >
          <div class="seed-header">
            <div class="creator-info">
              <div class="creator-avatar">
                {{ getSpeciesEmoji(seed.creator.species) }}
              </div>
              <div class="creator-details">
                <h4 class="creator-name">{{ seed.creator.name }}</h4>
                <span class="creator-level">Lv.{{ seed.creator.level }}</span>
              </div>
            </div>
            <div class="seed-meta">
              <span class="tree-size">🌳 {{ seed.tree_size }}</span>
              <span class="created-date">{{ formatDate(seed.created_at) }}</span>
            </div>
          </div>
          
          <div class="seed-content">
            <h3 class="seed-title">{{ seed.title }}</h3>
            <p class="seed-description">{{ seed.content }}</p>
          </div>
          
          <div class="seed-footer">
            <div class="seed-stats">
              <span class="comment-count">💬 {{ seed.comments.length }}개 댓글</span>
            </div>
            <div class="seed-actions">
              <button 
                @click="toggleSeedDetails(seed.id)"
                class="action-button details"
              >
                {{ expandedSeeds.has(seed.id) ? '접기' : '자세히' }}
              </button>
              <button 
                @click="openWaterModal(seed)"
                :disabled="seed.creator_id === currentCharacter?.id"
                class="action-button water"
              >
                💧 물주기
              </button>
            </div>
          </div>
          
          <!-- Expanded Details -->
          <div v-if="expandedSeeds.has(seed.id)" class="seed-details">
            <div class="comments-section">
              <h4 class="comments-title">💬 댓글 ({{ seed.comments.length }})</h4>
              
              <div v-if="seed.comments.length === 0" class="no-comments">
                <p>아직 댓글이 없습니다. 첫 번째 물방울을 남겨보세요!</p>
              </div>
              
              <div v-else class="comments-list">
                <div 
                  v-for="comment in seed.comments" 
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-header">
                    <div class="commenter-info">
                      <span class="commenter-avatar">{{ getSpeciesEmoji(comment.commenter.species) }}</span>
                      <span class="commenter-name">{{ comment.commenter.name }}</span>
                      <span class="commenter-level">Lv.{{ comment.commenter.level }}</span>
                    </div>
                    <span class="comment-date">{{ formatTime(comment.created_at) }}</span>
                  </div>
                  <p class="comment-content">{{ comment.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Tab -->
    <div v-if="activeTab === 'create'" class="tab-content">
      <div class="create-seed-form">
        <h4 class="form-title">🌱 새로운 지식의 씨앗 심기</h4>
        <p class="form-description">
          당신의 지식, 경험, 생각을 다른 캐릭터들과 나누어보세요!
        </p>
        
        <div class="form-group">
          <label class="form-label">제목</label>
          <input
            v-model="newSeed.title"
            placeholder="흥미로운 제목을 지어보세요"
            class="form-input"
            maxlength="100"
          />
          <div class="char-count">{{ newSeed.title.length }}/100</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">내용</label>
          <textarea
            v-model="newSeed.content"
            placeholder="지식, 팁, 경험담, 질문 등 무엇이든 자유롭게 작성해보세요!"
            class="form-textarea"
            rows="8"
            maxlength="1000"
          ></textarea>
          <div class="char-count">{{ newSeed.content.length }}/1000</div>
        </div>
        
        <div class="form-actions">
          <button 
            @click="clearForm"
            class="action-button secondary"
          >
            초기화
          </button>
          <button 
            @click="submitSeed"
            :disabled="!canSubmit || creatingSeeds"
            class="action-button primary"
          >
            <span v-if="creatingSeeds">심는 중...</span>
            <span v-else>🌱 씨앗 심기</span>
          </button>
        </div>
      </div>
    </div>

    <!-- My Seeds Tab -->
    <div v-if="activeTab === 'myseeds'" class="tab-content">
      <div class="my-seeds-section">
        <div class="section-stats">
          <div class="stat-card">
            <div class="stat-value">{{ mySeeds.length }}</div>
            <div class="stat-label">내가 심은 씨앗</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ totalMyTreeSize }}</div>
            <div class="stat-label">총 나무 크기</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ wateredSeeds.length }}</div>
            <div class="stat-label">물을 준 씨앗</div>
          </div>
        </div>
        
        <div v-if="mySeeds.length === 0" class="empty-state">
          <p>🌱 아직 심은 씨앗이 없습니다</p>
          <button @click="activeTab = 'create'" class="action-button primary">
            첫 씨앗 심기
          </button>
        </div>
        
        <div v-else class="seeds-grid">
          <div 
            v-for="seed in mySeeds" 
            :key="seed.id"
            class="my-seed-card"
          >
            <div class="seed-header">
              <h4 class="seed-title">{{ seed.title }}</h4>
              <div class="seed-metrics">
                <span class="tree-size">🌳 {{ seed.tree_size }}</span>
                <span class="comment-count">💬 {{ seed.comments.length }}</span>
              </div>
            </div>
            <p class="seed-preview">{{ truncateText(seed.content, 100) }}</p>
            <div class="seed-footer">
              <span class="created-date">{{ formatDate(seed.created_at) }}</span>
              <button 
                @click="activeTab = 'explore'; scrollToSeed(seed.id)"
                class="view-button"
              >
                자세히 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Water Modal -->
    <div v-if="waterModal.show" class="modal-overlay" @click="closeWaterModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>💧 지식의 나무에 물주기</h3>
          <button @click="closeWaterModal" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <div class="seed-info">
            <h4>{{ waterModal.seed?.title }}</h4>
            <p class="seed-creator">by {{ waterModal.seed?.creator.name }}</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">댓글 (물방울)</label>
            <textarea
              v-model="waterModal.comment"
              placeholder="응원, 질문, 추가 정보 등을 남겨보세요..."
              class="form-textarea"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ waterModal.comment.length }}/500</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeWaterModal" class="action-button secondary">
            취소
          </button>
          <button 
            @click="submitWater"
            :disabled="!waterModal.comment.trim() || wateringSeeds"
            class="action-button primary"
          >
            <span v-if="wateringSeeds">물주는 중...</span>
            <span v-else>💧 물주기</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSeedStore } from '../stores/seed'
import { useCharacterStore } from '../stores/character'
import type { Seed } from '../types'

const seedStore = useSeedStore()
const characterStore = useCharacterStore()

const activeTab = ref('explore')
const searchQuery = ref('')
const currentFilter = ref('recent')
const expandedSeeds = ref(new Set<string>())
const creatingSeeds = ref(false)
const wateringSeeds = ref(false)

const newSeed = ref({
  title: '',
  content: ''
})

const waterModal = ref({
  show: false,
  seed: null as Seed | null,
  comment: ''
})

const currentCharacter = computed(() => characterStore.currentCharacter)
const loading = computed(() => seedStore.loading)
const seeds = computed(() => seedStore.seeds)
const seedStats = computed(() => seedStore.seedStats)

const mySeeds = computed(() => {
  if (!currentCharacter.value) return []
  return seedStore.getMySeeds(currentCharacter.value.id)
})

const wateredSeeds = computed(() => {
  if (!currentCharacter.value) return []
  return seedStore.getWateredSeeds(currentCharacter.value.id)
})

const totalMyTreeSize = computed(() => {
  return mySeeds.value.reduce((sum, seed) => sum + seed.tree_size, 0)
})

const filteredSeeds = computed(() => {
  let result = seeds.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(seed => 
      seed.title.toLowerCase().includes(query) || 
      seed.content.toLowerCase().includes(query) ||
      seed.creator.name.toLowerCase().includes(query)
    )
  }

  switch (currentFilter.value) {
    case 'popular':
      return [...result].sort((a, b) => b.tree_size - a.tree_size)
    case 'recent':
      return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    default:
      return result
  }
})

const canSubmit = computed(() => {
  return newSeed.value.title.trim().length > 0 && 
         newSeed.value.content.trim().length > 0 &&
         newSeed.value.title.length <= 100 &&
         newSeed.value.content.length <= 1000
})

function setFilter(filter: string) {
  currentFilter.value = filter
}

async function refreshSeeds() {
  if (currentCharacter.value) {
    await seedStore.loadSeeds(currentCharacter.value.id)
  }
}

async function onSearch() {
  // Search is handled by computed property
}

function toggleSeedDetails(seedId: string) {
  if (expandedSeeds.value.has(seedId)) {
    expandedSeeds.value.delete(seedId)
  } else {
    expandedSeeds.value.add(seedId)
  }
}

function openWaterModal(seed: Seed) {
  waterModal.value = {
    show: true,
    seed,
    comment: ''
  }
}

function closeWaterModal() {
  waterModal.value = {
    show: false,
    seed: null,
    comment: ''
  }
}

async function submitWater() {
  if (!waterModal.value.seed || !currentCharacter.value || !waterModal.value.comment.trim()) return
  
  wateringSeeds.value = true
  
  try {
    const result = await seedStore.waterSeed(
      waterModal.value.seed.id,
      currentCharacter.value.id,
      waterModal.value.comment
    )
    
    if (result.success) {
      closeWaterModal()
    }
  } finally {
    wateringSeeds.value = false
  }
}

async function submitSeed() {
  if (!currentCharacter.value || !canSubmit.value) return
  
  creatingSeeds.value = true
  
  try {
    const result = await seedStore.createSeed(
      currentCharacter.value.id,
      newSeed.value.title,
      newSeed.value.content
    )
    
    if (result.success) {
      clearForm()
      activeTab.value = 'explore'
    }
  } finally {
    creatingSeeds.value = false
  }
}

function clearForm() {
  newSeed.value = {
    title: '',
    content: ''
  }
}

function scrollToSeed(seedId: string) {
  // Scroll to specific seed in explore tab
  expandedSeeds.value.add(seedId)
}

function getSpeciesEmoji(species: string): string {
  const emojis = {
    cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹',
    bird: '🐦', fish: '🐠', turtle: '🐢', fox: '🦊'
  }
  return emojis[species as keyof typeof emojis] || '🐾'
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '오늘'
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Watch for tab changes to load appropriate data
watch(activeTab, async (newTab) => {
  if (newTab === 'explore' && seeds.value.length === 0) {
    await refreshSeeds()
  }
})

onMounted(async () => {
  if (currentCharacter.value) {
    await seedStore.loadSeeds(currentCharacter.value.id)
  }
})
</script>

<style scoped>
.knowledge-seeds {
  @apply bg-transparent rounded-2xl p-3;
  max-height: 600px;
  overflow-y: auto;
  border: none;
  box-shadow: none;
}

.seeds-header {
  @apply mb-3;
}

.section-title {
  @apply text-base font-bold text-white mb-1;
}

.seeds-stats {
  @apply flex gap-4;
}

.stat-item {
  @apply flex items-center gap-1 text-sm text-gray-300;
}

.stat-icon {
  @apply text-base;
}

.seeds-tabs {
  @apply flex gap-1 mb-3;
}

.tab-button {
  @apply px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 border;
  @apply bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600;
}

.tab-button.active {
  @apply bg-green-600 text-white border-green-500 shadow-md;
}

.tab-content {
  @apply space-y-3;
}

.search-section {
  @apply space-y-3;
}

.search-bar {
  @apply flex gap-2;
}

.search-input {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
}

.refresh-button {
  @apply p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors;
}

.filter-buttons {
  @apply flex gap-2;
}

.filter-btn {
  @apply px-3 py-1 text-xs font-medium rounded-lg transition-all;
  @apply bg-gray-100 text-gray-600 hover:bg-gray-200;
}

.filter-btn.active {
  @apply bg-green-100 text-green-700 border border-green-300;
}

.seeds-list {
  @apply space-y-4 max-h-96 overflow-y-auto;
}

.seed-card {
  @apply bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all;
}

.seed-header {
  @apply flex items-start justify-between mb-3;
}

.creator-info {
  @apply flex items-center gap-3;
}

.creator-avatar {
  @apply text-xl;
}

.creator-details {
  @apply flex flex-col;
}

.creator-name {
  @apply font-semibold text-gray-800 text-sm;
}

.creator-level {
  @apply text-xs text-gray-500;
}

.seed-meta {
  @apply flex flex-col items-end gap-1 text-xs text-gray-500;
}

.tree-size {
  @apply font-medium text-green-600;
}

.seed-content {
  @apply mb-3;
}

.seed-title {
  @apply font-semibold text-gray-800 mb-2;
}

.seed-description {
  @apply text-sm text-gray-600 line-clamp-3;
}

.seed-footer {
  @apply flex items-center justify-between;
}

.seed-stats {
  @apply flex gap-3 text-xs text-gray-500;
}

.seed-actions {
  @apply flex gap-2;
}

.action-button {
  @apply px-3 py-1 text-xs font-medium rounded-lg transition-all;
}

.action-button.details {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.action-button.water {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50;
}

.action-button.primary {
  @apply bg-green-500 text-white hover:bg-green-600 disabled:opacity-50;
}

.action-button.secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.seed-details {
  @apply mt-4 pt-4 border-t border-gray-100;
}

.comments-section {
  @apply space-y-3;
}

.comments-title {
  @apply font-semibold text-gray-800 text-sm;
}

.comments-list {
  @apply space-y-3;
}

.comment-item {
  @apply bg-gray-50 rounded-lg p-3;
}

.comment-header {
  @apply flex items-center justify-between mb-2;
}

.commenter-info {
  @apply flex items-center gap-2 text-sm;
}

.commenter-avatar {
  @apply text-base;
}

.commenter-name {
  @apply font-medium text-gray-800;
}

.commenter-level {
  @apply text-xs text-gray-500;
}

.comment-date {
  @apply text-xs text-gray-500;
}

.comment-content {
  @apply text-sm text-gray-700;
}

.create-seed-form {
  @apply space-y-4;
}

.form-title {
  @apply text-lg font-semibold text-gray-800;
}

.form-description {
  @apply text-sm text-gray-600;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input, .form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
}

.char-count {
  @apply text-xs text-gray-500 text-right;
}

.form-actions {
  @apply flex gap-3 justify-end;
}

.my-seeds-section {
  @apply space-y-4;
}

.section-stats {
  @apply grid grid-cols-3 gap-4;
}

.stat-card {
  @apply bg-white rounded-lg p-3 text-center border border-gray-200;
}

.stat-value {
  @apply text-lg font-bold text-green-600;
}

.stat-label {
  @apply text-xs text-gray-500;
}

.seeds-grid {
  @apply grid grid-cols-1 gap-3;
}

.my-seed-card {
  @apply bg-white rounded-lg border border-gray-200 p-3;
}

.seed-preview {
  @apply text-sm text-gray-600 my-2;
}

.view-button {
  @apply text-xs text-green-600 hover:text-green-700 font-medium;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-xl shadow-xl max-w-md w-full mx-4;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.close-button {
  @apply text-gray-400 hover:text-gray-600 text-xl font-bold;
}

.modal-body {
  @apply p-4 space-y-4;
}

.seed-info {
  @apply space-y-1;
}

.seed-creator {
  @apply text-sm text-gray-500;
}

.modal-footer {
  @apply flex gap-3 justify-end p-4 border-t border-gray-200;
}

.loading-state, .empty-state {
  @apply text-center py-8 text-gray-500;
}

.spinner {
  @apply w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2;
}

.hint {
  @apply text-xs mt-1;
}

.no-comments {
  @apply text-center py-4 text-gray-500 text-sm;
}
</style>