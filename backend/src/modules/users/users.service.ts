import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly bcryptRounds = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all users with pagination
   * Automatically filtered by tenantId via Prisma middleware
   */
  async findAll(page = 1, limit = 10, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          mfaEnabled: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive fields
          password: false,
          refreshToken: false,
          mfaSecret: false,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Find a single user by ID
   * Automatically filtered by tenantId via Prisma middleware
   */
  async findOne(id: string, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        mfaEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
        password: false,
        refreshToken: false,
        mfaSecret: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * Create a new user
   * TenantId is automatically injected via Prisma middleware
   */
  async create(dto: CreateUserDto, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    // Check if user with email already exists in this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.bcryptRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status || 'ACTIVE',
        mfaEnabled: dto.mfaEnabled || false,
        // tenantId will be automatically injected by Prisma middleware
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
        password: false,
        refreshToken: false,
        mfaSecret: false,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  /**
   * Update a user
   * Automatically filtered by tenantId via Prisma middleware
   */
  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check for conflicts
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          tenantId,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
        mfaEnabled: dto.mfaEnabled,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        mfaEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
        password: false,
        refreshToken: false,
        mfaSecret: false,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  /**
   * Delete a user
   * Automatically filtered by tenantId via Prisma middleware
   */
  async delete(id: string, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  /**
   * Change user password
   * User can change their own password with current password verification
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    tenantId: string,
  ) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, this.bcryptRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        // Clear refresh token to force re-login
        refreshToken: null,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Admin reset user password (without current password)
   * Only for ADMIN role
   */
  async resetPassword(userId: string, newPassword: string, tenantId: string) {
    // Set tenant context for this request
    this.prisma.setTenantId(tenantId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate password length
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        // Clear refresh token to force re-login
        refreshToken: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
