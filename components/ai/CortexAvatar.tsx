import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';

interface CortexAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function CortexAvatar({ size = 'md', showPulse = true }: CortexAvatarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!showPulse) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [showPulse]);

  const sizeMap = {
    sm: { container: 36, img: 30, fontSize: 20 },
    md: { container: 54, img: 46, fontSize: 30 },
    lg: { container: 88, img: 76, fontSize: 48 },
  };

  const s = sizeMap[size];

  // Try to use generated 3d avatar asset if exists, with glowing cybernetic fallback
  let imageSource;
  try {
    imageSource = require('../../assets/cortex-avatar.png');
  } catch {
    imageSource = null;
  }

  return (
    <View style={[styles.wrapper, { width: s.container, height: s.container }]}>
      {/* Outer Hologram Glow Ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: s.container,
            height: s.container,
            borderRadius: s.container / 2,
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Core Avatar */}
      <View
        style={[
          styles.core,
          {
            width: s.img,
            height: s.img,
            borderRadius: s.img / 2,
          },
        ]}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={{ width: s.img, height: s.img, borderRadius: s.img / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: s.fontSize }}>🧠</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#06B6D4', // Cyan hologram
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    overflow: 'hidden',
  },
});
