import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailerService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailerService: MailerService);
    register(email: string, password: string): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
        };
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
    }>;
    activateAccount(token: string): Promise<{
        message: string;
        email: string;
    }>;
    googleLogin(googleId: string, email: string, name?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
    resendActivation(email: string): Promise<{
        message: string;
    }>;
}
