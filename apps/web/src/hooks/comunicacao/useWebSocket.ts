'use client';

/**
 * useWebSocket Hook
 * Gerencia conexao WebSocket com o servidor de chat
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  WebSocketMessageNewEvent,
  WebSocketMessageStatusEvent,
  WebSocketTypingEvent,
  WebSocketConversationUpdateEvent,
} from '../../services/comunicacao/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const RECONNECTION_DELAY = 1000;
const MAX_RECONNECTION_DELAY = 5000;

export interface UseWebSocketOptions {
  onMessageNew?: (event: WebSocketMessageNewEvent) => void;
  onMessageStatus?: (event: WebSocketMessageStatusEvent) => void;
  onTyping?: (event: WebSocketTypingEvent) => void;
  onConversationUpdate?: (event: WebSocketConversationUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const {
    onMessageNew,
    onMessageStatus,
    onTyping,
    onConversationUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // Inicializa conexao
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/chat`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: MAX_RECONNECTION_DELAY,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();

      // Rejoin rooms after reconnect
      joinedRoomsRef.current.forEach((roomId) => {
        socket.emit('join:conversation', roomId);
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      onError?.(error);
    });

    socket.on('message:new', (event: WebSocketMessageNewEvent) => {
      onMessageNew?.(event);
    });

    socket.on('message:status', (event: WebSocketMessageStatusEvent) => {
      onMessageStatus?.(event);
    });

    socket.on('typing:update', (event: WebSocketTypingEvent) => {
      onTyping?.(event);
    });

    socket.on('conversation:update', (event: WebSocketConversationUpdateEvent) => {
      onConversationUpdate?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onConnect, onDisconnect, onError, onMessageNew, onMessageStatus, onTyping, onConversationUpdate]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:conversation', conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:conversation', conversationId);
      joinedRoomsRef.current.delete(conversationId);
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', conversationId);
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', conversationId);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    disconnect,
    reconnect,
  };
}
