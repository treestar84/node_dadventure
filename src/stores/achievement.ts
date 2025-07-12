import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Achievement, Character, AchievementContext, AchievementDefinition } from '../types'
import { ACHIEVEMENT_DEFINITIONS, achievementCheckers } from '../data/achievements'
import { supabase } from '../lib/supabase'
import { useNotificationStore } from './notification'

export const useAchievementStore = defineStore('achievement', () => {
  const achievements = ref<Achievement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 업적 통계 계산
  const achievementStats = computed(() => {
    const totalAchievements = ACHIEVEMENT_DEFINITIONS.length
    const unlockedAchievements = achievements.value.length
    const totalPoints = achievements.value.reduce((sum, ach) => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === ach.key)
      return sum + (def?.points || 0)
    }, 0)

    const categoryStats = achievements.value.reduce((stats, ach) => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === ach.key)
      if (def) {
        stats[def.category] = (stats[def.category] || 0) + 1
      }
      return stats
    }, {} as Record<string, number>)

    return {
      totalAchievements,
      unlockedAchievements,
      completionRate: Math.round((unlockedAchievements / totalAchievements) * 100),
      totalPoints,
      categoryStats
    }
  })

  // 캐릭터의 업적 로드
  async function loadAchievements(characterId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('achievements')
        .select('*')
        .eq('character_id', characterId)
        .order('achieved_at', { ascending: false })

      if (supabaseError) throw supabaseError

      achievements.value = data || []
    } catch (err) {
      console.error('Error loading achievements:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load achievements'
    } finally {
      loading.value = false
    }
  }

  // 업적 달성 처리
  async function unlockAchievement(characterId: string, achievementKey: string, context?: AchievementContext): Promise<Achievement | null> {
    try {
      // 이미 달성한 업적인지 확인
      const existingAchievement = achievements.value.find(ach => ach.key === achievementKey)
      if (existingAchievement) {
        return null
      }

      const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.key === achievementKey)
      if (!definition) {
        console.error(`Achievement definition not found: ${achievementKey}`)
        return null
      }

      // 업적 데이터 생성
      const achievementData = {
        character_id: characterId,
        key: definition.key,
        title: definition.title,
        description: definition.description,
        category: definition.category,
        tier: definition.tier,
        points: definition.points,
        achieved_at: new Date().toISOString(),
        reward: definition.reward,
        icon: definition.icon
      }

      // 데이터베이스에 저장
      const { data, error: supabaseError } = await supabase
        .from('achievements')
        .insert(achievementData)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      const newAchievement = data as Achievement
      achievements.value.unshift(newAchievement)

      // 보상 적용
      await applyAchievementReward(characterId, definition.reward)

      // 알림 표시
      const notificationStore = useNotificationStore()
      notificationStore.showAchievement(newAchievement)
      
      console.log(`🏆 Achievement Unlocked: ${definition.title}`)

      return newAchievement
    } catch (err) {
      console.error('Error unlocking achievement:', err)
      error.value = err instanceof Error ? err.message : 'Failed to unlock achievement'
      return null
    }
  }

  // 업적 보상 적용
  async function applyAchievementReward(characterId: string, reward: any) {
    try {
      const updates: any = {}

      if (reward.coins) {
        // 코인 추가
        const { error } = await supabase.rpc('add_character_coins', {
          character_id: characterId,
          amount: reward.coins
        })
        if (error) throw error
      }

      if (reward.exp) {
        // 경험치 추가  
        const { error } = await supabase.rpc('add_character_exp', {
          character_id: characterId,
          amount: reward.exp
        })
        if (error) throw error
      }

      if (reward.items && reward.items.length > 0) {
        // 아이템 추가
        const { error } = await supabase.rpc('add_character_items', {
          character_id: characterId,
          items: reward.items
        })
        if (error) throw error
      }

      console.log('Achievement reward applied:', reward)
    } catch (err) {
      console.error('Error applying achievement reward:', err)
    }
  }

  // 자동 업적 체크 시스템
  async function checkAchievements(character: Character, context: AchievementContext = {}) {
    const unlockedAchievements: Achievement[] = []

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      // 이미 달성한 업적은 건너뛰기
      if (achievements.value.some(ach => ach.key === definition.key)) {
        continue
      }

      let shouldUnlock = false

      // 업적 조건 체크
      switch (definition.requirements.type) {
        case 'level':
          shouldUnlock = character.level >= Number(definition.requirements.target)
          break

        case 'stat':
          if (definition.requirements.metadata?.stat) {
            const statValue = character.stats[definition.requirements.metadata.stat as keyof typeof character.stats]
            shouldUnlock = statValue >= Number(definition.requirements.target)
          }
          break

        case 'count':
          // 컨텍스트에서 카운트 정보 확인
          if (context.metadata?.[definition.key + '_count']) {
            shouldUnlock = context.metadata[definition.key + '_count'] >= Number(definition.requirements.target)
          }
          break

        case 'time':
          // 캐릭터 나이(일수) 기준
          shouldUnlock = character.age >= Number(definition.requirements.target)
          break

        case 'special':
          // 특별한 조건 체크
          if (definition.checkFunction) {
            shouldUnlock = definition.checkFunction(character, context)
          } else if (achievementCheckers[definition.requirements.target as keyof typeof achievementCheckers]) {
            shouldUnlock = achievementCheckers[definition.requirements.target as keyof typeof achievementCheckers](character, context)
          }
          break
      }

      if (shouldUnlock) {
        const achievement = await unlockAchievement(character.id, definition.key, context)
        if (achievement) {
          unlockedAchievements.push(achievement)
        }
      }
    }

    return unlockedAchievements
  }

  // 특정 액션에 대한 업적 체크
  async function checkActionAchievements(character: Character, actionType: string, metadata: Record<string, any> = {}) {
    const context: AchievementContext = {
      actionType,
      metadata: {
        ...metadata,
        // 기본 카운트 정보들을 여기서 조회해서 설정
        first_feed_count: metadata.totalBugsUsed || 0,
        first_visit_count: metadata.totalVisitsGiven || 0,
        first_gift_count: metadata.totalGifts || 0,
        first_seed_count: metadata.totalSeeds || 0,
        bug_collector_bronze_count: metadata.totalBugsUsed || 0,
        bug_collector_silver_count: metadata.totalBugsUsed || 0,
        item_collector_count: character.items.length,
        social_butterfly_count: metadata.totalVisitsGiven || 0,
        popular_friend_count: metadata.totalVisitsReceived || 0,
        generous_heart_count: metadata.totalGifts || 0,
        knowledge_tree_count: metadata.seedShares || 0,
        // Special achievement triggers
        character_created: actionType === 'character_created' ? 1 : 0
      }
    }

    return await checkAchievements(character, context)
  }

  // 레벨업 시 업적 체크
  async function checkLevelUpAchievements(character: Character, previousLevel: number) {
    const context: AchievementContext = {
      previousLevel,
      actionType: 'level_up'
    }

    return await checkAchievements(character, context)
  }

  // 업적 정의 조회
  function getAchievementDefinition(key: string): AchievementDefinition | undefined {
    return ACHIEVEMENT_DEFINITIONS.find(def => def.key === key)
  }

  // 업적 진행률 계산 (미완료 업적용)
  function getAchievementProgress(character: Character, definitionKey: string): number {
    const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.key === definitionKey)
    if (!definition || achievements.value.some(ach => ach.key === definitionKey)) {
      return 100 // 이미 달성됨
    }

    switch (definition.requirements.type) {
      case 'level':
        return Math.min(100, (character.level / (definition.requirements.target as number)) * 100)
      
      case 'stat':
        if (definition.requirements.metadata?.stat) {
          const statValue = character.stats[definition.requirements.metadata.stat as keyof typeof character.stats]
          return Math.min(100, (statValue / (definition.requirements.target as number)) * 100)
        }
        break
      
      case 'time':
        return Math.min(100, (character.age / (definition.requirements.target as number)) * 100)
      
      default:
        return 0
    }

    return 0
  }

  // 카테고리별 업적 조회
  function getAchievementsByCategory(category: string) {
    return ACHIEVEMENT_DEFINITIONS.filter(def => def.category === category)
  }

  // 달성 가능한 다음 업적들 조회
  function getNextAchievements(character: Character, limit: number = 5) {
    const unlockedKeys = new Set(achievements.value.map(ach => ach.key))
    
    return ACHIEVEMENT_DEFINITIONS
      .filter(def => !unlockedKeys.has(def.key) && !def.hidden)
      .map(def => ({
        definition: def,
        progress: getAchievementProgress(character, def.key)
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit)
  }

  return {
    // State
    achievements,
    loading,
    error,
    
    // Getters
    achievementStats,
    
    // Actions
    loadAchievements,
    unlockAchievement,
    checkAchievements,
    checkActionAchievements,
    checkLevelUpAchievements,
    getAchievementDefinition,
    getAchievementProgress,
    getAchievementsByCategory,
    getNextAchievements
  }
})