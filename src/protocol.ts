/**
 * NOVAFSM Shared Protocol Definitions
 *
 * This file defines the canonical WebSocket event names and payload shapes
 * that the backend emits and the frontend consumes. Any change here is a
 * breaking change to the real-time protocol and MUST be coordinated across
 * both backend (jobs-gateway.ts) and frontend (lib/websocket.ts).
 *
 * Validated at CI time by: pnpm protocol:check
 */

// ---------------------------------------------------------------------------
// WebSocket event names (server → client)
// ---------------------------------------------------------------------------

export const WS_EVENTS = {
  // Job lifecycle events emitted by the backend gateway
  JOB_ASSIGNED: 'job.assigned',
  JOB_UPDATED: 'job.updated',
  JOB_STATUS_CHANGED: 'job.statusChanged',
  JOB_DELETED: 'job.deleted',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ---------------------------------------------------------------------------
// WebSocket event names (client → server)
// ---------------------------------------------------------------------------

export const WS_CLIENT_EVENTS = {
  JOB_SUBSCRIBE: 'job.subscribe',
  JOB_UNSUBSCRIBE: 'job.unsubscribe',
} as const;

export type WsClientEventName =
  (typeof WS_CLIENT_EVENTS)[keyof typeof WS_CLIENT_EVENTS];

// ---------------------------------------------------------------------------
// Payload shapes
// ---------------------------------------------------------------------------

export interface WsJobAssignedPayload {
  job: unknown;
  timestamp: string;
}

export interface WsJobUpdatedPayload {
  job: unknown;
  timestamp: string;
}

export interface WsJobStatusChangedPayload {
  job: unknown;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface WsJobDeletedPayload {
  jobId: string;
  jobNumber: string;
  timestamp: string;
}

export interface WsJobSubscribePayload {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Protocol manifest – used by scripts/protocol-check.mjs at CI time
// ---------------------------------------------------------------------------

export const PROTOCOL_MANIFEST = {
  serverEmits: Object.values(WS_EVENTS),
  clientEmits: Object.values(WS_CLIENT_EVENTS),
} as const;
