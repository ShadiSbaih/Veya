# AuthGuard Infinite Loop Fix

## Problem
In Expo Router, returning a `<Redirect>` component from a sibling element like an `AuthGuard` alongside the `<Stack>` causes an immediate navigation transition. If it is rendered continuously, the app gets trapped in an **infinite redirect loop**—infinitely attempting to redirect to `/(auth)` even when already there. This exceeds React's maximum update depth and crashes the app before the Web UI can boot, which then causes the Error Overlay itself to crash with the error: `Cannot read properties of undefined (reading 'map')`.

## Solution
Instead of rendering a `<Redirect>` directly, wait for the layout to mount and handle the redirects securely via a `useEffect` hook using `router.replace()`.

### Code Reference
```tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function useProtectedRoute(isSignedIn: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, segments]);
}

export default function RootLayout() {
  const { isSignedIn } = { isSignedIn: false };
  useProtectedRoute(isSignedIn);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
      </Stack>
      
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
```
