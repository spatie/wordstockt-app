import { useRef, useCallback, useEffect } from 'react';
import type { View, LayoutChangeEvent } from 'react-native';
import { useDragDrop } from '../context/DragDropContext';

const MEASURE_DELAY = 100;

interface UseMeasureOnDragOptions<T> {
  onMeasure: (x: number, y: number, width: number, height: number) => T;
  onLayout: (layout: T) => void;
}

export function useMeasureOnDrag<T>({
  onMeasure,
  onLayout,
}: UseMeasureOnDragOptions<T>) {
  const ref = useRef<View>(null);
  const { isDragging } = useDragDrop();

  const measure = useCallback(() => {
    if (ref.current) {
      ref.current.measureInWindow((x, y, width, height) => {
        const layout = onMeasure(x, y, width, height);
        onLayout(layout);
      });
    }
  }, [onMeasure, onLayout]);

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      // Small delay to ensure the layout is stable
      setTimeout(measure, MEASURE_DELAY);
    },
    [measure]
  );

  // Re-measure when drag starts to ensure accurate positioning
  useEffect(() => {
    if (isDragging) {
      measure();
    }
  }, [isDragging, measure]);

  return { ref, handleLayout };
}
