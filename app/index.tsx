import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { Colors } from '../constants/theme';

export default function Index() {
  const { isLoading, user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !user.goals?.length) {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.brand.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
