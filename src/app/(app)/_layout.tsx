import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="device-detail" />
      <Stack.Screen name="add-device-form" />
      <Stack.Screen name="consumer-unit-form" />
    </Stack>
  );
}
