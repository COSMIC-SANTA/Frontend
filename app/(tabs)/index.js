import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const navigateToLogin = () => {
    router.push("/splash");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Santa App</ThemedText>
      <ThemedText style={styles.description}>
        산타 앱에 오신 것을 환영합니다!
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        로그인하여 더 많은 기능을 이용해보세요.
      </ThemedText>

      <TouchableOpacity
        style={[
          styles.loginButton,
          { backgroundColor: themeColors.tint || "#007AFF" },
        ]}
        onPress={navigateToLogin}
      >
        <ThemedText style={styles.loginButtonText}>로그인하기</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  description: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.7,
  },
  loginButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
