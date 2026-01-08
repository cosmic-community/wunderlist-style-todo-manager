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
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f3f4f6;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Header -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="width: 40px; height: 40px; background-color: #2563eb; border-radius: 8px; text-align: center; vertical-align: middle;">
                                  <span style="color: #ffffff; font-size: 24px; line-height: 40px;">✓</span>
                                </td>
                                <td style="padding-left: 12px; font-size: 24px; font-weight: bold; color: #111827;">Cosmic Todo</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Content -->
                      <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Welcome, ${displayName}! 👋</h1>
                      
                      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;">Thanks for signing up for Cosmic Todo. To get started, please verify your email address by clicking the button below:</p>
                      
                      <!-- Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #2563eb; border-radius: 8px;">
                            <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email Address</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;">Or enter this verification code manually:</p>
                      
                      <!-- Code Box -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                        <tr>
                          <td style="background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px 32px;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827; font-family: monospace;">${verificationCode}</span>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <tr>
                          <td>
                            <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">If you didn't create an account with Cosmic Todo, you can safely ignore this email.</p>
                            <p style="font-size: 14px; color: #9ca3af; margin: 0;">This link will expire in 24 hours.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
  const colorToUse = listColor || '#3b82f6'
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to collaborate on "${listName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f3f4f6;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Header -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="width: 40px; height: 40px; background-color: #2563eb; border-radius: 8px; text-align: center; vertical-align: middle;">
                                  <span style="color: #ffffff; font-size: 24px; line-height: 40px;">✓</span>
                                </td>
                                <td style="padding-left: 12px; font-size: 24px; font-weight: bold; color: #111827;">Cosmic Todo</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Content -->
                      <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">You've been invited! 🎉</h1>
                      
                      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;"><strong style="color: #111827;">${inviterName}</strong> has invited you to collaborate on a todo list:</p>
                      
                      <!-- List Preview -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin: 16px 0;">
                        <tr>
                          <td style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="width: 12px; height: 12px; background-color: ${colorToUse}; border-radius: 50%;"></td>
                                <td style="padding-left: 8px; font-weight: 600; color: #111827; font-size: 16px;">${listName}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 16px 0;">Click the button below to accept the invitation and start collaborating:</p>
                      
                      <!-- Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #2563eb; border-radius: 8px;">
                            <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 16px 0;">You'll be asked to set a password for your new account if you don't already have one.</p>
                      
                      <!-- Footer -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <tr>
                          <td>
                            <p style="font-size: 14px; color: #9ca3af; margin: 0;">If you don't want to join this list, you can safely ignore this email.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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