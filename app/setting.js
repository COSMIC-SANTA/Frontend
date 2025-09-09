import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { planService } from "../services/api.js";
import BottomNavBar from "./s_navigationbar";

export default function SettingScreen() {
  const router = useRouter();
  const [nickName, setNickName] = useState("");
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const openPlanModal = (plan) => {
    setSelectedPlan(plan);
    setIsPlanModalVisible(true);
  };
  const closePlanModal = () => {
    setIsPlanModalVisible(false);
    setSelectedPlan(null);
  };
  const fmtDate = (iso) => {
    if (!iso) return "미정";
    try {
      // "2025-09-24T00:00:00" → "2025-09-24"
      return String(iso).split("T")[0];
    } catch {
      return String(iso);
    }
  };
  const firstN = (arr, n = 3) => (Array.isArray(arr) ? arr.slice(0, n) : []);

  const [currentPlans, setCurrentPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [completedMountains, setCompletedMountains] = useState([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const loadNickName = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem("nickName");
      if (v) setNickName(v);
    } catch (e) {
      // noop
    }
  }, []);

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
  useEffect(() => {
    loadAllPlans();
    loadNickName();
  }, [loadAllPlans, loadNickName]); // 2) 화면에 포커스될 때마다 새로고침(= 리프레시)
  useFocusEffect(
    useCallback(() => {
      loadAllPlans();
      loadNickName();
    }, [loadAllPlans, loadNickName])
  );

  const handleCompletePlan = async (planId) => {
    Alert.alert("계획 완료", "이 등산 계획을 완료 처리하시겠습니까?", [
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
                planService.loadCompletedPlan(),
              ]);

              // 현재 계획 업데이트
              if (currentResponse?.data) {
                setCurrentPlans(
                  Array.isArray(currentResponse.data)
                    ? currentResponse.data
                    : [currentResponse.data]
                );
              }

              // 완료된 계획 업데이트
              if (completedResponse?.data) {
                setCompletedMountains(
                  Array.isArray(completedResponse.data)
                    ? completedResponse.data
                    : [completedResponse.data]
                );
              }
            } else {
              Alert.alert(
                "오류",
                result.error || "계획 완료 처리에 실패했습니다."
              );
            }
          } catch (error) {
            console.error("계획 완료 처리 오류:", error);
            Alert.alert("오류", "계획 완료 처리 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
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
      ]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );

  const LevelBadge = ({ level }) => (
    <View
      style={[styles.levelBadge, { backgroundColor: getLevelColor(level) }]}>
      <Text style={styles.levelText}>{level}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView style={[styles.container, { backgroundColor: "#325A2A" }]}>
        {/* 상단 프로필 섹션 */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingHello}>안녕하세요,</Text>
          <Text style={styles.greetingName}>{nickName || "하이커"}님</Text>
          <Text style={styles.greetingSub}>오늘도 안전한 산행 되세요 ⛰️</Text>
        </View>
        {/* 중간 계획 섹션 */}
        <View
          style={[styles.planSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            등산 계획
          </Text>

          {isLoadingPlans ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeColors.tint || "#007AFF"}
              />
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                계획을 불러오는 중...
              </Text>
            </View>
          ) : (
            <>
              {currentPlans.length > 0 ? (
                currentPlans.map((plan, index) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    key={plan?.planId}
                    style={[
                      styles.planCard,
                      { backgroundColor: themeColors.background },
                    ]}
                    onPress={() => openPlanModal(plan)}>
                    <View style={styles.planInfo}>
                      <View style={{ flexShrink: 1 }}>
                        <Text
                          style={[
                            styles.planName,
                            { color: themeColors.text },
                          ]}>
                          {plan?.mountainDTO?.name}
                        </Text>
                        <Text
                          style={[
                            styles.planDate,
                            { color: themeColors.text + "80" },
                          ]}>
                          계획일: {fmtDate(plan?.targetDate)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleCompletePlan(plan?.planId);
                        }}
                        style={styles.completeButton}>
                        <Text style={styles.completeButtonText}>완료</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeColors.text + "60" },
                  ]}>
                  현재 계획된 등산이 없습니다.
                </Text>
              )}
            </>
          )}
        </View>

        {/* 하단 완료 섹션 */}
        <View
          style={[
            styles.completedSection,
            { backgroundColor: themeColors.card },
          ]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            등산 완료 기록
          </Text>

          {isLoadingCompleted ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={themeColors.tint || "#007AFF"}
              />
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
                    ]}>
                    <View style={styles.completedInfo}>
                      <Text
                        style={[
                          styles.completedName,
                          { color: themeColors.text },
                        ]}>
                        {mountain?.mountainDTO?.name || "산 이름 미정"}
                      </Text>
                      <StatusBadge status="완료" />
                    </View>
                    <Text
                      style={[
                        styles.completedDate,
                        { color: themeColors.text + "80" },
                      ]}>
                      계획일: {mountain?.targetDate || "미정"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeColors.text + "60" },
                  ]}>
                  완료된 등산 기록이 없습니다.
                </Text>
              )}
            </>
          )}
        </View>

        {/* 계획 요약 모달 */}
        <Modal
          animationType="fade"
          transparent
          visible={isPlanModalVisible}
          onRequestClose={closePlanModal}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.card },
              ]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                🗓️ 여행 계획 요약
              </Text>

              {/* 산 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>🏔️</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    산
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: themeColors.text }]}>
                    {selectedPlan?.mountainDTO?.name || "미정"}
                  </Text>
                </View>
              </View>

              {/* 계획일 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>📅</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    계획일
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: themeColors.text }]}>
                    {fmtDate(selectedPlan?.targetDate)}
                  </Text>
                </View>
              </View>

              {/* 관광지 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>🏞️</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    관광지
                  </Text>
                  {firstN(selectedPlan?.spotDTOS).length ? (
                    firstN(selectedPlan?.spotDTOS).map((s, i) => (
                      <Text
                        key={`spot-${i}`}
                        style={[
                          styles.summaryValue,
                          { color: themeColors.text },
                        ]}>
                        • {s?.name} ({s?.location})
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.summaryEmpty,
                        { color: themeColors.text + "80" },
                      ]}>
                      항목 없음
                    </Text>
                  )}
                </View>
              </View>

              {/* 카페/관광시설 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>☕</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    카페·관광시설
                  </Text>
                  {firstN(selectedPlan?.cafeDTOS).length ? (
                    firstN(selectedPlan?.cafeDTOS).map((c, i) => (
                      <Text
                        key={`cafe-${i}`}
                        style={[
                          styles.summaryValue,
                          { color: themeColors.text },
                        ]}>
                        • {c?.name} ({c?.location})
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.summaryEmpty,
                        { color: themeColors.text + "80" },
                      ]}>
                      항목 없음
                    </Text>
                  )}
                </View>
              </View>

              {/* 식당 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>🍽️</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    식당
                  </Text>
                  {firstN(selectedPlan?.restaurantDTOS).length ? (
                    firstN(selectedPlan?.restaurantDTOS).map((r, i) => (
                      <Text
                        key={`rest-${i}`}
                        style={[
                          styles.summaryValue,
                          { color: themeColors.text },
                        ]}>
                        • {r?.name} ({r?.location})
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.summaryEmpty,
                        { color: themeColors.text + "80" },
                      ]}>
                      항목 없음
                    </Text>
                  )}
                </View>
              </View>

              {/* 숙소 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>🏨</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.summaryLabel, { color: themeColors.text }]}>
                    숙소
                  </Text>
                  {firstN(selectedPlan?.stayDTOS).length ? (
                    firstN(selectedPlan?.stayDTOS).map((h, i) => (
                      <Text
                        key={`stay-${i}`}
                        style={[
                          styles.summaryValue,
                          { color: themeColors.text },
                        ]}>
                        • {h?.name} ({h?.location})
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.summaryEmpty,
                        { color: themeColors.text + "80" },
                      ]}>
                      항목 없음
                    </Text>
                  )}
                </View>
              </View>

              {/* 버튼들 */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={closePlanModal}
                  style={[styles.modalButton, styles.cancelButton]}>
                  <Text style={styles.cancelButtonText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  summaryEmoji: {
    fontSize: 20,
    width: 24,
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryEmpty: {
    fontSize: 13,
    fontStyle: "italic",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  completeButton: {
    marginLeft: "auto", // ← 최우측 정렬
    alignSelf: "center", // ← 세로 중앙
    backgroundColor: "#0A5011",
    paddingVertical: 12, // ← 크기 키움
    paddingHorizontal: 18, // ← 크기 키움
    borderRadius: 12,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  //프로필
  greetingCard: {
    marginTop: 70,
    marginBottom: 16,
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.08)", // 초록 배경 위에 은은한 카드
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderRadius: 16,
    // 살짝 입체감
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  greetingHello: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginBottom: 2,
  },
  greetingName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  greetingSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 6,
  },
});
