export interface Character {
  id: string
  name: string
  password_hash: string
  species: string
  job: string
  level: number
  age: number
  stats: CharacterStats
  emotion: string
  appearance: CharacterAppearance
  created_at: string
  coins: number
  exp: number
  items: string[]
}

export interface CharacterAppearance {
  base_color?: string
  clothing?: string[]
  accessories?: string[]
  background?: string
  equipment?: JobEquipment
  evolution_stage?: number
  customization_unlocks?: string[]
}

export interface JobEquipment {
  weapon?: string
  armor?: string
  special_item?: string
}

export interface CharacterStats {
  // Basic RPG stats
  str: number    // 근력
  dex: number    // 민첩
  int: number    // 지능
  vit: number    // 체력
  agi: number    // 속도
  luk: number    // 운
  
  // Personality/Emotional stats
  playfulness: number      // 장난기
  curiosity: number        // 호기심
  sensitivity: number      // 감수성
  awareness: number        // 눈치
  meddling: number         // 오지랖
  pragmatism: number       // 원영적 사고
  appetite: number         // 식탐
  anger_control: number    // 분노 조절
  clumsiness: number       // 허당끼
}

export interface Bug {
  id: string
  character_id: string
  created_at: string
  used: boolean
}

export interface Candy {
  id: string
  from_character_id: string
  to_character_id: string
  used_at: string
}

export interface Achievement {
  id: string
  character_id: string
  key: string
  title: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  points: number
  achieved_at: string
  reward: AchievementReward
  requirements?: AchievementRequirement
  icon?: string
  hidden?: boolean
}

export interface AchievementReward {
  coins?: number
  exp?: number
  items?: string[]
  title?: string
  skin?: string
}

export interface AchievementRequirement {
  type: 'stat' | 'level' | 'count' | 'time' | 'special'
  target: string | number
  current?: number
  metadata?: Record<string, any>
}

export interface AchievementDefinition {
  key: string
  title: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  points: number
  requirements: AchievementRequirement
  reward: AchievementReward
  icon?: string
  hidden?: boolean
  checkFunction?: (character: Character, context: AchievementContext) => boolean
}

export interface AchievementContext {
  previousLevel?: number
  actionType?: string
  targetCharacter?: Character
  bugsUsed?: number
  timeSpent?: number
  metadata?: Record<string, any>
}

export const ACHIEVEMENT_CATEGORIES = [
  'first_steps',    // 첫 걸음
  'progression',    // 성장
  'social',         // 사교
  'collector',      // 수집가
  'explorer',       // 탐험가
  'master',         // 마스터
  'time_keeper',    // 시간지기
  'generous',       // 관대함
  'scholar',        // 학자
  'survivor',       // 생존자
  'perfectionist',  // 완벽주의자
  'lucky',          // 행운
  'specialist',     // 전문가
  'legendary'       // 전설
] as const

export const ACHIEVEMENT_TIERS = [
  'bronze', 'silver', 'gold', 'platinum', 'diamond'
] as const

export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number]
export type AchievementTier = typeof ACHIEVEMENT_TIERS[number]

export interface Visit {
  id: string
  visitor_id: string
  visited_id: string
  visited_at: string
}

export interface Seed {
  id: string
  title: string
  content: string
  creator_id: string
  tree_size: number
  created_at: string
}

export interface SeedComment {
  id: string
  seed_id: string
  commenter_id: string
  content: string
  created_at: string
}

export interface Skin {
  id: string
  name: string
  type: 'clothing' | 'background' | 'accessory'
  image_url: string
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface Purchase {
  id: string
  character_id: string
  skin_id: string
  purchased_at: string
}

export const SPECIES_OPTIONS = [
  'cat', 'dog', 'rabbit', 'hamster', 'bird', 'fish', 'turtle', 'fox'
] as const

export const JOB_OPTIONS = [
  'warrior', 'mage', 'archer', 'thief', 'cleric', 'bard', 'scholar', 'merchant'
] as const

export const EMOTION_OPTIONS = [
  'happy', 'sad', 'angry', 'excited', 'tired', 'confused', 'proud', 'anxious', 'peaceful', 'curious'
] as const

export type Species = typeof SPECIES_OPTIONS[number]
export type Job = typeof JOB_OPTIONS[number]
export type Emotion = typeof EMOTION_OPTIONS[number]

// Quest System Types
export interface Quest {
  id: string
  character_id: string
  title: string
  description: string
  status: 'received' | 'available' | 'accepted' | 'completed' | 'expired'
  accepted_at?: string
  completed_at?: string
  expires_at?: string
  duration_hours: number
  reward_food_count: number
  created_at: string
}

export interface QuestDefinition {
  id: string
  title: string
  description: string
  min_duration_hours: number
  max_duration_hours: number
  min_reward_food: number
  max_reward_food: number
  bonus_reward_chance: number
  bonus_reward_food: number
  category: QuestCategory
  difficulty: QuestDifficulty
}

export const QUEST_CATEGORIES = [
  'daily',      // 일일 퀘스트
  'adventure',  // 모험 퀘스트
  'social',     // 사회 퀘스트
  'crafting',   // 제작 퀘스트
  'exploration', // 탐험 퀘스트
  'special'     // 특별 퀘스트
] as const

export const QUEST_DIFFICULTIES = [
  'easy', 'normal', 'hard', 'epic', 'legendary'
] as const

export type QuestCategory = typeof QUEST_CATEGORIES[number]
export type QuestDifficulty = typeof QUEST_DIFFICULTIES[number]