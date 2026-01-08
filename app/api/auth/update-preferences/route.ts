import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/auth'
import { cosmicWrite } from '@/lib/cosmic'
import { CheckboxPosition, ColorTheme } from '@/types'

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
    const { checkbox_position, color_theme } = body as {
      checkbox_position?: CheckboxPosition
      color_theme?: ColorTheme
    }

    // Validate checkbox_position if provided
    if (checkbox_position && !['left', 'right'].includes(checkbox_position)) {
      return NextResponse.json(
        { error: 'Invalid checkbox position. Must be "left" or "right"' },
        { status: 400 }
      )
    }

    // Validate color_theme if provided
    if (color_theme && !['light', 'dark', 'system'].includes(color_theme)) {
      return NextResponse.json(
        { error: 'Invalid color theme. Must be "light", "dark", or "system"' },
        { status: 400 }
      )
    }

    // Build metadata update object with only changed fields
    const metadataUpdate: Record<string, string> = {}
    
    // Changed: Use the exact value format from the content model for select-dropdown
    if (checkbox_position) {
      metadataUpdate.checkbox_position = checkbox_position === 'left' ? 'Left Side' : 'Right Side'
    }
    
    if (color_theme) {
      metadataUpdate.color_theme = color_theme === 'light' ? 'Light' : color_theme === 'dark' ? 'Dark' : 'System'
    }

    if (Object.keys(metadataUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No preferences provided to update' },
        { status: 400 }
      )
    }

    // Update user in Cosmic
    await cosmicWrite.objects.updateOne(session.user.id, {
      metadata: metadataUpdate
    })

    // Update session with new preferences
    const updatedUser = {
      ...session.user,
      ...(checkbox_position && { checkbox_position }),
      ...(color_theme && { color_theme })
    }

    await updateSession(updatedUser)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}