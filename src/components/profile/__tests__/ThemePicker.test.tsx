import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemePicker } from '../ThemePicker';
import { palettes } from '../../../config/theme';
import { useAppearanceStore } from '../../../stores/appearanceStore';

jest.unmock('zustand/middleware');

beforeEach(async () => {
  await AsyncStorage.clear();
  useAppearanceStore.setState({ appearance: 'navy' });
});

it('changes the visible palette and restores the saved choice', async () => {
  const view = await render(<ThemePicker />);

  await fireEvent.press(view.getByRole('radio', { name: 'Paper theme' }));

  expect(
    view.getByRole('radio', { name: 'Paper theme' }).props.accessibilityState
  ).toMatchObject({
    checked: true,
  });
  expect(view.getByText('Appearance').props.style.color).toBe(
    palettes.paper.textPrimary
  );

  let savedAppearance = '';
  await waitFor(async () => {
    savedAppearance = (await AsyncStorage.getItem('appearance-storage')) ?? '';
    expect(savedAppearance).toContain('paper');
  });

  useAppearanceStore.setState({ appearance: 'navy' });
  await AsyncStorage.setItem('appearance-storage', savedAppearance);
  await useAppearanceStore.persist.rehydrate();
  expect(useAppearanceStore.getState().appearance).toBe('paper');
});
