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
  detail: string
  achieved_at: string
  reward: Record<string, any>
}

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