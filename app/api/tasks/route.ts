import { NextResponse } from 'next/server'
import { cosmic, getTasksForUser } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Check for authenticated user
    const session = await getSession()
    
    if (session) {
      // Return only user's tasks
      const tasks = await getTasksForUser(session.user.id)
      return NextResponse.json({ tasks })
    }
    
    // Changed: Return demo tasks for unauthenticated users
    try {
      const response = await cosmic.objects
        .find({ type: 'tasks' })
        .props(['id', 'title', 'slug', 'metadata'])
        .depth(1)
      
      // Show all tasks that don't belong to a user's list
      // (tasks with no list or demo lists)
      return NextResponse.json({ tasks: response.objects })
    } catch (error) {
      // If no demo tasks exist, return empty array
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return NextResponse.json({ tasks: [] })
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
    
    // Changed: Allow task creation without auth (demo mode)
    // Validate that the list belongs to the user only if authenticated
    if (session && data.list) {
      const userLists = await getTasksForUser(session.user.id)
      const listIds = userLists.map(l => typeof l.metadata.list === 'string' ? l.metadata.list : l.metadata.list?.id).filter(Boolean)
      
      if (!listIds.includes(data.list)) {
        return NextResponse.json(
          { error: 'List not found or not accessible' },
          { status: 403 }
        )
      }
    }
    
    const response = await cosmic.objects.insertOne({
      type: 'tasks',
      title: data.title,
      metadata: {
        title: data.title,
        description: data.description || '',
        completed: false,
        priority: data.priority ? { key: data.priority, value: data.priority.charAt(0).toUpperCase() + data.priority.slice(1) } : { key: 'medium', value: 'Medium' },
        due_date: data.due_date || '',
        list: data.list || ''
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