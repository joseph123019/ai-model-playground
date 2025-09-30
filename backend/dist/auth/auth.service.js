"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const mailer_service_1 = require("../mailer/mailer.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailerService;
    constructor(prisma, jwtService, mailerService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailerService = mailerService;
    }
    async register(email, password) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const activationToken = (0, crypto_1.randomUUID)();
        const activationTokenExpires = new Date();
        activationTokenExpires.setHours(activationTokenExpires.getHours() + 24);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                isActive: false,
                activationToken,
                activationTokenExpires,
            },
        });
        await this.mailerService.sendActivationEmail(email, activationToken);
        return {
            message: 'Registration successful. Please check your email to activate your account. Use a working email address.',
            user: {
                id: user.id,
                email: user.email,
                isActive: user.isActive,
            },
        };
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account not activated. Please check your email for the activation link.');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
        };
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        };
    }
    async activateAccount(token) {
        const user = await this.prisma.user.findUnique({
            where: { activationToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid activation token');
        }
        if (user.activationTokenExpires && user.activationTokenExpires < new Date()) {
            throw new common_1.BadRequestException('Activation token has expired');
        }
        if (user.isActive) {
            throw new common_1.BadRequestException('Account is already activated');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isActive: true,
                activationToken: null,
                activationTokenExpires: null,
            },
        });
        return {
            message: 'Account activated successfully. You can now log in.',
            email: user.email,
        };
    }
    async googleLogin(googleId, email, name) {
        let user = await this.prisma.user.findUnique({
            where: { googleId },
        });
        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (user) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        isActive: true,
                    },
                });
            }
        }
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    googleId,
                    isActive: true,
                    password: null,
                },
            });
        }
        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
        };
    }
    async resendActivation(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isActive) {
            throw new common_1.BadRequestException('Account is already activated');
        }
        if (user.activationTokenExpires) {
            const now = new Date();
            const lastSent = new Date(user.activationTokenExpires.getTime() - 24 * 60 * 60 * 1000);
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            if (lastSent > fiveMinutesAgo) {
                throw new common_1.HttpException('Please wait before requesting another activation email.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        const activationToken = (0, crypto_1.randomUUID)();
        const activationTokenExpires = new Date();
        activationTokenExpires.setHours(activationTokenExpires.getHours() + 24);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                activationToken,
                activationTokenExpires,
            },
        });
        await this.mailerService.sendActivationEmail(email, activationToken);
        return {
            message: 'New activation link sent. Please check your email.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mailer_service_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map