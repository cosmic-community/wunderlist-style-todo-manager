import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/auth'
import { cosmicWrite } from '@/lib/cosmic'
import { CheckboxPosition } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name, checkbox_position } = body

    // Build metadata update object - only include fields that are being updated
    const metadataUpdate: Record<string, string> = {}
    const titleUpdate: Record<string, string> = {}

    // Changed: Handle display_name update
    if (display_name !== undefined) {
      if (!display_name || display_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Display name is required' },
          { status: 400 }
        )
      }
      metadataUpdate.display_name = display_name.trim()
      titleUpdate.title = display_name.trim()
    }

    // Changed: Handle checkbox_position update
    if (checkbox_position !== undefined) {
      if (checkbox_position !== 'left' && checkbox_position !== 'right') {
        return NextResponse.json(
          { error: 'Invalid checkbox position. Must be "left" or "right"' },
          { status: 400 }
        )
      }
      metadataUpdate.checkbox_position = checkbox_position
    }

    // Update user in Cosmic - only include changed fields
    await cosmicWrite.objects.updateOne(session.user.id, {
      ...titleUpdate,
      metadata: metadataUpdate
    })

    // Update session with new user data
    const updatedUser = {
      ...session.user,
      display_name: display_name !== undefined ? display_name.trim() : session.user.display_name,
      checkbox_position: (checkbox_position !== undefined ? checkbox_position : session.user.checkbox_position || 'left') as CheckboxPosition
    }

    await updateSession(updatedUser)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}