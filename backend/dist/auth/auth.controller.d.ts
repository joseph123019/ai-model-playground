import { AuthService } from './auth.service';
import { GoogleOAuthService } from '../services/google-oauth.service';
import type { Response } from 'express';
export declare class RegisterDto {
    email: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ResendActivationDto {
    email: string;
}
export declare class AuthController {
    private authService;
    private googleOAuthService;
    constructor(authService: AuthService, googleOAuthService: GoogleOAuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
    activate(token: string): Promise<{
        message: string;
        email: string;
    }>;
    resendActivation(dto: ResendActivationDto): Promise<{
        message: string;
    }>;
    googleAuth(res: Response): Promise<void>;
    googleAuthCallback(code: string, res: Response): Promise<void>;
    getProfile(req: any): Promise<any>;
}
