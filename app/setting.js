import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

export default function SettingScreen() {
  const [userInfo, setUserInfo] = useState({
    name: "홍길동",
    location: "서울",
    age: "25",
    level: "중급",
    profileImage: null,
  });

  const [currentPlans, setCurrentPlans] = useState([
    {
      id: 1,
      mountainName: "지리산",
      mountainLevel: "상급",
      status: "계획중", // "계획중" | "완료"
      targetDate: "2025-08-15",
      imageUrl: require("@/assets/images/react-logo.png"), // 임시 이미지
    },
  ]);

  const [completedMountains, setCompletedMountains] = useState([
    {
      id: 1,
      mountainName: "설악산",
      mountainLevel: "상급",
      completedDate: "2025-07-01",
    },
    {
      id: 2,
      mountainName: "한라산",
      mountainLevel: "중급",
      completedDate: "2025-06-15",
    },
    {
      id: 3,
      mountainName: "북한산",
      mountainLevel: "하급",
      completedDate: "2025-05-20",
    },
  ]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUserInfo, setEditingUserInfo] = useState(userInfo);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleEditProfile = () => {
    setEditingUserInfo(userInfo);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    setUserInfo(editingUserInfo);
    setIsEditModalVisible(false);
    Alert.alert("성공", "프로필이 업데이트되었습니다.");
  };

  const handleImagePicker = () => {
    // 이미지 피커 구현 (expo-image-picker 사용 예정)
    Alert.alert("알림", "이미지 선택 기능은 추후 구현 예정입니다.");
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "상급":
        return "#FF6B6B";
      case "중급":
        return "#4ECDC4";
      case "하급":
        return "#95E1D3";
      default:
        return "#999";
    }
  };

  const StatusBadge = ({ status }) => (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: status === "완료" ? "#4CAF50" : "#FF9800",
        },
      ]}
    >
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );

  const LevelBadge = ({ level }) => (
    <View
      style={[styles.levelBadge, { backgroundColor: getLevelColor(level) }]}
    >
      <Text style={styles.levelText}>{level}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: "#325A2A" }]}>
      {/* 상단 프로필 섹션 */}
      <View
        style={[styles.profileSection, { backgroundColor: themeColors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          프로필 설정
        </Text>

        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.profileImageContainer}
          >
            {userInfo.profileImage ? (
              <Image
                source={{ uri: userInfo.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: themeColors.border },
                ]}
              >
                <Text
                  style={[styles.profileImageText, { color: themeColors.text }]}
                >
                  📷
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                이름:
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                {userInfo.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                지역:
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                {userInfo.location}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                나이:
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                {userInfo.age}세
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                등산 레벨:
              </Text>
              <LevelBadge level={userInfo.level} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: themeColors.tint || "#007AFF" },
          ]}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>프로필 수정</Text>
        </TouchableOpacity>
      </View>

      {/* 중간 계획 섹션 */}
      <View style={[styles.planSection, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          등산 계획
        </Text>

        {currentPlans.length > 0 ? (
          currentPlans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: themeColors.background },
              ]}
            >
              <Image source={plan.imageUrl} style={styles.planImage} />
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: themeColors.text }]}>
                  {plan.mountainName}
                </Text>
                <View style={styles.planDetails}>
                  <LevelBadge level={plan.mountainLevel} />
                  <StatusBadge status={plan.status} />
                </View>
                <Text
                  style={[styles.planDate, { color: themeColors.text + "80" }]}
                >
                  계획일: {plan.targetDate}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: themeColors.text + "60" }]}>
            현재 계획된 등산이 없습니다.
          </Text>
        )}
      </View>

      {/* 하단 완료 섹션 */}
      <View
        style={[styles.completedSection, { backgroundColor: themeColors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          등산 완료 기록
        </Text>

        {completedMountains.map((mountain) => (
          <View
            key={mountain.id}
            style={[
              styles.completedCard,
              { backgroundColor: themeColors.background },
            ]}
          >
            <View style={styles.completedInfo}>
              <Text style={[styles.completedName, { color: themeColors.text }]}>
                {mountain.mountainName}
              </Text>
              <LevelBadge level={mountain.mountainLevel} />
            </View>
            <Text
              style={[styles.completedDate, { color: themeColors.text + "80" }]}
            >
              완료일: {mountain.completedDate}
            </Text>
          </View>
        ))}
      </View>

      {/* 프로필 수정 모달 */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              프로필 수정
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                이름
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
                value={editingUserInfo.name}
                onChangeText={(text) =>
                  setEditingUserInfo({ ...editingUserInfo, name: text })
                }
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
                value={editingUserInfo.location}
                onChangeText={(text) =>
                  setEditingUserInfo({ ...editingUserInfo, location: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                나이
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
                value={editingUserInfo.age}
                onChangeText={(text) =>
                  setEditingUserInfo({ ...editingUserInfo, age: text })
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.tint || "#007AFF" },
                ]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  editButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  planCard: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  planImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  planDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  planDate: {
    fontSize: 12,
  },
  completedCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  completedName: {
    fontSize: 14,
    fontWeight: "600",
  },
  completedDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
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
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
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
