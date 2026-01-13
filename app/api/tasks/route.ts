import { NextResponse } from 'next/server'
import { cosmic, getTasksForUser } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'
import type { Task, List } from '@/types'

export async function GET(request: Request) {
  try {
    // Changed: Parse URL to get query parameters
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('list')
    const listSlug = searchParams.get('listSlug')
    
    // Check for authenticated user
    const session = await getSession()
    
    if (session) {
      // Changed: Return user's tasks (owned by user OR in user's lists)
      const tasks = await getTasksForUser(session.user.id)
      
      // Changed: Filter by list if specified
      if (listId || listSlug) {
        // Changed: First resolve the target list if we only have a slug
        let targetListId = listId
        let targetListSlug = listSlug
        
        if (listSlug && !listId) {
          // Need to find the list by slug to get its ID for comparison
          try {
            const listResponse = await cosmic.objects
              .findOne({ type: 'lists', slug: listSlug })
              .props(['id', 'title', 'slug', 'metadata'])
              .depth(1)
            if (listResponse.object) {
              targetListId = listResponse.object.id
              targetListSlug = listResponse.object.slug
            }
          } catch {
            // List not found, return empty
            return NextResponse.json({ tasks: [] }, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            })
          }
        }
        
        const filteredTasks = tasks.filter(task => {
          const taskList = task.metadata.list
          if (!taskList) return false
          
          // Changed: Handle both string ID and resolved List object
          if (typeof taskList === 'string') {
            // taskList is a string ID - compare with targetListId
            return taskList === targetListId
          }
          
          // taskList is a resolved List object
          if (targetListSlug && taskList.slug === targetListSlug) {
            return true
          }
          if (targetListId && taskList.id === targetListId) {
            return true
          }
          return false
        })
        return NextResponse.json({ tasks: filteredTasks }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
      
      return NextResponse.json({ tasks }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    // Changed: Return demo tasks for unauthenticated users
    try {
      const response = await cosmic.objects
        .find({ type: 'tasks' })
        .props(['id', 'title', 'slug', 'metadata', 'modified_at'])
        .depth(1)
      
      let tasks = response.objects as Task[]
      
      // Changed: Filter tasks for public/demo mode
      // Only show tasks that belong to public lists (lists with no owner)
      if (listId || listSlug) {
        // First, get the list to check if it's public
        let targetList: List | null = null
        
        if (listSlug) {
          try {
            const listResponse = await cosmic.objects
              .findOne({ type: 'lists', slug: listSlug })
              .props(['id', 'title', 'slug', 'metadata'])
              .depth(1)
            targetList = listResponse.object as List
          } catch {
            // List not found
          }
        } else if (listId) {
          try {
            const listResponse = await cosmic.objects
              .findOne({ type: 'lists', id: listId })
              .props(['id', 'title', 'slug', 'metadata'])
              .depth(1)
            targetList = listResponse.object as List
          } catch {
            // List not found
          }
        }
        
        // Filter tasks by the target list
        tasks = tasks.filter(task => {
          const taskList = task.metadata.list
          if (!taskList) return false
          
          if (typeof taskList === 'string') {
            return taskList === (targetList?.id || listId)
          }
          
          // taskList is a List object
          if (listSlug && targetList) {
            return taskList.slug === listSlug || taskList.id === targetList.id
          }
          return taskList.id === (targetList?.id || listId)
        })
      } else {
        // No specific list requested - show tasks from public lists only
        tasks = tasks.filter(task => {
          const taskList = task.metadata.list
          if (!taskList) return true // Tasks without a list are shown
          
          if (typeof taskList === 'object') {
            // Only show if the list has no owner (public/demo list)
            return !taskList.metadata?.owner
          }
          
          return true
        })
      }
      
      return NextResponse.json({ tasks }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } catch (error) {
      // If no demo tasks exist, return empty array
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return NextResponse.json({ tasks: [] }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const session = await getSession()
    
    // Changed: Set owner to current user if authenticated
    const ownerId = session?.user?.id || ''
    
    const response = await cosmic.objects.insertOne({
      type: 'tasks',
      title: data.title,
      metadata: {
        title: data.title,
        description: data.description || '',
        completed: false,
        priority: data.priority ? { key: data.priority, value: data.priority.charAt(0).toUpperCase() + data.priority.slice(1) } : { key: 'medium', value: 'Medium' },
        due_date: data.due_date || '',
        list: data.list || '',
        owner: ownerId, // Changed: Always set owner to current user
        order: data.order ?? 0 // Changed: Include order field for new tasks
      }
    })
    
    return NextResponse.json({ success: true, task: response.object })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}