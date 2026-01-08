import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/auth'
import { cosmicWrite } from '@/lib/cosmic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { display_name } = await request.json()

    if (!display_name || display_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Update user in Cosmic
    await cosmicWrite.objects.updateOne(session.user.id, {
      title: display_name.trim(),
      metadata: {
        display_name: display_name.trim()
      }
    })

    // Update session with new display name
    const updatedUser = {
      ...session.user,
      display_name: display_name.trim()
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