import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

function play(feedback: () => Promise<void>) {
  if (!isSupported) {
    return;
  }

  // Haptics are a nicety; never let a failure surface to the player
  feedback().catch(() => {});
}

// The physical feedback moments of the game, in one place
export const haptics = {
  // A tile lands on the board
  place: () =>
    play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Small rack changes: reordering or shuffling tiles
  tick: () => play(() => Haptics.selectionAsync()),

  // A word was played or tiles were swapped
  success: () =>
    play(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ),

  // The server rejected a move
  error: () =>
    play(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    ),
};
