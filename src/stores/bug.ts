import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Bug } from '@/types'

export const useBugStore = defineStore('bug', () => {
  const availableBugs = ref<Bug[]>([])
  const loading = ref(false)
  const lastBugTime = ref<Date | null>(null)
  const bugTimer = ref<NodeJS.Timeout | null>(null)

  const BUG_GENERATION_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds
  const MAX_BUGS = 3 // Maximum bugs that can be stored

  const nextBugTime = computed(() => {
    if (!lastBugTime.value) return null
    return new Date(lastBugTime.value.getTime() + BUG_GENERATION_INTERVAL)
  })

  const timeUntilNextBug = computed(() => {
    if (!nextBugTime.value) return 0
    return Math.max(0, nextBugTime.value.getTime() - Date.now())
  })

  const canGenerateBug = computed(() => {
    return availableBugs.value.length < MAX_BUGS
  })

  async function loadBugs(characterId: string): Promise<void> {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('bugs')
        .select('*')
        .eq('character_id', characterId)
        .eq('used', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading bugs:', error)
        return
      }

      availableBugs.value = data || []
      
      // Set last bug time if we have bugs
      if (data && data.length > 0) {
        const lastBug = data[data.length - 1]
        lastBugTime.value = new Date(lastBug.created_at)
      }
    } catch (error) {
      console.error('Error loading bugs:', error)
    } finally {
      loading.value = false
    }
  }

  async function generateBug(characterId: string): Promise<boolean> {
    if (!canGenerateBug.value) {
      console.log('Cannot generate bug: maximum reached')
      return false
    }

    try {
      const { data, error } = await supabase
        .from('bugs')
        .insert([{ character_id: characterId }])
        .select()
        .single()

      if (error) {
        console.error('Error generating bug:', error)
        return false
      }

      availableBugs.value.push(data)
      lastBugTime.value = new Date(data.created_at)
      
      console.log('Bug generated successfully!')
      return true
    } catch (error) {
      console.error('Error generating bug:', error)
      return false
    }
  }

  async function feedBug(bugId: string, characterId: string): Promise<boolean> {
    try {
      // Mark bug as used
      const { error } = await supabase
        .from('bugs')
        .update({ used: true })
        .eq('id', bugId)

      if (error) {
        console.error('Error feeding bug:', error)
        return false
      }

      // Remove from available bugs
      availableBugs.value = availableBugs.value.filter(bug => bug.id !== bugId)
      
      console.log('Bug fed successfully!')
      return true
    } catch (error) {
      console.error('Error feeding bug:', error)
      return false
    }
  }

  function startBugTimer(characterId: string): void {
    if (bugTimer.value) {
      clearInterval(bugTimer.value)
    }

    // Check immediately
    checkAndGenerateBug(characterId)

    // Then check every minute
    bugTimer.value = setInterval(() => {
      checkAndGenerateBug(characterId)
    }, 60 * 1000) // Check every minute
  }

  function stopBugTimer(): void {
    if (bugTimer.value) {
      clearInterval(bugTimer.value)
      bugTimer.value = null
    }
  }

  async function checkAndGenerateBug(characterId: string): Promise<void> {
    if (!canGenerateBug.value) return

    const now = Date.now()
    const timeSinceLastBug = lastBugTime.value ? now - lastBugTime.value.getTime() : BUG_GENERATION_INTERVAL

    if (timeSinceLastBug >= BUG_GENERATION_INTERVAL) {
      await generateBug(characterId)
    }
  }

  // Initialize with first bug if no bugs exist
  async function initializeBugs(characterId: string): Promise<void> {
    await loadBugs(characterId)
    
    // If no bugs exist, create the first one
    if (availableBugs.value.length === 0) {
      await generateBug(characterId)
    }
    
    startBugTimer(characterId)
  }

  return {
    availableBugs,
    loading,
    lastBugTime,
    nextBugTime,
    timeUntilNextBug,
    canGenerateBug,
    loadBugs,
    generateBug,
    feedBug,
    startBugTimer,
    stopBugTimer,
    initializeBugs
  }
})