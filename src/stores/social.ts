import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { Character } from '../types'
import { useAchievementStore } from './achievement'

export interface DiscoverableCharacter {
  id: string
  name: string
  species: string
  job: string
  level: number
  last_active_at: string
  online_status: 'online' | 'away' | 'offline'
  public_message?: string
  popularity_score: number
  is_friend: boolean
  friendship_status: string
}

export interface Friend {
  friend_id: string
  friend_name: string
  friend_species: string
  friend_job: string
  friend_level: number
  friendship_created_at: string
  last_active_at: string
  online_status: 'online' | 'away' | 'offline'
}

export interface Visit {
  id: string
  visitor_id: string
  visited_id: string
  visit_type: 'casual' | 'greeting' | 'play' | 'help'
  interaction_data: Record<string, any>
  visited_at: string
  visitor?: Character
  visited?: Character
}

export interface FriendRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
  requester?: Character
}

export const useSocialStore = defineStore('social', () => {
  const discoverableCharacters = ref<DiscoverableCharacter[]>([])
  const friends = ref<Friend[]>([])
  const recentVisits = ref<Visit[]>([])
  const friendRequests = ref<FriendRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed values
  const onlineFriends = computed(() => 
    friends.value.filter(friend => friend.online_status === 'online')
  )

  const pendingFriendRequests = computed(() => 
    friendRequests.value.filter(req => req.status === 'pending')
  )

  // Load discoverable characters for exploration
  async function loadDiscoverableCharacters(characterId: string, limit = 20, offset = 0) {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase.rpc('get_discoverable_characters', {
        requesting_character_id: characterId,
        limit_count: limit,
        offset_count: offset
      })

      if (supabaseError) throw supabaseError

      discoverableCharacters.value = data || []
    } catch (err) {
      console.error('Error loading discoverable characters:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load characters'
    } finally {
      loading.value = false
    }
  }

  // Load character's friends
  async function loadFriends(characterId: string) {
    try {
      const { data, error: supabaseError } = await supabase.rpc('get_character_friends', {
        character_id: characterId
      })

      if (supabaseError) throw supabaseError

      friends.value = data || []
    } catch (err) {
      console.error('Error loading friends:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load friends'
    }
  }

  // Load recent visits
  async function loadRecentVisits(characterId: string, limit = 20) {
    try {
      const { data, error: supabaseError } = await supabase
        .from('visits')
        .select(`
          *,
          visitor:characters!visitor_id(id, name, species, job, level),
          visited:characters!visited_id(id, name, species, job, level)
        `)
        .or(`visitor_id.eq.${characterId},visited_id.eq.${characterId}`)
        .order('visited_at', { ascending: false })
        .limit(limit)

      if (supabaseError) throw supabaseError

      recentVisits.value = data || []
    } catch (err) {
      console.error('Error loading recent visits:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load visits'
    }
  }

  // Send friend request
  async function sendFriendRequest(characterId: string, targetCharacterName: string) {
    try {
      const { data, error: supabaseError } = await supabase.rpc('send_friend_request', {
        requester_character_id: characterId,
        target_character_name: targetCharacterName
      })

      if (supabaseError) throw supabaseError

      if (data.success) {
        // Refresh discoverable characters to update friendship status
        await loadDiscoverableCharacters(characterId)
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error sending friend request:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send friend request' }
    }
  }

  // Visit a character
  async function visitCharacter(
    visitorId: string, 
    targetCharacterName: string, 
    visitType: 'casual' | 'greeting' | 'play' | 'help' = 'casual',
    interactionData: Record<string, any> = {}
  ) {
    try {
      const { data, error: supabaseError } = await supabase.rpc('visit_character', {
        visitor_id: visitorId,
        visited_character_name: targetCharacterName,
        visit_type: visitType,
        interaction_data: interactionData
      })

      if (supabaseError) throw supabaseError

      if (data.success) {
        // Refresh recent visits
        await loadRecentVisits(visitorId)
        
        // Check for visit-related achievements
        const achievementStore = useAchievementStore()
        // Get visitor's character data
        const { data: visitorData } = await supabase
          .from('characters')
          .select('*')
          .eq('id', visitorId)
          .single()
        
        if (visitorData) {
          // Get visit statistics
          const { data: stats } = await supabase.rpc('get_character_statistics', {
            character_id: visitorId
          })
          
          await achievementStore.checkActionAchievements(visitorData, 'character_visit', {
            totalVisitsGiven: stats?.total_visits_given || 1,
            isFirstVisit: (stats?.total_visits_given || 1) === 1
          })
        }
        
        return { success: true, message: data.message, visitId: data.visit_id }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error visiting character:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to visit character' }
    }
  }

  // Update character activity status
  async function updateActivityStatus(
    characterId: string, 
    onlineStatus: 'online' | 'away' | 'offline' = 'online',
    publicMessage?: string
  ) {
    try {
      await supabase.rpc('update_character_activity', {
        character_id: characterId,
        online_status: onlineStatus,
        public_message: publicMessage
      })
    } catch (err) {
      console.error('Error updating activity status:', err)
    }
  }

  // Search characters by name
  async function searchCharacters(characterId: string, searchTerm: string) {
    if (!searchTerm.trim()) {
      return discoverableCharacters.value
    }

    try {
      const { data, error: supabaseError } = await supabase.rpc('get_discoverable_characters', {
        requesting_character_id: characterId,
        limit_count: 50,
        offset_count: 0
      })

      if (supabaseError) throw supabaseError

      const filtered = (data || []).filter((char: DiscoverableCharacter) =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return filtered
    } catch (err) {
      console.error('Error searching characters:', err)
      return []
    }
  }

  // Get character's visit statistics
  async function getVisitStatistics(characterId: string) {
    try {
      const { data, error: supabaseError } = await supabase.rpc('get_character_statistics', {
        character_id: characterId
      })

      if (supabaseError) throw supabaseError

      return {
        totalVisitsGiven: data?.total_visits_given || 0,
        totalVisitsReceived: data?.total_visits_received || 0,
        popularityScore: 0 // Will be calculated from character_activity
      }
    } catch (err) {
      console.error('Error getting visit statistics:', err)
      return {
        totalVisitsGiven: 0,
        totalVisitsReceived: 0,
        popularityScore: 0
      }
    }
  }

  // Get character activity info
  async function getCharacterActivity(characterId: string) {
    try {
      const { data, error: supabaseError } = await supabase
        .from('character_activity')
        .select('*')
        .eq('character_id', characterId)
        .single()

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw supabaseError
      }

      return data || {
        character_id: characterId,
        last_active_at: new Date().toISOString(),
        online_status: 'offline',
        public_message: null,
        total_visitors: 0,
        total_visits_given: 0,
        popularity_score: 0
      }
    } catch (err) {
      console.error('Error getting character activity:', err)
      return null
    }
  }

  // Clear all data (for logout)
  function clearSocialData() {
    discoverableCharacters.value = []
    friends.value = []
    recentVisits.value = []
    friendRequests.value = []
    error.value = null
  }

  return {
    // State
    discoverableCharacters,
    friends,
    recentVisits,
    friendRequests,
    loading,
    error,

    // Computed
    onlineFriends,
    pendingFriendRequests,

    // Actions
    loadDiscoverableCharacters,
    loadFriends,
    loadRecentVisits,
    sendFriendRequest,
    visitCharacter,
    updateActivityStatus,
    searchCharacters,
    getVisitStatistics,
    getCharacterActivity,
    clearSocialData
  }
})