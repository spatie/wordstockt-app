import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync } from 'expo-image-manipulator';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async () => ({ uri: 'file://resized.jpg', width: 512, height: 512 })),
  SaveFormat: { JPEG: 'jpeg' },
}));

import { pickAvatar, AvatarPermissionError } from '../avatarImage';

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('pickAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a normalized jpeg when a library image is chosen', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://original.heic' }],
    } as never);

    const result = await pickAvatar('library');

    expect(result).toEqual({ uri: 'file://resized.jpg', name: 'avatar.jpg', mimeType: 'image/jpeg' });
    expect(manipulateAsync).toHaveBeenCalledWith(
      'file://original.heic',
      [{ resize: { width: 512 } }],
      expect.objectContaining({ format: 'jpeg' })
    );
  });

  it('returns null when the user cancels', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] } as never);

    expect(await pickAvatar('library')).toBeNull();
    expect(manipulateAsync).not.toHaveBeenCalled();
  });

  it('throws a permission error when library access is denied', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await expect(pickAvatar('library')).rejects.toBeInstanceOf(AvatarPermissionError);
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('uses the camera when requested', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    } as never);

    const result = await pickAvatar('camera');

    expect(result?.mimeType).toBe('image/jpeg');
    expect(picker.launchCameraAsync).toHaveBeenCalled();
  });
});
