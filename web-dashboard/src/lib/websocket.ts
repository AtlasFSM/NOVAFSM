import { io, Socket } from 'socket.io-client';
import { WS_URL } from './api';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function initWebSocket(tenantId: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on('connect', () => {
    console.log('[WebSocket] Connected');
    reconnectAttempts = 0;

    // Join tenant room
    if (tenantId) {
      socket?.emit('join', `tenant:${tenantId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[WebSocket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[WebSocket] Connection error:', error);
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      socket?.close();
    }
  });

  socket.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
  });

  return socket;
}

export function getWebSocket(): Socket | null {
  return socket;
}

export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToEvent<T = unknown>(
  eventName: string,
  callback: (data: T) => void
): () => void {
  if (!socket) {
    console.warn('[WebSocket] Socket not initialized. Call initWebSocket first.');
    return () => {};
  }

  socket.on(eventName, callback);

  // Return unsubscribe function
  return () => {
    socket?.off(eventName, callback);
  };
}

export function emitEvent<T = unknown>(eventName: string, data: T): void {
  if (!socket?.connected) {
    console.warn('[WebSocket] Socket not connected. Event not sent.');
    return;
  }

  socket.emit(eventName, data);
}
