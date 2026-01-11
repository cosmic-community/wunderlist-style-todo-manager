// app/api/lists/[id]/remove-user/route.ts
import { NextResponse } from 'next/server'
import { cosmic, getListById } from '@/lib/cosmic'
import { getSession } from '@/lib/auth'

// Changed: New API endpoint to remove a user from a shared list
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Check if list exists
    const list = await getListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    // Check if current user is the owner
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (session.user.id !== ownerId) {
      return NextResponse.json(
        { error: 'Only the list owner can remove shared users' },
        { status: 403 }
      )
    }
    
    // Get current shared_with and remove the user
    const currentSharedWith = list.metadata.shared_with || []
    const sharedIds = currentSharedWith.map(u => typeof u === 'string' ? u : u.id)
    const updatedSharedIds = sharedIds.filter(id => id !== userId)
    
    // Update the list with the new shared_with array
    const response = await cosmic.objects.updateOne(id, {
      metadata: {
        shared_with: updatedSharedIds
      }
    })
    
    return NextResponse.json({ success: true, list: response.object })
  } catch (error) {
    console.error('Error removing user from list:', error)
    return NextResponse.json(
      { error: 'Failed to remove user from list' },
      { status: 500 }
    )
  }
}