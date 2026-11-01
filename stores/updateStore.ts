import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkGitHubReleaseUpdate,
  downloadAndInstallApkDirectly,
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
  isDownloading: boolean;
  downloadProgress: number; // 0 a 1
  downloadProgressText: string;
  isInstalling: boolean;
  downloadError: string | null;

  checkUpdate: (isManual?: boolean) => Promise<void>;
  dismissModal: () => Promise<void>;
  startInAppUpdate: () => Promise<void>;
  downloadLatestApk: () => Promise<void>;
  openModalManually: () => void;
  resetDownloadState: () => void;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  isChecking: false,
  updateInfo: null,
  isModalVisible: false,
  isDownloading: false,
  downloadProgress: 0,
  downloadProgressText: '',
  isInstalling: false,
  downloadError: null,

  resetDownloadState: () => {
    set({
      isDownloading: false,
      downloadProgress: 0,
      downloadProgressText: '',
      isInstalling: false,
      downloadError: null,
    });
  },

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
          get().resetDownloadState();
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
    const { updateInfo, isDownloading } = get();
    if (isDownloading) return; // Evitar cerrar accidentalmente mientras descarga

    if (updateInfo?.latestVersion) {
      await AsyncStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
    }
    set({ isModalVisible: false });
    get().resetDownloadState();
  },

  startInAppUpdate: async () => {
    const { updateInfo, isDownloading } = get();
    if (isDownloading) return;
    if (!updateInfo || !updateInfo.apkUrl) {
      // Fallback si no hay asset de APK directo
      await get().downloadLatestApk();
      return;
    }

    set({
      isDownloading: true,
      downloadProgress: 0,
      downloadProgressText: 'Conectando con satélite...',
      isInstalling: false,
      downloadError: null,
    });
    Haptics.medium();

    try {
      await downloadAndInstallApkDirectly(updateInfo.apkUrl, (progress) => {
        set({
          downloadProgress: progress.progressRatio,
          downloadProgressText: progress.progressText,
        });
      });

      set({
        isDownloading: false,
        isInstalling: true,
        downloadProgress: 1,
        downloadProgressText: 'Iniciando instalador nativo...',
      });
      Haptics.triumph();
      SoundEffects.playLevelUp();
    } catch (err: any) {
      console.error('[UpdateStore] Error durante la actualización interna:', err);
      set({
        isDownloading: false,
        isInstalling: false,
        downloadError: err?.message || 'Error durante la descarga interna del parche.',
      });
      Haptics.heavy();
    }
  },

  downloadLatestApk: async () => {
    const { updateInfo } = get();
    if (!updateInfo) return;

    Haptics.success();
    await openApkDownload(updateInfo.apkUrl, updateInfo.releaseUrl);
  },

  openModalManually: () => {
    get().resetDownloadState();
    set({ isModalVisible: true });
  },
}));
