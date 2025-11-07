/**
 * React Query hooks for matches API (Web)
 * Location: apps/web/src/hooks/api/use-matches.ts
 */

import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const API_BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) || 'https://api.petspark.app'

async function fetchMatches(): Promise<Match[]> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/matches`, {
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
      const response = await fetch(`${String(API_BASE_URL ?? '')}/api/matches/${String(matchId ?? '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch match')
      return response.json()
    },
    enabled: !!matchId,
  })
}

/**
 * Example mutation for matches domain: dismiss a match
 */
export interface DismissMatchInput { id: string }

async function dismissMatch(id: string): Promise<void> {
  const res = await fetch(`${String(API_BASE_URL ?? '')}/api/matches/${String(id ?? '')}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to dismiss match')
}

export function useDismissMatch(): UseMutationResult<void, Error, DismissMatchInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: DismissMatchInput) => dismissMatch(input.id),
    onSuccess: () => {
      // Refresh lists/details after mutation
      void qc.invalidateQueries({ queryKey: queryKeys.matches.list })
    },
  })
}

