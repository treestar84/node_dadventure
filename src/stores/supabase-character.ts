import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterStats, Species, Job } from '@/types'

export const useSupabaseCharacterStore = defineStore('supabase-character', () => {
  const currentCharacter = ref<Character | null>(null)
  const isLoggedIn = ref(false)
  const loading = ref(false)
  
  const characterLevel = computed(() => currentCharacter.value?.level || 1)
  const characterExp = computed(() => currentCharacter.value?.exp || 0)
  const characterCoins = computed(() => currentCharacter.value?.coins || 0)
  
  const expToNextLevel = computed(() => {
    const currentLevel = characterLevel.value
    const expForNextLevel = Math.pow(currentLevel, 2) * 100
    return expForNextLevel - characterExp.value
  })
  
  const availableStatPoints = computed(() => {
    if (!currentCharacter.value) return 0
    const totalSpentPoints = Object.values(currentCharacter.value.stats).reduce((sum, stat) => sum + stat, 0)
    const basePoints = 15 * 10 // 15 stats * 10 base points each
    const levelBonusPoints = (currentCharacter.value.level - 1) * 5
    return basePoints + levelBonusPoints - totalSpentPoints
  })

  function generateRandomPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  async function createCharacter(name: string, species: Species, job: Job): Promise<{ success: boolean; password?: string; error?: string }> {
    loading.value = true
    
    try {
      // 비밀번호 생성
      const password = generateRandomPassword()
      const passwordHash = btoa(password)
      
      // 기본 스탯 설정
      const defaultStats: CharacterStats = {
        str: 10, dex: 10, int: 10, vit: 10, agi: 10, luk: 10,
        playfulness: 10, curiosity: 10, sensitivity: 10, awareness: 10,
        meddling: 10, pragmatism: 10, appetite: 10, anger_control: 10, clumsiness: 10
      }
      
      // 캐릭터 생성
      const { data: character, error } = await supabase
        .from('characters')
        .insert({
          name,
          password_hash: passwordHash,
          species,
          job,
          level: 1,
          age: 1,
          stats: defaultStats,
          emotion: 'happy',
          appearance: {},
          coins: 100,
          exp: 0,
          items: []
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // unique violation
          return { success: false, error: 'Character name already exists' }
        }
        throw error
      }
      
      // 초기 먹이 생성 (DB 함수 호출)
      const { error: foodError } = await supabase.rpc('create_initial_food', {
        character_uuid: character.id
      })
      
      if (foodError) {
        console.error('Error creating initial food:', foodError)
      }
      
      currentCharacter.value = character
      isLoggedIn.value = true
      
      return { success: true, password }
    } catch (error) {
      console.error('Error creating character:', error)
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function createCharacterWithPassword(name: string, password: string, species: Species, job: Job): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      const passwordHash = btoa(password)
      
      // 기본 스탯 설정
      const defaultStats: CharacterStats = {
        str: 10, dex: 10, int: 10, vit: 10, agi: 10, luk: 10,
        playfulness: 10, curiosity: 10, sensitivity: 10, awareness: 10,
        meddling: 10, pragmatism: 10, appetite: 10, anger_control: 10, clumsiness: 10
      }
      
      // 캐릭터 생성
      const { data: character, error } = await supabase
        .from('characters')
        .insert({
          name,
          password_hash: passwordHash,
          species,
          job,
          level: 1,
          age: 1,
          stats: defaultStats,
          emotion: 'happy',
          appearance: {},
          coins: 100,
          exp: 0,
          items: []
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // unique violation
          return { success: false, error: 'Character name already exists' }
        }
        throw error
      }
      
      // 초기 먹이 생성 (DB 함수 호출)
      const { error: foodError } = await supabase.rpc('create_initial_food', {
        character_uuid: character.id
      })
      
      if (foodError) {
        console.error('Error creating initial food:', foodError)
      }
      
      currentCharacter.value = character
      isLoggedIn.value = true
      
      return { success: true }
    } catch (error) {
      console.error('Error creating character:', error)
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function loginCharacter(name: string, password: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      const passwordHash = btoa(password)
      
      // 캐릭터 조회
      const { data: character, error } = await supabase
        .from('characters')
        .select('*')
        .eq('name', name)
        .eq('password_hash', passwordHash)
        .single()
      
      if (error || !character) {
        return { success: false, error: 'Invalid character name or password' }
      }
      
      // 오프라인 먹이 생성 체크
      const { data: generatedFood, error: foodError } = await supabase.rpc('generate_offline_food', {
        character_uuid: character.id
      })
      
      if (foodError) {
        console.error('Error generating offline food:', foodError)
      } else if (generatedFood > 0) {
        console.log(`Generated ${generatedFood} food items during offline time`)
      }
      
      currentCharacter.value = character
      isLoggedIn.value = true
      
      return { success: true }
    } catch (error) {
      console.error('Error logging in character:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function updateCharacterStats(newStats: Partial<CharacterStats>): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      const updatedStats = { ...currentCharacter.value.stats, ...newStats }
      
      const { error } = await supabase
        .from('characters')
        .update({ stats: updatedStats })
        .eq('id', currentCharacter.value.id)
      
      if (error) throw error
      
      currentCharacter.value.stats = updatedStats
      return true
    } catch (error) {
      console.error('Error updating character stats:', error)
      return false
    }
  }

  async function updateCharacterEmotion(emotion: string): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      const { error } = await supabase
        .from('characters')
        .update({ emotion })
        .eq('id', currentCharacter.value.id)
      
      if (error) throw error
      
      currentCharacter.value.emotion = emotion
      return true
    } catch (error) {
      console.error('Error updating character emotion:', error)
      return false
    }
  }

  async function gainExperience(amount: number): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      const newExp = currentCharacter.value.exp + amount
      
      const { error } = await supabase
        .from('characters')
        .update({ exp: newExp })
        .eq('id', currentCharacter.value.id)
      
      if (error) throw error
      
      // 레벨 재계산 (DB 트리거가 자동으로 처리)
      const { data: updatedCharacter, error: fetchError } = await supabase
        .from('characters')
        .select('level, exp')
        .eq('id', currentCharacter.value.id)
        .single()
      
      if (fetchError) throw fetchError
      
      currentCharacter.value.exp = updatedCharacter.exp
      currentCharacter.value.level = updatedCharacter.level
      
      return true
    } catch (error) {
      console.error('Error gaining experience:', error)
      return false
    }
  }

  async function spendCoins(amount: number): Promise<boolean> {
    if (!currentCharacter.value || currentCharacter.value.coins < amount) return false
    
    try {
      const newCoins = currentCharacter.value.coins - amount
      
      const { error } = await supabase
        .from('characters')
        .update({ coins: newCoins })
        .eq('id', currentCharacter.value.id)
      
      if (error) throw error
      
      currentCharacter.value.coins = newCoins
      return true
    } catch (error) {
      console.error('Error spending coins:', error)
      return false
    }
  }

  async function logout() {
    currentCharacter.value = null
    isLoggedIn.value = false
  }

  return {
    currentCharacter,
    isLoggedIn,
    loading,
    characterLevel,
    characterExp,
    characterCoins,
    expToNextLevel,
    availableStatPoints,
    createCharacter,
    createCharacterWithPassword,
    loginCharacter,
    updateCharacterStats,
    updateCharacterEmotion,
    gainExperience,
    spendCoins,
    logout
  }
}) 