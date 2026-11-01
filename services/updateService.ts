import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import packageJson from '../package.json';

export const GITHUB_CONFIG = {
  owner: 'EduardoOG14',
  repo: 'Level-Up',
};

export interface ApkDownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progressRatio: number; // 0.0 to 1.0
  progressPercent: number; // 0 to 100
  progressText: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  apkUrl: string | null;
  releaseUrl: string;
  publishedAt: string;
}

/**
 * Obtiene la versión actual configurada en la app
 */
export function getCurrentAppVersion(): string {
  const version =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    packageJson.version ||
    '1.0.7';
  return version.replace(/^v/, '');
}

/**
 * Compara dos versiones en formato semver (ej: "1.0.7" > "1.0.6")
 * Retorna true si latest es mayor que current
 */
export function isNewerVersion(latest: string, current: string): boolean {
  const cleanLatest = latest.replace(/^v/, '').trim();
  const cleanCurrent = current.replace(/^v/, '').trim();

  if (cleanLatest === cleanCurrent) return false;

  const latestParts = cleanLatest.split('.').map((n) => parseInt(n, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((n) => parseInt(n, 10) || 0);

  const maxLength = Math.max(latestParts.length, currentParts.length);

  for (let i = 0; i < maxLength; i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

/**
 * Consulta la API pública de GitHub Releases para verificar si hay una versión superior
 */
export async function checkGitHubReleaseUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const endpoint = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases/latest`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'LevelUp-Hunter-App',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      // El repositorio o el release aún no se han publicado
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseTitle: 'Sistema al día',
        releaseNotes: 'No hay releases disponibles en el repositorio.',
        apkUrl: null,
        releaseUrl: `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases`,
        publishedAt: new Date().toISOString(),
      };
    }

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const data = await response.json();
    const latestTag = data.tag_name || data.name || currentVersion;
    const cleanLatest = latestTag.replace(/^v/, '').trim();
    const hasUpdate = isNewerVersion(cleanLatest, currentVersion);

    // Buscar el archivo APK entre los assets del release
    let apkUrl: string | null = null;
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find((asset: any) =>
        typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset && apkAsset.browser_download_url) {
        apkUrl = apkAsset.browser_download_url;
      }
    }

    return {
      hasUpdate,
      currentVersion,
      latestVersion: cleanLatest,
      releaseTitle: data.name || `Level Up v${cleanLatest}`,
      releaseNotes: data.body || 'Nuevas optimizaciones de combate y atributos implementados.',
      apkUrl,
      releaseUrl: data.html_url || `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases`,
      publishedAt: data.published_at || new Date().toISOString(),
    };
  } catch (error: any) {
    console.warn('[UpdateService] Error comprobando actualización:', error?.message || error);
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseTitle: 'Sistema al día',
      releaseNotes: 'No se pudo conectar con el satélite de actualizaciones.',
      apkUrl: null,
      releaseUrl: `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases`,
      publishedAt: new Date().toISOString(),
    };
  }
}

/**
 * Descarga el archivo APK directamente en la app y lanza el instalador nativo de Android
 * Sin obligar al usuario a salir de la app ni ir a páginas web.
 */
export async function downloadAndInstallApkDirectly(
  apkUrl: string,
  onProgress?: (progress: ApkDownloadProgress) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('La instalación interna de APK solo está disponible en dispositivos Android.');
  }

  const destinationFileUri = `${FileSystem.cacheDirectory}level-up-latest.apk`;

  // 1. Limpieza de APK previo si existiese
  try {
    const existing = await FileSystem.getInfoAsync(destinationFileUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(destinationFileUri, { idempotent: true });
    }
  } catch (e) {
    console.warn('[UpdateService] Error limpiando APK previo:', e);
  }

  // 2. Descarga streaming con reporte de progreso
  const downloadResumable = FileSystem.createDownloadResumable(
    apkUrl,
    destinationFileUri,
    {},
    (downloadProgress) => {
      const written = downloadProgress.totalBytesWritten;
      const expected = downloadProgress.totalBytesExpectedToWrite;
      const ratio = expected > 0 ? Math.min(1, Math.max(0, written / expected)) : 0;
      const percent = Math.round(ratio * 100);
      const writtenMb = (written / (1024 * 1024)).toFixed(1);
      const expectedMb = expected > 0 ? (expected / (1024 * 1024)).toFixed(1) : '?';

      if (onProgress) {
        onProgress({
          totalBytesWritten: written,
          totalBytesExpectedToWrite: expected,
          progressRatio: ratio,
          progressPercent: percent,
          progressText: `${writtenMb} MB / ${expectedMb} MB (${percent}%)`,
        });
      }
    }
  );

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || !downloadResult.uri) {
    throw new Error('La descarga del archivo APK se interrumpió.');
  }

  // 3. Obtener Content URI compatible con Android FileProvider
  const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

  // 4. Lanzar instalador del sistema Android
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
    });
  } catch (err: any) {
    console.warn('[UpdateService] Falló intent directo, solicitando permiso de instalación:', err);
    try {
      // Si el usuario no ha concedido permiso de instalar fuentes desconocidas para Level Up
      await IntentLauncher.startActivityAsync(
        'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
        { data: 'package:com.levelup.app' }
      );
    } catch (e2) {
      // Fallback a enlace en navegador
      await openApkDownload(apkUrl);
    }
  }
}

/**
 * Fallback: Abre el enlace de descarga en el navegador si el instalador nativo es bloqueado
 */
export async function openApkDownload(apkUrl: string | null, releaseUrl?: string) {
  const targetUrl = apkUrl || releaseUrl || `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases`;
  try {
    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else {
      await Linking.openURL(targetUrl);
    }
  } catch (err) {
    console.error('[UpdateService] Error abriendo URL:', err);
  }
}
