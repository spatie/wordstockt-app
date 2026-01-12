import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { WS_URL, API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import { useInvitationStore } from '../stores/invitationStore';
import { gameKeys } from '../api/queries/useGames';
import { invitationKeys } from '../api/queries/useInvitations';
import type { GameInvitation } from '../types/invitation';

interface WebSocketMessage {
  event: string;
  channel?: string;
  data: unknown;
}

const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 20000;

/**
 * WebSocket hook for user-level events (invitations, etc.)
 * Subscribes to private-user.{userUlid} channel
 */
export function useUserWebSocket() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const userUlid = useAuthStore((s) => s.user?.ulid);

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
  const userUlidRef = useRef(userUlid);
  const queryClientRef = useRef(queryClient);

  // Update refs on every render
  tokenRef.current = token;
  userUlidRef.current = userUlid;
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
        console.log('[UserWS] Cannot subscribe: missing socket_id or token');
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
          console.log('[UserWS] Auth failed:', response.status, errorText);
          return;
        }

        const authData = await response.json();
        console.log('[UserWS] Auth successful, subscribing to', channelName);

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
        console.log('[UserWS] Subscribe error:', error);
      }
    };

    const connect = () => {
      if (
        !userUlidRef.current ||
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
        console.log('[UserWS] Connected, waiting for connection_established');
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
            console.log('[UserWS] Got socket_id:', socketIdRef.current);

            startPing(ws);
            subscribeToChannel(ws, `private-user.${userUlidRef.current}`);
            return;
          }

          if (message.event === 'pusher_internal:subscription_succeeded') {
            console.log('[UserWS] Subscribed to', message.channel);
            return;
          }

          if (message.event === 'pusher:subscription_error') {
            console.log('[UserWS] Subscription error:', message);
            return;
          }

          if (message.event === 'pusher:pong') {
            return;
          }

          // Handle game invitation event
          if (message.event === 'game.invitation') {
            console.log(
              '[UserWS] Game invitation received, refreshing invitations list'
            );
            queryClientRef.current.invalidateQueries({
              queryKey: invitationKeys.lists(),
            });

            // Show invitation dialog
            const data = message.data as {
              game: { ulid: string; language: string };
              inviter: {
                ulid: string;
                username: string;
                avatar: string | null;
              };
            };

            const invitation: GameInvitation = {
              ulid: '',
              status: 'pending',
              game: data.game,
              inviter: {
                ...data.inviter,
                avatarColor: null,
              },
              invitee: {
                ulid: userUlidRef.current!,
                username: '',
                avatar: null,
                avatarColor: null,
              },
              createdAt: new Date().toISOString(),
            };

            useInvitationStore.getState().setPendingInvitation(invitation);
          }

          // Handle invitation accepted event (for the inviter)
          if (message.event === 'game.invitation.accepted') {
            console.log('[UserWS] Invitation accepted, refreshing games list');
            queryClientRef.current.invalidateQueries({
              queryKey: gameKeys.lists(),
            });
          }
        } catch (e) {
          console.log('[UserWS] Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.log('[UserWS] Error:', error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log('[UserWS] Disconnected');
        stopPing();
        isConnectingRef.current = false;
        wsRef.current = null;
        socketIdRef.current = null;

        // Only reconnect if still mounted and have credentials
        if (isMountedRef.current && userUlidRef.current && tokenRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    };

    // Store connect function in ref for external access
    connectRef.current = connect;

    // Initial connection
    if (userUlidRef.current && tokenRef.current) {
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

  // Trigger connection when userUlid or token become available after mount
  useEffect(() => {
    if (userUlid && token && connectRef.current) {
      connectRef.current();
    }
  }, [userUlid, token]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
