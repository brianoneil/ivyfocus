import { Stack } from "expo-router";
import { AudioProvider } from "../lib/context/AudioContext";

export default function RootLayout() {
  return (
    <AudioProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AudioProvider>
  );
}
