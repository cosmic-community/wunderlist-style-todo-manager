import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession, generateVerificationCode } from '@/lib/auth'
import { getUserByEmail, createUser, getListById, addUserToList } from '@/lib/cosmic'
import { sendInviteEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { email, listId, message } = await request.json()
    
    if (!email || !listId) {
      return NextResponse.json(
        { error: 'Email and list ID are required' },
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
    
    // Validate message length if provided
    if (message && typeof message === 'string' && message.length > 500) {
      return NextResponse.json(
        { error: 'Message must be 500 characters or less' },
        { status: 400 }
      )
    }
    
    // Get the list
    const list = await getListById(listId)
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    
    // Check if user is owner of the list
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    
    if (ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the list owner can invite users' },
        { status: 403 }
      )
    }
    
    // Check if user already exists
    let invitedUser = await getUserByEmail(email)
    let verificationCode = ''
    
    if (!invitedUser) {
      // Create new user with temporary password
      verificationCode = generateVerificationCode()
      const tempPasswordHash = await bcrypt.hash(verificationCode, 12)
      
      invitedUser = await createUser({
        email,
        password_hash: tempPasswordHash,
        display_name: email.split('@')[0],
        verification_code: verificationCode
      })
    } else if (invitedUser.metadata.email_verified) {
      // User exists and is verified, just add to list
      await addUserToList(listId, invitedUser.id)
      
      return NextResponse.json({
        success: true,
        message: 'User added to list'
      })
    } else {
      // User exists but not verified, use existing verification code
      verificationCode = invitedUser.metadata.verification_code || generateVerificationCode()
    }
    
    // Add user to list's shared_with
    await addUserToList(listId, invitedUser.id)
    
    // Send invite email with optional personal message
    const emailSent = await sendInviteEmail(
      email,
      session.user.display_name,
      list.metadata.name,
      list.metadata.color || '#3b82f6',
      verificationCode,
      typeof message === 'string' ? message.trim() : undefined
    )
    
    if (!emailSent) {
      console.error('Failed to send invite email')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation sent'
    })
    
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}