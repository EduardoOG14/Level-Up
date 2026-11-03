import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const bottomInset = Math.max(insets.bottom, isIOS ? 26 : 14);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#0A0C16',
          borderTopColor: 'rgba(0, 240, 255, 0.25)',
          borderTopWidth: 1.5,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 7,
          elevation: 12,
          shadowColor: '#00F0FF',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 3,
        },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? '#00F0FF' : '#64748B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Calabozos',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <Ionicons
                name={focused ? 'barbell' : 'barbell-outline'}
                size={22}
                color={focused ? '#00F0FF' : '#64748B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'CORTEX',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <Ionicons
                name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
                size={22}
                color={focused ? '#00F0FF' : '#64748B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Telemetría',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={22}
                color={focused ? '#00F0FF' : '#64748B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Estado',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <Ionicons
                name={focused ? 'shield' : 'shield-outline'}
                size={22}
                color={focused ? '#00F0FF' : '#64748B'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
