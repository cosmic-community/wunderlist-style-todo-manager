import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { AuthUser } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const COOKIE_NAME = 'auth_token'

export interface Session {
  user: AuthUser
  token: string
}

export function generateVerificationCode(): string {
  // Generate a 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

// Changed: Added createToken function that only creates a JWT token without setting cookie
export async function createToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({ 
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    email_verified: user.email_verified
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  return token
}

// Changed: Added setAuthCookie function that only sets the cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

// Changed: Added clearAuthCookie function to clear the auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function createSession(user: AuthUser): Promise<string> {
  const token = await createToken(user)
  await setAuthCookie(token)
  return token
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        display_name: payload.display_name as string,
        email_verified: payload.email_verified as boolean
      },
      token
    }
  } catch {
    return null
  }
}

// Changed: Added updateSession function to update user data in session
export async function updateSession(user: AuthUser): Promise<string> {
  const token = await createToken(user)
  await setAuthCookie(token)
  return token
}

export async function clearSession(): Promise<void> {
  await clearAuthCookie()
}