import { getBoardCellFromPosition, type BoardLayout } from '../dragMath';

const layout: BoardLayout = {
  x: 100,
  y: 200,
  width: 150,
  height: 150,
  cellSize: 10,
};

describe('getBoardCellFromPosition', () => {
  it.each([
    [100, 200, 0, 0],
    [249.999, 349.999, 14, 14],
    [250, 350, 14, 14],
    [98, 198, 0, 0],
    [252, 352, 14, 14],
    [110, 210, 1, 1],
  ])('maps (%i, %i) to cell (%i, %i)', (x, y, cellX, cellY) => {
    expect(getBoardCellFromPosition(x, y, layout)).toEqual({
      x: cellX,
      y: cellY,
    });
  });

  it.each([
    [97.999, 200],
    [100, 197.999],
    [252.001, 350],
    [250, 352.001],
  ])('rejects (%i, %i) beyond the edge tolerance', (x, y) => {
    expect(getBoardCellFromPosition(x, y, layout)).toBeNull();
  });
});
