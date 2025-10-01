import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface ResponseData {
  model: string;
  content: string;
  tokens: number;
  cost: number;
  responseId: string;
  duration?: number;
}

interface StatusUpdate {
  model: string;
  status: 'typing' | 'streaming' | 'complete' | 'error';
  responseId: string;
  duration?: number;
}

interface FinalMetrics {
  sessionId: string;
  responses: Array<{
    model: string;
    tokens: number;
    cost: number;
    status: string;
    duration?: number;
  }>;
  totals: {
    tokens: number;
    cost: number;
    fastestModel: string;
    fastestDuration: number;
  };
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finalMetrics, setFinalMetrics] = useState<FinalMetrics | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('Socket ID:', newSocket.id);
      console.log('Transport:', newSocket.io.engine.transport.name);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket after', attemptNumber, 'attempts');
      setConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to WebSocket');
      setConnected(false);
    });

    newSocket.on('sessionCreated', (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
      setResponses({});
      setStatuses({});
      setFinalMetrics(null);
    });

    newSocket.on('statusUpdate', (data: StatusUpdate) => {
      setStatuses(prev => ({
        ...prev,
        [data.model]: data.status,
      }));
      
      // Update duration if provided (when complete)
      if (data.duration) {
        setResponses(prev => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            duration: data.duration,
          },
        }));
      }
    });

    newSocket.on('responseChunk', (data: ResponseData) => {
      setResponses(prev => ({
        ...prev,
        [data.model]: data,
      }));
    });

    newSocket.on('finalMetrics', (data: FinalMetrics) => {
      setFinalMetrics(data);
    });

    newSocket.on('connect_error', (error) => {
      // Only log if it's not an auth issue (which is expected when not logged in)
      if (!error.message.includes('Unauthorized') && !error.message.includes('Authentication')) {
        console.error('WebSocket connection error:', error.message);
      }
      setConnected(false);
    });

    newSocket.on('error', (error: { message?: string; model?: string }) => {
      // Only log errors with useful information
      if (error.message && !error.message.includes('transport')) {
        console.error('WebSocket error:', error.message);
      }
      if (error.model) {
        setStatuses(prev => ({
          ...prev,
          [error.model as string]: 'error',
        }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, token]);

  const startComparison = (payload: {
    prompt: string;
    selectionMode?: string;
    manualModels?: { openai?: string; anthropic?: string };
  }) => {
    if (socket && connected) {
      socket.emit('startComparison', payload);
    }
  };

  const reset = () => {
    setResponses({});
    setStatuses({});
    setSessionId(null);
    setFinalMetrics(null);
  };

  return {
    socket,
    connected,
    responses,
    statuses,
    sessionId,
    finalMetrics,
    startComparison,
    reset,
  };
}
