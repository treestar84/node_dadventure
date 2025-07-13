<template>
  <div class="achievement-panel">
    <!-- Achievement Summary -->
    <div class="achievement-summary">
      <div class="summary-header">
        <h3 class="section-title">🏆 업적</h3>
        <div class="completion-rate">
          {{ achievementStats.unlockedAchievements }}/{{ achievementStats.totalAchievements }}
          <span class="percentage">({{ achievementStats.completionRate }}%)</span>
        </div>
      </div>
      <div class="total-points">
        <span class="points-label">총 포인트:</span>
        <span class="points-value">{{ achievementStats.totalPoints }}</span>
      </div>
    </div>

    <!-- Achievement Tabs -->
    <div class="achievement-tabs">
      <button 
        v-for="category in categories" 
        :key="category.key"
        @click="selectedCategory = category.key"
        :class="['tab-button', { active: selectedCategory === category.key }]"
      >
        {{ category.emoji }} {{ category.name }}
        <span class="category-count">{{ getCategoryCount(category.key) }}</span>
      </button>
    </div>

    <!-- Achievement List -->
    <div class="achievement-list">
      <div 
        v-for="achievement in filteredAchievements" 
        :key="achievement.key"
        :class="['achievement-item', achievement.tier, { unlocked: isUnlocked(achievement.key) }]"
      >
        <div class="achievement-icon">
          {{ achievement.icon || '🏆' }}
        </div>
        <div class="achievement-content">
          <div class="flex justify-between items-start gap-3 mb-2">
            <div class="flex-1 min-w-0 space-y-1">
              <h4 class="text-sm font-bold text-white leading-tight">{{ achievement.title }}</h4>
              <span class="text-xs text-gray-300 leading-relaxed opacity-90 block">{{ achievement.description }}</span>
            </div>
            <div class="flex-shrink-0">
              <div class="text-xs font-bold text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-2 py-1 rounded-full border border-yellow-500/30 shadow-sm">{{ achievement.points }}pt</div>
            </div>
          </div>
          
          <!-- Progress Bar (for unfinished achievements) -->
          <div v-if="!isUnlocked(achievement.key)" class="achievement-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgress(achievement.key) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(getProgress(achievement.key)) }}%</span>
          </div>
          
          <!-- Achievement Date (for completed achievements) -->
          <div v-else class="achievement-date">
            달성일: {{ formatDate(getAchievementDate(achievement.key)) }}
          </div>
        </div>
        <div class="achievement-tier-badge">
          {{ getTierEmoji(achievement.tier) }}
        </div>
      </div>
    </div>

    <!-- Next Achievements -->
    <div v-if="selectedCategory === 'all'" class="next-achievements">
      <h4 class="section-subtitle">🎯 다음 목표</h4>
      <div class="next-list">
        <div 
          v-for="next in nextAchievements" 
          :key="next.definition.key"
          class="next-achievement"
        >
          <span class="next-icon">{{ next.definition.icon || '🏆' }}</span>
          <div class="next-content">
            <span class="next-title">{{ next.definition.title }}</span>
            <div class="next-progress">
              <div class="progress-bar mini">
                <div 
                  class="progress-fill" 
                  :style="{ width: next.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text mini">{{ Math.round(next.progress) }}%</span>
            </div>
          </div>
          <span class="next-points">{{ next.definition.points }}pt</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAchievementStore } from '../stores/achievement'
import { useCharacterStore } from '../stores/character'
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievements'
import type { AchievementCategory } from '../types'

const achievementStore = useAchievementStore()
const characterStore = useCharacterStore()

const selectedCategory = ref<AchievementCategory | 'all'>('all' as const)

const categories = [
  { key: 'all' as const, name: '전체', emoji: '🏆' },
  { key: 'first_steps' as const, name: '첫걸음', emoji: '🐾' },
  { key: 'progression' as const, name: '성장', emoji: '📈' },
  { key: 'social' as const, name: '사교', emoji: '👥' },
  { key: 'scholar' as const, name: '학자', emoji: '📚' }
]

const achievementStats = computed(() => achievementStore.achievementStats)

const filteredAchievements = computed(() => {
  if (selectedCategory.value === 'all') {
    return ACHIEVEMENT_DEFINITIONS.filter(def => !def.hidden)
  }
  return achievementStore.getAchievementsByCategory(selectedCategory.value as string)
})

const nextAchievements = computed(() => {
  if (!characterStore.currentCharacter) return []
  return achievementStore.getNextAchievements(characterStore.currentCharacter, 5)
})

function isUnlocked(achievementKey: string): boolean {
  return achievementStore.achievements.some(ach => ach.key === achievementKey)
}

