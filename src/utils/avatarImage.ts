import type * as ImagePicker from 'expo-image-picker';

export interface PickedAvatar {
  uri: string;
  name: string;
  mimeType: string;
}

export type AvatarSource = 'library' | 'camera';

export class AvatarPermissionError extends Error {
  constructor(source: AvatarSource) {
    super(
      source === 'camera'
        ? 'Camera access is needed to take a profile photo. You can enable it in Settings.'
        : 'Photo access is needed to choose a profile photo. You can enable it in Settings.'
    );
    this.name = 'AvatarPermissionError';
  }
}

const MAX_AVATAR_WIDTH = 512;

// Loaded lazily so a JS bundle that adds these native modules never crashes a
// binary that predates them (e.g. an OTA update onto an older build); the
// avatar feature just degrades until the binary is updated.
function imagePicker(): typeof ImagePicker {
  return require('expo-image-picker');
}

// Resize down to cap upload size; the server crops to a square, so we only
// constrain the width here and keep the aspect ratio (web has no crop UI).
async function normalizeToJpeg(uri: string): Promise<PickedAvatar> {
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

  const result = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_AVATAR_WIDTH } }],
    {
      compress: 0.8,
      format: SaveFormat.JPEG,
    }
  );

  return { uri: result.uri, name: 'avatar.jpg', mimeType: 'image/jpeg' };
}

export async function pickAvatar(
  source: AvatarSource
): Promise<PickedAvatar | null> {
  const picker = imagePicker();

  if (source === 'camera') {
    const permission = await picker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new AvatarPermissionError('camera');
    }

    const result = await picker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    return resultToAvatar(result);
  }

  const permission = await picker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new AvatarPermissionError('library');
  }

  const result = await picker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  return resultToAvatar(result);
}

async function resultToAvatar(
  result: ImagePicker.ImagePickerResult
): Promise<PickedAvatar | null> {
  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return normalizeToJpeg(result.assets[0].uri);
}
