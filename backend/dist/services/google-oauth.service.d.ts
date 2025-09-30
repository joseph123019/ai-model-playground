export declare class GoogleOAuthService {
    private oauth2Client;
    constructor();
    getAuthUrl(): string;
    getGoogleUser(code: string): Promise<{
        googleId: string | null | undefined;
        email: string | null | undefined;
        name: string | null | undefined;
        picture: string | null | undefined;
    }>;
}
