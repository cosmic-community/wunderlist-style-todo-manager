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
    
    // Changed: Fetch fresh user data from Cosmic to get latest preferences including checkbox_position
    const freshUser = await getUserById(session.user.id)
    
    if (freshUser) {
      // Return user with latest data from Cosmic
      return NextResponse.json({
        user: {
          id: freshUser.id,
          email: freshUser.metadata.email,
          display_name: freshUser.metadata.display_name,
          email_verified: freshUser.metadata.email_verified,
          checkbox_position: freshUser.metadata.checkbox_position || 'left' // Changed: Include checkbox_position with default
        }
      })
    }
    
    // Fallback to session user if Cosmic fetch fails
    return NextResponse.json({
      user: {
        ...session.user,
        checkbox_position: session.user.checkbox_position || 'left' // Changed: Ensure checkbox_position has default
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