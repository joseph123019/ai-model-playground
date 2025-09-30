export declare class EmailService {
    private transporter;
    constructor();
    private initializeTransporter;
    sendActivationEmail(email: string, activationToken: string): Promise<any>;
}
