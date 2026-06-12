import { create } from 'zustand'
import type { Member, BulletinPost, MeetPin, Poi, Tent } from '../lib/supabase'

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
  tents: Tent[]
  activeSheet: 'none' | 'bulletin' | 'friends' | 'pin' | 'friend-detail' | 'tent'
  selectedMemberId: string | null
  unreadPosts: number
  newPostAlert: BulletinPost | null
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
  setTents: (t: Tent[]) => void
  upsertTent: (t: Tent) => void
  removeTent: (id: string) => void
  setActiveSheet: (s: GroupStore['activeSheet'], memberId?: string) => void
  markPostsRead: () => void
  clearNewPostAlert: () => void
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
  tents: [],
  activeSheet: 'none',
  selectedMemberId: null,
  unreadPosts: 0,
  newPostAlert: null,
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
      newPostAlert: state.activeSheet === 'bulletin' ? null : p,
    })),

  setPins: (pins) => set({ pins }),

  addPin: (p) =>
    set((state) => ({
      pins: [...state.pins.filter((x) => x.created_by !== p.created_by), p],
    })),

  removePin: (id) =>
    set((state) => ({ pins: state.pins.filter((p) => p.id !== id) })),

  setTents: (tents) => set({ tents }),

  upsertTent: (t) =>
    set((state) => {
      const idx = state.tents.findIndex((x) => x.id === t.id || x.member_id === t.member_id)
      if (idx >= 0) {
        const updated = [...state.tents]
        updated[idx] = t
        return { tents: updated }
      }
      return { tents: [...state.tents, t] }
    }),

  removeTent: (id) =>
    set((state) => ({ tents: state.tents.filter((t) => t.id !== id) })),

  setActiveSheet: (activeSheet, memberId) =>
    set((state) => ({
      activeSheet,
      selectedMemberId: memberId ?? null,
      unreadPosts: activeSheet === 'bulletin' ? 0 : state.unreadPosts,
      newPostAlert: activeSheet === 'bulletin' ? null : state.newPostAlert,
    })),

  markPostsRead: () => set({ unreadPosts: 0 }),

  clearNewPostAlert: () => set({ newPostAlert: null }),

  flyTo: (lat, lng) => set({ flyToTarget: [lat, lng] }),

  clearFlyTo: () => set({ flyToTarget: null }),
}))
