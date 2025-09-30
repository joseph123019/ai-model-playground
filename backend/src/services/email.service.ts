import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Priority 1: Gmail OAuth2 (if configured)
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_SENDER_EMAIL,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: process.env.GMAIL_ACCESS_TOKEN,
        },
      });
      console.log('📧 Using Gmail OAuth2 for email sending');
    }
    // Priority 2: SMTP configuration
    else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('📧 Using SMTP configuration for email sending');
    }
    // Priority 3: Ethereal test account (development)
    else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Using Ethereal test email account:', testAccount.user);
    }
  }

  async sendActivationEmail(email: string, activationToken: string) {
    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${activationToken}`;

    const mailOptions = {
      from: process.env.GMAIL_SENDER_EMAIL || process.env.SMTP_FROM || 'noreply@aicomparison.com',
      to: email,
      subject: 'Activate your account',
      text: `Hello,

Your account has been created but is not active yet.
Please click the link below to activate your account:

${activationLink}

Credentials:
Email: ${email}
Password: (the one you registered with)`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Activation email sent:', info.messageId);
      
      // Preview URL for Ethereal test emails only
      if (info.messageId && !process.env.GMAIL_CLIENT_ID && !process.env.SMTP_HOST) {
        console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return info;
    } catch (error) {
      console.error('❌ Error sending activation email:', error);
      throw error;
    }
  }
}
