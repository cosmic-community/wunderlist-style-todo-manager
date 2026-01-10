// app/api/lists/[id]/route.ts
import { NextResponse } from 'next/server'
import { cosmic, getListById } from '@/lib/cosmic'

// Changed: Removed authentication and ownership checks to allow anyone to edit public lists
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
    
    // Changed: Allow anyone to edit public lists - no authentication or ownership check required
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

// Changed: Removed authentication and ownership checks to allow anyone to delete public lists
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
    
    // Changed: Allow anyone to delete public lists - no authentication or ownership check required
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