import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserById } from '@/lib/cosmic'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Changed: Fetch fresh user data to get latest preferences
    const user = await getUserById(session.user.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Changed: Extract checkbox_position, color_theme, and style_theme from metadata
    const checkboxPosition = user.metadata.checkbox_position
    const colorTheme = user.metadata.color_theme
    const styleTheme = user.metadata.style_theme
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.metadata.email,
        display_name: user.metadata.display_name,
        email_verified: user.metadata.email_verified,
        // Changed: Map select-dropdown values back to keys
        checkbox_position: checkboxPosition?.key || 'left',
        color_theme: colorTheme?.key || 'system',
        style_theme: styleTheme?.key || 'default'
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication' },
      { status: 500 }
    )
  }
}