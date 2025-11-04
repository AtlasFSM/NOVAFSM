import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, EnableMfaDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register new organization and admin user
   * This bootstraps a new tenant
   */
  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const bcryptRounds = this.configService.get<number>('security.bcryptRounds', 12);
    const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds);

    // Create organization and admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          currency: dto.currency || 'CAD',
          status: 'ACTIVE',
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: org.id,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      return { org, user };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.org.id, dto.email, result.user.role);

    // Save hashed refresh token
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.org.id,
        organizationName: result.org.name,
      },
      tokens,
    };
  }

  /**
   * Login with email and password
   * Supports MFA if enabled
   */
  async login(dto: LoginDto, ip?: string) {
    // Find user by email
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Check MFA if enabled
    if (user.mfaEnabled && user.mfaSecret) {
      if (!dto.mfaCode) {
        return {
          success: false,
          requiresMfa: true,
          message: 'MFA code required',
        };
      }

      const isValidMfa = this.verifyTOTP(user.mfaSecret, dto.mfaCode);

      if (!isValidMfa) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.tenantId, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        organizationName: user.organization.name,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.privateKey'),
        algorithms: ['RS256'],
      });

      // Check if token is blacklisted
      const hashedToken = await bcrypt.hash(refreshToken, 10);
      const isBlacklisted = await this.prisma.tokenBlacklist.findUnique({
        where: { token: hashedToken },
      });

      if (isBlacklisted) {
        throw new UnauthorizedException('Token revoked');
      }

      // Verify user still exists and token matches
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.tenantId, user.email, user.role);

      // Update stored refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        success: true,
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - blacklist refresh token
   */
  async logout(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Match refresh token expiry

    await this.prisma.tokenBlacklist.create({
      data: {
        token: hashedToken,
        expiresAt,
      },
    });

    // Clear user's refresh token
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Enable MFA for user - generates QR code
   */
  async enableMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA already enabled');
    }

    // Generate TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'NoVaFSM',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Generate QR code
    const otpauthUrl = totp.toString();
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Store secret (not yet enabled)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    return {
      success: true,
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify MFA code and complete enablement
   */
  async verifyAndEnableMfa(userId: string, dto: EnableMfaDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    const isValid = this.verifyTOTP(user.mfaSecret, dto.verificationCode);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return {
      success: true,
      message: 'MFA enabled successfully',
    };
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, verificationCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA not enabled');
    }

    const isValid = this.verifyTOTP(user.mfaSecret, verificationCode);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  }

  /**
   * Get current user details
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, mfaSecret, ...safeUser } = user;

    return {
      success: true,
      user: safeUser,
    };
  }

  /**
   * JWKS endpoint for JWT public key
   */
  getJWKS() {
    const publicKey = this.configService.get<string>('jwt.publicKey');

    if (!publicKey) {
      throw new Error('JWT public key not configured');
    }

    // Note: In production, generate proper JWK format
    // This is a simplified version for MVP
    return {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          alg: 'RS256',
          kid: 'novafsm-key-1',
          n: Buffer.from(publicKey).toString('base64'),
        },
      ],
    };
  }

  // ============ Private Helper Methods ============

  private async generateTokens(userId: string, tenantId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      tenantId,
      email,
      role,
    };

    const privateKey = this.configService.get<string>('jwt.privateKey');
    const accessExpiry = this.configService.get<string>('jwt.accessExpiry', '15m');
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiry', '7d');
    const issuer = this.configService.get<string>('jwt.issuer');
    const audience = this.configService.get<string>('jwt.audience');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        privateKey,
        algorithm: 'RS256',
        expiresIn: accessExpiry,
        issuer,
        audience,
      }),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        {
          privateKey,
          algorithm: 'RS256',
          expiresIn: refreshExpiry,
          issuer,
          audience,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiry(accessExpiry),
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private verifyTOTP(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Allow 1 period (30s) window for clock drift
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15m default

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 60);
  }
}
