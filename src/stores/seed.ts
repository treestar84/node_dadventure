import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Seed, SeedComment, Character } from '../types'
import { supabase } from '../lib/supabase'
import { useNotificationStore } from './notification'
import { useAchievementStore } from './achievement'

export const useSeedStore = defineStore('seed', () => {
  const seeds = ref<Array<Seed & { creator: Character; comments: SeedComment[] }>>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedSeed = ref<Seed | null>(null)

  // 시드 통계 계산
  const seedStats = computed(() => {
    const totalSeeds = seeds.value.length
    const totalComments = seeds.value.reduce((sum, seed) => sum + seed.comments.length, 0)
    const mySeeds = seeds.value.filter(seed => seed.creator_id === currentCharacterId.value)
    
    return {
      totalSeeds,
      totalComments,
      mySeeds: mySeeds.length,
      avgTreeSize: totalSeeds > 0 ? Math.round(seeds.value.reduce((sum, seed) => sum + seed.tree_size, 0) / totalSeeds) : 0
    }
  })

  const currentCharacterId = ref<string | null>(null)

  // 모든 지식의 씨앗 로드
  async function loadSeeds(characterId?: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      // 각 시드에 대한 댓글도 로드
      const seedsWithComments = await Promise.all(
        (data || []).map(async (seed) => {
          const { data: comments } = await supabase
            .from('seed_comments')
            .select(`
              *,
              commenter:characters!seed_comments_commenter_id_fkey(id, name, species, level)
            `)
            .eq('seed_id', seed.id)
            .order('created_at', { ascending: true })

          return {
            ...seed,
            comments: comments || []
          }
        })
      )

      seeds.value = seedsWithComments
      if (characterId) {
        currentCharacterId.value = characterId
      }
    } catch (err) {
      console.error('Error loading seeds:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load seeds'
    } finally {
      loading.value = false
    }
  }

  // 새로운 시드 생성
  async function createSeed(characterId: string, title: string, content: string): Promise<{ success: boolean; error?: string; seed?: Seed }> {
    try {
      const seedData = {
        title: title.trim(),
        content: content.trim(),
        creator_id: characterId,
        tree_size: 0
      }

      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .insert(seedData)
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .single()

      if (supabaseError) throw supabaseError

      const newSeed = { ...data, comments: [] }
      seeds.value.unshift(newSeed)

      // 알림 표시
      const notificationStore = useNotificationStore()
      notificationStore.showSuccess('지식의 씨앗을 심었습니다! 🌱')

      // 업적 체크
      const achievementStore = useAchievementStore()
      await achievementStore.checkActionAchievements(
        { id: characterId } as Character, 
        'seed_created',
        { seedShares: seeds.value.filter(s => s.creator_id === characterId).length }
      )

      return { success: true, seed: data }
    } catch (err) {
      console.error('Error creating seed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to create seed'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    }
  }

  // 시드에 댓글 추가 (물주기)
  async function waterSeed(seedId: string, characterId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const commentData = {
        seed_id: seedId,
        commenter_id: characterId,
        content: content.trim()
      }

      const { data: comment, error: commentError } = await supabase
        .from('seed_comments')
        .insert(commentData)
        .select(`
          *,
          commenter:characters!seed_comments_commenter_id_fkey(id, name, species, level)
        `)
        .single()

      if (commentError) throw commentError

      // 시드의 tree_size 증가
      const { error: updateError } = await supabase
        .from('seeds')
        .update({ tree_size: supabase.raw('tree_size + 1') })
        .eq('id', seedId)

      if (updateError) throw updateError

      // 로컬 상태 업데이트
      const seedIndex = seeds.value.findIndex(seed => seed.id === seedId)
      if (seedIndex !== -1) {
        seeds.value[seedIndex].comments.push(comment)
        seeds.value[seedIndex].tree_size += 1
      }

      // 알림 표시
      const notificationStore = useNotificationStore()
      notificationStore.showSuccess('지식의 나무에 물을 주었습니다! 💧')

      // 업적 체크
      const achievementStore = useAchievementStore()
      await achievementStore.checkActionAchievements(
        { id: characterId } as Character,
        'seed_watered',
        { totalWaters: seeds.value.reduce((sum, seed) => sum + seed.comments.filter(c => c.commenter_id === characterId).length, 0) }
      )

      return { success: true }
    } catch (err) {
      console.error('Error watering seed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to water seed'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    }
  }

  // 시드 검색
  async function searchSeeds(query: string): Promise<Seed[]> {
    try {
      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('tree_size', { ascending: false })
        .limit(20)

      if (supabaseError) throw supabaseError

      return data || []
    } catch (err) {
      console.error('Error searching seeds:', err)
      return []
    }
  }

  // 인기 시드 조회 (tree_size 기준)
  async function getPopularSeeds(limit: number = 10): Promise<Seed[]> {
    try {
      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .order('tree_size', { ascending: false })
        .limit(limit)

      if (supabaseError) throw supabaseError

      return data || []
    } catch (err) {
      console.error('Error getting popular seeds:', err)
      return []
    }
  }

  // 최근 시드 조회
  async function getRecentSeeds(limit: number = 10): Promise<Seed[]> {
    try {
      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (supabaseError) throw supabaseError

      return data || []
    } catch (err) {
      console.error('Error getting recent seeds:', err)
      return []
    }
  }

  // 내가 만든 시드 조회
  function getMySeeds(characterId: string) {
    return seeds.value.filter(seed => seed.creator_id === characterId)
  }

  // 내가 물을 준 시드 조회
  function getWateredSeeds(characterId: string) {
    return seeds.value.filter(seed => 
      seed.comments.some(comment => comment.commenter_id === characterId)
    )
  }

  // 시드 상세 정보 조회
  async function getSeedDetails(seedId: string): Promise<Seed | null> {
    try {
      const { data, error: supabaseError } = await supabase
        .from('seeds')
        .select(`
          *,
          creator:characters!seeds_creator_id_fkey(id, name, species, level)
        `)
        .eq('id', seedId)
        .single()

      if (supabaseError) throw supabaseError

      // 댓글도 함께 로드
      const { data: comments } = await supabase
        .from('seed_comments')
        .select(`
          *,
          commenter:characters!seed_comments_commenter_id_fkey(id, name, species, level)
        `)
        .eq('seed_id', seedId)
        .order('created_at', { ascending: true })

      selectedSeed.value = { ...data, comments: comments || [] }
      return selectedSeed.value
    } catch (err) {
      console.error('Error getting seed details:', err)
      return null
    }
  }

  return {
    // State
    seeds,
    loading,
    error,
    selectedSeed,
    currentCharacterId,
    
    // Getters
    seedStats,
    
    // Actions
    loadSeeds,
    createSeed,
    waterSeed,
    searchSeeds,
    getPopularSeeds,
    getRecentSeeds,
    getMySeeds,
    getWateredSeeds,
    getSeedDetails
  }
})