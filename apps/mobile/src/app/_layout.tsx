import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../AppProvider";
export default function Root() {
  return (
    <SafeAreaProvider style={{ backgroundColor: "#EEEEEA" }}>
      <View
        style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" }}
      >
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAF9F5" },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="compose" options={{ presentation: "modal" }} />
            <Stack.Screen name="settings" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="edit-profile"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </AppProvider>
      </View>
    </SafeAreaProvider>
  );
}
