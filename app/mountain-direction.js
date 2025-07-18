import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MountainDirectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedRoute, setSelectedRoute] = useState(null);

  const routes = [
    {
      id: 1,
      duration: "2h 3.6km",
      cost: "245,050원",
      type: "taxi",
      description: "가장 빠른 경로",
      steps: [
        "출발지에서 택시 이용",
        "지리산 국립공원 입구까지",
        "도보로 등산로 진입",
      ],
    },
    {
      id: 2,
      duration: "3h 08분",
      cost: "256,050원",
      type: "public",
      description: "대중교통 이용",
      steps: [
        "지하철 → 버스 환승",
        "지리산 셔틀버스 이용",
        "등산로 입구까지 도보",
      ],
    },
  ];

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
  };

  const handleStartNavigation = () => {
    if (!selectedRoute) {
      alert("경로를 선택해주세요.");
      return;
    }
    // 실제 네비게이션 앱 연동 또는 내부 네비게이션 시작
    alert(
      `${
        selectedRoute.type === "taxi" ? "택시" : "대중교통"
      } 경로로 안내를 시작합니다.`
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#4CAF50" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧭 산길 동행</Text>
      </View>

      {/* 목적지 정보 */}
      <View
        style={[
          styles.destinationContainer,
          { backgroundColor: themeColors.card },
        ]}
      >
        <Text style={[styles.destinationTitle, { color: themeColors.text }]}>
          📍 선택한 산으로 가는 길 안내
        </Text>
        <Text style={[styles.destinationSubtitle, { color: themeColors.text }]}>
          사용자가 현재 위치하고 있는 장소에서부터 목적지인 산까지 이동하는
          최적의 경로를 안내해주는 네비게이션
        </Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <View
          style={[styles.mapPlaceholder, { backgroundColor: themeColors.card }]}
        >
          <Image
            source={{
              uri: "https://via.placeholder.com/400x300/4CAF50/white?text=지리산+경로+지도",
            }}
            style={styles.mapImage}
          />
          <View style={styles.mapOverlay}>
            <Text style={styles.mapTime}>🕐 2시간 34분</Text>
          </View>
        </View>
      </View>

      {/* 경로 선택 */}
      <ScrollView style={styles.routesContainer}>
        <Text style={[styles.routesTitle, { color: themeColors.text }]}>
          경로 선택
        </Text>

        {routes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.routeCard,
              {
                backgroundColor: themeColors.card,
                borderColor:
                  selectedRoute?.id === route.id
                    ? "#4CAF50"
                    : themeColors.border,
                borderWidth: selectedRoute?.id === route.id ? 2 : 1,
              },
            ]}
            onPress={() => handleRouteSelect(route)}
          >
            <View style={styles.routeHeader}>
              <Text style={[styles.routeDuration, { color: themeColors.text }]}>
                {route.duration}
              </Text>
              <Text style={[styles.routeCost, { color: "#4CAF50" }]}>
                {route.cost}
              </Text>
            </View>

            <Text
              style={[styles.routeDescription, { color: themeColors.text }]}
            >
              {route.description}
            </Text>

            <View style={styles.stepsContainer}>
              {route.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View
                    style={[styles.stepDot, { backgroundColor: "#4CAF50" }]}
                  />
                  <Text style={[styles.stepText, { color: themeColors.text }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            {selectedRoute?.id === route.id && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedText}>✓ 선택됨</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View
        style={[styles.actionContainer, { backgroundColor: themeColors.card }]}
      >
        <TouchableOpacity
          style={[styles.laterButton, { borderColor: themeColors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.laterButtonText, { color: themeColors.text }]}>
            나중에
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: selectedRoute ? "#4CAF50" : "#ccc",
              opacity: selectedRoute ? 1 : 0.5,
            },
          ]}
          onPress={handleStartNavigation}
          disabled={!selectedRoute}
        >
          <Text style={styles.startButtonText}>🚀 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  destinationContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  destinationSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  mapContainer: {
    margin: 15,
    height: 250,
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mapOverlay: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapTime: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  routesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  routesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  routeCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    position: "relative",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: "bold",
  },
  routeCost: {
    fontSize: 16,
    fontWeight: "600",
  },
  routeDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
  },
  stepsContainer: {
    paddingLeft: 10,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  selectedIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  startButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
