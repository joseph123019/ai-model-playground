import { Controller, Post, Body, Get, UseGuards, Request, Param, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Response } from 'express';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ResendActivationDto {
  @IsEmail()
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOAuthService: GoogleOAuthService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('activate/:token')
  async activate(@Param('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @Post('resend-activation')
  async resendActivation(@Body() dto: ResendActivationDto) {
    return this.authService.resendActivation(dto.email);
  }

  @Get('google')
  async googleAuth(@Res() res: Response) {
    const url = this.googleOAuthService.getAuthUrl();
    res.redirect(url);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const googleUser = await this.googleOAuthService.getGoogleUser(code);
      
      if (!googleUser.googleId || !googleUser.email) {
        throw new Error('Google authentication failed: Missing required user information');
      }
      
      const result = await this.authService.googleLogin(
        googleUser.googleId,
        googleUser.email,
        googleUser.name || undefined,
      );
      
      // Redirect to frontend with token and user data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('🔗 Google OAuth redirect to:', frontendUrl);
      console.log('📝 FRONTEND_URL env var:', process.env.FRONTEND_URL);
      const userData = encodeURIComponent(JSON.stringify(result.user));
      res.redirect(`${frontendUrl}/auth/google/success?token=${result.access_token}&user=${userData}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/error?message=${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }
}
