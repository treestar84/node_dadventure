import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

interface FoodItem {
  id: string
  character_id: string
  type: 'small' | 'large'
  created_at: string
  used: boolean
}

interface BoxItem {
  id: string
  character_id: string
  created_at: string
  opened: boolean
  opened_at?: string
  reward?: any
}

export const useSupabaseFoodStore = defineStore('supabase-food', () => {
  const foodItems = ref<FoodItem[]>([])
  const boxItems = ref<BoxItem[]>([])
  const loading = ref(false)
  const lastFoodTime = ref<Date | null>(null)
  const foodTimer = ref<NodeJS.Timeout | null>(null)

  const BUG_GENERATION_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds
  const SMALL_FOOD_TO_LARGE = 10 // 10개 작은 먹이 = 1개 큰 먹이
  const MAX_SMALL_FOOD = 100 // 최대 100개 작은 먹이 (10개 큰 먹이)

  // 사용 가능한 먹이들 (사용되지 않은 것들)
  const availableFood = computed(() => {
    return foodItems.value.filter(food => !food.used)
  })

  // 사용 가능한 상자들 (열리지 않은 것들)
  const availableBoxes = computed(() => {
    return boxItems.value.filter(box => !box.opened)
  })

  // 작은 먹이 개수
  const smallFoodCount = computed(() => {
    return availableFood.value.filter(food => food.type === 'small').length
  })

  // 큰 먹이 개수
  const largeFoodCount = computed(() => {
    return availableFood.value.filter(food => food.type === 'large').length
  })

  // 다음 먹이 생성 시간
  const nextFoodTime = computed(() => {
    if (!lastFoodTime.value) return null
    return new Date(lastFoodTime.value.getTime() + BUG_GENERATION_INTERVAL)
  })

  // 다음 먹이까지 남은 시간 (밀리초)
  const timeUntilNextFood = computed(() => {
    if (!nextFoodTime.value) return 0
    return Math.max(0, nextFoodTime.value.getTime() - Date.now())
  })

  // 먹이 생성 가능 여부
  const canGenerateFood = computed(() => {
    return smallFoodCount.value < MAX_SMALL_FOOD
  })

  // 총 저장 가능한 먹이 개수 (작은 먹이 + 큰 먹이)
  const totalFoodCapacity = computed(() => {
    return smallFoodCount.value + largeFoodCount.value
  })

  // 저장 공간 사용률
  const storageUsage = computed(() => {
    return Math.min(100, (smallFoodCount.value / MAX_SMALL_FOOD) * 100)
  })

  // DB에서 먹이 데이터 로드
  async function loadFoodFromDatabase(characterId: string): Promise<void> {
    try {
      loading.value = true
      
      // 먹이 데이터 로드
      const { data: foods, error: foodError } = await supabase
        .from('bugs')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true })
      
      if (foodError) throw foodError
      
      foodItems.value = foods || []
      
      // 상자 데이터 로드
      const { data: boxes, error: boxError } = await supabase
        .from('boxes')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true })
      
      if (boxError) throw boxError
      
      boxItems.value = boxes || []
      
      // 마지막 먹이 생성 시간 로드
      const { data: timer, error: timerError } = await supabase
        .from('food_timers')
        .select('last_food_time')
        .eq('character_id', characterId)
        .single()
      
      if (timerError && timerError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading food timer:', timerError)
      }
      
      lastFoodTime.value = timer?.last_food_time ? new Date(timer.last_food_time) : null
      
      // 작은 먹이를 큰 먹이로 자동 변환 (무한 루프 방지를 위해 별도 처리)
      const smallFoodCount = foodItems.value.filter(f => f.type === 'small' && !f.used).length
      if (smallFoodCount >= 10) {
        await convertSmallToLarge(characterId)
        // 변환 후 데이터 다시 로드
        const { data: updatedFoods, error: foodError2 } = await supabase
          .from('bugs')
          .select('*')
          .eq('character_id', characterId)
          .order('created_at', { ascending: true })
        
        if (!foodError2) {
          foodItems.value = updatedFoods || []
        }
      }
      
    } catch (error) {
      console.error('Error loading food from database:', error)
    } finally {
      loading.value = false
    }
  }

  // 작은 먹이를 큰 먹이로 변환 (직접 SQL 사용)
  async function convertSmallToLarge(characterId: string): Promise<void> {
    try {
      // 현재 작은 먹이 개수 확인
      const { data: smallFoods, error: countError } = await supabase
        .from('bugs')
        .select('id')
        .eq('character_id', characterId)
        .eq('type', 'small')
        .eq('used', false)
      
      if (countError) throw countError
      
      const smallFoodCount = smallFoods?.length || 0
      const largeFoodsToCreate = Math.floor(smallFoodCount / 10)
      
      if (largeFoodsToCreate > 0) {
        console.log(`Converting ${largeFoodsToCreate * 10} small foods to ${largeFoodsToCreate} large foods`)
        
        // 사용할 작은 먹이들 선택 (가장 오래된 것부터)
        const foodsToUse = smallFoods.slice(0, largeFoodsToCreate * 10)
        const foodIdsToUse = foodsToUse.map(f => f.id)
        
        // 작은 먹이들을 사용 처리
        const { error: updateError } = await supabase
          .from('bugs')
          .update({ used: true })
          .in('id', foodIdsToUse)
          .eq('character_id', characterId)
        
        if (updateError) throw updateError
        
        // 큰 먹이들 생성
        const { error: insertError } = await supabase
          .from('bugs')
          .insert(
            Array.from({ length: largeFoodsToCreate }, () => ({
              character_id: characterId,
              type: 'large',
              used: false
            }))
          )
        
        if (insertError) throw insertError
        
        console.log(`Successfully converted ${largeFoodsToCreate * 10} small foods to ${largeFoodsToCreate} large foods`)
      }
    } catch (error) {
      console.error('Error converting small to large food:', error)
    }
  }

  // 오프라인 먹이 생성 체크 (DB 함수 호출)
  async function checkAndGenerateOfflineFood(characterId: string): Promise<void> {
    try {
      const { data: generatedCount, error } = await supabase.rpc('generate_offline_food', {
        character_uuid: characterId
      })
      
      if (error) throw error
      
      if (generatedCount > 0) {
        console.log(`Generated ${generatedCount} food items during offline time`)
        // 데이터 다시 로드
        await loadFoodFromDatabase(characterId)
      }
    } catch (error) {
      console.error('Error generating offline food:', error)
    }
  }

  // 코인 보상 계산
  function calculateCoinReward(): number {
    const random = Math.random()
    if (random < 0.5) return 100      // 50%
    if (random < 0.8) return 200      // 30%
    if (random < 0.95) return 300     // 15%
    return 500                        // 5%
  }

  // 보상 확률 계산
  function calculateRewards(): { coins: number | null; box: boolean } {
    const coinChance = Math.random()
    const boxChance = Math.random()
    
    let coins: number | null = null
    let box = false
    
    // 코인 보상 (80% 확률)
    if (coinChance < 0.8) {
      coins = calculateCoinReward()
    }
    
    // 상자 보상 (5% 확률)
    if (boxChance < 0.05) {
      box = true
    }
    
    return { coins, box }
  }

  // 상자 생성
  async function createBox(characterId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('boxes')
        .insert({
          character_id: characterId,
          opened: false
        })
      
      if (error) throw error
      
      // 데이터 다시 로드
      await loadFoodFromDatabase(characterId)
    } catch (error) {
      console.error('Error creating box:', error)
    }
  }

  // 상자 열기
  async function openBox(boxId: string, characterId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('boxes')
        .update({
          opened: true,
          opened_at: new Date().toISOString()
        })
        .eq('id', boxId)
        .eq('character_id', characterId)
      
      if (error) throw error
      
      // 데이터 다시 로드
      await loadFoodFromDatabase(characterId)
      
      return { success: true, message: 'Box opened! (Rewards will be implemented later)' }
    } catch (error) {
      console.error('Error opening box:', error)
      return { success: false, message: 'Failed to open box' }
    }
  }

  // 먹이 사용
  async function useFood(foodId: string, characterId: string): Promise<{ 
    success: boolean; 
    expGained?: number; 
    coinsGained?: number; 
    boxGained?: boolean;
    isLargeFood?: boolean;
    totalActions?: number;
  }> {
    const food = foodItems.value.find(f => f.id === foodId && !f.used)
    
    if (!food) {
      return { success: false }
    }

    try {
      // 먹이를 사용 처리
      const { error: updateError } = await supabase
        .from('bugs')
        .update({ used: true })
        .eq('id', foodId)
        .eq('character_id', characterId)
      
      if (updateError) throw updateError

      // 큰 먹이인 경우 10번의 행동을 시뮬레이션
      if (food.type === 'large') {
        let totalExpGained = 0
        let totalCoinsGained = 0
        let totalBoxesGained = 0

        // 10번의 작은 먹이 행동을 시뮬레이션
        for (let i = 0; i < 10; i++) {
          // 기본 경험치 (고정 80)
          totalExpGained += 80

          // 보상 계산
          const rewards = calculateRewards()
          if (rewards.coins) {
            totalCoinsGained += rewards.coins
          }
          if (rewards.box) {
            totalBoxesGained += 1
            await createBox(characterId)
          }
        }

        // 데이터 다시 로드
        await loadFoodFromDatabase(characterId)

        return { 
          success: true, 
          expGained: totalExpGained, 
          coinsGained: totalCoinsGained > 0 ? totalCoinsGained : undefined, 
          boxGained: totalBoxesGained > 0,
          isLargeFood: true,
          totalActions: 10
        }
      } else {
        // 작은 먹이 (기존 로직)
        const expGained = 80

        // 보상 계산
        const rewards = calculateRewards()
        let coinsGained: number | undefined = undefined
        let boxGained = false

        if (rewards.coins) {
          coinsGained = rewards.coins
        }

        if (rewards.box) {
          boxGained = true
          await createBox(characterId)
        }

        // 데이터 다시 로드
        await loadFoodFromDatabase(characterId)

        return { 
          success: true, 
          expGained, 
          coinsGained, 
          boxGained,
          isLargeFood: false,
          totalActions: 1
        }
      }
    } catch (error) {
      console.error('Error using food:', error)
      return { success: false }
    }
  }

  // 먹이 타이머 시작
  async function startFoodTimer(characterId: string): Promise<void> {
    if (foodTimer.value) {
      clearInterval(foodTimer.value)
    }

    // 즉시 체크
    await checkAndGenerateOfflineFood(characterId)

    // 1분마다 체크
    foodTimer.value = setInterval(async () => {
      await checkAndGenerateOfflineFood(characterId)
    }, 60 * 1000)
  }

  // 먹이 타이머 중지
  function stopFoodTimer(): void {
    if (foodTimer.value) {
      clearInterval(foodTimer.value)
      foodTimer.value = null
    }
  }

  // 캐릭터 로드 시 호출
  async function loadFood(characterId: string): Promise<void> {
    await loadFoodFromDatabase(characterId)
    await startFoodTimer(characterId)
  }

  // 캐릭터 로그아웃 시 호출
  function unloadFood(): void {
    stopFoodTimer()
    foodItems.value = []
    boxItems.value = []
    lastFoodTime.value = null
  }

  return {
    // State
    foodItems,
    boxItems,
    loading,
    lastFoodTime,
    
    // Computed
    availableFood,
    availableBoxes,
    smallFoodCount,
    largeFoodCount,
    nextFoodTime,
    timeUntilNextFood,
    canGenerateFood,
    totalFoodCapacity,
    storageUsage,
    
    // Actions
    loadFood,
    unloadFood,
    useFood,
    openBox,
    startFoodTimer,
    stopFoodTimer,
    checkAndGenerateOfflineFood,
    convertSmallToLarge,
    loadFoodFromDatabase
  }
}) 