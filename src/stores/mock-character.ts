import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, CharacterStats, Species, Job } from '@/types'

export const useMockCharacterStore = defineStore('mock-character', () => {
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

  // Mock storage with localStorage persistence
  const STORAGE_KEY = 'mytamalife_characters'
  
  function loadCharactersFromStorage(): Record<string, Character> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        Object.values(parsed).forEach((char: any) => {
          if (char.created_at) {
            char.created_at = new Date(char.created_at).toISOString()
          }
        })
        return parsed
      }
    } catch (error) {
      console.error('Error loading characters from storage:', error)
    }
    return {}
  }
  
  function saveCharactersToStorage(characters: Record<string, Character>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    } catch (error) {
      console.error('Error saving characters to storage:', error)
    }
  }
  
  const mockCharacters: Record<string, Character> = loadCharactersFromStorage()

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if character name already exists
      if (mockCharacters[name]) {
        return { success: false, error: 'Character name already exists' }
      }
      
      const password = generateRandomPassword()
      const passwordHash = btoa(password)
      
      const newCharacter: Character = {
        id: crypto.randomUUID(),
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
        created_at: new Date().toISOString(),
        coins: 100,
        exp: 0,
        items: []
      }
      
      // Store in mock database
      mockCharacters[name] = newCharacter
      saveCharactersToStorage(mockCharacters)
      
      currentCharacter.value = newCharacter
      isLoggedIn.value = true
      
      // Initialize food system for new character
      const { useMockBugStore } = await import('./mock-bug')
      const bugStore = useMockBugStore()
      bugStore.loadFood(newCharacter.id)
      
      return { success: true, password }
    } catch (error) {
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function createCharacterWithPassword(name: string, password: string, species: Species, job: Job): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if character name already exists
      if (mockCharacters[name]) {
        return { success: false, error: 'Character name already exists' }
      }
      
      const passwordHash = btoa(password)
      
      const newCharacter: Character = {
        id: crypto.randomUUID(),
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
        created_at: new Date().toISOString(),
        coins: 100,
        exp: 0,
        items: []
      }
      
      // Store in mock database
      mockCharacters[name] = newCharacter
      saveCharactersToStorage(mockCharacters)
      
      currentCharacter.value = newCharacter
      isLoggedIn.value = true
      
      // Initialize food system for new character
      const { useMockBugStore } = await import('./mock-bug')
      const bugStore = useMockBugStore()
      bugStore.loadFood(newCharacter.id)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to create character' }
    } finally {
      loading.value = false
    }
  }

  async function loginCharacter(name: string, password: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const passwordHash = btoa(password)
      const character = mockCharacters[name]
      
      if (!character || character.password_hash !== passwordHash) {
        return { success: false, error: 'Invalid character name or password' }
      }
      
      currentCharacter.value = character
      isLoggedIn.value = true
      
      // Initialize food system for existing character
      const { useMockBugStore } = await import('./mock-bug')
      const bugStore = useMockBugStore()
      bugStore.loadFood(character.id)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function updateCharacterStats(newStats: Partial<CharacterStats>): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const updatedStats = { ...currentCharacter.value.stats, ...newStats }
      currentCharacter.value.stats = updatedStats
      
      // Update in mock storage
      if (mockCharacters[currentCharacter.value.name]) {
        mockCharacters[currentCharacter.value.name].stats = updatedStats
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  async function updateCharacterEmotion(emotion: string): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      currentCharacter.value.emotion = emotion
      
      // Update in mock storage
      if (mockCharacters[currentCharacter.value.name]) {
        mockCharacters[currentCharacter.value.name].emotion = emotion
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  async function gainExperience(amount: number): Promise<boolean> {
    if (!currentCharacter.value) return false
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const newExp = currentCharacter.value.exp + amount
      currentCharacter.value.exp = newExp
      
      // Calculate new level
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newExp / 100)) + 1)
      currentCharacter.value.level = newLevel
      
      // Update in mock storage
      if (mockCharacters[currentCharacter.value.name]) {
        mockCharacters[currentCharacter.value.name].exp = newExp
        mockCharacters[currentCharacter.value.name].level = newLevel
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  async function spendCoins(amount: number): Promise<boolean> {
    if (!currentCharacter.value || currentCharacter.value.coins < amount) return false
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const newCoins = currentCharacter.value.coins - amount
      currentCharacter.value.coins = newCoins
      
      // Update in mock storage
      if (mockCharacters[currentCharacter.value.name]) {
        mockCharacters[currentCharacter.value.name].coins = newCoins
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  async function logout() {
    // Unload food system before logout
    if (currentCharacter.value) {
      try {
        const { useMockBugStore } = await import('./mock-bug')
        const bugStore = useMockBugStore()
        bugStore.unloadFood()
      } catch (error) {
        console.error('Error unloading food system:', error)
      }
    }
    
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