import React from 'react'
import { Tabs } from 'expo-router'
import { Colors } from '@/assets/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '@/context/AppContext'

export default function TabLayout() {
  const { unreadCount } = useApp();
  
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.onSurface,
      tabBarStyle: {
        backgroundColor: Colors.surfaceLowest,
        borderTopColor: Colors.surfaceHigh,
        borderTopWidth: 1,
        height: 80,
        paddingBottom: 12,
        paddingTop: 8
      },
      tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: "600"
      }
    }}>
      <Tabs.Screen name="index"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={22} color={color} />
          )
        }} />
      <Tabs.Screen name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen name="notifications"
        options={{
          title: "Alerts",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          )
        }}
      />
    </Tabs>
  )
}