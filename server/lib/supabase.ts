import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

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
    }
  }
}