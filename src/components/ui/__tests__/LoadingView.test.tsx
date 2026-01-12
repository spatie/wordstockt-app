import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingView } from '../LoadingView';

describe('LoadingView', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<LoadingView />);
    expect(toJSON()).not.toBeNull();
  });
});
