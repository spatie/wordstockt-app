import { useRef, useCallback, useEffect } from 'react';
import { Platform, GestureResponderEvent } from 'react-native';
import { CLICK_THRESHOLD } from '../config/constants';

interface UsePointerDragOptions {
  onDragStart: (pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (wasDragged: boolean) => void;
  isActive: boolean;
  disabled?: boolean;
}

export function usePointerDrag({
  onDragStart,
  onDragMove,
  onDragEnd,
  isActive,
  disabled = false,
}: UsePointerDragOptions) {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Store callbacks in refs to avoid stale closures
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const disabledRef = useRef(disabled);

  // Update refs on each render
  onDragStartRef.current = onDragStart;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;
  disabledRef.current = disabled;

  // Web: pointer down handler
  // Uses flexible typing to handle both React Native and DOM pointer events
  const handlePointerDown = useCallback(
    (e: {
      nativeEvent?: { pageX: number; pageY: number };
      pageX?: number;
      pageY?: number;
      preventDefault: () => void;
      stopPropagation: () => void;
    }) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      // React events wrap native event, DOM events have coordinates directly
      const pageX = e.nativeEvent?.pageX ?? e.pageX ?? 0;
      const pageY = e.nativeEvent?.pageY ?? e.pageY ?? 0;
      startPosRef.current = { x: pageX, y: pageY };
      hasDraggedRef.current = false;
      isDraggingRef.current = true;
      onDragStart(pageX, pageY);
    },
    [disabled, onDragStart]
  );

  // Web: document-level event listeners for move and up during drag
  useEffect(() => {
    if (!isActive || Platform.OS !== 'web') return;

    const handleDocumentMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      if (startPosRef.current && !hasDraggedRef.current) {
        const dx = e.pageX - startPosRef.current.x;
        const dy = e.pageY - startPosRef.current.y;
        if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
          hasDraggedRef.current = true;
        }
      }

      onDragMoveRef.current(e.pageX, e.pageY);
    };

    const handleDocumentUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      onDragEndRef.current(hasDraggedRef.current);
    };

    document.addEventListener('pointermove', handleDocumentMove);
    document.addEventListener('pointerup', handleDocumentUp);
    document.addEventListener('pointercancel', handleDocumentUp);

    return () => {
      document.removeEventListener('pointermove', handleDocumentMove);
      document.removeEventListener('pointerup', handleDocumentUp);
      document.removeEventListener('pointercancel', handleDocumentUp);
    };
  }, [isActive]);

  // Native: Touch event handlers (similar to web pointer events)
  const onTouchStart = useCallback((e: GestureResponderEvent) => {
    if (disabledRef.current) return;

    const touch = e.nativeEvent;
    startPosRef.current = { x: touch.pageX, y: touch.pageY };
    hasDraggedRef.current = false;
    isDraggingRef.current = true;
    onDragStartRef.current(touch.pageX, touch.pageY);
  }, []);

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDraggingRef.current) return;

    const touch = e.nativeEvent;

    if (startPosRef.current && !hasDraggedRef.current) {
      const dx = touch.pageX - startPosRef.current.x;
      const dy = touch.pageY - startPosRef.current.y;
      if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
        hasDraggedRef.current = true;
      }
    }

    onDragMoveRef.current(touch.pageX, touch.pageY);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onDragEndRef.current(hasDraggedRef.current);
  }, []);

  // Native touch props to spread on View
  // Must also claim responder for onTouchMove to fire
  const touchProps = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
    // Responder props to ensure we receive touch events
    onStartShouldSetResponder: () => !disabledRef.current,
    onMoveShouldSetResponder: () => !disabledRef.current,
    onResponderTerminationRequest: () => false,
  };

  return {
    handlePointerDown,
    touchProps,
    disabled,
  };
}
