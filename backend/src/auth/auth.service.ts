import { Injectable, UnauthorizedException, ConflictException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate activation token
    const activationToken = randomUUID();
    const activationTokenExpires = new Date();
    activationTokenExpires.setHours(activationTokenExpires.getHours() + 24); // 24 hours

    // Create user (inactive by default)
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isActive: false,
        activationToken,
        activationTokenExpires,
      },
    });

    // Send activation email
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

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account not activated. Please check your email for the activation link.');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
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

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async activateAccount(token: string) {
    // Find user by activation token
    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid activation token');
    }

    // Check if token has expired
    if (user.activationTokenExpires && user.activationTokenExpires < new Date()) {
      throw new BadRequestException('Activation token has expired');
    }

    // Check if already activated
    if (user.isActive) {
      throw new BadRequestException('Account is already activated');
    }

    // Activate user and clear activation token
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

  async googleLogin(googleId: string, email: string, name?: string) {
    // Check if user exists with this Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    // If not, check if user exists with this email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      // If user exists with email but no Google ID, link the accounts
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId,
            isActive: true, // Auto-activate Google users
          },
        });
      }
    }

    // If user still doesn't exist, create a new one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          isActive: true, // Google users are auto-activated
          password: null, // No password for Google users
        },
      });
    }

    // Generate JWT token
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

  async resendActivation(email: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if already activated
    if (user.isActive) {
      throw new BadRequestException('Account is already activated');
    }

    // Throttle: Check if last activation email was sent less than 5 minutes ago
    if (user.activationTokenExpires) {
      const now = new Date();
      const lastSent = new Date(user.activationTokenExpires.getTime() - 24 * 60 * 60 * 1000); // Subtract 24 hours to get when it was sent
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      if (lastSent > fiveMinutesAgo) {
        throw new HttpException(
          'Please wait before requesting another activation email.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // Generate new activation token
    const activationToken = randomUUID();
    const activationTokenExpires = new Date();
    activationTokenExpires.setHours(activationTokenExpires.getHours() + 24); // 24 hours

    // Update user with new token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken,
        activationTokenExpires,
      },
    });

    // Send activation email
    await this.mailerService.sendActivationEmail(email, activationToken);

    return {
      message: 'New activation link sent. Please check your email.',
    };
  }
}
