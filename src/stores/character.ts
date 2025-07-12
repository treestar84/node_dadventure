import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterStats, Species, Job } from '@/types'

export const useCharacterStore = defineStore('character', () => {
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

  async function createCharacterWithPassword(name: string, password: string, species: Species, job: Job): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      // Check if character name already exists
      const { data: existingChar } = await supabase
        .from('characters')
        .select('name')
        .eq('name', name)
        .single()
      
      if (existingChar) {
        return { success: false, error: 'Character name already exists' }
      }
      
      const passwordHash = await bcrypt.hash(password, 10)
      
      const newCharacter = {
        name,
        password_hash: passwordHash,
        species,
        job,
        level: 1,
        age: 1,
        stats: {
          str: 10, dex: 10, int: 10, vit: 10, agi: 10, luk: 10,
          playfulness: 10, curiosity: 10, sensitivity: 10, awareness: 10,
          meddling: 10, pragmatism: 10, appetite: 10, anger_control: 10, clumsiness: 10
        } as CharacterStats,
        emotion: 'happy',
        appearance: {},
        coins: 100,
        exp: 0,
        items: []
      }
      
      const { data, error } = await supabase
        .from('characters')
        .insert([newCharacter])
        .select()
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      currentCharacter.value = data
      isLoggedIn.value = true
      
      // Create initial bug for the character
      await supabase.from('bugs').insert([{ character_id: data.id }])
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function createCharacter(name: string, species: Species, job: Job): Promise<{ success: boolean; password?: string; error?: string }> {
    loading.value = true
    
    try {
      // Check if character name already exists
      const { data: existingChar } = await supabase
        .from('characters')
        .select('name')
        .eq('name', name)
        .single()
      
      if (existingChar) {
        return { success: false, error: 'Character name already exists' }
      }
      
      const password = generateRandomPassword()
      const passwordHash = await bcrypt.hash(password, 10)
      
      const newCharacter = {
        name,
        password_hash: passwordHash,
        species,
        job,
        level: 1,
        age: 1,
        stats: {
          str: 10, dex: 10, int: 10, vit: 10, agi: 10, luk: 10,
          playfulness: 10, curiosity: 10, sensitivity: 10, awareness: 10,
          meddling: 10, pragmatism: 10, appetite: 10, anger_control: 10, clumsiness: 10
        } as CharacterStats,
        emotion: 'happy',
        appearance: {},
        coins: 100,
        exp: 0,
        items: []
      }
      
      const { data, error } = await supabase
        .from('characters')
        .insert([newCharacter])
        .select()
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      currentCharacter.value = data
      isLoggedIn.value = true
      
      // Create initial bug for the character
      await supabase.from('bugs').insert([{ character_id: data.id }])
      
      return { success: true, password }
    } catch (error) {
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function loginCharacter(name: string, password: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      const { data: character, error } = await supabase
        .from('characters')
        .select('*')
        .eq('name', name)
        .single()
      
      if (error || !character) {
        return { success: false, error: 'Invalid character name or password' }
      }
      
      const isValidPassword = await bcrypt.compare(password, character.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Invalid character name or password' }
      }
      
      currentCharacter.value = character
      isLoggedIn.value = true
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
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
      
      if (error) return false
      
      currentCharacter.value.stats = updatedStats
      return true
    } catch (error) {
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
      
      if (error) return false
      
      currentCharacter.value.emotion = emotion
      return true
    } catch (error) {
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
      
      if (error) return false
      
      currentCharacter.value.exp = newExp
      // Level will be updated automatically by database trigger
      
      return true
    } catch (error) {
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
      
      if (error) return false
      
      currentCharacter.value.coins = newCoins
      return true
    } catch (error) {
      return false
    }
  }

  function logout() {
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