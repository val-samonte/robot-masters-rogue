import { atom } from 'jotai'

// Core game state atoms
export const gameWrapperAtom = atom<any | null>(null)
export const gameConfigAtom = atom<any | null>(null)
export const gameStateAtom = atom<any | null>(null)

// Entity rendering state (what Jotai is actually for)
export const charactersAtom = atom<any[]>([])
export const spawnsAtom = atom<any[]>([])

// Simple UI state
export const isPlayingAtom = atom<boolean>(false)
export const currentFrameAtom = atom<number>(0)
