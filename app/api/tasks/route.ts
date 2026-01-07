import { NextResponse } from 'next/server'
import { cosmic } from '@/lib/cosmic'

export async function GET() {
  try {
    const response = await cosmic.objects
      .find({ type: 'tasks' })
      .props(['id', 'title', 'slug', 'metadata', 'created_at', 'modified_at'])
      .depth(1)
    
    return NextResponse.json({ tasks: response.objects })
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
    const data = await request.json()
    
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