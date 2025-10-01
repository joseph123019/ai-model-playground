import { PrismaService } from '../prisma/prisma.service';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserSessions(userId: string): Promise<{
        id: string;
        prompt: string;
        createdAt: Date;
        responses: {
            id: string;
            createdAt: Date;
            tokens: number | null;
            status: string;
            model: string;
            duration: number | null;
            cost: number | null;
        }[];
        totalTokens: number;
        totalCost: number;
    }[]>;
    getSessionById(sessionId: string, userId: string): Promise<{
        id: string;
        prompt: string;
        createdAt: Date;
        responses: {
            id: string;
            createdAt: Date;
            tokens: number | null;
            status: string;
            model: string;
            duration: number | null;
            content: string;
            cost: number | null;
            sessionId: string;
        }[];
        user: {
            id: string;
            email: string;
        } | null;
        totalTokens: number;
        totalCost: number;
    }>;
}
