import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Haptics } from '../../services/haptics';

interface GymFocusControlsProps {
  isFocusModeActive: boolean;
  onToggleFocusMode: (active: boolean) => void;
}

export function GymFocusControls({
  isFocusModeActive,
  onToggleFocusMode,
}: GymFocusControlsProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const handleOpenSpotify = async () => {
    Haptics.medium();
    const spotifyUri = 'spotify://';
    const spotifyWeb = 'https://open.spotify.com';

    try {
      const supported = await Linking.canOpenURL(spotifyUri);
      if (supported) {
        await Linking.openURL(spotifyUri);
      } else {
        await Linking.openURL(spotifyWeb);
      }
    } catch {
      Linking.openURL(spotifyWeb);
    }
  };

  const handleOpenMusic = async () => {
    Haptics.medium();
    if (Platform.OS === 'android') {
      try {
        await Linking.openURL('music://');
      } catch {
        handleOpenSpotify();
      }
    } else {
      Linking.openURL('music://');
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón Switch Modo Gym Focus */}
      <TouchableOpacity
        style={[styles.focusPill, isFocusModeActive && styles.focusPillActive]}
        onPress={() => {
          Haptics.light();
          onToggleFocusMode(!isFocusModeActive);
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isFocusModeActive ? 'headset' : 'headset-outline'}
          size={14}
          color={isFocusModeActive ? '#10B981' : '#94A3B8'}
        />
        <Text style={[styles.focusPillText, isFocusModeActive && styles.focusPillTextActive]}>
          {isFocusModeActive ? 'GYM FOCUS ACTIVO' : 'GYM FOCUS'}
        </Text>
      </TouchableOpacity>

      {/* Acceso Rápido a Spotify / Música del Cazador */}
      <View style={styles.musicRow}>
        <TouchableOpacity
          style={styles.musicBtn}
          onPress={handleOpenSpotify}
          activeOpacity={0.7}
        >
          <Ionicons name="musical-note" size={14} color="#1DB954" />
          <Text style={styles.musicBtnText}>Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.musicBtn}
          onPress={handleOpenMusic}
          activeOpacity={0.7}
        >
          <Ionicons name="musical-notes" size={14} color="#00F0FF" />
          <Text style={styles.musicBtnText}>App Música</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 18, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  focusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  focusPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  focusPillTextActive: {
    color: '#10B981',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  musicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0A0E1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  musicBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
});
