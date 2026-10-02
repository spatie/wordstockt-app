import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BoardMaker } from '../BoardMaker';
import { createEmptyBoardTemplate } from '../../../utils/boardMaker';

describe('BoardMaker', () => {
  it('starts from a copy of the accepted template and returns the edited draft', async () => {
    const accepted = createEmptyBoardTemplate();
    accepted[0]![0] = '2L';
    const onAccept = jest.fn();

    await render(
      <BoardMaker
        initialTemplate={accepted}
        onAccept={onAccept}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('2L: 27')).toBeTruthy();
    await fireEvent.press(screen.getByText('2L'));
    await fireEvent.press(screen.getByText('Accept'));

    const edited = onAccept.mock.calls[0]?.[0];
    expect(accepted[0]?.[0]).toBe('2L');
    expect(edited[0]?.[0]).toBe('3L');
    expect(edited[14]?.[14]).toBe('3L');
    expect(edited).not.toBe(accepted);
  });
});
