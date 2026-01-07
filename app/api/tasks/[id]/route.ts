// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server'
import { cosmic } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const updateData: any = {}
    
    if (data.completed !== undefined) {
      updateData.completed = data.completed
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
    
    // Add small delay to allow Cosmic API to propagate changes
    await new Promise(resolve => setTimeout(resolve, 100))
    
    revalidatePath('/')
    revalidatePath('/lists/[slug]')
    
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
    
    // Add small delay to allow Cosmic API to propagate changes
    await new Promise(resolve => setTimeout(resolve, 100))
    
    revalidatePath('/')
    revalidatePath('/lists/[slug]')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}