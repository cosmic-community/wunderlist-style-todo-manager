// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server'
import { cosmic } from '@/lib/cosmic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (data.completed !== undefined) {
      updateData.completed = data.completed
    }
    
    // Note: 'starred' field may not exist in the object type
    // Only include if explicitly supported by the content model
    if (data.starred !== undefined) {
      updateData.starred = data.starred
    }
    
    if (data.title !== undefined) {
      updateData.title = data.title
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    
    if (data.priority !== undefined) {
      updateData.priority = { 
        key: data.priority, 
        value: data.priority.charAt(0).toUpperCase() + data.priority.slice(1) 
      }
    }
    
    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date
    }
    
    if (data.list !== undefined) {
      updateData.list = data.list
    }
    
    const response = await cosmic.objects.updateOne(id, {
      metadata: updateData
    })
    
    return NextResponse.json({ success: true, task: response.object })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await cosmic.objects.deleteOne(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}