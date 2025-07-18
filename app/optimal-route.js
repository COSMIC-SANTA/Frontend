import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OptimalRouteScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // 예시 선택된 스팟들과 최적 경로
  const selectedSpots = [
    { id: 1, name: "불일폭포", distance: "20km", category: "tourist_spot" },
    {
      id: 2,
      name: "산채비빔밥 전문점",
      distance: "25km",
      category: "restaurant",
    },
    { id: 3, name: "산속마을 카페", distance: "36km", category: "cafe" },
    { id: 4, name: "지리산전통마을펜션", distance: "46km", category: "hotel" },
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case "tourist_spot":
        return "🏞️";
      case "restaurant":
        return "🍽️";
      case "cafe":
        return "☕";
      case "hotel":
        return "🏨";
      default:
        return "📍";
    }
  };

  const handleStartRoute = () => {
    alert("최적 경로 안내를 시작합니다!");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#2196F3" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 최적 여행 코스</Text>
      </View>

      {/* 설명 */}
      <View
        style={[
          styles.descriptionContainer,
          { backgroundColor: themeColors.card },
        ]}
      >
        <Text style={[styles.descriptionTitle, { color: themeColors.text }]}>
          # 선택 스팟들의 최적 여행 코스 및 경로 제공
        </Text>
        <Text style={[styles.descriptionText, { color: themeColors.text }]}>
          이동 거리, 방문 장소의 특성을 종합하여 가장 효율적인 이동 순서와
          경로를 제시
        </Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <View
          style={[styles.mapPlaceholder, { backgroundColor: themeColors.card }]}
        >
          <Image
            source={{
              uri: "https://via.placeholder.com/400x250/2196F3/white?text=최적+경로+지도",
            }}
            style={styles.mapImage}
          />
        </View>
      </View>

      {/* 경로 리스트 */}
      <ScrollView style={styles.routeContainer}>
        <Text style={[styles.routeTitle, { color: themeColors.text }]}>
          🗺️ 추천 방문 순서
        </Text>

        {selectedSpots.map((spot, index) => (
          <View key={spot.id} style={styles.routeItem}>
            <View style={styles.routeItemLeft}>
              <View style={[styles.stepNumber, { backgroundColor: "#2196F3" }]}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>

              {index < selectedSpots.length - 1 && (
                <View
                  style={[styles.connector, { backgroundColor: "#2196F3" }]}
                />
              )}
            </View>

            <View
              style={[
                styles.routeItemContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              <View style={styles.routeItemHeader}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(spot.category)}
                </Text>
                <Text style={[styles.spotName, { color: themeColors.text }]}>
                  {spot.name}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { borderColor: themeColors.border },
                  ]}
                >
                  <Text
                    style={[styles.editButtonText, { color: themeColors.text }]}
                  >
                    수정
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.spotDistance, { color: "#2196F3" }]}>
                📍 {spot.distance}
              </Text>
            </View>
          </View>
        ))}

        {/* 최종 도착지 */}
        <View style={styles.routeItem}>
          <View style={styles.routeItemLeft}>
            <View style={[styles.stepNumber, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.stepNumberText}>🏁</Text>
            </View>
          </View>

          <View
            style={[
              styles.routeItemContent,
              { backgroundColor: themeColors.card },
            ]}
          >
            <View style={styles.routeItemHeader}>
              <Text style={styles.categoryIcon}>🏔️</Text>
              <Text style={[styles.spotName, { color: themeColors.text }]}>
                지리산 정상
              </Text>
            </View>
            <Text style={[styles.spotDistance, { color: "#4CAF50" }]}>
              최종 목적지 도착
            </Text>
          </View>
        </View>
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
            ⏰ Later
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: "#2196F3" }]}
          onPress={handleStartRoute}
        >
          <Text style={styles.startButtonText}>🚀 Start</Text>
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
  descriptionContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  mapContainer: {
    margin: 15,
    height: 200,
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  routeContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: "row",
    marginBottom: 15,
    minHeight: 80,
  },
  routeItemLeft: {
    alignItems: "center",
    marginRight: 15,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  connector: {
    position: "absolute",
    top: 40,
    width: 2,
    height: 60,
    zIndex: 1,
  },
  routeItemContent: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
  },
  routeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  spotDistance: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 30,
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
