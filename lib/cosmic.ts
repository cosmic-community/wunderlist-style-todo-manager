import { createBucketClient } from '@cosmicjs/sdk'
import { Task, List, User } from '@/types'

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

// Fetch tasks for a specific user (owned or shared lists)
export async function getTasksForUser(userId: string): Promise<Task[]> {
  try {
    // First get user's lists
    const lists = await getListsForUser(userId)
    const listIds = lists.map(list => list.id)
    
    if (listIds.length === 0) {
      return []
    }
    
    // Get tasks that belong to those lists
    const response = await cosmic.objects
      .find({ type: 'tasks' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)
    
    const allTasks = response.objects as Task[]
    
    // Filter tasks by user's lists
    return allTasks.filter(task => {
      const listId = typeof task.metadata.list === 'string' 
        ? task.metadata.list 
        : task.metadata.list?.id
      return listId && listIds.includes(listId)
    })
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch tasks for user')
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

// Fetch lists for a specific user (owned or shared)
export async function getListsForUser(userId: string): Promise<List[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'lists' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)
    
    const allLists = response.objects as List[]
    
    // Filter lists where user is owner or in shared_with
    return allLists.filter(list => {
      const ownerId = typeof list.metadata.owner === 'string' 
        ? list.metadata.owner 
        : list.metadata.owner?.id
      
      const sharedWith = list.metadata.shared_with || []
      const sharedUserIds = sharedWith.map(u => typeof u === 'string' ? u : u.id)
      
      return ownerId === userId || sharedUserIds.includes(userId)
    })
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch lists for user')
  }
}

// Create a new list with owner
export async function createList(data: { 
  name: string; 
  description?: string; 
  color?: string;
  ownerId?: string;
}): Promise<List> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const response = await cosmic.objects.insertOne({
    title: data.name.trim(),
    slug: slug,
    type: 'lists',
    metadata: {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || '#3b82f6',
      owner: data.ownerId || '',
      created_by: data.ownerId || '',
      shared_with: [],
      share_token: ''
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

// User functions
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'users',
        'metadata.email': email.toLowerCase()
      })
      .props(['id', 'title', 'slug', 'metadata'])
    
    if (response.objects.length > 0) {
      return response.objects[0] as User
    }
    return null
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw new Error('Failed to fetch user')
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await cosmic.objects.findOne({
      id,
      type: 'users'
    })
    
    return response.object as User
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw new Error('Failed to fetch user')
  }
}

export async function createUser(data: {
  email: string;
  password_hash: string;
  display_name: string;
  verification_code: string;
}): Promise<User> {
  const slug = data.email.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const response = await cosmic.objects.insertOne({
    title: data.display_name,
    slug: slug + '-' + Date.now(),
    type: 'users',
    metadata: {
      email: data.email.toLowerCase(),
      password_hash: data.password_hash,
      display_name: data.display_name,
      email_verified: false,
      verification_code: data.verification_code
    }
  })
  
  return response.object as User
}

export async function updateUser(id: string, data: Partial<User['metadata']>): Promise<User> {
  const response = await cosmic.objects.updateOne(id, {
    metadata: data
  })
  
  return response.object as User
}

// Get list by ID
export async function getListById(id: string): Promise<List | null> {
  try {
    const response = await cosmic.objects.findOne({
      id,
      type: 'lists'
    }).depth(1)
    
    return response.object as List
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw new Error('Failed to fetch list')
  }
}

// Update list shared_with
export async function addUserToList(listId: string, userId: string): Promise<List> {
  const list = await getListById(listId)
  if (!list) {
    throw new Error('List not found')
  }
  
  const currentShared = list.metadata.shared_with || []
  const sharedIds = currentShared.map(u => typeof u === 'string' ? u : u.id)
  
  if (!sharedIds.includes(userId)) {
    sharedIds.push(userId)
  }
  
  const response = await cosmic.objects.updateOne(listId, {
    metadata: {
      shared_with: sharedIds
    }
  })
  
  return response.object as List
}