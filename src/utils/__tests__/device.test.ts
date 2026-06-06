jest.mock('expo-device', () => ({
  osVersion: '17.4',
  modelName: 'iPhone 15 Pro',
}));

describe('device', () => {
  let device: typeof import('../device');
  let storage: typeof import('@react-native-async-storage/async-storage').default;

  beforeEach(() => {
    jest.resetModules();
    storage = require('@react-native-async-storage/async-storage');
    storage.clear();
    device = require('../device');
  });

  it('generates a uuid-shaped device id and persists it', async () => {
    const deviceId = await device.getDeviceId();

    expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await storage.getItem('device-id')).toBe(deviceId);
  });

  it('returns the same device id on subsequent calls', async () => {
    const first = await device.getDeviceId();
    const second = await device.getDeviceId();

    expect(second).toBe(first);
  });

  it('returns one shared id for concurrent first-launch calls', async () => {
    const setItem = jest.spyOn(storage, 'setItem');

    const [first, second] = await Promise.all([device.getDeviceId(), device.getDeviceId()]);

    expect(first).toBe(second);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('still resolves a valid id when storage fails', async () => {
    jest.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    jest.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('storage unavailable'));

    const deviceId = await device.getDeviceId();

    expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('exposes platform and device metadata', () => {
    expect(device.getDeviceMetadata()).toEqual({
      platform: 'ios',
      osVersion: '17.4',
      model: 'iPhone 15 Pro',
    });
  });
});
