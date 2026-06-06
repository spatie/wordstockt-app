import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-device', () => ({
  osVersion: '17.4',
  modelName: 'iPhone 15 Pro',
}));

import { getDeviceId, getDeviceMetadata } from '../device';

describe('device', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.resetModules();
  });

  it('generates a uuid-shaped device id and persists it', async () => {
    const deviceId = await getDeviceId();

    expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await AsyncStorage.getItem('device-id')).toBe(deviceId);
  });

  it('returns the same device id on subsequent calls', async () => {
    const first = await getDeviceId();
    const second = await getDeviceId();

    expect(second).toBe(first);
  });

  it('exposes platform and device metadata', () => {
    expect(getDeviceMetadata()).toEqual({
      platform: 'ios',
      osVersion: '17.4',
      model: 'iPhone 15 Pro',
    });
  });
});
