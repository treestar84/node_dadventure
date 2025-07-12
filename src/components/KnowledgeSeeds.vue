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
}


/* 기존 다크 테마 스타일 시스템에 맞는 최소 CSS */
.tab-content {
  @apply space-y-3;
}

.seeds-list {
  @apply space-y-3 max-h-80 overflow-y-auto;
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