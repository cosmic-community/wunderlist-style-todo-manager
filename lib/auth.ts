import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AuthUser, AuthSession } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!'
)

export async function createToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({ 
    userId: user.id,
    email: user.email,
    display_name: user.display_name,
    email_verified: user.email_verified
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      id: payload.userId as string,
      email: payload.email as string,
      display_name: payload.display_name as string,
      email_verified: payload.email_verified as boolean
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) {
    return null
  }
  
  const user = await verifyToken(token)
  
  if (!user) {
    return null
  }
  
  return { user, token }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}