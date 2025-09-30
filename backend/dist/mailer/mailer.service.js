"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
let MailerService = class MailerService {
    oAuth2Client;
    gmail;
    constructor() {
        this.oAuth2Client = new googleapis_1.google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET, process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground');
        this.oAuth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        });
        this.gmail = googleapis_1.google.gmail({ version: 'v1', auth: this.oAuth2Client });
        console.log('📧 Gmail API Mailer Service initialized');
    }
    async sendActivationEmail(to, activationToken) {
        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${activationToken}`;
        const from = process.env.GMAIL_SENDER_EMAIL;
        try {
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
            const encodedMessage = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });
            console.log('✅ Activation email sent via Gmail API:', response.data.id);
            return response.data;
        }
        catch (error) {
            console.error('❌ Error sending activation email:', error);
            throw error;
        }
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailerService);
//# sourceMappingURL=mailer.service.js.map