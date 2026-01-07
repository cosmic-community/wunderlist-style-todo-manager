import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail, createUser } from '@/lib/cosmic'
import { generateVerificationCode } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name } = await request.json()
    
    // Validate input
    if (!email || !password || !display_name) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 12)
    
    // Generate verification code
    const verification_code = generateVerificationCode()
    
    // Create user
    const user = await createUser({
      email,
      password_hash,
      display_name,
      verification_code
    })
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, display_name, verification_code)
    
    if (!emailSent) {
      console.error('Failed to send verification email, but user was created')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      userId: user.id
    }, { status: 201 })
    
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}