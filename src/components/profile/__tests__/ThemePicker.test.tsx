import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemePicker } from '../ThemePicker';
import { palettes } from '../../../config/theme';
import { useAppearanceStore } from '../../../stores/appearanceStore';

jest.unmock('zustand/middleware');

beforeEach(async () => {
  await AsyncStorage.clear();
  useAppearanceStore.setState({ appearance: 'navy', followSystem: false });
});

afterEach(() => {
  jest.restoreAllMocks();
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

it('follows the system appearance until a theme is picked', async () => {
  jest
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    .spyOn(require('react-native'), 'useColorScheme')
    .mockReturnValue('light');
  const view = await render(<ThemePicker />);

  await fireEvent(view.getByRole('switch'), 'valueChange', true);

  expect(useAppearanceStore.getState().followSystem).toBe(true);
  // Light system appearance resolves to the Paper palette
  expect(view.getByText('Appearance').props.style.color).toBe(
    palettes.paper.textPrimary
  );

  await fireEvent.press(view.getByRole('radio', { name: 'Forest theme' }));

  expect(useAppearanceStore.getState().followSystem).toBe(false);
  expect(useAppearanceStore.getState().appearance).toBe('forest');
});
