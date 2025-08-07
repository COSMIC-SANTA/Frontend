import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router, useLocalSearchParams } from "expo-router";
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

// 날짜 포맷 유틸리티 함수
function formatDate(date) {
  return date.toLocaleString("ko-KR");
}

export default function BoardPostScreen() {
  const { postId } = useLocalSearchParams();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(8);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // 샘플 게시글 데이터
  const posts = {
    1: {
      id: 1,
      title: "지리산 등반 후기 - 정말 힘들었지만 보람있었어요!",
      content: `어제 지리산을 다녀왔는데 정말 힘든 코스였지만 끝까지 완주했습니다!

새벽 5시에 출발해서 오후 6시에 하산했는데, 중간에 포기하고 싶었던 순간이 몇 번 있었어요. 특히 천왕봉 올라가는 구간이 정말 힘들더라구요.

하지만 정상에서 본 풍경은 정말 말로 표현할 수 없을 정도로 아름다웠습니다. 구름 위로 솟아있는 다른 산봉우리들과 끝없이 펼쳐진 산맥들... 

등산 초보분들은 충분한 준비와 체력 훈련 후에 도전하시길 추천드려요!

#지리산 #등산후기 #천왕봉`,
      author: "익명1",
      createdAt: "2025-08-01 14:30",
      views: 127,
    },
    2: {
      id: 2,
      title: "등산화 추천 부탁드려요",
      content: `등산 초보인데 어떤 등산화가 좋을까요?

예산은 20만원 정도로 생각하고 있고, 주로 근교 산들 위주로 다닐 예정입니다.

발볼이 좀 넓은 편이라 편한 걸로 추천해주시면 감사하겠습니다!`,
      author: "익명2",
      createdAt: "2025-08-01 12:15",
      views: 89,
    },
    3: {
      id: 3,
      title: "한라산 등반 계획 중인데 조언 구합니다",
      content: `다음 주에 한라산 등반을 계획하고 있는데 몇 가지 궁금한 점이 있어서 문의드려요.

1. 이 시기 한라산 날씨는 어떤가요?
2. 어느 코스가 가장 좋을까요?
3. 준비물로 특별히 챙겨야 할 것이 있을까요?

한라산 경험 있으신 분들의 조언 부탁드립니다!`,
      author: "익명3",
      createdAt: "2025-08-01 10:45",
      views: 156,
    },
  };

  const [comments, setComments] = useState([
    {
      id: 1,
      text: "와 정말 멋진 후기네요! 저도 지리산 가보고 싶어졌어요",
      author: "산사랑",
      createdAt: "2025-08-01 15:00",
      likes: 3,
    },
    {
      id: 2,
      text: "천왕봉 구간이 정말 힘들죠ㅠㅠ 고생하셨습니다!",
      author: "등산매니아",
      createdAt: "2025-08-01 15:30",
      likes: 1,
    },
    {
      id: 3,
      text: "초보자도 충분한 준비하면 할 수 있나요?",
      author: "등산초보",
      createdAt: "2025-08-01 16:00",
      likes: 0,
    },
  ]);

  const currentPost = posts[postId] || posts[1];

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: comments.length + 1,
        text: commentText.trim(),
        author: "나",
        createdAt: formatDate(new Date()),
        likes: 0,
      };
      setComments([...comments, newComment]);
      setCommentText("");
      Alert.alert("성공", "댓글이 등록되었습니다.");
    }
  };

  const CommentItem = ({ comment }) => (
    <View style={[styles.commentItem, { backgroundColor: themeColors.card }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: themeColors.text }]}>
          {comment.author}
        </Text>
        <Text style={[styles.commentDate, { color: themeColors.text + "60" }]}>
          {comment.createdAt}
        </Text>
      </View>
      <Text style={[styles.commentText, { color: themeColors.text }]}>
        {comment.text}
      </Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentLikeButton}>
          <Text
            style={[styles.commentLikeText, { color: themeColors.text + "80" }]}
          >
            ❤️ {comment.likes}
          </Text>
        </TouchableOpacity>
      </View>
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
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          게시글
        </Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 게시글 내용 */}
        <View
          style={[styles.postContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.postTitle, { color: themeColors.text }]}>
            {currentPost.title}
          </Text>
          <View style={styles.postInfo}>
            <Text
              style={[styles.postAuthor, { color: themeColors.text + "80" }]}
            >
              {currentPost.author}
            </Text>
            <Text style={[styles.postDate, { color: themeColors.text + "60" }]}>
              {currentPost.createdAt}
            </Text>
            <Text
              style={[styles.postViews, { color: themeColors.text + "60" }]}
            >
              👁️ {currentPost.views}
            </Text>
          </View>
          <Text style={[styles.postContent, { color: themeColors.text }]}>
            {currentPost.content}
          </Text>

          {/* 좋아요 버튼 */}
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[
                styles.likeButton,
                {
                  backgroundColor: isLiked ? "#FFE6E6" : themeColors.background,
                },
              ]}
              onPress={handleLike}
            >
              <Text
                style={[
                  styles.likeButtonText,
                  { color: isLiked ? "#FF6B6B" : themeColors.text },
                ]}
              >
                {isLiked ? "❤️" : "🤍"} {likeCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 댓글 섹션 */}
        <View
          style={[
            styles.commentsSection,
            { backgroundColor: themeColors.card },
          ]}
        >
          <Text style={[styles.commentsTitle, { color: themeColors.text }]}>
            댓글 {comments.length}개
          </Text>

          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </View>
      </ScrollView>

      {/* 댓글 입력 영역 */}
      <View
        style={[
          styles.commentInputContainer,
          { backgroundColor: themeColors.card },
        ]}
      >
        <TextInput
          style={[
            styles.commentInput,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border || "#ddd",
            },
          ]}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={themeColors.text + "60"}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.commentSubmitButton,
            {
              backgroundColor: commentText.trim()
                ? themeColors.tint || "#007AFF"
                : "#ccc",
            },
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim()}
        >
          <Text style={styles.commentSubmitText}>등록</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  menuButton: {
    paddingLeft: 16,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  postContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 24,
  },
  postInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: "500",
  },
  postDate: {
    fontSize: 12,
  },
  postViews: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  likeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  likeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentsSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  commentItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  commentLikeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentLikeText: {
    fontSize: 12,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 80,
    fontSize: 14,
  },
  commentSubmitButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
