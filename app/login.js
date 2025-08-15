import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
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
  View,
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

    const requestData = {
      username: username.trim(),
      password: password.trim(),
    };

    console.log("🚀 로그인 요청 데이터:", {
      username: requestData.username,
      password: "[보안상 숨김]"
    });

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 로그인 응답 성공:", result);

        // LoginResponseDTO 구조 확인 - token을 받아옴
        if (result.data && result.data.token) {
          const token = result.data.token;
          console.log("🔑 받은 토큰:", token.substring(0, 20) + "...");

          // 토큰을 저장 (추후 AsyncStorage 등으로 개선 가능)
          // AsyncStorage.setItem('authToken', token);

          Alert.alert(
            "로그인 성공",
            `환영합니다, ${username}님!`,
            [
              {
                text: "확인",
                onPress: () => {
                  console.log("🏔️ spain 페이지로 이동");
                  router.replace("/spain");
                },
              },
            ]
          );
        } else {
          console.log("⚠️ 토큰이 응답에 없음:", result);
          Alert.alert("알림", "로그인은 완료되었지만 인증 토큰을 받지 못했습니다.");
          router.replace("/spain");
        }
      } else {
        // 에러 응답 처리
        const errorText = await response.text();
        console.log(`❌ HTTP ${response.status} 에러:`, errorText);

        let errorMessage = "로그인에 실패했습니다.";
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          console.log("🔍 파싱된 에러 데이터:", errorData);
        } catch (_parseError) {
          console.log("🔍 에러 응답 파싱 실패, 원본 텍스트:", errorText);
        }

        if (response.status === 401) {
          errorMessage = "사용자명 또는 비밀번호가 올바르지 않습니다.";
        } else if (response.status === 403) {
          errorMessage = "계정이 비활성화되었습니다.";
        } else if (response.status === 404) {
          errorMessage = "존재하지 않는 계정입니다.";
        } else if (response.status === 500) {
          errorMessage = "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }

        Alert.alert("로그인 실패", errorMessage);
      }
    } catch (error) {
      console.log("💥 네트워크 에러:", error);
      console.log("🔍 에러 상세:", {
        name: error.name,
        message: error.message,
      });

      let errorMessage = "네트워크 연결에 문제가 발생했습니다.";
      
      if (error.message.includes("Network request failed")) {
        errorMessage = "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
      }

      Alert.alert("연결 오류", errorMessage);
    } finally {
      setIsLoading(false);
      console.log("=== 로그인 종료 ===");
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
