// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import "react-native-reanimated";

// import { useColorScheme } from "@/hooks/useColorScheme";

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <Stack>
//         {/* 로그인 페이지를 첫 번째로 설정 (실제 앱 플로우) */}
//         <Stack.Screen
//           name="login"
//           options={{ title: "로그인", headerShown: false }}
//         />
//         <Stack.Screen
//           name="main"
//           options={{ title: "메인 페이지", headerShown: false }}
//         />
//         <Stack.Screen
//           name="dev-menu"
//           options={{ title: "개발자 메뉴", headerShown: false }}
//         />
//         <Stack.Screen
//           name="dashboard"
//           options={{ title: "대시보드", headerShown: false }}
//         />
//         <Stack.Screen
//           name="mountain-tourism"
//           options={{ title: "산 주변 관광 스팟", headerShown: false }}
//         />
//         <Stack.Screen
//           name="mountain-direction"
//           options={{ title: "산길 안내", headerShown: false }}
//         />
//         <Stack.Screen
//           name="optimal-route"
//           options={{ title: "최적 경로", headerShown: false }}
//         />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="+not-found" />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        // ✅ 기본 탭바 완전히 숨기기
        screenOptions={{
          headerShown: false,
          tabBar: () => null,
        }}
      >
        {/* login은 라우팅만 유지하고 탭에 노출X */}
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="main" />
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="dev-menu" />
        <Tabs.Screen name="mountain-tourism" />
        <Tabs.Screen name="mountain-direction" />
        <Tabs.Screen name="optimal-route" />
        <Tabs.Screen name="+not-found" options={{ href: null }} />
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
