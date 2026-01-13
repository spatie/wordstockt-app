import { useEffect } from 'react';

export function useOTAUpdates() {
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    checkForUpdates();
  }, []);
}

async function checkForUpdates() {
  try {
    const Updates = await import('expo-updates');

    if (!Updates.isEnabled) {
      return;
    }

    const update = await Updates.checkForUpdateAsync();

    if (!update.isAvailable) {
      return;
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (error) {
    // expo-updates not available in dev client
  }
}
