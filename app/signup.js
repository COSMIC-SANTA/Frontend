import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignupScreen() {
    const router = useRouter();
    const [age, setAge] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [joinUser, setJoinUser] = useState(null);

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
        if (password.length < 6) {
            Alert.alert("입력 오류", "비밀번호는 최소 6자 이상이어야 합니다.");
            return false;
        }
        if (!nickname.trim()) {
            Alert.alert("입력 오류", "닉네임을 입력해주세요.");
            return false;
        }
        if (!age.trim() || isNaN(parseInt(age)) || parseInt(age) < 1) {
            Alert.alert("입력 오류", "올바른 나이를 입력해주세요.");
            return false;
        }
        return true;
    };

    // 회원가입 처리 함수
    const handleSignup = async () => {
        console.log("=== 회원가입 시작 ===");
        
        if (!validateInputs()) {
            return;
        }

        const requestData = {
            username: username.trim(),
            password: password.trim(),
            nickname: nickname.trim(),
            age: parseInt(age.trim(), 10),
        };

        console.log("🚀 전송 데이터:", {
            username: requestData.username,
            nickname: requestData.nickname,
            age: requestData.age,
            password: "[보안상 숨김]"
        });

        setIsLoading(true);

        try {
            const response = await fetch("http://api-santa.com/api/auth/sign-up", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
            console.log(`📡 응답 헤더:`, Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const result = await response.json();
                console.log("✅ 서버 응답 성공:", result);

                // ResponseHandler<JoinResponseDTO> 구조 확인
                if (result.data) {
                    const joinUserData = result.data;
                    console.log("👤 회원가입된 사용자 정보:", {
                        userId: joinUserData.userId,
                        username: joinUserData.username,
                        nickname: joinUserData.nickname
                    });

                    setJoinUser(joinUserData);

                    Alert.alert(
                        "회원가입 성공", 
                        `환영합니다, ${joinUserData.nickname}님!\n사용자명: ${joinUserData.username}`,
                        [
                            {
                                text: "로그인하러 가기",
                                onPress: () => router.replace("/login")
                            }
                        ]
                    );
                } else {
                    console.log("⚠️ 응답 데이터 구조 이상:", result);
                    Alert.alert("알림", "회원가입은 완료되었지만 사용자 정보를 받아오지 못했습니다.");
                    router.replace("/login");
                }
            } else {
                // 에러 응답 처리
                const errorText = await response.text();
                console.log(`❌ HTTP ${response.status} 에러:`, errorText);

                let errorMessage = "회원가입에 실패했습니다.";
                
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    console.log("🔍 파싱된 에러 데이터:", errorData);
                } catch (_parseError) {
                    console.log("🔍 에러 응답 파싱 실패, 원본 텍스트:", errorText);
                }

                if (response.status === 400) {
                    errorMessage = "입력 정보가 올바르지 않습니다.";
                } else if (response.status === 409) {
                    errorMessage = "이미 사용 중인 사용자명 또는 닉네임입니다.";
                } else if (response.status === 500) {
                    errorMessage = "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
                }

                Alert.alert("회원가입 실패", errorMessage);
            }
        } catch (error) {
            console.log("💥 네트워크 에러:", error);
            console.log("🔍 에러 상세:", {
                name: error.name,
                message: error.message,
                stack: error.stack
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
            console.log("=== 회원가입 종료 ===");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>회원가입</Text>
            
            <TextInput
                style={styles.input}
                placeholder="사용자명 (아이디)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
            />
            
            <TextInput
                style={styles.input}
                placeholder="닉네임"
                value={nickname}
                onChangeText={setNickname}
                autoCorrect={false}
            />
            
            <TextInput
                style={styles.input}
                placeholder="비밀번호 (최소 6자)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />
            
            <TextInput
                style={styles.input}
                placeholder="나이"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
            />
            
            <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleSignup} 
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.buttonText}>회원가입</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => router.push("/login")}
            >
                <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
            </TouchableOpacity>

            {joinUser && (
                <View style={styles.successInfo}>
                    <Text style={styles.successText}>
                        가입 완료: {joinUser.nickname}님 (ID: {joinUser.userId})
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        padding: 24,
        backgroundColor: "#f5f5f5"
    },
    title: { 
        fontSize: 28, 
        fontWeight: "bold", 
        marginBottom: 32,
        color: "#325A2A"
    },
    input: { 
        width: "100%", 
        maxWidth: 350, 
        borderWidth: 1, 
        borderColor: "#ddd", 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 16,
        backgroundColor: "#fff",
        fontSize: 16
    },
    button: { 
        backgroundColor: "#325A2A", 
        padding: 16, 
        borderRadius: 8, 
        alignItems: "center", 
        width: "100%", 
        maxWidth: 350,
        marginTop: 8
    },
    buttonDisabled: {
        backgroundColor: "#888",
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 16 
    },
    linkButton: {
        marginTop: 16,
        padding: 8
    },
    linkText: {
        color: "#325A2A",
        fontSize: 14,
        textDecorationLine: "underline"
    },
    successInfo: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#d4edda",
        borderRadius: 8,
        borderColor: "#c3e6cb",
        borderWidth: 1
    },
    successText: {
        color: "#155724",
        fontSize: 14,
        fontWeight: "500"
    }
});