import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string
          name: string
          password_hash: string
          species: string
          job: string
          level: number
          age: number
          stats: Record<string, number>
          emotion: string
          appearance: Record<string, any>
          created_at: string
          coins: number
          exp: number
          items: string[]
        }
        Insert: {
          id?: string
          name: string
          password_hash: string
          species: string
          job: string
          level?: number
          age?: number
          stats?: Record<string, number>
          emotion?: string
          appearance?: Record<string, any>
          created_at?: string
          coins?: number
          exp?: number
          items?: string[]
        }
        Update: {
          id?: string
          name?: string
          password_hash?: string
          species?: string
          job?: string
          level?: number
          age?: number
          stats?: Record<string, number>
          emotion?: string
          appearance?: Record<string, any>
          created_at?: string
          coins?: number
          exp?: number
          items?: string[]
        }
      }
      bugs: {
        Row: {
          id: string
          character_id: string
          created_at: string
          used: boolean
        }
        Insert: {
          id?: string
          character_id: string
          created_at?: string
          used?: boolean
        }
        Update: {
          id?: string
          character_id?: string
          created_at?: string
          used?: boolean
        }
      }
      candies: {
        Row: {
          id: string
          from_character_id: string
          to_character_id: string
          used_at: string
        }
        Insert: {
          id?: string
          from_character_id: string
          to_character_id: string
          used_at?: string
        }
        Update: {
          id?: string
          from_character_id?: string
          to_character_id?: string
          used_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          character_id: string
          key: string
          detail: string
          achieved_at: string
          reward: Record<string, any>
        }
        Insert: {
          id?: string
          character_id: string
          key: string
          detail: string
          achieved_at?: string
          reward?: Record<string, any>
        }
        Update: {
          id?: string
          character_id?: string
          key?: string
          detail?: string
          achieved_at?: string
          reward?: Record<string, any>
        }
      }
      visits: {
        Row: {
          id: string
          visitor_id: string
          visited_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          visited_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          visitor_id?: string
          visited_id?: string
          visited_at?: string
        }
      }
      seeds: {
        Row: {
          id: string
          title: string
          content: string
          creator_id: string
          tree_size: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          creator_id: string
          tree_size?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          creator_id?: string
          tree_size?: number
          created_at?: string
        }
      }
      seed_comments: {
        Row: {
          id: string
          seed_id: string
          commenter_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          seed_id: string
          commenter_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          seed_id?: string
          commenter_id?: string
          content?: string
          created_at?: string
        }
      }
      quest_definitions: {
        Row: {
          id: string
          title: string
          description: string
          min_duration_hours: number
          max_duration_hours: number
          min_reward_food: number
          max_reward_food: number
          bonus_reward_chance: number
          bonus_reward_food: number
          category: string
          difficulty: string
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          min_duration_hours: number
          max_duration_hours: number
          min_reward_food: number
          max_reward_food: number
          bonus_reward_chance: number
          bonus_reward_food: number
          category: string
          difficulty: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          min_duration_hours?: number
          max_duration_hours?: number
          min_reward_food?: number
          max_reward_food?: number
          bonus_reward_chance?: number
          bonus_reward_food?: number
          category?: string
          difficulty?: string
          created_at?: string
        }
      }
      quests: {
        Row: {
          id: string
          character_id: string
          title: string
          description: string
          status: string
          accepted_at?: string
          completed_at?: string
          expires_at?: string
          duration_hours: number
          reward_food_count: number
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          title: string
          description: string
          status?: string
          accepted_at?: string
          completed_at?: string
          expires_at?: string
          duration_hours: number
          reward_food_count: number
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          title?: string
          description?: string
          status?: string
          accepted_at?: string
          completed_at?: string
          expires_at?: string
          duration_hours?: number
          reward_food_count?: number
          created_at?: string
        }
      }
    }
  }
}