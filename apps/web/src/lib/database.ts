import type { QueryFilter } from './types/database-query'
import { isQueryOperator } from './types/database-query'
import { generateULID } from './utils'
import { isTruthy, isDefined } from '@/core/guards';

export interface DBRecord {
  id: string
  createdAt: string
  updatedAt: string
  ownerId?: string
}

export interface QueryOptions<T extends DBRecord = DBRecord> {
  limit?: number
  offset?: number
  sortBy?: keyof T
  sortOrder?: 'asc' | 'desc'
  filter?: QueryFilter<T & Record<string, unknown>>
}

export interface QueryResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

export class DatabaseService {
  private async getCollection<T extends DBRecord>(collectionName: string): Promise<T[]> {
    const { storage } = await import('./storage')
    const data = await storage.get<T[]>(collectionName)
    return data || []
  }

  private async setCollection<T extends DBRecord>(collectionName: string, data: T[]): Promise<void> {
    const { storage } = await import('./storage')
    await storage.set(collectionName, data)
  }

  async create<T extends DBRecord>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    const collection = await this.getCollection<T>(collectionName)
    const now = new Date().toISOString()
    
    const newRecord = {
      ...data,
      id: generateULID(),
      createdAt: now,
      updatedAt: now,
    } as T

    collection.push(newRecord)
    await this.setCollection(collectionName, collection)

    return newRecord
  }

  async findById<T extends DBRecord>(collectionName: string, id: string): Promise<T | null> {
    const collection = await this.getCollection<T>(collectionName)
    return collection.find(item => item.id === id) || null
  }

  async findOne<T extends DBRecord>(
    collectionName: string,
    filter: QueryFilter<T & Record<string, unknown>>
  ): Promise<T | null> {
    const collection = await this.getCollection<T>(collectionName)
    return collection.find(item => this.matchesFilter(item, filter)) || null
  }

  async findMany<T extends DBRecord>(
    collectionName: string,
    options: QueryOptions<T> = {}
  ): Promise<QueryResult<T>> {
    const collection = await this.getCollection<T>(collectionName)
    let filtered = collection

    if (isTruthy(options.filter)) {
      filtered = filtered.filter(item => this.matchesFilter(item, options.filter!))
    }

    if (isTruthy(options.sortBy)) {
      filtered.sort((a, b) => {
        const sortKey = options.sortBy as keyof T
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    const total = filtered.length
    const offset = options.offset || 0
    const limit = options.limit || total

    const data = filtered.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return { data, total, hasMore }
  }

  async update<T extends DBRecord>(
    collectionName: string,
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
  ): Promise<T | null> {
    const collection = await this.getCollection<T>(collectionName)
    const index = collection.findIndex(item => item.id === id)

    if (index === -1) return null

    const updatedRecord = {
      ...collection[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as T

    collection[index] = updatedRecord
    await this.setCollection(collectionName, collection)

    return updatedRecord
  }

  async delete<T extends DBRecord>(collectionName: string, id: string): Promise<boolean> {
    const collection = await this.getCollection<T>(collectionName)
    const filteredCollection = collection.filter(item => item.id !== id)

    if (filteredCollection.length === collection.length) return false

    await this.setCollection(collectionName, filteredCollection)
    return true
  }

  async deleteMany<T extends DBRecord>(
    collectionName: string,
    filter: QueryFilter<T & Record<string, unknown>>
  ): Promise<number> {
    const collection = await this.getCollection<T>(collectionName)
    const filteredCollection = collection.filter(item => !this.matchesFilter(item, filter))
    const deletedCount = collection.length - filteredCollection.length

    if (deletedCount > 0) {
      await this.setCollection(collectionName, filteredCollection)
    }

    return deletedCount
  }

  async count<T extends DBRecord>(collectionName: string, filter?: QueryFilter<T & Record<string, unknown>>): Promise<number> {
    const collection = await this.getCollection<T>(collectionName)
    
    if (!filter) return collection.length

    return collection.filter(item => this.matchesFilter(item, filter)).length
  }

  async exists<T extends DBRecord>(collectionName: string, filter: QueryFilter<T & Record<string, unknown>>): Promise<boolean> {
    const collection = await this.getCollection<T>(collectionName)
    return collection.some(item => this.matchesFilter(item, filter))
  }

  private matchesFilter<T extends DBRecord>(item: T, filter: QueryFilter<T & Record<string, unknown>>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      const itemValue = item[key as keyof T]
      
      if (Array.isArray(value)) {
        return value.includes(itemValue)
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (isQueryOperator(value)) {
          if ('$in' in value && value.$in) {
            return value.$in.includes(itemValue as never)
          }
          if ('$gt' in value && value.$gt !== undefined && value.$gt !== null) {
            return itemValue > value.$gt
          }
          if ('$lt' in value && value.$lt !== undefined && value.$lt !== null) {
            return itemValue < value.$lt
          }
          if ('$gte' in value && value.$gte !== undefined && value.$gte !== null) {
            return itemValue >= value.$gte
          }
          if ('$lte' in value && value.$lte !== undefined && value.$lte !== null) {
            return itemValue <= value.$lte
          }
          if ('$ne' in value && value.$ne !== undefined) {
            return itemValue !== value.$ne
          }
        }
      }
      
      return itemValue === value
    })
  }

  async getAllCollections(): Promise<string[]> {
    const { storage } = await import('./storage')
    const allKeys = await storage.keys()
    return allKeys.filter(key => !key.startsWith('_'))
  }

  async clearCollection(collectionName: string): Promise<void> {
    const { storage } = await import('./storage')
    await storage.delete(collectionName)
  }
}

export const db = new DatabaseService()
