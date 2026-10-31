import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkGitHubReleaseUpdate,
  openApkDownload,
  type UpdateCheckResult,
  getCurrentAppVersion,
} from '../services/updateService';
import { Haptics } from '../services/haptics';
import { SoundEffects } from '../services/soundEffects';

const DISMISSED_VERSION_KEY = '@fitrise_dismissed_update_version';

interface UpdateState {
  isChecking: boolean;
  updateInfo: UpdateCheckResult | null;
  isModalVisible: boolean;
  checkUpdate: (isManual?: boolean) => Promise<void>;
  dismissModal: () => Promise<void>;
  downloadLatestApk: () => Promise<void>;
  openModalManually: () => void;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  isChecking: false,
  updateInfo: null,
  isModalVisible: false,

  checkUpdate: async (isManual = false) => {
    if (get().isChecking) return;

    set({ isChecking: true });
    try {
      const result = await checkGitHubReleaseUpdate();
      set({ updateInfo: result });

      if (result.hasUpdate) {
        // Verificar si el usuario ya pospuso esta versión exacta
        const dismissed = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);

        if (isManual || dismissed !== result.latestVersion) {
          set({ isModalVisible: true });
          Haptics.triumph();
          SoundEffects.playChime();
        }
      } else if (isManual) {
        Haptics.light();
        const current = getCurrentAppVersion();
        Alert.alert(
          '⚡ SISTEMA ACTUALIZADO',
          `CORTEX y Level Up se encuentran en la versión más reciente (v${current}). No se detectaron parches pendientes en el satélite.`
        );
      }
    } catch (err) {
      console.warn('[UpdateStore] Error en checkUpdate:', err);
      if (isManual) {
        Alert.alert(
          'Aviso de Conexión',
          'No se pudo conectar con el servidor de actualizaciones de GitHub en este momento.'
        );
      }
    } finally {
      set({ isChecking: false });
    }
  },

  dismissModal: async () => {
    const { updateInfo } = get();
    if (updateInfo?.latestVersion) {
      await AsyncStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
    }
    set({ isModalVisible: false });
  },

  downloadLatestApk: async () => {
    const { updateInfo } = get();
    if (!updateInfo) return;

    Haptics.success();
    await openApkDownload(updateInfo.apkUrl, updateInfo.releaseUrl);
  },

  openModalManually: () => {
    set({ isModalVisible: true });
  },
}));
