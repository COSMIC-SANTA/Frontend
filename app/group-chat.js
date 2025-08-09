import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function GroupChatScreen() {
  const { groupId } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 새로 가입한 등산 초보입니다 😊",
      author: "등산러버",
      timestamp: "14:30",
      isMe: false,
    },
    {
      id: 2,
      text: "어서오세요! 환영합니다 🎉",
      author: "산악대장",
      timestamp: "14:32",
      isMe: false,
    },
    {
      id: 3,
      text: "다음 주 지리산 등반 계획은 어떻게 되나요?",
      author: "나",
      timestamp: "14:35",
      isMe: true,
    },
    {
      id: 4,
      text: "일요일 오전 8시에 출발 예정입니다! 참여하실 분은 댓글 남겨주세요",
      author: "산악대장",
      timestamp: "14:36",
      isMe: false,
    },
    {
      id: 5,
      text: "저도 참여하고 싶어요! 🙋‍♀️",
      author: "하이킹걸",
      timestamp: "14:38",
      isMe: false,
    },
  ]);

  const scrollViewRef = useRef();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // 샘플 그룹 정보
  const groupInfo = {
    1: {
      title: "서울 지리산 산행 모임",
      members: 15,
      location: "서울",
      level: "중급",
    },
    2: {
      title: "부산 등산 초보 모임",
      members: 8,
      location: "부산",
      level: "초급",
    },
    3: {
      title: "등산 사진 동호회",
      members: 25,
      location: "전국",
      level: "중급",
    },
  };

  const currentGroup = groupInfo[groupId] || groupInfo[1];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // 타임스탬프 포맷 유틸리티 함수
  const formatTimestamp = (date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message.trim(),
        author: "나",
        timestamp: formatTimestamp(new Date()),
        isMe: true,
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const MessageBubble = ({ msg }) => (
    <View
      style={[
        styles.messageContainer,
        msg.isMe ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!msg.isMe && (
        <Text style={[styles.authorName, { color: themeColors.text + "80" }]}>
          {msg.author}
        </Text>
      )}
      <View
        style={[
          styles.messageBubble,
          msg.isMe
            ? { backgroundColor: themeColors.tint || "#007AFF" }
            : { backgroundColor: themeColors.card },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: msg.isMe ? "white" : themeColors.text },
          ]}
        >
          {msg.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: themeColors.text + "60" }]}>
        {msg.timestamp}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.backButtonText,
              { color: themeColors.tint || "#007AFF" },
            ]}
          >
            ← 뒤로
          </Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.groupTitle, { color: themeColors.text }]}>
            {currentGroup.title}
          </Text>
          <Text
            style={[styles.memberCount, { color: themeColors.text + "80" }]}
          >
            멤버 {currentGroup.members}명
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text
            style={[
              styles.menuButtonText,
              { color: themeColors.tint || "#007AFF" },
            ]}
          >
            ⋯
          </Text>
        </TouchableOpacity>
      </View>

      {/* 채팅 영역 */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </ScrollView>

        {/* 입력 영역 */}
        <View
          style={[styles.inputContainer, { backgroundColor: themeColors.card }]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border || "#ddd",
              },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={themeColors.text + "60"}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: message.trim()
                  ? themeColors.tint || "#007AFF"
                  : "#ccc",
              },
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
  },
  menuButton: {
    paddingLeft: 16,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  authorName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
