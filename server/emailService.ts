import { Resend } from 'resend';
import { storage } from './storage';

class EmailService {
  private resend: Resend | null;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not found - emails will be logged to console instead of sent');
      console.log('To get Resend API key (production readiness):');
      console.log('1. Go to https://resend.com/signup');
      console.log('2. Upgrade to Pro plan ($20/month) if needed');
      console.log('3. If you require HIPAA BAAs, confirm availability with the vendor before sending PHI');
      console.log('4. Go to Settings → API Keys → Create API Key');
      console.log('5. Add RESEND_API_KEY to your .env file');
      this.resend = null;
      return;
    }

    // Validate Resend API key format
    if (!process.env.RESEND_API_KEY.startsWith('re_')) {
      console.error('⚠️ Resend API key should start with "re_" - current key starts with:', process.env.RESEND_API_KEY.substring(0, 3));
      console.log('Please check your Resend API key at https://resend.com/api-keys');
      this.resend = null;
      return;
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend API key configured successfully (working toward HIPAA readiness)');
  }

  async sendEmail(email: {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    // If Resend is not configured, log email to console for testing
    if (!this.resend) {
      console.log('\n📧 EMAIL WOULD BE SENT (Resend not configured):');
      console.log('To:', email.to);
      console.log('From:', email.from);
      console.log('Subject:', email.subject);
      console.log('HTML Content:', email.html?.substring(0, 200) + '...');
      console.log('✅ Email simulated successfully\n');
      return true; // Return success for testing
    }

    try {
      // Debug log to check what we're sending
      console.log('Sending email via Resend with HTML length:', email.html?.length);

      // Ensure we have content to send
      if (!email.html && !email.text) {
        console.error('❌ No content to send in email (both html and text are empty)');
        return false;
      }

      // Send email using Resend
      const { data, error } = await this.resend.emails.send({
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text || 'Please enable HTML to view this email.',
        html: email.html || email.text || '',
      });

      if (error) {
        console.error('❌ Resend email error:', error);
        return false;
      }

      console.log('✅ Email sent successfully via Resend to:', email.to);
      console.log('   Email ID:', data?.id);
      return true;
    } catch (error: any) {
      console.error('❌ Resend email error:', error.message || error);
      return false;
    }
  }

  async processEmailQueue(): Promise<void> {
    try {
      // Get all pending emails
      const pendingEmails = await storage.getPendingEmails();
      
      for (const email of pendingEmails) {
        console.log(`Processing email: ${email.emailType} to ${email.toEmail}`);
        
        // Fix PostgreSQL escaped quotes in HTML content
        let cleanHtml = email.htmlContent;
        if (cleanHtml) {
          // PostgreSQL escapes quotes as "" in output, fix them
          cleanHtml = cleanHtml.replace(/""/g, '"');
          // Remove wrapping quotes if present
          if (cleanHtml.startsWith('"') && cleanHtml.endsWith('"')) {
            cleanHtml = cleanHtml.slice(1, -1);
          }
          // Also remove any leading/trailing newlines
          cleanHtml = cleanHtml.trim();
          console.log('Cleaning HTML - before length:', email.htmlContent?.length, 'after:', cleanHtml?.length);
        }
        
        const success = await this.sendEmail({
          to: email.toEmail,
          from: email.fromEmail || 'info@tranquiloo-app.com',
          subject: email.subject,
          html: cleanHtml,
          text: email.textContent || ''
        });

        // Update email status
        await storage.updateEmailStatus(email.id, success ? 'sent' : 'failed');
        
        if (success) {
          console.log(`✅ Email sent successfully to ${email.toEmail}`);
        } else {
          console.error(`❌ Failed to send email to ${email.toEmail}`);
        }
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  // Process emails every 30 seconds
  startEmailProcessor(): void {
    setInterval(() => {
      this.processEmailQueue();
    }, 30000); // 30 seconds

    // Process immediately on start
    this.processEmailQueue();
  }

  // Send verification email for patients
  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<{ success: boolean }> {
    try {
      // Use the Replit domain for verification URLs
      const host = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
      const protocol = host.includes('replit.dev') ? 'https' : 'http';
      console.log('Email verification URL will use:', protocol + '://' + host);
      const verificationUrl = `${protocol}://${host}/verify-email?token=${token}`;
      
      const subject = 'Please verify your email - Tranquil Support';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Welcome to Tranquil Support</h1>
            <p style="color: #6b7280; font-size: 16px;">Your mental health companion</p>
          </div>
          
          <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin-top: 0;">Please verify your email address</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for creating an account with Tranquil Support. To ensure the security of your account 
              and enable all features, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${verificationUrl}</span>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
            <p><strong>What's next?</strong></p>
            <ul style="line-height: 1.6;">
              <li>Complete your profile setup</li>
              <li>Start tracking your anxiety and mood</li>
              <li>Connect with AI companions for support</li>
              <li>Access therapeutic resources and tools</li>
            </ul>
            
            <p style="margin-top: 20px;">
              <small>This email was sent to ${email}. If you didn't create this account, 
              please ignore this email.</small>
            </p>
          </div>
        </div>
      `;
      
      const text = `Welcome to Tranquil Support!
      
Please verify your email address to complete your account setup.

Click this link to verify: ${verificationUrl}

What's next:
- Complete your profile setup
- Start tracking your anxiety and mood
- Connect with AI companions for support
- Access therapeutic resources and tools

This email was sent to ${email}. If you didn't create this account, please ignore this email.`;

      // Queue the email for sending
      await storage.createEmailNotification({
        toEmail: email,
        emailType: 'email_verification',
        subject: subject,
        htmlContent: html,
        metadata: JSON.stringify({ firstName, verificationToken: token })
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating verification email:', error);
      return { success: false };
    }
  }

  // Send welcome email to therapists with license verification notice
  async sendTherapistVerificationEmail(email: string, firstName: string, token: string, verificationUrl: string): Promise<{ success: boolean }> {
    try {
      const subject = 'Verify Your Therapist Account - Tranquiloo';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">Welcome to Tranquiloo, ${firstName}!</h1>
            <p style="color: #6b7280; font-size: 16px;">Your professional mental health platform</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #059669;">
            <h2 style="color: #065f46; margin-top: 0;">Please verify your email address</h2>
            <p style="color: #065f46; line-height: 1.6;">
              Thank you for joining our professional network. To ensure the security of your therapist account 
              and enable access to patient data, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: #059669; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Verify Email & Access Dashboard
              </a>
            </div>
            
            <p style="color: #065f46; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; background: #ecfdf5; padding: 2px 4px; border-radius: 3px;">${verificationUrl}</span>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #374151; margin-top: 0;">After verification, you can:</h3>
            <ul style="color: #6b7280; line-height: 1.6;">
              <li>Access your professional therapist dashboard</li>
              <li>Connect with patients using their patient codes</li>
              <li>View HIPAA-compliant patient analytics and reports</li>
              <li>Create and manage treatment plans</li>
              <li>Manage your practice and patient connections</li>
            </ul>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Professional License Verification:</strong> We'll verify your license in the background after account activation. 
                You'll have full access while we complete this process.
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 12px;">
            <p>This email was sent to ${email}. If you didn't create this account, please contact support immediately.</p>
            <p>For questions about therapist accounts, reach out to our professional support team.</p>
          </div>
        </div>
      `;
      
      const text = `Welcome to Tranquiloo, ${firstName}!

Please verify your therapist account email address.

Thank you for joining our professional network. To ensure the security of your therapist account and enable access to patient data, please verify your email address.

Verification link: ${verificationUrl}

After verification, you can:
- Access your professional therapist dashboard
- Connect with patients using their patient codes
- View HIPAA-compliant patient analytics and reports
- Create and manage treatment plans
- Manage your practice and patient connections

Professional License Verification: We'll verify your license in the background after account activation. You'll have full access while we complete this process.

This email was sent to ${email}. If you didn't create this account, please contact support immediately.`;

      // Queue the email for sending
      await storage.createEmailNotification({
        toEmail: email,
        emailType: 'therapist_welcome',
        subject: subject,
        htmlContent: html,
        metadata: JSON.stringify({ firstName, token })
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating therapist welcome email:', error);
      return { success: false };
    }
  }

  async sendTherapistWelcomeEmail(email: string, firstName: string, token: string): Promise<{ success: boolean }> {
    const verificationUrl = `${process.env.REPLIT_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    const subject = 'Welcome to Tranquiloo - Verify your email';
    const html = `<p>Hello ${firstName},</p><p>Please verify your therapist account by clicking <a href="${verificationUrl}">here</a>.</p>`;
    const success = await this.sendEmail({
      to: email,
      from: 'noreply@tranquiloo-app.com',
      subject,
      html,
    });
    return { success };
  }
}

export const emailService = new EmailService();
