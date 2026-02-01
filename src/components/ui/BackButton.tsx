import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  backTo?: string;
  onBack?: () => void;
}

export function BackButton({ backTo, onBack }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    onBack?.();
    if (backTo) {
      router.replace(backTo as Href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <Pressable
      onPress={handleBack}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={styles.button}>
        <Ionicons name="chevron-back" size={20} color="#FFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 50, 0.9)',
  },
});
