import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    getUserSessions(req: any): Promise<{
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
    getSession(id: string, req: any): Promise<{
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
