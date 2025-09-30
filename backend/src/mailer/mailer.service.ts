import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class MailerService {
  private oAuth2Client;
  private gmail;

  constructor() {
    // Initialize OAuth2 client
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );

    // Set refresh token
    this.oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // Initialize Gmail API
    this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });

    console.log('📧 Gmail API Mailer Service initialized');
  }

  async sendActivationEmail(to: string, activationToken: string) {
    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${activationToken}`;
    const from = process.env.GMAIL_SENDER_EMAIL;

    try {
      // Build HTML email template
      const htmlBody = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Activate Your Account</h2>
    <p>Hello,</p>
    <p>Your account has been created but is not active yet.</p>
    <p>
      Please click the link below to activate your account:
    </p>
    <p>
      <a href="${activationLink}"
         style="display:inline-block; padding:10px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:4px;">
        Activate Account
      </a>
    </p>
    <p>
      Credentials:<br />
      <strong>Email:</strong> ${to}<br />
      <strong>Password:</strong> (the one you registered with)
    </p>
    <hr />
    <p style="font-size: 12px; color: #777;">
      If you didn't request this account, please ignore this email.
    </p>
  </body>
</html>`;

      // Build RFC 2822 formatted email message with HTML
      const emailLines = [
        `From: AI Playground <${from}>`,
        `To: ${to}`,
        'Subject: Activate your account',
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody,
      ];

      const email = emailLines.join('\r\n');

      // Encode in base64url format
      const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log('✅ Activation email sent via Gmail API:', response.data.id);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error sending activation email:', error);
      throw error;
    }
  }
}
