import { Controller, Post, Get, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, EnableMfaDto, VerifyMfaDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  // 3 registrations per hour — limits account-creation spam & email enumeration
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Register new organization and admin user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  // 10 refresh attempts per minute per IP — prevents token-cycling brute-force
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: CurrentUserPayload, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.userId, dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.userId);
  }

  @Post('mfa/enable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Enable MFA and get QR code' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async enableMfa(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.enableMfa(user.userId);
  }

  @Post('mfa/verify')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify MFA code and complete setup' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async verifyMfa(@CurrentUser() user: CurrentUserPayload, @Body() dto: EnableMfaDto) {
    return this.authService.verifyAndEnableMfa(user.userId, dto);
  }

  @Post('mfa/disable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disableMfa(@CurrentUser() user: CurrentUserPayload, @Body() dto: VerifyMfaDto) {
    return this.authService.disableMfa(user.userId, dto.code);
  }

  @Public()
  @Get('jwks')
  @ApiOperation({ summary: 'Get JWKS for JWT verification' })
  @ApiResponse({ status: 200, description: 'JWKS retrieved' })
  getJWKS() {
    return this.authService.getJWKS();
  }
}
