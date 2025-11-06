/**
 * React Query hooks for matches API (Web)
 * Location: apps/web/src/hooks/api/use-matches.ts
 */

import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

export interface Match {
  id: string
  petId: string
  matchedAt: string
  pet?: {
    id: string
    name: string
    photos: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.petspark.app'

async function fetchMatches(): Promise<Match[]> {
  const response = await fetch(`${API_BASE_URL}/api/matches`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch matches')
  const data = await response.json()
  return Array.isArray(data) ? data : data.items || []
}

export function useMatches(): UseQueryResult<Match[]> {
  return useQuery({
    queryKey: queryKeys.matches.list,
    queryFn: fetchMatches,
    staleTime: 60_000,
    gcTime: 1_800_000,
  })
}

export function useMatch(matchId: string): UseQueryResult<Match> {
  return useQuery({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch match')
      return response.json()
    },
    enabled: !!matchId,
  })
}

