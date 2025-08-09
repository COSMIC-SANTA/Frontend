import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    // 간단한 로그인 로직 (실제 앱에서는 API 호출 등을 해야 합니다)
    if (email === "test@test.com" && password === "password") {
      Alert.alert("성공", "로그인에 성공했습니다!", [
        {
          text: "확인",
          onPress: () => {
            // 로그인 성공 시 메인 페이지로 이동
            router.replace("/spain");
          },
        },
      ]);
    } else {
      Alert.alert("실패", "이메일 또는 비밀번호가 잘못되었습니다.");
    }
  };

  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.loginContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>로그인</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            이메일
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.border || "#ddd",
                backgroundColor: themeColors.card || "#f9f9f9",
                color: themeColors.text,
              },
            ]}
            placeholder="이메일을 입력하세요"
            placeholderTextColor={themeColors.text + "80"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            비밀번호
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.border || "#ddd",
                backgroundColor: themeColors.card || "#f9f9f9",
                color: themeColors.text,
              },
            ]}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor={themeColors.text + "80"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: themeColors.tint || "#007AFF" },
          ]}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity>
            <Text
              style={[
                styles.linkText,
                { color: themeColors.tint || "#007AFF" },
              ]}
            >
              계정이 없으신가요? 회원가입
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text
              style={[
                styles.linkText,
                { color: themeColors.tint || "#007AFF" },
              ]}
            >
              비밀번호를 잊으셨나요?
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testInfoContainer}>
          <Text style={[styles.testInfo, { color: themeColors.text + "80" }]}>
            테스트 계정: test@test.com / password
          </Text>
        </View>

        {/* 개발자 메뉴 버튼 */}
        <TouchableOpacity
          style={[styles.devMenuButton, { borderColor: themeColors.border }]}
          onPress={() => router.push("/dev-menu")}
        >
          <Text style={[styles.devMenuText, { color: themeColors.text }]}>
            🛠️ 개발자 메뉴
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  linkContainer: {
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPassword: {
    marginTop: 15,
  },
  testInfoContainer: {
    marginTop: 40,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  testInfo: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  devMenuButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  devMenuText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
