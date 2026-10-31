import { Platform, Vibration } from 'react-native';

/**
 * Servicio Táctico de Vibración Háptica para CORTEX
 * Provee retroalimentación física precisa y fiable en dispositivos Android e iOS.
 */
export const Haptics = {
  /**
   * Pulso ultra ligero (15ms)
   * Utilizado para ticks de cadencia, toques de agua y botones secundarios.
   */
  light: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(15);
    } else {
      Vibration.vibrate(20);
    }
  },

  /**
   * Pulso medio (35ms)
   * Utilizado para cambios de fase (bajar/pausar/subir) y conteos 3-2-1.
   */
  medium: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(35);
    } else {
      Vibration.vibrate(40);
    }
  },

  /**
   * Pulso firme (70ms)
   * Utilizado para inicio de ejercicio, cambios de estación y confirmaciones.
   */
  heavy: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(70);
    } else {
      Vibration.vibrate(80);
    }
  },

  /**
   * Patrón de éxito / Victoria (Doble pulso táctico)
   * Utilizado al completar series, circuitos, metas de agua o misiones.
   */
  success: () => {
    // [espera, vibración, espera, vibración]
    Vibration.vibrate([0, 50, 70, 90]);
  },

  /**
   * Patrón Legendario de Ascenso (Triple pulso sostenido)
   * Utilizado al subir de nivel, conquistar un logro o derrotar al Jefe Semanal.
   */
  triumph: () => {
    Vibration.vibrate([0, 60, 60, 80, 80, 160]);
  },

  /**
   * Patrón de advertencia o error
   */
  warning: () => {
    Vibration.vibrate([0, 40, 50, 40]);
  },
};
