<template>
  <div class="knowledge-seeds">
    <!-- Seeds Header -->
    <div class="p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-500/30 mb-4">
      <h3 class="text-lg font-bold text-white mb-3">🌱 지식의 씨앗</h3>
      <div class="flex gap-4">
        <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
          <span class="text-lg">🌱</span>
          <span class="text-sm font-medium text-white">총 {{ seedStats.totalSeeds }}개</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
          <span class="text-lg">💬</span>
          <span class="text-sm font-medium text-white">댓글 {{ seedStats.totalComments }}개</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
          <span class="text-lg">📚</span>
          <span class="text-sm font-medium text-white">내 {{ seedStats.mySeeds }}개</span>
        </div>
      </div>
    </div>

    <!-- Seeds Tabs -->
    <div class="flex gap-2 mb-4">
      <button 
        @click="activeTab = 'explore'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'explore' 
            ? 'bg-green-600 text-white border-green-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        🌍 탐색
      </button>
      <button 
        @click="activeTab = 'create'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'create' 
            ? 'bg-green-600 text-white border-green-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        ➕ 씨앗 심기
      </button>
      <button 
        @click="activeTab = 'myseeds'"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border relative',
          activeTab === 'myseeds' 
            ? 'bg-green-600 text-white border-green-500 shadow-lg' 
            : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
        ]"
      >
        📚 내 씨앗
      </button>
    </div>

    <!-- Explore Tab -->
    <div v-if="activeTab === 'explore'" class="tab-content">
      <!-- Search Bar -->
      <div class="flex gap-3 mb-4">
        <input
          v-model="searchQuery"
          @input="onSearch"
          placeholder="지식의 씨앗을 검색해보세요..."
          class="flex-1 px-4 py-3 border border-gray-600/50 rounded-xl text-sm bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
        <button @click="refreshSeeds" class="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors text-gray-300 border border-gray-600/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
      
      <!-- Filter Buttons -->
      <div class="flex gap-2 mb-4">
        <button 
          @click="setFilter('recent')"
          :class="[
            'px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border',
            currentFilter === 'recent'
              ? 'bg-green-600 text-white border-green-500 shadow-md'
              : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
          ]"
        >
          🕒 최신
        </button>
        <button 
          @click="setFilter('popular')"
          :class="[
            'px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border',
            currentFilter === 'popular'
              ? 'bg-green-600 text-white border-green-500 shadow-md'
              : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
          ]"
        >
          🔥 인기
        </button>
        <button 
          @click="setFilter('all')"
          :class="[
            'px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 border',
            currentFilter === 'all'
              ? 'bg-green-600 text-white border-green-500 shadow-md'
              : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
          ]"
        >
          📋 전체
        </button>
      </div>

      <!-- Seeds List -->
      <div class="seeds-list">
        <div v-if="loading" class="text-center py-12 text-gray-400">
          <div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm">지식의 씨앗을 불러오는 중...</p>
        </div>
        
        <div v-else-if="filteredSeeds.length === 0" class="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-600/30">
          <div class="text-4xl mb-3">🌱</div>
          <p class="text-gray-400 text-sm mb-2">아직 심어진 씨앗이 없습니다</p>
          <p class="text-xs text-gray-500">첫 번째 지식의 씨앗을 심어보세요!</p>
        </div>
        
        <div 
          v-else
          v-for="seed in filteredSeeds" 
          :key="seed.id"
          class="seed-card"
        >
          <div class="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600/30 hover:shadow-md transition-all duration-200">
            <!-- 왼쪽: 작성자 정보 -->
            <div class="flex flex-col items-center gap-2 min-w-0 flex-shrink-0">
              <div class="text-2xl">{{ getSpeciesEmoji(seed.creator.species) }}</div>
              <div class="text-center">
                <h4 class="text-xs font-semibold text-white">{{ seed.creator.name }}</h4>
                <div class="flex flex-col gap-1 mt-1">
                  <span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Lv.{{ seed.creator.level }}</span>
                  <span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">🌳 {{ seed.tree_size }}</span>
                </div>
              </div>
            </div>

            <!-- 오른쪽: 컨텐츠 영역 -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-sm font-semibold text-white flex-1">{{ seed.title }}</h3>
                <span class="text-xs text-gray-400 ml-2 flex-shrink-0">{{ formatDate(seed.created_at) }}</span>
              </div>
              
              <p class="text-xs text-gray-300 mb-3 leading-relaxed" :class="{ 'line-clamp-2': !expandedSeeds.has(seed.id) }">
                {{ expandedSeeds.has(seed.id) ? seed.content : truncateText(seed.content, 100) }}
              </p>
              
              <!-- 하단 액션 바 -->
              <div class="flex justify-between items-center pt-2 border-t border-gray-600/30">
                <div class="flex gap-3 text-xs text-gray-400">
                  <span class="flex items-center gap-1">
                    <span>💬</span>
                    <span>{{ seed.comments.length }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span>📈</span>
                    <span>성장 중</span>
                  </span>
                </div>
                
                <div class="flex gap-2">
                  <button 
                    @click="toggleSeedDetails(seed.id)"
                    class="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    {{ expandedSeeds.has(seed.id) ? '접기' : '더보기' }}
                  </button>
                  <button 
                    @click="openWaterModal(seed)"
                    :disabled="seed.creator_id === currentCharacter?.id"
                    class="px-3 py-1 text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded-md transition-colors"
                  >
                    💧 물주기
                  </button>
                </div>
              </div>
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
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.knowledge-seeds::-webkit-scrollbar {
  width: 6px;
}

.knowledge-seeds::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.knowledge-seeds::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.knowledge-seeds::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Knowledge Seeds Header */
.knowledge-seeds > div:first-child {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.knowledge-seeds > div:first-child h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.knowledge-seeds > div:first-child > div {
  display: flex;
  gap: 1rem;
}

.knowledge-seeds > div:first-child > div > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
}

.knowledge-seeds > div:first-child > div > div > span:first-child {
  font-size: 1.125rem;
}

.knowledge-seeds > div:first-child > div > div > span:last-child {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
}

/* Seeds Tabs */
.knowledge-seeds > div:nth-child(2) {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.knowledge-seeds > div:nth-child(2) > button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  border: 1px solid;
  position: relative;
}

.knowledge-seeds > div:nth-child(2) > button:not(.active) {
  background: rgba(55, 65, 81, 0.5);
  color: #d1d5db;
  border-color: rgba(75, 85, 99, 0.5);
}

.knowledge-seeds > div:nth-child(2) > button:not(.active):hover {
  background: rgba(75, 85, 99, 0.5);
}

.knowledge-seeds > div:nth-child(2) > button.active {
  background: #059669;
  color: #ffffff;
  border-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Tab Content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Search Bar */
.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: rgba(31, 41, 55, 0.5);
  color: #ffffff;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  ring: 2px;
  ring-color: #10b981;
  border-color: transparent;
  transition: all 0.2s ease;
}

.refresh-button {
  padding: 0.75rem;
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.75rem;
  transition: colors 0.2s ease;
  color: #d1d5db;
}

.refresh-button:hover {
  background: rgba(75, 85, 99, 0.5);
}

/* Filter Buttons */
.filter-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  border: 1px solid;
}

