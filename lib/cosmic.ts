import { createBucketClient } from '@cosmicjs/sdk'
import { Task, List } from '@/types'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Simple error helper for Cosmic SDK
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error
}

// Fetch all tasks with related lists
export async function getTasks(): Promise<Task[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'tasks' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)
    
    return response.objects as Task[]
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch tasks')
  }
}

// Fetch all lists
export async function getLists(): Promise<List[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'lists' })
      .props(['id', 'title', 'slug', 'metadata'])
    
    return response.objects as List[]
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch lists')
  }
}

// Create a new list
export async function createList(data: { name: string; description?: string; color?: string }): Promise<List> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const response = await cosmic.objects.insertOne({
    title: data.name.trim(),
    slug: slug,
    type: 'lists',
    metadata: {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || '#3b82f6'
    }
  })
  
  return response.object as List
}

// Fetch single task by ID
export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const response = await cosmic.objects.findOne({
      id,
      type: 'tasks'
    }).depth(1)
    
    return response.object as Task
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw new Error('Failed to fetch task')
  }
}

// Fetch tasks by list ID
export async function getTasksByList(listId: string): Promise<Task[]> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'tasks',
        'metadata.list': listId
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)
    
    return response.objects as Task[]
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch tasks by list')
  }
}