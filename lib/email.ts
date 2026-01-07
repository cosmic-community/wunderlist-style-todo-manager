import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'support@cosmicjs.com'

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

function getEmailStyles(): string {
  return `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        padding: 40px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
      }
      .logo {
        width: 40px;
        height: 40px;
        background-color: #2563eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .logo-icon {
        color: #ffffff;
        font-size: 24px;
      }
      .brand {
        font-size: 24px;
        font-weight: bold;
        color: #111827;
      }
      h1 {
        font-size: 24px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 16px 0;
      }
      p {
        font-size: 16px;
        color: #4b5563;
        line-height: 1.6;
        margin: 0 0 16px 0;
      }
      .button {
        display: inline-block;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        margin: 24px 0;
      }
      .button:hover {
        background-color: #1d4ed8;
      }
      .code {
        display: inline-block;
        background-color: #f3f4f6;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 16px 32px;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 4px;
        color: #111827;
        margin: 16px 0;
      }
      .footer {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
        font-size: 14px;
        color: #6b7280;
      }
      .muted {
        color: #9ca3af;
        font-size: 14px;
      }
      .list-preview {
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      .list-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #111827;
      }
      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
    </style>
  `
}

export async function sendVerificationEmail(
  email: string,
  displayName: string,
  verificationCode: string
): Promise<boolean> {
  const baseUrl = getBaseUrl()
  const verifyUrl = `${baseUrl}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your Cosmic Todo account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          ${getEmailStyles()}
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">
                  <span class="logo-icon">✓</span>
                </div>
                <span class="brand">Cosmic Todo</span>
              </div>
              
              <h1>Welcome, ${displayName}! 👋</h1>
              
              <p>Thanks for signing up for Cosmic Todo. To get started, please verify your email address by clicking the button below:</p>
              
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
              
              <p>Or enter this verification code manually:</p>
              
              <div class="code">${verificationCode}</div>
              
              <div class="footer">
                <p class="muted">If you didn't create an account with Cosmic Todo, you can safely ignore this email.</p>
                <p class="muted">This link will expire in 24 hours.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

export async function sendInviteEmail(
  email: string,
  inviterName: string,
  listName: string,
  listColor: string,
  verificationCode: string
): Promise<boolean> {
  const baseUrl = getBaseUrl()
  const acceptUrl = `${baseUrl}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}&invite=true`
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to collaborate on "${listName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          ${getEmailStyles()}
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">
                  <span class="logo-icon">✓</span>
                </div>
                <span class="brand">Cosmic Todo</span>
              </div>
              
              <h1>You've been invited! 🎉</h1>
              
              <p><strong>${inviterName}</strong> has invited you to collaborate on a todo list:</p>
              
              <div class="list-preview">
                <div class="list-name">
                  <span class="color-dot" style="background-color: ${listColor || '#3b82f6'}"></span>
                  <span>${listName}</span>
                </div>
              </div>
              
              <p>Click the button below to accept the invitation and start collaborating:</p>
              
              <a href="${acceptUrl}" class="button">Accept Invitation</a>
              
              <p class="muted">You'll be asked to set a password for your new account if you don't already have one.</p>
              
              <div class="footer">
                <p class="muted">If you don't want to join this list, you can safely ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })
    
    return true
  } catch (error) {
    console.error('Failed to send invite email:', error)
    return false
  }
}