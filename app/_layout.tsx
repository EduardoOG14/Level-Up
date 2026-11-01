import { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, BackHandler, ToastAndroid } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { useUserStore } from '../stores/userStore';
import { useUpdateStore } from '../stores/updateStore';
import { UpdateModal } from '../components/system/UpdateModal';
import { Colors } from '../constants/theme';
import { setupNotificationChannels } from '../services/notifications';

export default function RootLayout() {
  const { loadLocalUser } = useUserStore();
  const { checkUpdate } = useUpdateStore();
  const pathname = usePathname();
  const router = useRouter();

  // Inicializar canales de notificación prioritarios en Android
  useEffect(() => {
    setupNotificationChannels();
  }, []);

  // 1. Ocultar botones de navegación de Android (Immersive Sticky Mode)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setHidden(true);
        NavigationBar.setStyle('dark');
      } catch (e) {
        console.warn('Error configurando NavigationBar:', e);
      }
    }
  }, []);

  // 2. Control del botón Atrás de Android
  useEffect(() => {
    let lastBackPress = 0;

    const handleHardwareBack = () => {
      // Si está en onboarding u otra pantalla con historial atrás
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      // Si está en alguna sub-pestaña diferente al Inicio, regresar a Inicio
      if (pathname === '/workouts' || pathname === '/tutor' || pathname === '/progress' || pathname === '/profile') {
        router.replace('/(tabs)');
        return true;
      }

      // Si está en la pantalla principal de Inicio
      if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') {
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          BackHandler.exitApp();
          return false;
        }
        lastBackPress = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Presiona atrás de nuevo para salir de Level Up', ToastAndroid.SHORT);
        }
        return true; // Evita que se salga accidentalmente
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [pathname]);

  // 3. Cargar sesión y perfil del Cazador local offline
  useEffect(() => {
    loadLocalUser();
  }, []);

  // 4. Verificación automática de actualizaciones al abrir la app
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUpdate(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
      <StatusBar style="light" />
      <NavigationBar hidden={true} style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      <UpdateModal />
    </GestureHandlerRootView>
  );
}
