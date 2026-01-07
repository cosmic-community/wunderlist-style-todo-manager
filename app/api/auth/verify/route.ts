import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/cosmic'
import { createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    
    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if already verified
    if (user.metadata.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }
    
    // Verify code
    if (user.metadata.verification_code !== code.toUpperCase()) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }
    
    // Update user as verified
    await updateUser(user.id, {
      email_verified: true,
      verification_code: ''
    })
    
    // Create auth token and log them in
    const authUser = {
      id: user.id,
      email: user.metadata.email,
      display_name: user.metadata.display_name,
      email_verified: true
    }
    
    const token = await createToken(authUser)
    await setAuthCookie(token)
    
    return NextResponse.json({
      success: true,
      user: authUser
    })
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}