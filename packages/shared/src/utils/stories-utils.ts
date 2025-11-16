import { generateULID } from './utils'
import type { Story, StoryHighlight } from '../types/stories-types'

export function createStoryHighlight(
  userId: string,
  petId: string,
  title: string,
  coverImage: string,
  stories: Story[]
): StoryHighlight {
  return {
    id: generateULID(),
    userId,
    petId,
    title,
    coverImage,
    stories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: false,
  }
}

export function isStoryExpired(story: Story): boolean {
  return new Date(story.expiresAt) < new Date()
}

export function filterActiveStories(stories: Story[]): Story[] {
  if (!Array.isArray(stories)) return []
  return stories.filter(s => !isStoryExpired(s))
}

export function groupStoriesByUser(stories: Story[]): Map<string, Story[]> {
  const grouped = new Map<string, Story[]>()

  if (!Array.isArray(stories)) return grouped

  stories.forEach(story => {
    const userStories = grouped.get(story.userId) ?? []
    userStories.push(story)
    grouped.set(story.userId, userStories)
  })

  return grouped
}
