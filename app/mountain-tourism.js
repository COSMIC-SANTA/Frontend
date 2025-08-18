import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { tourismService } from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function MountainTourismScreen() {
  const router = useRouter();
  const { location, pageNo } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [tourismData, setTourismData] = useState(null);
  const [touristSpots, setTouristSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 상태
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(pageNo) || 1);
  const [hasMoreData, setHasMoreData] = useState(true); // 더 불러올 데이터가 있는지

  useEffect(() => {
    loadInitialData();
  }, [location]);

  const loadInitialData = async () => {
      try {
        setLoading(true);
        setCurrentPage(1);
        // 선택된 산에 따라 다른 JSON 파일 로드
        const result = await tourismService.getTouristSpots(location, 1);

        if (result.success) {
          setTourismData(result.data);
          setTouristSpots(result.data?.touristSpots || []);
          setHasMoreData((result.data?.touristSpots || []).length > 0);
        } else {
          Alert.alert("오류", result.error);
        }
      } catch (error) {
        Alert.alert("오류", "관광 정보를 불러오는데 실패했습니다.");
        console.error("관광 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadMoreData = async () => {
      if (loadingMore || !hasMoreData) return;

      try {
        setLoadingMore(true);
        const nextPage = currentPage + 1;
        const result = await tourismService.getTouristSpots(location, nextPage);

        if (result.success) {
          const newSpots = result.data?.touristSpots || [];
          if (newSpots.length > 0) {
            setTouristSpots(prev => [...prev, ...newSpots]);
            setCurrentPage(nextPage);
          } else {
            setHasMoreData(false); // 더 이상 데이터가 없음
          }
        } else {
          Alert.alert("오류", result.error);
        }
      } catch (error) {
        console.error("추가 데이터 로드 실패:", error);
      } finally {
        setLoadingMore(false);
      }
    };

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      setHasMoreData(true);
      await loadInitialData();
      setRefreshing(false);
    }, [location]);

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

  const renderSpotCard = ({item: spot}) => {
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

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0A5011" />
        <Text style={[styles.footerText, {color: themeColors.text}]}>
          관광정보 가져오는 중...
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, {backgroundColor: "#0A5011"}]}>
      <Text style={styles.headerTitle}>
        {tourismData?.mountain?.name || location}
      </Text>
      <Text style={styles.headerSubtitle}>
        {tourismData?.mountain?.description || "산 주변 관광 스팟 추천"}
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
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
          {/* FlatList로 페이지네이션 구현 */}
          <FlatList
            data={touristSpots}
            renderItem={renderSpotCard}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
          />

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
  flatListContent: {
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 10,
    fontSize: 14,
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
