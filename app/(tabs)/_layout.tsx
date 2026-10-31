import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#0A0C16',
          borderTopColor: 'rgba(0, 240, 255, 0.25)',
          borderTopWidth: 1.5,
          height: isIOS ? 86 : 64,
          paddingBottom: isIOS ? 26 : 8,
          paddingTop: 6,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={23}
              color={focused ? '#00F0FF' : '#64748B'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Calabozos',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'barbell' : 'barbell-outline'}
              size={23}
              color={focused ? '#00F0FF' : '#64748B'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'CORTEX',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
              size={23}
              color={focused ? '#00F0FF' : '#64748B'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Telemetría',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={23}
              color={focused ? '#00F0FF' : '#64748B'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Estado',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'shield' : 'shield-outline'}
              size={23}
              color={focused ? '#00F0FF' : '#64748B'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
