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

const CATEGORIES = [
  { key: 'touristSpotDTO', label: '관광지', icon: '🏞️', color: '#4CAF50' },
  { key: 'restaurantDTO', label: '맛집', icon: '🍽️', color: '#FF9800' },
  { key: 'cafeDTO', label: '관광시설', icon: '☕', color: '#2196F3' },
  { key: 'stayDTO', label: '숙박', icon: '🏨', color: '#9C27B0' },
];

export default function MountainTourismScreen() {
  const router = useRouter();
  const { mountainName, location, pageNo } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  
  const [selectedCategory, setSelectedCategory] = useState('touristSpotDTO');
  const [tourismData, setTourismData] = useState(null);
  const [currentData, setCurrentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(pageNo) || 1);

    // 여행 계획 큐 - 각 카테고리별로 선택된 장소들을 저장
  const [travelQueue, setTravelQueue] = useState({
    touristSpotDTO: null, // 첫 페이지는 "선택하지 않음"으로 고정
    restaurantDTO: null,
    cafeDTO: null,
    stayDTO: null,
  });

  useEffect(() => {
    loadInitialData();
  }, [location, mountainName]);

  useEffect(() => {
    // 카테고리 변경 시 해당 카테고리의 데이터로 업데이트
    if (tourismData && tourismData[selectedCategory]) {
      setCurrentData(tourismData[selectedCategory]);
      console.log(`${selectedCategory} 데이터:`, tourismData[selectedCategory]);
    }
  }, [selectedCategory, tourismData]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      console.log(`관광 정보 요청: location=${location}, pageNo=1`);
      const result = await tourismService.getTouristSpots(location, 1);
      
      console.log("API 응답 전체:", result);
      
      if (result.touristSpotDTO || result.restaurantDTO || result.cafeDTO || result.stayDTO) {
        setTourismData(result);
        console.log("설정된 관광 데이터:", result);
        
        // 각 카테고리별 데이터 확인
        CATEGORIES.forEach(category => {
          const categoryData = result[category.key];
          console.log(`${category.label} (${category.key}) 데이터:`, categoryData);
        });
      } else if (result.error) {
        Alert.alert("오류", result.error);
      }
    } catch (error) {
      Alert.alert("오류", "관광 정보를 불러오는데 실패했습니다.");
      console.error("관광 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [location, mountainName]);

  const getCategoryConfig = (categoryKey) => {
    return CATEGORIES.find(cat => cat.key === categoryKey) || CATEGORIES[0];
  };

  const togglePlaceSelection = (categoryKey, place) => {
    setTravelQueue(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey]?.name === place.name ? null : place
    }));
  };

    // 여행 계획 저장 함수
  const saveTravelPlan = () => {
    const selectedPlaces = Object.entries(travelQueue)
      .filter(([key, value]) => value !== null)
      .map(([key, value]) => ({
        category: CATEGORIES.find(cat => cat.key === key)?.label,
        place: value
      }));

    if (selectedPlaces.length === 0) {
      Alert.alert("알림", "최소 한 곳은 선택해주세요.");
      return;
    }

    console.log("저장된 여행 계획:", selectedPlaces);
    
    // s_navigation으로 이동하면서 선택된 정보 전달
    router.push({
      pathname: '/mountain-direction',
      params: {
        travelPlan: JSON.stringify(selectedPlaces),
        location: location,
        mountainName: mountainName
      }
    });
  };

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      {CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.key;
        return (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              {
                backgroundColor: isSelected ? category.color : 'transparent',
                borderColor: category.color,
                borderWidth: 1,
              }
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              { color: isSelected ? 'white' : category.color }
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /*const renderSpotCard = ({ item }) => {
    const categoryConfig = getCategoryConfig(selectedCategory);
    
    return (
      <TouchableOpacity
        style={[
          styles.spotCard,
          {
            backgroundColor: themeColors.card,
            borderColor: categoryConfig.color + '30',
            borderWidth: 1,
          },
        ]}
        onPress={() => {
          console.log(`${item.name} 클릭됨:`, item);
          // 여기에 상세 페이지 이동 로직 추가 가능
        }}
      >
        <View style={styles.spotImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.spotImage} />
          ) : (
            <View style={[styles.noImageContainer, { backgroundColor: categoryConfig.color + '20' }]}>
              <Text style={[styles.noImageText, { color: categoryConfig.color }]}>
                {categoryConfig.icon}
              </Text>
            </View>
          )}
          
          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}>
            <Text style={styles.categoryBadgeIcon}>{categoryConfig.icon}</Text>
          </View>
        </View>

        <View style={styles.spotInfo}>
          <Text style={[styles.spotName, { color: themeColors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={[styles.spotLocation, { color: themeColors.text }]} numberOfLines={3}>
            📍 {item.location}
          </Text>

          {item.mapX && item.mapY && (
            <View style={styles.coordinateContainer}>
              <Text style={[styles.coordinate, { color: categoryConfig.color }]}>
                📍 위도: {item.mapY.toFixed(4)}, 경도: {item.mapX.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };*/

    const renderPlaceCard = ({ item, index }) => {
    const categoryConfig = getCategoryConfig(selectedCategory);
    const isSelected = travelQueue[selectedCategory]?.name === item.name;
    const isFirstItem = index === 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.spotCard,
          {
            backgroundColor: themeColors.card,
            borderColor: isSelected ? categoryConfig.color : (categoryConfig.color + '30'),
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
        onPress={() => {
          if (isFirstItem) {
            // 첫 번째 아이템은 "선택하지 않음"
            setTravelQueue(prev => ({
              ...prev,
              [selectedCategory]: null
            }));
          } else {
            togglePlaceSelection(selectedCategory, item);
          }
          console.log(`${item.name} ${isSelected ? '해제됨' : '선택됨'}:`, item);
        }}
      >
        {isFirstItem && (
          <View style={styles.noSelectionOverlay}>
            <Text style={[styles.noSelectionText, { color: categoryConfig.color }]}>
              선택하지 않음
            </Text>
          </View>
        )}

        <View style={styles.spotImageContainer}>
          {item.imageUrl && !isFirstItem ? (
            <Image source={{ uri: item.imageUrl }} style={styles.spotImage} />
          ) : (
            <View style={[styles.noImageContainer, { backgroundColor: categoryConfig.color + '20' }]}>
              <Text style={[styles.noImageText, { color: categoryConfig.color }]}>
                {isFirstItem ? '❌' : categoryConfig.icon}
              </Text>
            </View>
          )}
          
          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}>
            <Text style={styles.categoryBadgeIcon}>
              {isFirstItem ? '❌' : categoryConfig.icon}
            </Text>
          </View>

          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: categoryConfig.color }]}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.spotInfo}>
          <Text style={[styles.spotName, { color: themeColors.text }]} numberOfLines={2}>
            {isFirstItem ? "선택하지 않음" : item.name}
          </Text>
          
          {!isFirstItem && (
            <Text style={[styles.spotLocation, { color: themeColors.text }]} numberOfLines={3}>
              📍 {item.location}
            </Text>
          )}

          {!isFirstItem && item.mapX && item.mapY && (
            <View style={styles.coordinateContainer}>
              <Text style={[styles.coordinate, { color: categoryConfig.color }]}>
                📍 위도: {item.mapY.toFixed(4)}, 경도: {item.mapX.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: "#0A5011" }]}>
      <Text style={styles.headerTitle}>
        {mountainName || "관광 정보"}
      </Text>
      <Text style={styles.headerSubtitle}>
        주변 관광 스팟 추천
      </Text>
    </View>
  );

    const renderSelectedSummary = () => {
    const selectedCount = Object.values(travelQueue).filter(place => place !== null).length;
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>선택된 장소: {selectedCount}개</Text>
        <View style={styles.summaryList}>
          {CATEGORIES.map(category => {
            const selectedPlace = travelQueue[category.key];
            return (
              <Text key={category.key} style={[styles.summaryItem, { color: category.color }]}>
                {category.icon} {category.label}: {selectedPlace ? selectedPlace.name : '선택하지 않음'}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: themeColors.text }]}>
        해당 카테고리의 정보가 없습니다.
      </Text>
    </View>
  );

    const getCurrentData = () => {
    const categoryData = tourismData?.[selectedCategory] || [];
    // 첫 번째에 "선택하지 않음" 옵션 추가
    return [{ name: "선택하지 않음", location: "", imageUrl: null }, ...categoryData];
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            관광 정보를 불러오는 중...
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={getCurrentData()}
            renderItem={renderPlaceCard}
            keyExtractor={(item, index) => `${selectedCategory}-${index}`}
            ListHeaderComponent={() => (
              <>
                {renderHeader()}
                {renderCategoryTabs()}
                {renderSelectedSummary()}
              </>
            )}
            ListEmptyComponent={renderEmptyComponent}
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

          {/* 여행 계획 저장 버튼 */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveTravelPlan}
            >
              <Text style={styles.saveButtonText}>
                🗺️ 여행 계획 저장하기
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    opacity: 0.9,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: 'space-around',
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryList: {
    gap: 5,
  },
  summaryItem: {
    fontSize: 14,
    fontWeight: '500',
  },
  flatListContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  spotCard: {
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  noSelectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderRadius: 15,
  },
  noSelectionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spotImageContainer: {
    position: "relative",
    height: 200,
  },
  spotImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 0,
    fontSize: 40,
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
  categoryBadgeIcon: {
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
    marginBottom: 8,
  },
  spotLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 20,
  },
  coordinateContainer: {
    marginTop: 5,
  },
  coordinate: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#0A5011',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});