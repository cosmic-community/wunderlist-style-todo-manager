// app/api/lists/[id]/route.ts
import { NextResponse } from 'next/server'
import { cosmic, getListById } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    
    // Check if user owns the list
    const list = await getListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this list' },
        { status: 403 }
      )
    }
    
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    
    // Check if user owns the list
    const list = await getListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this list' },
        { status: 403 }
      )
    }
    
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