function getProgress(achievementKey: string): number {
  if (!characterStore.currentCharacter) return 0
  return achievementStore.getAchievementProgress(characterStore.currentCharacter, achievementKey)
}

function getAchievementDate(achievementKey: string): string {
  const achievement = achievementStore.achievements.find(ach => ach.key === achievementKey)
  return achievement?.achieved_at || ''
}

function getCategoryCount(categoryKey: string): number {
  if (categoryKey === 'all') {
    return achievementStore.achievements.length
  }
  return achievementStore.achievements.filter(ach => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === ach.key)
    return def?.category === categoryKey
  }).length
}

function getTierEmoji(tier: string): string {
  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈', 
    gold: '🥇',
    platinum: '💎',
    diamond: '👑'
  }
  return tierEmojis[tier as keyof typeof tierEmojis] || '🏆'
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  if (characterStore.currentCharacter) {
    await achievementStore.loadAchievements(characterStore.currentCharacter.id)
  }
})
</script>

<style scoped>
.achievement-panel {
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

.achievement-panel::-webkit-scrollbar {
  width: 6px;
}

.achievement-panel::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.achievement-panel::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.achievement-panel::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.achievement-summary {
  @apply mb-3 p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30;
}

.summary-header {
  @apply flex justify-between items-center mb-1;
}

.section-title {
  @apply text-base font-bold text-white;
}

.completion-rate {
  @apply text-sm font-semibold text-purple-300;
}

.percentage {
  @apply text-purple-200;
}

.total-points {
  @apply text-sm;
}

.points-label {
  @apply text-gray-300;
}

.points-value {
  @apply font-bold text-orange-400;
}

.achievement-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: none;
  overflow: visible;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #d1d5db;
  background-color: #374151;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 32px;
}

.tab-button:hover {
  background-color: #4b5563;
  border-color: #6b7280;
}

.tab-button.active {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.category-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: #e5e7eb;
  background-color: #4b5563;
  border-radius: 9999px;
  min-width: 18px;
  height: 18px;
  line-height: 1;
}

.tab-button.active .category-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.achievement-list {
  @apply space-y-1 mb-3;
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.achievement-list::-webkit-scrollbar {
  width: 6px;
}

.achievement-list::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.achievement-list::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.achievement-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.achievement-item {
  @apply flex items-start gap-2 p-2 rounded border transition-all duration-200;
  @apply bg-gray-800/50 border-gray-600;
}

.achievement-item.unlocked {
  @apply bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500 shadow-sm;
}

.achievement-item.bronze.unlocked {
  @apply from-orange-900/30 to-yellow-900/30 border-orange-500;
}

.achievement-item.silver.unlocked {
  @apply from-gray-900/30 to-slate-900/30 border-gray-400;
}

.achievement-item.gold.unlocked {
  @apply from-yellow-900/30 to-orange-900/30 border-yellow-500;
}

.achievement-item.platinum.unlocked {
  @apply from-purple-900/30 to-indigo-900/30 border-purple-500;
}

.achievement-item.diamond.unlocked {
  @apply from-pink-900/30 to-purple-900/30 border-pink-500;
}

.achievement-icon {
  @apply text-lg flex-shrink-0;
}

.achievement-content {
  @apply flex-1 min-w-0;
}

.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.achievement-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.achievement-title {
  font-weight: 700;
  color: #ffffff;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
}

.achievement-description {
  color: #d1d5db;
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0;
  word-break: break-word;
  opacity: 0.9;
}

.achievement-meta {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}

.achievement-points {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fbbf24;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.progress-bar {
  flex: 1;
  background-color: #374151;
  border-radius: 9999px;
  height: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.625rem;
  font-weight: 500;
  color: #9ca3af;
  white-space: nowrap;
}

.achievement-date {
  font-size: 0.625rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.achievement-tier-badge {
  @apply text-base flex-shrink-0;
}

.next-achievements {
  @apply mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30;
}

.section-subtitle {
  @apply text-sm font-bold text-white mb-2;
}

.next-list {
  @apply space-y-1;
}

.next-achievement {
  @apply flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg border border-blue-600/30;
}

.next-icon {
  @apply text-sm flex-shrink-0;
}

.next-content {
  @apply flex-1 min-w-0;
}

.next-title {
  @apply text-xs font-medium text-gray-200 block;
}

.next-progress {
  @apply flex items-center gap-2 mt-1;
}

.progress-bar.mini {
  @apply h-1.5;
}

.progress-text.mini {
  @apply text-xs;
}

.next-points {
  @apply text-xs font-bold text-blue-400 flex-shrink-0;
}
</style>