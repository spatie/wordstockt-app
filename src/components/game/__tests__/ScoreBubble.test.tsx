import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ScoreBubble } from '../ScoreBubble';

jest.mock('../../../hooks/useScoreBubble', () => ({
  useScoreBubble: ({ score }: { score: number }) => ({
    isVisible: true,
    opacity: 1,
    displayScore: score,
  }),
}));

function bubblePosition() {
  const styles = screen.getByText('34').parent?.props.style;
  return StyleSheet.flatten(styles);
}

it('keeps a score bubble inside the top left corner', async () => {
  await render(
    <ScoreBubble score={34} x={0} y={0} cellSize={24} boardSize={378} />
  );

  expect(bubblePosition()).toMatchObject({ left: 4, top: 4 });
});

it('keeps the measured bubble inside the bottom right corner', async () => {
  await render(
    <ScoreBubble score={34} x={14} y={14} cellSize={24} boardSize={378} />
  );

  await fireEvent(screen.getByText('34').parent!, 'layout', {
    nativeEvent: { layout: { width: 55, height: 25 } },
  });

  expect(bubblePosition()).toMatchObject({ left: 317, top: 340 });
});
