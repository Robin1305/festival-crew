import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Group {
  code: string
  name: string
  expires_at: string | null
}

export interface Member {
  id: string
  group_code: string
  display_name: string
  color: string
  lat: number | null
  lng: number | null
  accuracy_m: number | null
  last_seen: string
  is_sos: boolean
  is_admin: boolean
}

export interface Poi {
  id: string
  group_code: string
  label: string
  icon: string
  lat: number
  lng: number
}

export interface BulletinPost {
  id: string
  group_code: string
  author_name: string
  content: string
  kind: 'message' | 'sos' | 'meetme'
  lat: number | null
  lng: number | null
  created_at: string
}

export interface MeetPin {
  id: string
  group_code: string
  label: string
  lat: number
  lng: number
  created_by: string
  expires_at: string
  created_at: string
}

export interface Tent {
  id: string
  group_code: string
  member_id: string
  name: string
  color: string
  lat: number
  lng: number
  created_at: string
}

export interface Car {
  id: string
  group_code: string
  member_id: string
  name: string
  color: string
  lat: number
  lng: number
  created_at: string
}
