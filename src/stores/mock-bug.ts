import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Bug } from '@/types'

interface FoodItem {
  id: string
  type: 'small' | 'large' // 작은 먹이 또는 큰 먹이
  createdAt: Date
  used: boolean
}

interface BoxItem {
  id: string
  type: 'box'
  createdAt: Date
  opened: boolean
}

export const useMockBugStore = defineStore('mock-bug', () => {
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

  // 로컬 스토리지에서 먹이 데이터 로드
  function loadFoodFromStorage(characterId: string): void {
    try {
      const storageKey = `food_${characterId}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        foodItems.value = data.foodItems?.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })) || []
        boxItems.value = data.boxItems?.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })) || []
        lastFoodTime.value = data.lastFoodTime ? new Date(data.lastFoodTime) : null
      }
    } catch (error) {
      console.error('Error loading food from storage:', error)
    }
  }

  // 로컬 스토리지에 먹이 데이터 저장
  function saveFoodToStorage(characterId: string): void {
    try {
      const storageKey = `food_${characterId}`
      const data = {
        foodItems: foodItems.value,
        boxItems: boxItems.value,
        lastFoodTime: lastFoodTime.value?.toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving food to storage:', error)
    }
  }

  // 작은 먹이를 큰 먹이로 변환
  function convertSmallToLarge(): void {
    const smallFoods = availableFood.value.filter(food => food.type === 'small')
    
    while (smallFoods.length >= SMALL_FOOD_TO_LARGE) {
      // 10개 작은 먹이를 사용 처리
      for (let i = 0; i < SMALL_FOOD_TO_LARGE; i++) {
        const smallFood = smallFoods[i]
        const index = foodItems.value.findIndex(food => food.id === smallFood.id)
        if (index !== -1) {
          foodItems.value[index].used = true
        }
      }
      
      // 1개 큰 먹이 생성
      const largeFood: FoodItem = {
        id: crypto.randomUUID(),
        type: 'large',
        createdAt: new Date(),
        used: false
      }
      foodItems.value.push(largeFood)
      
      // 배열 업데이트
      smallFoods.splice(0, SMALL_FOOD_TO_LARGE)
    }
  }

  // 먹이 생성 및 변환 체크
  function checkAndGenerateFood(characterId: string): void {
    if (!canGenerateFood.value) return

    const now = new Date()
    
    // 마지막 먹이 생성 시간이 없으면 현재 시간으로 설정
    if (!lastFoodTime.value) {
      lastFoodTime.value = now
      saveFoodToStorage(characterId)
      return
    }

    // 오프라인 시간 동안 생성되어야 할 먹이 계산
    const timeSinceLastFood = now.getTime() - lastFoodTime.value.getTime()
    const foodToGenerate = Math.floor(timeSinceLastFood / BUG_GENERATION_INTERVAL)
    
    if (foodToGenerate > 0) {
      // 오프라인 시간 동안 생성된 먹이들을 생성
      for (let i = 0; i < foodToGenerate && canGenerateFood.value; i++) {
        const foodTime = new Date(lastFoodTime.value.getTime() + (i + 1) * BUG_GENERATION_INTERVAL)
        
        const smallFood: FoodItem = {
          id: crypto.randomUUID(),
          type: 'small',
          createdAt: foodTime,
          used: false
        }
        
        foodItems.value.push(smallFood)
      }
      
      // 마지막 먹이 생성 시간 업데이트
      lastFoodTime.value = new Date(lastFoodTime.value.getTime() + foodToGenerate * BUG_GENERATION_INTERVAL)
      
      // 작은 먹이를 큰 먹이로 변환 체크
      convertSmallToLarge()
      
      // 로컬 스토리지에 저장
      saveFoodToStorage(characterId)
      
      console.log(`Generated ${foodToGenerate} small foods during offline time, total small: ${smallFoodCount.value}, large: ${largeFoodCount.value}`)
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
    
    return {
      coins: coinChance < 0.15 ? calculateCoinReward() : null, // 15% 확률
      box: boxChance < 0.05 // 5% 확률
    }
  }

  // 상자 생성
  function createBox(characterId: string): void {
    const box: BoxItem = {
      id: crypto.randomUUID(),
      type: 'box',
      createdAt: new Date(),
      opened: false
    }
    
    boxItems.value.push(box)
    saveFoodToStorage(characterId)
  }

  // 상자 열기
  async function openBox(boxId: string, characterId: string): Promise<{ success: boolean; message?: string }> {
    const box = boxItems.value.find(b => b.id === boxId && !b.opened)
    
    if (!box) {
      return { success: false, message: 'Box not found or already opened' }
    }

    try {
      // 상자를 열린 상태로 변경
      const index = boxItems.value.findIndex(b => b.id === boxId)
      if (index !== -1) {
        boxItems.value[index].opened = true
      }

      // 로컬 스토리지에 저장
      saveFoodToStorage(characterId)

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
      const index = foodItems.value.findIndex(f => f.id === foodId)
      if (index !== -1) {
        foodItems.value[index].used = true
      }

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
            createBox(characterId)
          }
        }

        // 로컬 스토리지에 저장
        saveFoodToStorage(characterId)

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
          createBox(characterId)
        }

        // 로컬 스토리지에 저장
        saveFoodToStorage(characterId)

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
  function startFoodTimer(characterId: string): void {
    if (foodTimer.value) {
      clearInterval(foodTimer.value)
    }

    // 즉시 체크
    checkAndGenerateFood(characterId)

    // 1분마다 체크
    foodTimer.value = setInterval(() => {
      checkAndGenerateFood(characterId)
    }, 60 * 1000)
  }

  // 먹이 타이머 중지
  function stopFoodTimer(): void {
    if (foodTimer.value) {
      clearInterval(foodTimer.value)
      foodTimer.value = null
    }
  }

  // 초기 먹이 9개 생성
  function createInitialFood(characterId: string): void {
    const now = new Date()
    
    // 초기 작은 먹이 9개 생성
    for (let i = 0; i < 9; i++) {
      const smallFood: FoodItem = {
        id: crypto.randomUUID(),
        type: 'small',
        createdAt: new Date(now.getTime() - i * 1000), // 1초씩 차이나게 생성
        used: false
      }
      foodItems.value.push(smallFood)
    }
    
    // 작은 먹이를 큰 먹이로 변환 체크
    convertSmallToLarge()
    
    // 로컬 스토리지에 저장
    saveFoodToStorage(characterId)
    
    console.log('Created initial 9 small foods')
  }

  // 캐릭터 로드 시 호출
  function loadFood(characterId: string): void {
    loadFoodFromStorage(characterId)
    
    // 저장된 데이터가 없으면 초기 먹이 생성
    if (foodItems.value.length === 0) {
      createInitialFood(characterId)
    }
    
    startFoodTimer(characterId)
  }

  // 캐릭터 로그아웃 시 호출
  function unloadFood(): void {
    stopFoodTimer()
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
    checkAndGenerateFood,
    convertSmallToLarge,
    createInitialFood,
    saveFoodToStorage
  }
}) 