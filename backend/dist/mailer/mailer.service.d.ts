export declare class MailerService {
    private oAuth2Client;
    private gmail;
    constructor();
    sendActivationEmail(to: string, activationToken: string): Promise<any>;
}
