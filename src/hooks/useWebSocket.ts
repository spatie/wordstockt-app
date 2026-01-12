import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { WS_URL, API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import { gameKeys } from '../api/queries/useGames';

interface WebSocketMessage {
  event: string;
  channel?: string;
  data: unknown;
}

const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 20000;

export function useWebSocket(gameUlid: string | null) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  // All mutable state in refs to avoid dependency issues
  const wsRef = useRef<WebSocket | null>(null);
  const socketIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const connectRef = useRef<(() => void) | null>(null);

  // Store current values in refs for access in callbacks
  const tokenRef = useRef(token);
  const gameUlidRef = useRef(gameUlid);
  const queryClientRef = useRef(queryClient);

  // Update refs on every render
  tokenRef.current = token;
  gameUlidRef.current = gameUlid;
  queryClientRef.current = queryClient;

  useEffect(() => {
    isMountedRef.current = true;

    const stopPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const startPing = (ws: WebSocket) => {
      stopPing();
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
        }
      }, PING_INTERVAL);
    };

    const disconnect = () => {
      stopPing();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      socketIdRef.current = null;
      isConnectingRef.current = false;
    };

    const subscribeToChannel = async (ws: WebSocket, channelName: string) => {
      if (!socketIdRef.current || !tokenRef.current) {
        console.log('[WS] Cannot subscribe: missing socket_id or token');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/broadcasting/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({
            socket_id: socketIdRef.current,
            channel_name: channelName,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('[WS] Auth failed:', response.status, errorText);
          return;
        }

        const authData = await response.json();
        console.log('[WS] Auth successful, subscribing to', channelName);

        ws.send(
          JSON.stringify({
            event: 'pusher:subscribe',
            data: {
              channel: channelName,
              auth: authData.auth,
            },
          })
        );
      } catch (error) {
        console.log('[WS] Subscribe error:', error);
      }
    };

    const connect = () => {
      if (
        !gameUlidRef.current ||
        !tokenRef.current ||
        isConnectingRef.current ||
        wsRef.current?.readyState === WebSocket.OPEN ||
        !isMountedRef.current
      ) {
        return;
      }

      isConnectingRef.current = true;
      const ws = new WebSocket(
        `${WS_URL}/app/wordstockt-key?protocol=7&client=js&version=8.3.0`
      );

      ws.onopen = () => {
        console.log('[WS] Connected, waiting for connection_established');
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.event === 'pusher:connection_established') {
            const data =
              typeof message.data === 'string'
                ? JSON.parse(message.data)
                : message.data;
            socketIdRef.current = data.socket_id;
            console.log('[WS] Got socket_id:', socketIdRef.current);

            startPing(ws);
            subscribeToChannel(ws, `private-game.${gameUlidRef.current}`);
            return;
          }

          if (message.event === 'pusher_internal:subscription_succeeded') {
            console.log('[WS] Subscribed to', message.channel);
            return;
          }

          if (message.event === 'pusher:subscription_error') {
            console.log('[WS] Subscription error:', message);
            return;
          }

          if (message.event === 'pusher:pong') {
            return;
          }

          if (message.event === 'move.played') {
            console.log('[WS] Move played, refreshing game');
            queryClientRef.current.invalidateQueries({
              queryKey: gameKeys.detail(gameUlidRef.current!),
            });
            queryClientRef.current.invalidateQueries({
              queryKey: gameKeys.lists(),
            });
          }
        } catch (e) {
          console.log('[WS] Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.log('[WS] Error:', error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        stopPing();
        isConnectingRef.current = false;
        wsRef.current = null;
        socketIdRef.current = null;

        // Only reconnect if still mounted and have credentials
        if (isMountedRef.current && gameUlidRef.current && tokenRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    };

    // Store connect function in ref for external access
    connectRef.current = connect;

    // Initial connection
    if (gameUlidRef.current && tokenRef.current) {
      connect();
    }

    // Handle app state changes
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          connect();
        } else if (state === 'background') {
          disconnect();
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      connectRef.current = null;
      subscription.remove();
      disconnect();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Trigger connection when gameUlid or token become available after mount
  useEffect(() => {
    if (gameUlid && token && connectRef.current) {
      connectRef.current();
    }
  }, [gameUlid, token]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
