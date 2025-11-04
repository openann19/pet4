import { generateULID } from './utils'

export interface DBRecord {
  id: string
  createdAt: string
  updatedAt: string
  ownerId?: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, any>
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
    filter: Partial<T>
  ): Promise<T | null> {
    const collection = await this.getCollection<T>(collectionName)
    return collection.find(item => this.matchesFilter(item, filter)) || null
  }

  async findMany<T extends DBRecord>(
    collectionName: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const collection = await this.getCollection<T>(collectionName)
    let filtered = collection

    if (options.filter) {
      filtered = filtered.filter(item => this.matchesFilter(item, options.filter! as Partial<T>))
    }

    if (options.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[options.sortBy!]
        const bVal = (b as any)[options.sortBy!]
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
    filter: Partial<T>
  ): Promise<number> {
    const collection = await this.getCollection<T>(collectionName)
    const filteredCollection = collection.filter(item => !this.matchesFilter(item, filter))
    const deletedCount = collection.length - filteredCollection.length

    if (deletedCount > 0) {
      await this.setCollection(collectionName, filteredCollection)
    }

    return deletedCount
  }

  async count<T extends DBRecord>(collectionName: string, filter?: Partial<T>): Promise<number> {
    const collection = await this.getCollection<T>(collectionName)
    
    if (!filter) return collection.length

    return collection.filter(item => this.matchesFilter(item, filter)).length
  }

  async exists<T extends DBRecord>(collectionName: string, filter: Partial<T>): Promise<boolean> {
    const collection = await this.getCollection<T>(collectionName)
    return collection.some(item => this.matchesFilter(item, filter))
  }

  private matchesFilter<T>(item: T, filter: Partial<T>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      const itemValue = (item as any)[key]
      
      if (Array.isArray(value)) {
        return value.includes(itemValue)
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if ('$in' in value) {
          return (value as any).$in.includes(itemValue)
        }
        if ('$gt' in value) {
          return itemValue > (value as any).$gt
        }
        if ('$lt' in value) {
          return itemValue < (value as any).$lt
        }
        if ('$gte' in value) {
          return itemValue >= (value as any).$gte
        }
        if ('$lte' in value) {
          return itemValue <= (value as any).$lte
        }
        if ('$ne' in value) {
          return itemValue !== (value as any).$ne
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
