// app/api/lists/[id]/route.ts
import { NextResponse } from 'next/server'
import { cosmic, getListById } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'

// Changed: Added authentication and ownership checks for list editing
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if list exists
    const list = await getListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    // Changed: Check if list has an owner - if so, only owner can edit
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (ownerId) {
      // List has an owner - check if current user is the owner
      const session = await getSession()
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (session.user.id !== ownerId) {
        return NextResponse.json(
          { error: 'Only the list owner can edit this list' },
          { status: 403 }
        )
      }
    }
    // If list has no owner (demo list), allow anyone to edit
    
    const data = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (data.name !== undefined) {
      updateData.name = data.name
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    
    if (data.color !== undefined) {
      updateData.color = data.color
    }
    
    const response = await cosmic.objects.updateOne(id, {
      title: data.name || undefined,
      metadata: updateData
    })
    
    return NextResponse.json({ success: true, list: response.object })
  } catch (error) {
    console.error('Error updating list:', error)
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    )
  }
}

// Changed: Added authentication and ownership checks for list deletion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if list exists
    const list = await getListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    // Changed: Check if list has an owner - if so, only owner can delete
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (ownerId) {
      // List has an owner - check if current user is the owner
      const session = await getSession()
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (session.user.id !== ownerId) {
        return NextResponse.json(
          { error: 'Only the list owner can delete this list' },
          { status: 403 }
        )
      }
    }
    // If list has no owner (demo list), allow anyone to delete
    
    await cosmic.objects.deleteOne(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting list:', error)
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    )
  }
}