import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Quest, QuestDefinition } from '@/types'
import { useSupabaseFoodStore } from '@/stores/supabase-food'

export const useQuestStore = defineStore('quest', () => {
  const receivedQuests = ref<Quest[]>([])
  const availableQuests = ref<Quest[]>([])
  const acceptedQuests = ref<Quest[]>([])
  const completedQuests = ref<Quest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 일일 퀘스트 제한
  const DAILY_QUEST_LIMIT = 10
  const MAX_ACCEPTED_QUESTS = 4

  // 퀘스트 정의 (DB에서 가져옴)
  const questDefinitions = ref<QuestDefinition[]>([])

  // 퀘스트 정의 로드
  async function loadQuestDefinitions(): Promise<void> {
    try {
      console.log('Loading quest definitions from database...')
      
      const { data, error: supabaseError } = await supabase
        .from('quest_definitions')
        .select('*')
        .order('id')

      if (supabaseError) {
        console.error('Supabase error loading quest definitions:', supabaseError)
        console.error('Error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        })
        throw supabaseError
      }

      questDefinitions.value = data || []
      console.log('Loaded quest definitions:', questDefinitions.value.length)
      console.log('Quest definitions:', questDefinitions.value)
      
      // 퀘스트 정의가 없으면 기본값 사용
      if (questDefinitions.value.length === 0) {
        console.log('No quest definitions found in DB, using defaults')
        questDefinitions.value = getDefaultQuestDefinitions()
      }
    } catch (err) {
      console.error('Error loading quest definitions:', err)
      console.log('Using default quest definitions due to error')
      // DB 연결 실패 시 기본 퀘스트 정의 사용
      questDefinitions.value = getDefaultQuestDefinitions()
    }
  }

  // 기본 퀘스트 정의 (DB 연결 실패 시 사용)
  function getDefaultQuestDefinitions(): QuestDefinition[] {
    return [
      {
        id: 'quest_001',
        title: '아침 운동',
        description: '가벼운 운동으로 하루를 시작하여 에너지를 충전하세요.',
        min_duration_hours: 8,
        max_duration_hours: 12,
        min_reward_food: 3,
        max_reward_food: 5,
        bonus_reward_chance: 0.05,
        bonus_reward_food: 10,
        category: 'daily',
        difficulty: 'easy'
      },
      {
        id: 'quest_002',
        title: '숲 탐험',
        description: '신비로운 숲을 탐험하고 숨겨진 보물을 발견하세요.',
        min_duration_hours: 10,
        max_duration_hours: 16,
        min_reward_food: 4,
        max_reward_food: 6,
        bonus_reward_chance: 0.05,
        bonus_reward_food: 10,
        category: 'adventure',
        difficulty: 'normal'
      }
    ]
  }

  // Computed properties
  const todayCompletedCount = computed(() => {
    const today = new Date().toDateString()
    return completedQuests.value.filter(quest => 
      quest.completed_at && new Date(quest.completed_at).toDateString() === today
    ).length
  })

  const canAcceptMoreQuests = computed(() => {
    return acceptedQuests.value.length < MAX_ACCEPTED_QUESTS
  })

  const canCompleteMoreToday = computed(() => {
    return todayCompletedCount.value < DAILY_QUEST_LIMIT
  })

  const questProgress = computed(() => {
    return {
      dailyCompleted: todayCompletedCount.value,
      dailyLimit: DAILY_QUEST_LIMIT,
      acceptedCount: acceptedQuests.value.length,
      maxAccepted: MAX_ACCEPTED_QUESTS
    }
  })

  // 퀘스트 보상 계산
  function calculateQuestReward(definition: QuestDefinition): number {
    const baseReward = Math.floor(
      Math.random() * (definition.max_reward_food - definition.min_reward_food + 1) + 
      definition.min_reward_food
    )
    
    // 5% 확률로 보너스 보상
    if (Math.random() < definition.bonus_reward_chance) {
      return definition.bonus_reward_food
    }
    
    return baseReward
  }

  // 퀘스트 지속 시간 계산 (8-16시간 랜덤)
  function calculateQuestDuration(definition: QuestDefinition): number {
    return Math.floor(
      Math.random() * (definition.max_duration_hours - definition.min_duration_hours + 1) + 
      definition.min_duration_hours
    )
  }

  // 퀘스트 로드
  async function loadQuests(characterId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      console.log('Loading quests for character:', characterId)
      
      // 먼저 퀘스트 정의 로드
      await loadQuestDefinitions()
      
      console.log('Loading individual quests from database...')
      const { data, error: supabaseError } = await supabase
        .from('quests')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('Supabase error loading quests:', supabaseError)
        console.error('Error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        })
        throw supabaseError
      }

      const quests = data || []
      console.log('Loaded quests from DB:', quests.length)
      console.log('Quests data:', quests)
      
      // 상태별로 분류
      receivedQuests.value = quests.filter(q => q.status === 'received')
      availableQuests.value = quests.filter(q => q.status === 'available')
      acceptedQuests.value = quests.filter(q => q.status === 'accepted')
      completedQuests.value = quests.filter(q => q.status === 'completed')

      console.log('Available quests:', availableQuests.value.length)
      console.log('Accepted quests:', acceptedQuests.value.length)
      console.log('Completed quests:', completedQuests.value.length)

      // 만료된 퀘스트 체크
      await checkExpiredQuests(characterId)
      
    } catch (err) {
      console.error('Error loading quests:', err)
      
      // DB 에러 시 localStorage에서 로드 시도
      try {
        console.log('Trying to load quests from localStorage...')
        const localQuests = JSON.parse(localStorage.getItem(`quests_${characterId}`) || '[]')
        
        if (localQuests.length > 0) {
          console.log('Loaded quests from localStorage:', localQuests.length)
          
          // 상태별로 분류
          receivedQuests.value = localQuests.filter((q: any) => q.status === 'received')
          availableQuests.value = localQuests.filter((q: any) => q.status === 'available')
          acceptedQuests.value = localQuests.filter((q: any) => q.status === 'accepted')
          completedQuests.value = localQuests.filter((q: any) => q.status === 'completed')
          
          error.value = null
        } else {
          error.value = '퀘스트를 불러오는데 실패했습니다 (DB 연결 오류)'
          // 에러 발생 시 빈 배열로 초기화
          availableQuests.value = []
          acceptedQuests.value = []
          completedQuests.value = []
        }
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr)
                  error.value = '퀘스트를 불러오는데 실패했습니다'
          // 에러 발생 시 빈 배열로 초기화
          receivedQuests.value = []
          availableQuests.value = []
          acceptedQuests.value = []
          completedQuests.value = []
      }
    } finally {
      loading.value = false
    }
  }

  // 새로운 퀘스트 생성 (처음 시작 시 받은 상태로 생성)
  async function generateNewQuests(characterId: string): Promise<void> {
    try {
      // 퀘스트 정의가 없으면 먼저 로드
      if (questDefinitions.value.length === 0) {
        await loadQuestDefinitions()
      }
      
      const newQuests: Partial<Quest>[] = []
      
      // 5개의 새로운 퀘스트 생성 (처음에는 'received' 상태로 생성)
      for (let i = 0; i < 5; i++) {
        const definition = questDefinitions.value[Math.floor(Math.random() * questDefinitions.value.length)]
        const duration = calculateQuestDuration(definition)
        const reward = calculateQuestReward(definition)
        
        newQuests.push({
          character_id: characterId,
          title: definition.title,
          description: definition.description,
          status: 'received', // 처음에는 'received' 상태
          duration_hours: duration,
          reward_food_count: reward
        })
      }

      const { error: supabaseError } = await supabase
        .from('quests')
        .insert(newQuests)

      if (supabaseError) {
        console.error('Supabase error generating quests:', supabaseError)
        throw supabaseError
      }

      // 퀘스트 다시 로드
      await loadQuests(characterId)
      
    } catch (err) {
      console.error('Error generating new quests:', err)
      error.value = err instanceof Error ? err.message : '새 퀘스트 생성에 실패했습니다'
    }
  }

  // 퀘스트 수락 (received -> accepted)
  async function acceptQuest(questId: string, characterId: string): Promise<boolean> {
    if (!canAcceptMoreQuests.value) {
      error.value = '더 이상 퀘스트를 수락할 수 없습니다'
      return false
    }

    try {
      const now = new Date()
      const quest = receivedQuests.value.find(q => q.id === questId)
      
      if (!quest) {
        error.value = '퀘스트를 찾을 수 없습니다'
        return false
      }

      const expiresAt = new Date(now.getTime() + quest.duration_hours * 60 * 60 * 1000)

      const { error: supabaseError } = await supabase
        .from('quests')
        .update({
          status: 'accepted',
          accepted_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('id', questId)

      if (supabaseError) throw supabaseError

      // 퀘스트 다시 로드
      await loadQuests(characterId)
      
      return true
    } catch (err) {
      console.error('Error accepting quest:', err)
      error.value = err instanceof Error ? err.message : '퀘스트 수락에 실패했습니다'
      return false
    }
  }

  // 퀘스트 거절 (received -> available)
  async function rejectQuest(questId: string, characterId: string): Promise<boolean> {
    try {
      const quest = receivedQuests.value.find(q => q.id === questId)
      
      if (!quest) {
        error.value = '퀘스트를 찾을 수 없습니다'
        return false
      }

      const { error: supabaseError } = await supabase
        .from('quests')
        .update({
          status: 'available'
        })
        .eq('id', questId)

      if (supabaseError) throw supabaseError

      // 퀘스트 다시 로드
      await loadQuests(characterId)
      
      return true
    } catch (err) {
      console.error('Error rejecting quest:', err)
      error.value = err instanceof Error ? err.message : '퀘스트 거절에 실패했습니다'
      return false
    }
  }

  // 만료된 퀘스트 체크
  async function checkExpiredQuests(characterId: string): Promise<void> {
    try {
      const now = new Date()
      const expiredQuests = acceptedQuests.value.filter(quest => 
        quest.expires_at && new Date(quest.expires_at) <= now
      )

      if (expiredQuests.length > 0) {
        const { error: supabaseError } = await supabase
          .from('quests')
          .update({ status: 'expired' })
          .in('id', expiredQuests.map(q => q.id))

        if (supabaseError) throw supabaseError

        // 퀘스트 다시 로드
        await loadQuests(characterId)
      }
    } catch (err) {
      console.error('Error checking expired quests:', err)
    }
  }

  // 완료된 퀘스트 체크 및 보상 지급 (시간 기반 자동 완료)
  async function checkCompletedQuests(characterId: string): Promise<void> {
    try {
      const now = new Date()
      const completedQuests = acceptedQuests.value.filter(quest => 
        quest.expires_at && new Date(quest.expires_at) <= now
      )

      if (completedQuests.length > 0) {
        console.log(`Found ${completedQuests.length} completed quests`)
        
        // 퀘스트 완료 처리
        const { error: supabaseError } = await supabase
          .from('quests')
          .update({ 
            status: 'completed',
            completed_at: now.toISOString()
          })
          .in('id', completedQuests.map(q => q.id))

        if (supabaseError) throw supabaseError

        // 보상 지급 (먹이 아이템)
        for (const quest of completedQuests) {
          console.log(`Giving reward for quest: ${quest.title} - ${quest.reward_food_count} food items`)
          
          // Supabase에 먹이 생성
          const { error: foodError } = await supabase
            .from('bugs')
            .insert(
              Array.from({ length: quest.reward_food_count }, () => ({
                character_id: characterId,
                type: 'small',
                used: false
              }))
            )
          
          if (foodError) {
            console.error('Error creating food rewards:', foodError)
          }
        }

        // Food 스토어 업데이트 및 자동 변환
        const foodStore = useSupabaseFoodStore()
        await foodStore.loadFoodFromDatabase(characterId)
        console.log('Food store updated')

        // 퀘스트 다시 로드
        await loadQuests(characterId)
        
        console.log('Quest completion and rewards processed successfully')
      }
    } catch (err) {
      console.error('Error checking completed quests:', err)
    }
  }

  // 퀘스트 완료 수동 처리 (테스트용)
  async function completeQuest(questId: string, characterId: string): Promise<boolean> {
    try {
      console.log(`Completing quest: ${questId} for character: ${characterId}`)
      
      const now = new Date()
      const quest = acceptedQuests.value.find(q => q.id === questId)
      
      if (!quest) {
        error.value = '퀘스트를 찾을 수 없습니다'
        console.error('Quest not found:', questId)
        return false
      }
      
      console.log(`Quest found: ${quest.title}, reward: ${quest.reward_food_count} food items`)
      
      const { error: supabaseError } = await supabase
        .from('quests')
        .update({ 
          status: 'completed',
          completed_at: now.toISOString()
        })
        .eq('id', questId)

      if (supabaseError) {
        console.error('Error updating quest status:', supabaseError)
        throw supabaseError
      }

      console.log('Quest status updated to completed')

      // 보상 지급 (먹이 아이템)
      console.log(`Giving ${quest.reward_food_count} food items as reward`)
      
      // Supabase에 먹이 생성
      const { error: foodError } = await supabase
        .from('bugs')
        .insert(
          Array.from({ length: quest.reward_food_count }, () => ({
            character_id: characterId,
            type: 'small',
            used: false
          }))
        )
      
      if (foodError) {
        console.error('Error creating food rewards:', foodError)
        throw foodError
      } else {
        console.log(`Successfully created ${quest.reward_food_count} food items in DB`)
      }

      // Food 스토어 업데이트 및 자동 변환
      const foodStore = useSupabaseFoodStore()
      await foodStore.loadFoodFromDatabase(characterId)
      console.log('Food store updated')

      // 퀘스트 다시 로드
      await loadQuests(characterId)
      console.log('Quests reloaded')
      
      return true
    } catch (err) {
      console.error('Error completing quest:', err)
      error.value = err instanceof Error ? err.message : '퀘스트 완료에 실패했습니다'
      return false
    }
  }

  // 퀘스트 초기화 (캐릭터 생성 시)
  async function initializeQuests(characterId: string): Promise<void> {
    try {
      console.log('Initializing quests for character:', characterId)
      
      // 퀘스트 정의 로드
      await loadQuestDefinitions()
      
      // 퀘스트 테이블이 없을 경우를 대비해 에러 처리
      try {
        await generateNewQuests(characterId)
      } catch (err) {
        console.error('Error generating new quests, table might not exist:', err)
        // 테이블이 없을 경우 기본 퀘스트만 생성
        const defaultQuests = getDefaultQuestDefinitions().slice(0, 2)
        const newQuests: Partial<Quest>[] = []
        
        for (const definition of defaultQuests) {
          const duration = calculateQuestDuration(definition)
          const reward = calculateQuestReward(definition)
          
          newQuests.push({
            character_id: characterId,
            title: definition.title,
            description: definition.description,
            status: 'available',
            duration_hours: duration,
            reward_food_count: reward
          })
        }
        
        // 로컬 스토리지에 저장 (임시 해결책)
        const existingQuests = JSON.parse(localStorage.getItem(`quests_${characterId}`) || '[]')
        const allQuests = [...existingQuests, ...newQuests]
        localStorage.setItem(`quests_${characterId}`, JSON.stringify(allQuests))
        
        console.log('Saved quests to localStorage as fallback')
      }
    } catch (err) {
      console.error('Error initializing quests:', err)
    }
  }

  return {
    // State
    receivedQuests,
    availableQuests,
    acceptedQuests,
    completedQuests,
    questDefinitions,
    loading,
    error,
    
    // Computed
    todayCompletedCount,
    canAcceptMoreQuests,
    canCompleteMoreToday,
    questProgress,
    
    // Actions
    loadQuests,
    loadQuestDefinitions,
    generateNewQuests,
    acceptQuest,
    rejectQuest,
    completeQuest,
    checkExpiredQuests,
    checkCompletedQuests,
    initializeQuests
  }
}) 