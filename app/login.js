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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    // 입력값 검증
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("입력 오류", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      Alert.alert("입력 오류", "비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 임시 로그인 검증 (실제 앱에서는 API 호출)
      if (email === "test@test.com" && password === "password") {
        // 로그인 성공
        Alert.alert("로그인 성공", "환영합니다!", [
          {
            text: "확인",
            onPress: () => {
              router.replace("/spain");
            },
          },
        ]);
      } else {
        // 로그인 실패
        Alert.alert(
          "로그인 실패", 
          "이메일 또는 비밀번호가 올바르지 않습니다.\n\n테스트 계정:\n이메일: test@test.com\n비밀번호: password"
        );
      }
    } catch (error) {
      console.error("로그인 처리 중 오류 발생:", error);
      
      // 에러 타입별 처리
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        Alert.alert("네트워크 오류", "인터넷 연결을 확인해주세요.");
      } else if (error.name === 'TimeoutError') {
        Alert.alert("시간 초과", "요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else if (error.response) {
        // API 응답 에러
        const statusCode = error.response.status;
        switch (statusCode) {
          case 400:
            Alert.alert("요청 오류", "잘못된 요청입니다.");
            break;
          case 401:
            Alert.alert("인증 실패", "이메일 또는 비밀번호를 확인해주세요.");
            break;
          case 403:
            Alert.alert("접근 거부", "계정이 비활성화되었습니다.");
            break;
          case 404:
            Alert.alert("계정 없음", "존재하지 않는 계정입니다.");
            break;
          case 500:
            Alert.alert("서버 오류", "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
            break;
          default:
            Alert.alert("오류", "알 수 없는 오류가 발생했습니다.");
        }
      } else {
        // 기타 예상치 못한 오류
        Alert.alert(
          "예상치 못한 오류", 
          "문제가 지속되면 고객센터에 문의해주세요.\n\n오류 코드: " + (error.code || 'UNKNOWN')
        );
      }
    } finally {
      setIsLoading(false);
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
            {
              backgroundColor: isLoading
                ? (themeColors.tint || "#007AFF") + "80"
                : themeColors.tint || "#007AFF",
            },
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Text>
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
