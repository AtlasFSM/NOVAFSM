import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Jobs WebSocket Gateway
 * Handles real-time job updates and notifications
 *
 * Events:
 * - job.assigned: Emitted when a job is assigned to a technician
 * - job.updated: Emitted when job status or details change
 *
 * Rooms:
 * - tenant:{tenantId}: All users in the organization
 * - tech:{techId}: Specific technician
 */
@WebSocketGateway({
  namespace: '/jobs',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake auth
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const { userId, tenantId, role } = payload;

      // Store user info in socket data
      client.data.userId = userId;
      client.data.tenantId = tenantId;
      client.data.role = role;

      // Join tenant room
      await client.join(`tenant:${tenantId}`);

      // If technician, join technician room
      if (role === 'TECHNICIAN') {
        await client.join(`tech:${userId}`);
      }

      this.logger.log(
        `Client ${client.id} connected (user: ${userId}, tenant: ${tenantId}, role: ${role})`,
      );
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Subscribe to job updates for a specific job
   */
  @SubscribeMessage('job.subscribe')
  handleSubscribeJob(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
    const { jobId } = data;
    client.join(`job:${jobId}`);
    this.logger.log(`Client ${client.id} subscribed to job ${jobId}`);
    return { event: 'job.subscribed', data: { jobId } };
  }

  /**
   * Unsubscribe from job updates
   */
  @SubscribeMessage('job.unsubscribe')
  handleUnsubscribeJob(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
    const { jobId } = data;
    client.leave(`job:${jobId}`);
    this.logger.log(`Client ${client.id} unsubscribed from job ${jobId}`);
    return { event: 'job.unsubscribed', data: { jobId } };
  }

  /**
   * Emit job assigned event
   * Sent to tenant room and technician room
   */
  emitJobAssigned(job: any, tenantId: string, technicianId: string) {
    const payload = {
      event: 'job.assigned',
      data: {
        job,
        timestamp: new Date().toISOString(),
      },
    };

    // Emit to tenant room
    this.server.to(`tenant:${tenantId}`).emit('job.assigned', payload.data);

    // Emit to technician room
    this.server.to(`tech:${technicianId}`).emit('job.assigned', payload.data);

    this.logger.log(
      `Emitted job.assigned for job ${job.number} to tenant ${tenantId} and tech ${technicianId}`,
    );
  }

  /**
   * Emit job updated event
   * Sent to tenant room, technician room (if assigned), and job-specific room
   */
  emitJobUpdated(job: any, tenantId: string, technicianId?: string) {
    const payload = {
      event: 'job.updated',
      data: {
        job,
        timestamp: new Date().toISOString(),
      },
    };

    // Emit to tenant room
    this.server.to(`tenant:${tenantId}`).emit('job.updated', payload.data);

    // Emit to technician room if assigned
    if (technicianId) {
      this.server.to(`tech:${technicianId}`).emit('job.updated', payload.data);
    }

    // Emit to job-specific room
    this.server.to(`job:${job.id}`).emit('job.updated', payload.data);

    this.logger.log(`Emitted job.updated for job ${job.number} to tenant ${tenantId}`);
  }

  /**
   * Emit job status changed event
   */
  emitJobStatusChanged(
    job: any,
    tenantId: string,
    oldStatus: string,
    newStatus: string,
    technicianId?: string,
  ) {
    const payload = {
      event: 'job.statusChanged',
      data: {
        job,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    };

    // Emit to tenant room
    this.server.to(`tenant:${tenantId}`).emit('job.statusChanged', payload.data);

    // Emit to technician room if assigned
    if (technicianId) {
      this.server.to(`tech:${technicianId}`).emit('job.statusChanged', payload.data);
    }

    // Emit to job-specific room
    this.server.to(`job:${job.id}`).emit('job.statusChanged', payload.data);

    this.logger.log(
      `Emitted job.statusChanged for job ${job.number}: ${oldStatus} -> ${newStatus}`,
    );
  }

  /**
   * Emit job deleted event
   */
  emitJobDeleted(jobId: string, jobNumber: string, tenantId: string) {
    const payload = {
      event: 'job.deleted',
      data: {
        jobId,
        jobNumber,
        timestamp: new Date().toISOString(),
      },
    };

    // Emit to tenant room
    this.server.to(`tenant:${tenantId}`).emit('job.deleted', payload.data);

    // Emit to job-specific room
    this.server.to(`job:${jobId}`).emit('job.deleted', payload.data);

    this.logger.log(`Emitted job.deleted for job ${jobNumber}`);
  }
}
