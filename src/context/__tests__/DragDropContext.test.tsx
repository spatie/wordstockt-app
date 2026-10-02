import React from 'react';
import { act, render } from '@testing-library/react-native';
import { DragDropProvider, useDragDrop } from '../DragDropContext';
import type { BoardLayout } from '../../utils/dragMath';

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

const layout: BoardLayout = {
  x: 10,
  y: 20,
  width: 300,
  height: 300,
  cellSize: 20,
};

describe('DragDropProvider board layout', () => {
  it('publishes measured layout and ignores equivalent measurements', async () => {
    let dragDrop: ReturnType<typeof useDragDrop>;
    let renderCount = 0;

    function Consumer() {
      dragDrop = useDragDrop();
      renderCount += 1;
      return null;
    }

    await render(
      <DragDropProvider>
        <Consumer />
      </DragDropProvider>
    );

    expect(dragDrop!.boardLayout).toBeNull();

    await act(() => dragDrop!.setBoardLayout(layout));
    expect(dragDrop!.boardLayout).toEqual(layout);
    const afterFirstMeasurement = renderCount;

    await act(() => dragDrop!.setBoardLayout({ ...layout }));
    expect(renderCount).toBe(afterFirstMeasurement);

    await act(() => dragDrop!.setBoardLayout({ ...layout, x: 11 }));
    expect(dragDrop!.boardLayout?.x).toBe(11);
    expect(renderCount).toBeGreaterThan(afterFirstMeasurement);
  });
});
