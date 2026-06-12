import { create } from 'zustand'
import type { Member, BulletinPost, MeetPin, Poi } from '../lib/supabase'

export interface Session {
  groupCode: string
  memberId: string
  displayName: string
  color: string
}

interface GroupStore {
  session: Session | null
  members: Member[]
  pois: Poi[]
  posts: BulletinPost[]
  pins: MeetPin[]
  activeSheet: 'none' | 'bulletin' | 'friends' | 'pin' | 'friend-detail'
  selectedMemberId: string | null
  unreadPosts: number
  flyToTarget: [number, number] | null

  setSession: (s: Session | null) => void
  setMembers: (m: Member[]) => void
  upsertMember: (m: Member) => void
  removeMember: (id: string) => void
  setPois: (p: Poi[]) => void
  setPosts: (p: BulletinPost[]) => void
  addPost: (p: BulletinPost) => void
  setPins: (p: MeetPin[]) => void
  addPin: (p: MeetPin) => void
  removePin: (id: string) => void
  setActiveSheet: (s: GroupStore['activeSheet'], memberId?: string) => void
  markPostsRead: () => void
  flyTo: (lat: number, lng: number) => void
  clearFlyTo: () => void
}

const SESSION_KEY = 'festival-crew-session'

export function loadSession(groupCode: string): Session | null {
  try {
    const raw = localStorage.getItem(`${SESSION_KEY}-${groupCode}`)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(`${SESSION_KEY}-${s.groupCode}`, JSON.stringify(s))
}

export function clearSession(groupCode: string) {
  localStorage.removeItem(`${SESSION_KEY}-${groupCode}`)
}

export const useGroupStore = create<GroupStore>((set) => ({
  session: null,
  members: [],
  pois: [],
  posts: [],
  pins: [],
  activeSheet: 'none',
  selectedMemberId: null,
  unreadPosts: 0,
  flyToTarget: null,

  setSession: (s) => set({ session: s }),

  setMembers: (members) => set({ members }),

  upsertMember: (m) =>
    set((state) => {
      const idx = state.members.findIndex((x) => x.id === m.id)
      if (idx >= 0) {
        const updated = [...state.members]
        updated[idx] = m
        return { members: updated }
      }
      return { members: [...state.members, m] }
    }),

  removeMember: (id) =>
    set((state) => ({ members: state.members.filter((m) => m.id !== id) })),

  setPois: (pois) => set({ pois }),

  setPosts: (posts) => set({ posts }),

  addPost: (p) =>
    set((state) => ({
      posts: [p, ...state.posts],
      unreadPosts: state.activeSheet === 'bulletin' ? 0 : state.unreadPosts + 1,
    })),

  setPins: (pins) => set({ pins }),

  addPin: (p) =>
    set((state) => ({
      pins: [...state.pins.filter((x) => x.created_by !== p.created_by), p],
    })),

  removePin: (id) =>
    set((state) => ({ pins: state.pins.filter((p) => p.id !== id) })),

  setActiveSheet: (activeSheet, memberId) =>
    set({
      activeSheet,
      selectedMemberId: memberId ?? null,
      unreadPosts: activeSheet === 'bulletin' ? 0 : undefined as unknown as number,
    }),

  markPostsRead: () => set({ unreadPosts: 0 }),

  flyTo: (lat, lng) => set({ flyToTarget: [lat, lng] }),

  clearFlyTo: () => set({ flyToTarget: null }),
}))
