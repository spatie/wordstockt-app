import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_STORAGE_KEY = 'device-id';

let cachedDeviceId: string | null = null;
let pendingDeviceId: Promise<string> | null = null;

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function resolveDeviceId(): Promise<string> {
  try {
    const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (storedDeviceId) {
      cachedDeviceId = storedDeviceId;
      return storedDeviceId;
    }
  } catch {
    // Reading storage failed; fall back to a freshly generated id below.
  }

  const newDeviceId = cachedDeviceId ?? generateDeviceId();
  cachedDeviceId = newDeviceId;

  try {
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
  } catch {
    // Persisting is best-effort; the id stays stable for this session.
  }

  return newDeviceId;
}

/**
 * A stable per-install identifier, generated once and persisted so the backend
 * can track which devices a user is logged in on across app launches.
 *
 * Concurrent first-launch callers share a single resolution so the install
 * never gets more than one id.
 */
export function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return Promise.resolve(cachedDeviceId);
  }

  if (!pendingDeviceId) {
    pendingDeviceId = resolveDeviceId().finally(() => {
      pendingDeviceId = null;
    });
  }

  return pendingDeviceId;
}

export function getDeviceMetadata(): { platform: string; osVersion: string; model: string } {
  return {
    platform: Platform.OS,
    osVersion: Device.osVersion ?? '',
    model: Device.modelName ?? '',
  };
}
