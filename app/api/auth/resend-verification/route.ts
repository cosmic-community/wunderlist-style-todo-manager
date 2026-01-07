import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/cosmic'
import { generateVerificationCode } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a new verification email has been sent.'
      })
    }
    
    if (user.metadata.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }
    
    // Generate new verification code
    const verification_code = generateVerificationCode()
    
    // Update user with new code
    await updateUser(user.id, {
      verification_code
    })
    
    // Send new verification email
    await sendVerificationEmail(email, user.metadata.display_name, verification_code)
    
    return NextResponse.json({
      success: true,
      message: 'Verification email sent'
    })
    
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}