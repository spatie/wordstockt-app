import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingView } from '../LoadingView';

describe('LoadingView', () => {
  it('renders without crashing', async () => {
    const { toJSON } = await render(<LoadingView />);
    expect(toJSON()).not.toBeNull();
  });
});
