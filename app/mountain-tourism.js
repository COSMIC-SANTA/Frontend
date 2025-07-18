import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { tourismService } from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MountainTourismScreen() {
  const router = useRouter();
  const { mountainId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [tourismData, setTourismData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 선택된 산에 따라 다른 JSON 파일 로드
        const data = await tourismService.getTouristSpots(mountainId);
        setTourismData(data);
      } catch (error) {
        Alert.alert("오류", "관광 정보를 불러오는데 실패했습니다.");
        console.error("관광 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mountainId]);

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

  const getCategoryColor = (category) => {
    switch (category) {
      case "tourist_spot":
        return "#4CAF50";
      case "restaurant":
        return "#FF9800";
      case "cafe":
        return "#2196F3";
      case "hotel":
        return "#9C27B0";
      default:
        return themeColors.tint;
    }
  };

  const toggleSpotSelection = (spot) => {
    setSelectedSpots((prev) => {
      const isSelected = prev.find((s) => s.id === spot.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== spot.id);
      } else {
        return [...prev, spot];
      }
    });
  };

  const navigateToDirection = () => {
    if (selectedSpots.length === 0) {
      Alert.alert("알림", "먼저 방문할 스팟을 선택해주세요.");
      return;
    }
    router.push("/mountain-direction");
  };

  const navigateToOptimalRoute = () => {
    if (selectedSpots.length < 2) {
      Alert.alert("알림", "최적 경로를 위해 2개 이상의 스팟을 선택해주세요.");
      return;
    }
    router.push("/optimal-route");
  };

  const renderSpotCard = (spot) => {
    const isSelected = selectedSpots.find((s) => s.id === spot.id);
    const categoryColor = getCategoryColor(spot.category);

    return (
      <TouchableOpacity
        key={spot.id}
        style={[
          styles.spotCard,
          {
            backgroundColor: themeColors.card,
            borderColor: isSelected ? categoryColor : themeColors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => toggleSpotSelection(spot)}
      >
        <View style={styles.spotImageContainer}>
          <Image source={{ uri: spot.image }} style={styles.spotImage} />
          <View
            style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
          >
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(spot.category)}
            </Text>
          </View>
          {isSelected && (
            <View
              style={[styles.selectedBadge, { backgroundColor: categoryColor }]}
            >
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.spotInfo}>
          <Text style={[styles.spotName, { color: themeColors.text }]}>
            {spot.name}
          </Text>
          <Text style={[styles.spotDescription, { color: themeColors.text }]}>
            {spot.description}
          </Text>

          <View style={styles.spotDetails}>
            <Text style={[styles.distance, { color: categoryColor }]}>
              📍 {spot.distance}
            </Text>
            <Text style={[styles.rating, { color: themeColors.text }]}>
              ⭐ {spot.rating}
            </Text>
          </View>

          <View style={styles.tagsContainer}>
            {spot.tags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: categoryColor + "20" }]}
              >
                <Text style={[styles.tagText, { color: categoryColor }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#4CAF50" }]}>
        <Text style={styles.headerTitle}>
          🏔️ {tourismData?.mountain?.name || "지리산"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {tourismData?.mountain?.description || "산 주변 관광 스팟 추천"}
        </Text>
      </View>

      {/* 로딩 상태 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            관광 정보를 불러오는 중...
          </Text>
        </View>
      ) : (
        <>
          {/* 선택된 스팟 카운터 */}
          <View
            style={[
              styles.counterContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            <Text style={[styles.counterText, { color: themeColors.text }]}>
              선택된 스팟: {selectedSpots.length}개
            </Text>
          </View>

          {/* 관광 스팟 리스트 */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.spotsContainer}>
              {tourismData?.touristSpots?.map(renderSpotCard)}
            </View>
          </ScrollView>

          {/* 하단 액션 버튼들 */}
          <View
            style={[
              styles.actionContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
              onPress={navigateToDirection}
            >
              <Text style={styles.actionButtonText}>
                🗺️ 산으로 가는 길 안내
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
              onPress={navigateToOptimalRoute}
            >
              <Text style={styles.actionButtonText}>
                🎯 최적의 여행 코스 제공
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    opacity: 0.9,
  },
  counterContainer: {
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  counterText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  spotsContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  spotCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spotImageContainer: {
    position: "relative",
  },
  spotImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 20,
  },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  spotInfo: {
    padding: 15,
  },
  spotName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  spotDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
  },
  spotDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  distance: {
    fontSize: 14,
    fontWeight: "600",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
