import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CONTENT_PLACEHOLDER = `등산에 관한 이야기를 자유롭게 작성해주세요.

예시:
- 등산 후기
- 장비 추천
- 코스 정보
- 질문 및 조언 구하기`;

export default function CreatePostScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("오류", "내용을 입력해주세요.");
      return;
    }

    // 실제로는 API 호출하여 게시글 저장
    Alert.alert("성공", "게시글이 등록되었습니다.", [
      {
        text: "확인",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: "#999" }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          글 작성
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor:
                title.trim() && content.trim()
                  ? themeColors.tint || "#007AFF"
                  : "#ccc",
            },
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !content.trim()}
        >
          <Text style={styles.submitButtonText}>등록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 익명 설정 */}
        <View
          style={[
            styles.optionContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>
              익명으로 작성
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isAnonymous
                    ? themeColors.tint || "#007AFF"
                    : "#ccc",
                },
              ]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View
                style={[
                  styles.toggleCircle,
                  { transform: [{ translateX: isAnonymous ? 24 : 2 }] },
                ]}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.optionDescription,
              { color: themeColors.text + "80" },
            ]}
          >
            익명으로 작성하면 다른 사용자에게 작성자가 표시되지 않습니다.
          </Text>
        </View>

        {/* 제목 입력 */}
        <View
          style={[styles.inputContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>
            제목
          </Text>
          <TextInput
            style={[
              styles.titleInput,
              {
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border || "#ddd",
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요"
            placeholderTextColor={themeColors.text + "60"}
            maxLength={100}
          />
          <Text
            style={[styles.characterCount, { color: themeColors.text + "60" }]}
          >
            {title.length}/100
          </Text>
        </View>

        {/* 내용 입력 */}
        <View
          style={[styles.inputContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>
            내용
          </Text>
          <TextInput
            style={[
              styles.contentInput,
              {
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border || "#ddd",
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={CONTENT_PLACEHOLDER}
            placeholderTextColor={themeColors.text + "60"}
            multiline
            numberOfLines={15}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text
            style={[styles.characterCount, { color: themeColors.text + "60" }]}
          >
            {content.length}/2000
          </Text>
        </View>

        {/* 작성 가이드 */}
        <View
          style={[styles.guideContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.guideTitle, { color: themeColors.text }]}>
            💡 작성 가이드
          </Text>
          <Text style={[styles.guideText, { color: themeColors.text + "80" }]}>
            • 등산과 관련된 내용을 작성해주세요{"\n"}• 다른 사용자에게 도움이
            되는 정보를 공유해주세요{"\n"}• 욕설이나 비방은 삼가해주세요{"\n"}•
            개인정보는 공개하지 마세요
          </Text>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  optionContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    width: 50,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    position: "relative",
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "white",
    position: "absolute",
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    height: 300,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: "right",
  },
  guideContainer: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  guideText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 20,
  },
});
