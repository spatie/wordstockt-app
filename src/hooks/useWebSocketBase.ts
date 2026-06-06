import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { WS_URL, API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/authStore';

interface WebSocketMessage {
  event: string;
  channel?: string;
  data: unknown;
}

const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 20000;

export interface WebSocketConfig {
  channelId: string | null | undefined;
  logPrefix: string;
  onConnected?: () => void;
  onMessage: (message: WebSocketMessage) => void;
  onAppForeground?: () => void;
}

export function useWebSocketBase({
  channelId,
  logPrefix,
  onConnected,
  onMessage,
  onAppForeground,
}: WebSocketConfig) {
  const token = useAuthStore((s) => s.token);

  const wsRef = useRef<WebSocket | null>(null);
  const socketIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);

  const tokenRef = useRef(token);
  const channelIdRef = useRef(channelId);
  const onConnectedRef = useRef(onConnected);
  const onMessageRef = useRef(onMessage);
  const onAppForegroundRef = useRef(onAppForeground);

  tokenRef.current = token;
  channelIdRef.current = channelId;
  onConnectedRef.current = onConnected;
  onMessageRef.current = onMessage;
  onAppForegroundRef.current = onAppForeground;

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
        // Detach handlers so the deliberate close does not trigger a reconnect.
        const closing = wsRef.current;
        closing.onopen = null;
        closing.onmessage = null;
        closing.onerror = null;
        closing.onclose = null;
        closing.close();
        wsRef.current = null;
      }
      socketIdRef.current = null;
      isConnectingRef.current = false;
    };

    const subscribeToChannel = async (ws: WebSocket, channelName: string) => {
      if (!socketIdRef.current || !tokenRef.current) {
        console.log(
          `[${logPrefix}] Cannot subscribe: missing socket_id or token`
        );
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
          console.log(
            `[${logPrefix}] Auth failed:`,
            response.status,
            errorText
          );
          return;
        }

        const authData = await response.json();
        console.log(
          `[${logPrefix}] Auth successful, subscribing to`,
          channelName
        );

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
        console.log(`[${logPrefix}] Subscribe error:`, error);
      }
    };

    const connect = () => {
      if (
        !channelIdRef.current ||
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
        console.log(
          `[${logPrefix}] Connected, waiting for connection_established`
        );
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
            console.log(`[${logPrefix}] Got socket_id:`, socketIdRef.current);

            startPing(ws);
            subscribeToChannel(ws, channelIdRef.current!);
            return;
          }

          if (message.event === 'pusher_internal:subscription_succeeded') {
            console.log(`[${logPrefix}] Subscribed to`, message.channel);
            onConnectedRef.current?.();
            return;
          }

          if (message.event === 'pusher:subscription_error') {
            console.log(`[${logPrefix}] Subscription error:`, message);
            return;
          }

          if (message.event === 'pusher:pong') {
            return;
          }

          onMessageRef.current(message);
        } catch (e) {
          console.log(`[${logPrefix}] Failed to parse message:`, e);
        }
      };

      ws.onerror = (error) => {
        console.log(`[${logPrefix}] Error:`, error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log(`[${logPrefix}] Disconnected`);
        stopPing();
        isConnectingRef.current = false;
        wsRef.current = null;
        socketIdRef.current = null;

        if (isMountedRef.current && channelIdRef.current && tokenRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    };

    if (channelIdRef.current && tokenRef.current) {
      connect();
    }

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          connect();
          onAppForegroundRef.current?.();
        } else if (state === 'background') {
          disconnect();
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      disconnect();
    };
    // Re-run the connection lifecycle when the channel or token changes so the
    // socket disconnects from the old channel/token and reconnects with the new
    // values. logPrefix is included because closures log it.
  }, [channelId, token, logPrefix]);

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  return { isConnected };
}
