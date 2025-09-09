import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
      <Stack
        // ✅ 기본 탭바 완전히 숨기기
        screenOptions={{
          headerShown: false,
          tabBar: () => null,
        }}
      >
        {/* login은 라우팅만 유지하고 탭에 노출X */}
          <Stack.Screen name="login" />
          <Stack.Screen name="spain" />         {/* ← 메인 화면 파일이 spain.js라면 이걸 노출 */}
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="dev-menu" />
          <Stack.Screen name="mountain-tourism" />
          <Stack.Screen name="mountain-direction" />
          <Stack.Screen name="optimal-route" />
          {/* 필요하면 (tabs) 그룹을 따로 두고 그 안에서 Tabs 구성 */}
          {/* <Stack.Screen name="(tabs)" /> */}
          <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
    </ThemeProvider>
  );
}