.filter-button:not(.active) {
  background: rgba(55, 65, 81, 0.5);
  color: #d1d5db;
  border-color: rgba(75, 85, 99, 0.5);
}

.filter-button:not(.active):hover {
  background: rgba(75, 85, 99, 0.5);
}

.filter-button.active {
  background: #059669;
  color: #ffffff;
  border-color: #10b981;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Seeds List */
.seeds-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 20rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.seeds-list::-webkit-scrollbar {
  width: 6px;
}

.seeds-list::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.seeds-list::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.seeds-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Seed Cards */
.seed-card {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.seed-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.seed-card > div {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
}

.seed-card .text-2xl {
  font-size: 1.5rem;
}

.seed-card .text-center {
  text-align: center;
}

.seed-card .text-xs {
  font-size: 0.75rem;
}

.seed-card .font-semibold {
  font-weight: 600;
}

.seed-card .text-white {
  color: #ffffff;
}

.seed-card .bg-blue-500 {
  background: #3b82f6;
}

.seed-card .bg-green-500 {
  background: #10b981;
}

.seed-card .text-white {
  color: #ffffff;
}

.seed-card .px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.seed-card .py-0\\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}

.seed-card .rounded-full {
  border-radius: 9999px;
}

.seed-card .flex-1 {
  flex: 1;
}

.seed-card .min-w-0 {
  min-width: 0;
}

.seed-card .flex {
  display: flex;
}

.seed-card .justify-between {
  justify-content: space-between;
}

.seed-card .items-start {
  align-items: flex-start;
}

.seed-card .mb-2 {
  margin-bottom: 0.5rem;
}

.seed-card .ml-2 {
  margin-left: 0.5rem;
}

.seed-card .flex-shrink-0 {
  flex-shrink: 0;
}

.seed-card .text-gray-400 {
  color: #9ca3af;
}

.seed-card .text-gray-300 {
  color: #d1d5db;
}

.seed-card .mb-3 {
  margin-bottom: 0.75rem;
}

.seed-card .leading-relaxed {
  line-height: 1.625;
}

.seed-card .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.seed-card .pt-2 {
  padding-top: 0.5rem;
}

.seed-card .border-t {
  border-top-width: 1px;
}

.seed-card .border-gray-600\/30 {
  border-color: rgba(75, 85, 99, 0.3);
}

.seed-card .gap-3 {
  gap: 0.75rem;
}

.seed-card .gap-2 {
  gap: 0.5rem;
}

.seed-card .items-center {
  align-items: center;
}

.seed-card .font-medium {
  font-weight: 500;
}

.seed-card .bg-gray-700 {
  background: #374151;
}

.seed-card .hover\:bg-gray-600:hover {
  background: #4b5563;
}

.seed-card .rounded-md {
  border-radius: 0.375rem;
}

.seed-card .transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.seed-card .bg-blue-500 {
  background: #3b82f6;
}

.seed-card .hover\:bg-blue-600:hover {
  background: #2563eb;
}

.seed-card .disabled\:opacity-50:disabled {
  opacity: 0.5;
}

/* Seed Details */
.seed-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(75, 85, 99, 0.3);
  background: rgba(17, 24, 39, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comments-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.no-comments {
  text-align: center;
  padding: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-item {
  padding: 0.75rem;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.5rem;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.commenter-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.commenter-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
}

.comment-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.comment-content {
  font-size: 0.875rem;
  color: #d1d5db;
}

/* Create Seed Form */
.create-form {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: rgba(17, 24, 39, 0.5);
  color: #ffffff;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-textarea {
  min-height: 6rem;
  resize: vertical;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button:hover {
  background: #059669;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.char-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* My Seeds Section */
.my-seeds-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border: 1px solid #4b5563;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #63b3ed;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: rgba(31, 41, 55, 0.3);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.75rem;
}

.empty-state .text-4xl {
  font-size: 2.25rem;
  margin-bottom: 0.75rem;
}

.empty-state .text-gray-400 {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.empty-state .text-xs {
  font-size: 0.75rem;
}

.empty-state .text-gray-500 {
  color: #6b7280;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #059669;
}

.action-button.primary {
  background: #10b981;
}

.seeds-grid {
  display: grid;
  gap: 1rem;
}

.my-seed-card {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s ease;
}

.my-seed-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.seed-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.seed-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.seed-metrics {
  display: flex;
  gap: 0.5rem;
}

.tree-size, .comment-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.seed-preview {
  font-size: 0.875rem;
  color: #d1d5db;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.seed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.created-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.view-button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-button:hover {
  background: #2563eb;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: #1f2937;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 28rem;
  width: 100%;
  margin: 0 1rem;
  border: 1px solid #374151;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #374151;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #374151;
  color: #ffffff;
}

.modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.seed-info {
  padding: 0.75rem;
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #374151;
}

.modal-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-button.secondary {
  background: #374151;
  color: #d1d5db;
  border: 1px solid #4b5563;
}

.modal-button.secondary:hover {
  background: #4b5563;
}

.modal-button.primary {
  background: #10b981;
  color: #ffffff;
  border: none;
}

.modal-button.primary:hover {
  background: #059669;
}

.modal-button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #9ca3af;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #10b981;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* 기존 다크 테마 스타일 시스템에 맞는 최소 CSS */
.tab-content {
  @apply space-y-3;
}

.seeds-list {
  @apply space-y-3 max-h-80 overflow-y-auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.seeds-list::-webkit-scrollbar {
  width: 6px;
}

.seeds-list::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.seeds-list::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.seeds-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.seed-details {
  @apply mt-3 pt-3 border-t border-gray-600/30 bg-gray-900/30 rounded-lg p-3;
}

.comments-section {
  @apply space-y-3;
}

.comments-title {
  @apply text-sm font-semibold text-white mb-3;
}

.comments-list {
  @apply space-y-2;
}

.comment-item {
  @apply p-3 bg-gray-800/50 rounded-lg border border-gray-600/30;
}

.comment-header {
  @apply flex items-center justify-between mb-2;
}

.commenter-info {
  @apply flex items-center gap-2;
}

.commenter-name {
  @apply text-sm font-medium text-white;
}

.comment-date {
  @apply text-xs text-gray-400;
}

.comment-content {
  @apply text-sm text-gray-300;
}

/* 다크 테마 모달 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-600;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-600;
}

.modal-body {
  @apply p-4 space-y-4;
}

.seed-info {
  @apply p-3 bg-gray-700/50 rounded-lg border border-gray-600/50;
}

.modal-footer {
  @apply flex gap-3 justify-end p-4 border-t border-gray-600;
}
</style>