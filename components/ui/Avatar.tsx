import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export interface PresetAvatar {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'shadow_hunter', label: 'Sombra', emoji: '⚔️', color: '#7C3AED' },
  { id: 'lightning_hunter', label: 'Rayo', emoji: '⚡', color: '#00F0FF' },
  { id: 'titan_warrior', label: 'Titán', emoji: '🛡️', color: '#F59E0B' },
  { id: 'fire_dragon', label: 'Dragón', emoji: '🐉', color: '#EF4444' },
  { id: 'cortex_cyborg', label: 'Cortex', emoji: '🤖', color: '#10B981' },
  { id: 'lone_wolf', label: 'Lobo', emoji: '🐺', color: '#6366F1' },
];

export function renderAvatarContent(avatar?: string, name?: string, size: number = 80) {
  if (avatar) {
    if (avatar.startsWith('preset:')) {
      const presetId = avatar.replace('preset:', '');
      const preset = PRESET_AVATARS.find((p) => p.id === presetId) || PRESET_AVATARS[0];
      return (
        <View
          style={[
            styles.avatarContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: preset.color + '25',
              borderColor: preset.color,
              borderWidth: 2,
            },
          ]}
        >
          <Text style={{ fontSize: size * 0.45 }}>{preset.emoji}</Text>
        </View>
      );
    }
    return (
      <Image
        source={{ uri: avatar }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.brand.primary,
        },
      ]}
    >
      <Text style={{ color: Colors.text.primary, fontSize: size * 0.45, fontWeight: 'bold' }}>
        {name ? name.charAt(0).toUpperCase() : 'C'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
