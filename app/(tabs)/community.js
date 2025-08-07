import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState("groups"); // 'groups' 또는 'board'
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] =
    useState(false);
  const [newGroupInfo, setNewGroupInfo] = useState({
    title: "",
    location: "",
    ageGroup: "20대",
    level: "초급",
    interest: "산행",
    description: "",
  });

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // 샘플 그룹 데이터
  const [groups, setGroups] = useState([
    {
      id: 1,
      title: "서울 지리산 산행 모임",
      location: "서울",
      ageGroup: "30대",
      level: "중급",
      interest: "산행",
      members: 15,
      maxMembers: 20,
      recentActivity: "2시간 전",
    },
    {
      id: 2,
      title: "부산 등산 초보 모임",
      location: "부산",
      ageGroup: "20대",
      level: "초급",
      interest: "등산입문",
      members: 8,
      maxMembers: 15,
      recentActivity: "30분 전",
    },
    {
      id: 3,
      title: "등산 사진 동호회",
      location: "전국",
      ageGroup: "전체",
      level: "중급",
      interest: "사진촬영",
      members: 25,
      maxMembers: 30,
      recentActivity: "1시간 전",
    },
  ]);

  // 샘플 게시판 데이터
  const [boardPosts] = useState([
    {
      id: 1,
      title: "지리산 등반 후기 - 정말 힘들었지만 보람있었어요!",
      content: "어제 지리산을 다녀왔는데 정말 힘든 코스였지만...",
      author: "익명1",
      createdAt: "2025-08-01 14:30",
      views: 127,
      likes: 8,
      comments: 5,
    },
    {
      id: 2,
      title: "등산화 추천 부탁드려요",
      content: "등산 초보인데 어떤 등산화가 좋을까요?",
      author: "익명2",
      createdAt: "2025-08-01 12:15",
      views: 89,
      likes: 3,
      comments: 12,
    },
    {
      id: 3,
      title: "한라산 등반 계획 중인데 조언 구합니다",
      content: "다음 주에 한라산 등반을 계획하고 있는데...",
      author: "익명3",
      createdAt: "2025-08-01 10:45",
      views: 156,
      likes: 15,
      comments: 8,
    },
  ]);

  const getLevelColor = (level) => {
    switch (level) {
      case "초급":
        return "#95E1D3";
      case "중급":
        return "#4ECDC4";
      case "고급":
        return "#FF6B6B";
      default:
        return "#999";
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupInfo.title.trim() || !newGroupInfo.description.trim()) {
      Alert.alert("오류", "제목과 설명을 입력해주세요.");
      return;
    }

    const newGroup = {
      id: groups.length + 1,
      ...newGroupInfo,
      members: 1,
      maxMembers: 20,
      recentActivity: "방금 전",
    };

    setGroups([newGroup, ...groups]);
    setIsCreateGroupModalVisible(false);
    setNewGroupInfo({
      title: "",
      location: "",
      ageGroup: "20대",
      level: "초급",
      interest: "산행",
      description: "",
    });
    Alert.alert("성공", "그룹이 생성되었습니다!");
  };

  const handleJoinGroup = (groupId) => {
    router.push(`/group-chat?groupId=${groupId}`);
  };

  const handlePostClick = (postId) => {
    router.push(`/board-post?postId=${postId}`);
  };

  const handleCreatePost = () => {
    router.push("/create-post");
  };

  const GroupCard = ({ group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: themeColors.card }]}
      onPress={() => handleJoinGroup(group.id)}
    >
      <View style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: themeColors.text }]}>
          {group.title}
        </Text>
        <Text
          style={[styles.groupActivity, { color: themeColors.text + "80" }]}
        >
          {group.recentActivity}
        </Text>
      </View>

      <View style={styles.groupTags}>
        <View style={[styles.tag, { backgroundColor: "#E3F2FD" }]}>
          <Text style={styles.tagText}>{group.location}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: "#FFF3E0" }]}>
          <Text style={styles.tagText}>{group.ageGroup}</Text>
        </View>
        <View
          style={[styles.tag, { backgroundColor: getLevelColor(group.level) }]}
        >
          <Text style={styles.tagText}>{group.level}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: "#F3E5F5" }]}>
          <Text style={styles.tagText}>{group.interest}</Text>
        </View>
      </View>

      <View style={styles.groupFooter}>
        <Text style={[styles.memberCount, { color: themeColors.text }]}>
          멤버 {group.members}/{group.maxMembers}명
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(group.members / group.maxMembers) * 100}%`,
                backgroundColor: themeColors.tint || "#007AFF",
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const BoardPostCard = ({ post }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: themeColors.card }]}
      onPress={() => handlePostClick(post.id)}
    >
      <Text style={[styles.postTitle, { color: themeColors.text }]}>
        {post.title}
      </Text>
      <Text
        style={[styles.postPreview, { color: themeColors.text + "80" }]}
        numberOfLines={2}
      >
        {post.content}
      </Text>
      <View style={styles.postFooter}>
        <Text style={[styles.postAuthor, { color: themeColors.text + "60" }]}>
          {post.author}
        </Text>
        <Text style={[styles.postDate, { color: themeColors.text + "60" }]}>
          {post.createdAt}
        </Text>
      </View>
      <View style={styles.postStats}>
        <Text style={[styles.postStat, { color: themeColors.text + "60" }]}>
          👁️ {post.views}
        </Text>
        <Text style={[styles.postStat, { color: themeColors.text + "60" }]}>
          ❤️ {post.likes}
        </Text>
        <Text style={[styles.postStat, { color: themeColors.text + "60" }]}>
          💬 {post.comments}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 탭 헤더 */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "groups" && {
              backgroundColor: themeColors.tint || "#007AFF",
            },
          ]}
          onPress={() => setActiveTab("groups")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "groups" ? "white" : themeColors.text },
            ]}
          >
            그룹 채팅
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "board" && {
              backgroundColor: themeColors.tint || "#007AFF",
            },
          ]}
          onPress={() => setActiveTab("board")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "board" ? "white" : themeColors.text },
            ]}
          >
            익명 게시판
          </Text>
        </TouchableOpacity>
      </View>

      {/* 그룹 채팅 탭 */}
      {activeTab === "groups" && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              등산 그룹 모임
            </Text>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: themeColors.tint || "#007AFF" },
              ]}
              onPress={() => setIsCreateGroupModalVisible(true)}
            >
              <Text style={styles.createButtonText}>그룹 생성</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 익명 게시판 탭 */}
      {activeTab === "board" && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              익명 게시판
            </Text>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: themeColors.tint || "#007AFF" },
              ]}
              onPress={handleCreatePost}
            >
              <Text style={styles.createButtonText}>글 작성</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {boardPosts.map((post) => (
              <BoardPostCard key={post.id} post={post} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 그룹 생성 모달 */}
      <Modal
        visible={isCreateGroupModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              새 그룹 생성
            </Text>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  그룹명
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
                  value={newGroupInfo.title}
                  onChangeText={(text) =>
                    setNewGroupInfo({ ...newGroupInfo, title: text })
                  }
                  placeholder="그룹명을 입력하세요"
                  placeholderTextColor={themeColors.text + "60"}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  지역
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
                  value={newGroupInfo.location}
                  onChangeText={(text) =>
                    setNewGroupInfo({ ...newGroupInfo, location: text })
                  }
                  placeholder="지역을 입력하세요"
                  placeholderTextColor={themeColors.text + "60"}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  설명
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      borderColor: themeColors.border || "#ddd",
                      backgroundColor: themeColors.card || "#f9f9f9",
                      color: themeColors.text,
                    },
                  ]}
                  value={newGroupInfo.description}
                  onChangeText={(text) =>
                    setNewGroupInfo({ ...newGroupInfo, description: text })
                  }
                  placeholder="그룹에 대한 설명을 입력하세요"
                  placeholderTextColor={themeColors.text + "60"}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsCreateGroupModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.tint || "#007AFF" },
                ]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.saveButtonText}>생성</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  groupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  groupActivity: {
    fontSize: 12,
  },
  groupTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberCount: {
    fontSize: 12,
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  postPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 12,
  },
  postDate: {
    fontSize: 12,
  },
  postStats: {
    flexDirection: "row",
    gap: 16,
  },
  postStat: {
    fontSize: 12,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
