import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { loginService } from "@/services/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 입력값 검증
  const validateInputs = () => {
    if (!username.trim()) {
      Alert.alert("입력 오류", "사용자명을 입력해주세요.");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    console.log("=== 로그인 시작 ===");
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginService.login(username, password);
      
      console.log("=== 로그인 결과 ===");
      console.log("메시지:", result);

      if (result && result.accessToken) {
        console.log("로그인 성공, 메인 화면으로 이동");
        router.navigate("/spain");
      } else if (result && result.error) {
        console.log("로그인 실패:", result.error);
        Alert.alert("로그인 실패", result.error);
      } else {
        console.log("로그인 결과가 없거나 토큰이 없음:", result);
        Alert.alert("로그인 실패", "로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.log("예상치 못한 에러:", error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      console.log("=== 로그인 종료 ===");
    };
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
            사용자명
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
            placeholder="사용자명을 입력하세요"
            placeholderTextColor={themeColors.text + "80"}
            value={username}
            onChangeText={setUsername}
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
            {
              backgroundColor: isLoading
                ? (themeColors.tint || "#007AFF") + "80"
                : themeColors.tint || "#007AFF",
            },
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>로그인</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={() => router.push("/signup")}>
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginContainer: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  linkContainer: {
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: "underline",
    marginBottom: 10,
  },
  forgotPassword: {
    marginTop: 10,
  },
});
