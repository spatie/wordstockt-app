import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_STORAGE_KEY = 'device-id';

let cachedDeviceId: string | null = null;

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * A stable per-install identifier, generated once and persisted so the backend
 * can track which devices a user is logged in on across app launches.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (storedDeviceId) {
    cachedDeviceId = storedDeviceId;
    return storedDeviceId;
  }

  const newDeviceId = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
  cachedDeviceId = newDeviceId;
  return newDeviceId;
}

export function getDeviceMetadata(): { platform: string; osVersion: string; model: string } {
  return {
    platform: Platform.OS,
    osVersion: Device.osVersion ?? '',
    model: Device.modelName ?? '',
  };
}
