import { useEffect, useRef } from 'react';
import { initWebSocket, subscribeToEvent, disconnectWebSocket } from '@/lib/websocket';

// This should come from auth context or user store in production
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default-tenant';

export function useWebSocket<T = unknown>(
  eventName: string,
  callback: (data: T) => void,
  enabled = true
) {
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Initialize WebSocket connection
    const socket = initWebSocket(TENANT_ID);

    // Subscribe to event
    const unsubscribe = subscribeToEvent<T>(eventName, (data) => {
      callbackRef.current(data);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [eventName, enabled]);
}

export function useWebSocketConnection() {
  useEffect(() => {
    const socket = initWebSocket(TENANT_ID);

    return () => {
      // Don't disconnect on component unmount, only on app unmount
      // This keeps the connection alive across page navigation
    };
  }, []);
}

// Hook for disconnecting WebSocket (useful for logout)
export function useWebSocketDisconnect() {
  return () => {
    disconnectWebSocket();
  };
}
