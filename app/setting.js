import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { planService } from "../services/api.js";
import BottomNavBar from "./s_navigationbar";

export default function SettingScreen() {
  const router = useRouter();

  const [currentPlans, setCurrentPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [completedMountains, setCompletedMountains] = useState([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState([true]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const loadAllPlans = useCallback(async () => {
      try {
        setIsLoadingPlans(true);
        setIsLoadingCompleted(true);
        
        // 현재 계획 로드
        const loadUserPlans = async () => {
          try {
            console.log("계획 불러오기 시작...");
            const response = await planService.loadPlan();
            console.log("계획 불러오기 응답:", response);

            if (response?.data) {
              if (Array.isArray(response.data)) {
                setCurrentPlans(response.data);
              } else {
                setCurrentPlans([response.data]);
              }
            } else {
              setCurrentPlans([]);
            }
          } catch (error) {
            console.error("계획 불러오기 실패:", error);
            setCurrentPlans([]);
            Alert.alert("알림", "등산 계획을 불러오는데 실패했습니다.");
          } finally {
            setIsLoadingPlans(false);
          }
        };

        // ✅ 완료된 계획 로드 함수 추가
        const loadCompletedPlans = async () => {
          try {
            console.log("완료된 계획 불러오기 시작...");
            const response = await planService.loadCompletedPlan();
            console.log("완료된 계획 불러오기 응답:", response);

            if (response?.data) {
              if (Array.isArray(response.data)) {
                setCompletedMountains(response.data);
              } else {
                setCompletedMountains([response.data]);
              }
            } else {
              setCompletedMountains([]);
            }
          } catch (error) {
            console.error("완료된 계획 불러오기 실패:", error);
            setCompletedMountains([]);
            // 완료된 계획은 선택사항이므로 에러 알림은 표시하지 않음
          } finally {
            setIsLoadingCompleted(false);
          }
        };

        // 두 함수를 병렬로 실행
        await Promise.all([loadUserPlans(), loadCompletedPlans()]);

      } catch (error) {
        console.error("전체 계획 로드 실패:", error);
        setIsLoadingPlans(false);
        setIsLoadingCompleted(false);
      }
  }, []);

  // 1) 최초 마운트
  useEffect(() => { loadAllPlans(); }, [loadAllPlans]);
  // 2) 화면에 포커스될 때마다 새로고침(= 리프레시)
  useFocusEffect(useCallback(() => {
    loadAllPlans();
  }, [loadAllPlans]));

    const handleCompletePlan = async (planId) => {
    Alert.alert(
      "계획 완료",
      "이 등산 계획을 완료 처리하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "완료",
          onPress: async () => {
            try {
              console.log(`계획 완료 처리 시작: ${planId}`);
              
              const result = await planService.completePlan(planId);
              
              if (result.success) {
                Alert.alert("성공", "계획이 완료되었습니다!");
                
                // 완료 후 목록 새로고침
                const [currentResponse, completedResponse] = await Promise.all([
                  planService.loadPlan(),
                  planService.loadCompletedPlan()
                ]);
                
                // 현재 계획 업데이트
                if (currentResponse?.data) {
                  setCurrentPlans(Array.isArray(currentResponse.data) ? currentResponse.data : [currentResponse.data]);
                }
                
                // 완료된 계획 업데이트
                if (completedResponse?.data) {
                  setCompletedMountains(Array.isArray(completedResponse.data) ? completedResponse.data : [completedResponse.data]);
                }
              } else {
                Alert.alert("오류", result.error || "계획 완료 처리에 실패했습니다.");
              }
            } catch (error) {
              console.error("계획 완료 처리 오류:", error);
              Alert.alert("오류", "계획 완료 처리 중 문제가 발생했습니다.");
            }
          }
        }
      ]
    );
  };

    const handleNavigation = (screen) => {
    router.push(`/${screen}`);
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
    <View style={styles.wrapper}>
    <ScrollView style={[styles.container, { backgroundColor: "#325A2A" }]}>
      {/* 상단 프로필 섹션 */}

      {/* 중간 계획 섹션 */}
      <View style={[styles.planSection, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          등산 계획
        </Text>
        
        {isLoadingPlans ? (<View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint || "#007AFF"} />
          <Text style={[styles.loadingText, {color: themeColors.text}]}>
            계획을 불러오는 중...
          </Text>
        </View>) : (
        <>
        {currentPlans.length > 0 ? (
          currentPlans.map((plan, index) => (
            <View
              key={plan?.planId}
              style={[
                styles.planCard,
                { backgroundColor: themeColors.background },
              ]}
            >
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: themeColors.text }]}>
                  {plan?.mountainDTO?.name}
                </Text>
                <Text
                  style={[styles.planDate, { color: themeColors.text + "80" }]}
                >
                  계획일: {plan?.targetDate}
                </Text>
                <View style={styles.completeButton}>
                <TouchableOpacity
                onPress={()=>handleCompletePlan(plan?.planId)}
                >
                  <Text style={styles.completeButtonText}>완료</Text>
                </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: themeColors.text + "60" }]}>
            현재 계획된 등산이 없습니다.
          </Text>
        )}
        </>
        )}
      </View>

      {/* 하단 완료 섹션 */}
      <View
        style={[styles.completedSection, { backgroundColor: themeColors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          등산 완료 기록
        </Text>

        {isLoadingCompleted ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColors.tint || "#007AFF"} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              완료 기록을 불러오는 중...
            </Text>
          </View>
        ) : (
          <>
            {completedMountains.length > 0 ? (
              completedMountains.map((mountain, index) => (
                <View
                  key={mountain?.planId || `completed-${index}`}
                  style={[
                    styles.completedCard,
                    { backgroundColor: themeColors.background },
                  ]}
                >
                  <View style={styles.completedInfo}>
                    <Text style={[styles.completedName, { color: themeColors.text }]}>
                      {mountain?.mountainDTO?.name || "산 이름 미정"}
                    </Text>
                    <StatusBadge status="완료" />
                  </View>
                  <Text
                    style={[styles.completedDate, { color: themeColors.text + "80" }]}
                  >
                    계획일: {mountain?.targetDate || "미정"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: themeColors.text + "60" }]}>
                완료된 등산 기록이 없습니다.
              </Text>
            )}
          </>
        )}
      </View>


      {/* 프로필 수정 모달 */}  
    </ScrollView>
    <BottomNavBar onNavigate={handleNavigation} />
    </View>
  );
}

const styles = StyleSheet.create({
    wrapper: {
    flex: 1,
  },
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

  // 여행 계획 완료 버튼 스타일
    loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
