import React from 'react';
import {
  View,
  ViewProps,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

export interface SafeScreenProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  extraTopPadding?: number;
}

/**
 * SafeScreen: Contenedor táctico de interfaz Edge-to-Edge con integración
 * milimétrica de la barra de notificaciones del sistema (Android & iOS).
 *
 * Resuelve colisiones con cámaras punch-hole, notch, Dynamic Island y barras
 * translúcidas usando cálculo defensivo: Math.max(insets.top, RNStatusBar.currentHeight).
 */
export function SafeScreen({
  children,
  style,
  edges = ['top', 'left', 'right'],
  extraTopPadding = 0,
  ...props
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  const topInset = edges.includes('top')
    ? Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight || 0) + extraTopPadding
      : insets.top + extraTopPadding
    : 0;

  const bottomInset = edges.includes('bottom') ? insets.bottom : 0;
  const leftInset = edges.includes('left') ? insets.left : 0;
  const rightInset = edges.includes('right') ? insets.right : 0;

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: topInset,
          paddingBottom: bottomInset,
          paddingLeft: leftInset,
          paddingRight: rightInset,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
});
