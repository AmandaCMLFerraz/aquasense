import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import * as React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/loading-screen";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { SelectedResidenceProvider } from "@/hooks/use-selected-residence";
import { ToastProvider } from "@/hooks/use-toast";

const MIN_LOADING_MS = 2000;

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/home");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <>
      {children}
      {(isLoading || !minTimeElapsed) && <LoadingScreen />}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SelectedResidenceProvider>
              <NotificationsProvider>
                <NavigationGuard>
                  <TouchableWithoutFeedback
                    onPress={Keyboard.dismiss}
                    accessible={false}
                  >
                    <KeyboardAvoidingView
                      style={{ flex: 1 }}
                      behavior="padding"
                    >
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(app)" />
                      </Stack>
                    </KeyboardAvoidingView>
                  </TouchableWithoutFeedback>
                </NavigationGuard>
              </NotificationsProvider>
            </SelectedResidenceProvider>
          </AuthProvider>
        </ToastProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
