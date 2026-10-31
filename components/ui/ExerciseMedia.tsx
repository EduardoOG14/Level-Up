import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors } from '../../constants/theme';

interface ExerciseMediaProps {
  gifUrl?: string;
  rawGifUrl?: string;
  thumbnailUrl?: string;
  style?: any;
  resizeMode?: 'contain' | 'cover';
}

export function ExerciseMedia({
  gifUrl,
  rawGifUrl,
  thumbnailUrl,
  style,
  resizeMode = 'contain',
}: ExerciseMediaProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | undefined>(gifUrl || rawGifUrl);

  const handleError = () => {
    // Si falla el CDN principal de jsDelivr, intentar el raw de GitHub
    if (currentUri === gifUrl && rawGifUrl && gifUrl !== rawGifUrl) {
      setCurrentUri(rawGifUrl);
      setHasError(false);
      setLoading(true);
    } else {
      setHasError(true);
      setLoading(false);
    }
  };

  if (!currentUri || hasError) {
    return (
      <View style={[styles.placeholderBox, style]}>
        <Text style={styles.placeholderEmoji}>⚡</Text>
        <Text style={styles.placeholderText}>CORTEX Media</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ExpoImage
        source={{ uri: currentUri }}
        placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit={resizeMode}
        cachePolicy="disk"
        transition={250}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={handleError}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.brand.primary} size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040711',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 7, 17, 0.4)',
  },
  placeholderBox: {
    backgroundColor: '#0A0E1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  placeholderEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
