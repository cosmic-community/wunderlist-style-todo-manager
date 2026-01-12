// Shared module-level cache for lists to persist across component remounts during navigation
// This prevents the sidebar from refetching when clicking between lists

import { List } from '@/types'

let cachedLists: List[] | null = null

export function getCachedLists(): List[] | null {
  return cachedLists
}

export function setCachedLists(lists: List[]): void {
  cachedLists = lists
}

export function hasCachedLists(): boolean {
  return cachedLists !== null
}

export function clearCachedLists(): void {
  cachedLists = null
}
