// app/api/lists/[id]/route.ts
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
    const { id } = await params
    
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