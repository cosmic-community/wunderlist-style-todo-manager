import { NextResponse } from 'next/server'
import { cosmic, getTasksForUser, getListsForUser } from '@/lib/cosmic'
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
    
    // No auth - return empty array
    return NextResponse.json({ tasks: [] })
  } catch (error) {
    // Handle 404 (no objects found) as empty array
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return NextResponse.json({ tasks: [] })
    }
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const data = await request.json()
    
    // Validate that the list belongs to the user
    if (data.list) {
      const userLists = await getListsForUser(session.user.id)
      const listIds = userLists.map(l => l.id)
      
      if (!listIds.includes(data.list)) {
        return NextResponse.json(
          { error: 'List not found or not accessible' },
          { status: 403 }
        )
      }
    }
    
    // Only include fields that exist in the Cosmic object type schema
    // Note: 'starred' field is not part of the tasks object type
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