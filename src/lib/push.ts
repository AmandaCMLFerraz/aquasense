import { Platform } from "react-native";

import { apiRequest } from "@/lib/api";

type FirebaseMessaging = typeof import("@react-native-firebase/messaging");

function loadMessaging() {
  if (Platform.OS === "web") return null;

  try {
    const module =
      require("@react-native-firebase/messaging") as FirebaseMessaging;
    return { module, messaging: module.getMessaging() };
  } catch {
    return null;
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const Notifications =
      require("expo-notifications") as typeof import("expo-notifications");
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

function sendToken(accessToken: string, token: string) {
  return apiRequest<void>("/users/fcm-token", {
    method: "PUT",
    body: { token },
    token: accessToken,
  });
}

export async function registerPushToken(accessToken: string): Promise<void> {
  const firebase = loadMessaging();
  if (!firebase) return;

  try {
    if (!(await ensureNotificationPermission())) return;

    const token = await firebase.module.getToken(firebase.messaging);
    await sendToken(accessToken, token);
  } catch {
  }
}

export async function unregisterPushToken(accessToken: string): Promise<void> {
  const firebase = loadMessaging();
  if (!firebase) return;

  try {
    const token = await firebase.module.getToken(firebase.messaging);
    await apiRequest<void>("/users/fcm-token", {
      method: "DELETE",
      body: { token },
      token: accessToken,
    });
    await firebase.module.deleteToken(firebase.messaging);
  } catch {
  }
}

export function onPushTokenRefresh(accessToken: string): () => void {
  const firebase = loadMessaging();
  if (!firebase) return () => {};

  return firebase.module.onTokenRefresh(firebase.messaging, (token) => {
    void sendToken(accessToken, token).catch(() => {});
  });
}

export function onNotificationOpened(handler: () => void): () => void {
  const firebase = loadMessaging();
  if (!firebase) return () => {};

  void firebase.module
    .getInitialNotification(firebase.messaging)
    .then((message) => {
      if (message) handler();
    });
  return firebase.module.onNotificationOpenedApp(firebase.messaging, handler);
}
