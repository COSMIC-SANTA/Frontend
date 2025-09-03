import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import { tourismService } from "../services/api.js";

export default function MountainDirectionScreen() {
  const router = useRouter();
  const { travelPlan, location } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [parsedTravelPlan, setParsedTravelPlan] = useState([]);
  const [optimalRouteData, setOptimalRouteData] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  useEffect(() => {
    // 전달받은 여행계획 파싱
    try {
      if (travelPlan) {
        const parsed = JSON.parse(travelPlan);
        setParsedTravelPlan(parsed);
        console.log("파싱된 여행계획:", parsed);
      }
    } catch (error) {
      console.error("여행계획 파싱 실패:", error);
    }

    getCurrentLocation();
  }, [travelPlan]);

  // 수정된 useEffect: selectedDestination이 선택된 경우에만 API 요청
  useEffect(() => {
    if (currentLocation && parsedTravelPlan.length > 0 && selectedDestination) {
      console.log("모든 조건이 준비됨 - API 요청 실행");
      requestOptimalRoute();
      console.log("카카오 Directions API 호출 실행");
    fetchKakaoRoute(currentLocation, selectedDestination).then((route) => {
      if (route) {
        setSelectedRoute(route); // state에 저장
      }
    });
    }
  }, [currentLocation, parsedTravelPlan, selectedDestination]);

  const routes = [
    {
      id: 1,
      duration: "2h 3.6km",
      cost: "245,050원",
      type: "taxi",
      description: "가장 빠른 경로",
      steps: [
        "출발지에서 택시 이용",
        "목적지까지 직행",
        "도보로 최종 목적지 도착",
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
        "대중교통으로 목적지 이동",
        "도보로 최종 목적지 도착",
      ],
    },
  ];

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("알림", "위치 권한이 필요합니다.");
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({});
      const coords = {
        mapX: locationResult.coords.longitude,
        mapY: locationResult.coords.latitude
      };

      setCurrentLocation(coords);
      console.log("현재 위치:", coords);
    } catch (error) {
      console.error("위치 가져오기 실패:", error);
      Alert.alert("오류", "현재 위치를 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 카테고리/기존 type 값을 표준 type으로 정규화
  const mapCategoryToType = (categoryOrType, optionId) => {
    if (optionId === 'mountain') return 'mountain';
    switch (categoryOrType) {
      case '관광지': return 'spot';
      case '맛집': return 'restaurant';
      case '관광시설': return 'cafe';
      case '숙박': return 'stay';
      case 'mountain': return 'mountain';
      default:
        console.warn('알 수 없는 카테고리/타입:', categoryOrType, '→ 기본값 spot');
        return 'spot';
    }
  };

  // 가능한 목적지 목록 생성 (산 + 선택된 장소들)
  const getDestinationOptions = () => {
    const options = [];

    // 산을 첫 번째 옵션으로 추가
    options.push({
      id: 'mountain',
      type: 'mountain',
      category: '산',
      name: location || '목적지 산',
      location: location || '산 위치',
      icon: '🏔️',
      color: '#4CAF50'
    });

    // 선택된 여행 장소들 추가
    parsedTravelPlan.forEach((item, index) => {
      options.push({
        id: `place_${index}`,
        type: mapCategoryToType(item.category),
        category: item.category,
        name: item.place.name,
        location: item.place.location,
        mapX: item.place.mapX,
        mapY: item.place.mapY,
        icon: (() => {
          switch (item.category) {
            case "관광지": return "🏞️";
            case "맛집": return "🍽️";
            case "카페":
            case "관광시설": return "☕";
            case "숙박": return "🏨";
            default: return "📍";
          }
        })(),
        color: (() => {
          switch (item.category) {
            case "관광지": return "#4CAF50";
            case "맛집": return "#FF9800";
            case "카페":
            case "관광시설": return "#2196F3";
            case "숙박": return "#9C27B0";
            default: return "#666";
          }
        })()
      });
    });

    return options;
  };

  const formatRouteData = () => {
    if (!currentLocation || parsedTravelPlan.length === 0 || !selectedDestination) {
      console.log("데이터 부족:", {
        currentLocation: !!currentLocation,
        parsedTravelPlan: parsedTravelPlan.length,
        selectedDestination: !!selectedDestination
      });
      return null;
    }

    // 카테고리별 분류
    const categorizedData = {
      tourist_spots: [],
      restaurants: [],
      facility: [],
      stay: []
    };

    const destination = {
      name: selectedDestination.name,
      location: selectedDestination.location,
      // 선택된 옵션의 type(있다면) 또는 category를 받아 표준화. 산일 경우 mountain으로 강제.
      type: mapCategoryToType(
          selectedDestination.type ?? selectedDestination.category,
          selectedDestination.id
      ),
    };

    if (selectedDestination.mapX != null && selectedDestination.mapY != null) {
      destination.mapX = selectedDestination.mapX;
      destination.mapY = selectedDestination.mapY;
    }

    parsedTravelPlan.forEach((item) => {
      if (selectedDestination.name === item.place.name) {
        console.log("목적지로 선택된 장소 제외:", item.place.name);
        return;
      }

      const position = {
        mapX: item.place.mapX,
        mapY: item.place.mapY,}

      const placeData = {
        name: item.place.name,
        location: item.place.location,
        position: position,
        type: mapCategoryToType(item.category) // FIX: place.category → item.category, 표준화
      };

      switch (item.category) {
        case "관광지":
          placeData.type="spot"
          categorizedData.tourist_spots.push(placeData);
          break;
        case "맛집":
          placeData.type="restaurant"
          categorizedData.restaurants.push(placeData);
          break;
        case "관광시설":
          placeData.type="cafe"
          categorizedData.facility.push(placeData);
          break;
        case "숙박":
          placeData.type="stay"
          categorizedData.stay.push(placeData);
          break;
        default:
          console.warn("알 수 없는 카테고리:", item.category);
      }
    });

    // ✅ 빈 배열은 null 로 변환
    const normalize = (arr) => (arr.length > 0 ? arr : null);

    let routeData = {
      origin: currentLocation,
      destination,
      tourist_spots: normalize(categorizedData.tourist_spots),
      restaurants: normalize(categorizedData.restaurants),
      facility: normalize(categorizedData.facility),
      stay: normalize(categorizedData.stay),
    };

    routeData = Object.fromEntries(
        Object.entries(routeData).filter(([_, v]) => v !== null)
    );

    console.log("최적 경로 요청 데이터:", routeData);
    return routeData;
  };

  // Kakao Mobility Directions API 호출 함수
const fetchKakaoRoute = async (origin, destination) => {
  try {
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.mapX},${origin.mapY}&destination=${destination.mapX},${destination.mapY}&priority=RECOMMEND`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "KakaoAK 54aa389e0a9aa1761e2ec162045756ea",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("카카오 경로 응답:", data);

    return data.routes?.[0] ?? null; // 첫 번째 경로만 반환
  } catch (error) {
    console.error("카카오 경로 요청 실패:", error);
    return null;
  }
};

  const requestOptimalRoute = async () => {
    const routeData = formatRouteData();
    if (!routeData) {
      console.log("경로 데이터가 준비되지 않았습니다.");
      return;
    }

    try {
      setLoading(true);
      const result = await tourismService.getOptimalRoute(routeData);

      if (result.success) {
        setOptimalRouteData(result.data);
        console.log("최적 경로 응답:", result.data);
        Alert.alert("성공", "최적 경로를 계산했습니다!");
      } else {
        console.error("최적 경로 계산 실패:", result.error);
        Alert.alert("오류", result.error || "최적 경로 계산에 실패했습니다.");
      }
    } catch (error) {
      console.error("최적 경로 요청 중 오류:", error);
      Alert.alert("오류", "최적 경로 요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNavigation = () => {
    if (!selectedRoute) {
      Alert.alert("알림", "경로를 선택해주세요.");
      return;
    }
    if (!selectedDestination) {
      Alert.alert("알림", "최종 목적지를 선택해주세요.");
      return;
    }

    Alert.alert(
        "네비게이션 시작",
        `${selectedDestination.name}까지 ${selectedRoute.type === "taxi" ? "택시" : "대중교통"} 경로로 안내를 시작합니다.`
    );
  };

  // 목적지 선택 핸들러 - 선택 시 즉시 API 요청
  const handleDestinationSelect = (option) => {
    console.log("목적지 선택됨:", option);
    setSelectedDestination(option);
    // useEffect가 자동으로 API 요청을 처리할 것입니다
  };

  const renderDestinationSelector = () => {
    const options = getDestinationOptions();

    return (
        <View style={[styles.destinationSelector, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.selectorTitle, { color: themeColors.text }]}>
            🎯 최종 목적지 선택
          </Text>
          <Text style={[styles.selectorSubtitle, { color: themeColors.text }]}>
            어디를 최종 목적지로 설정하시겠습니까?
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.destinationOption,
                      {
                        borderColor: selectedDestination?.id === option.id ? option.color : '#ddd',
                        borderWidth: selectedDestination?.id === option.id ? 3 : 1,
                        backgroundColor: selectedDestination?.id === option.id ? (option.color + '20') : 'white'
                      }
                    ]}
                    onPress={() => handleDestinationSelect(option)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={[styles.optionCategory, { color: option.color }]}>
                    {option.category}
                  </Text>
                  <Text style={styles.optionName} numberOfLines={2}>
                    {option.name}
                  </Text>
                  {selectedDestination?.id === option.id && (
                      <View style={[styles.selectedBadge, { backgroundColor: option.color }]}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                  )}
                </TouchableOpacity>
            ))}
          </ScrollView>

          {!selectedDestination && (
              <View style={styles.selectionPrompt}>
                <Text style={[styles.promptText, { color: '#FF6B6B' }]}>
                  ⚠️ 최종 목적지를 선택해주세요
                </Text>
              </View>
          )}
        </View>
    );
  };

  const renderTravelPlanSummary = () => {
    if (parsedTravelPlan.length === 0) return null;

    return (
        <View style={[styles.summaryContainer, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
            📋 선택된 여행 계획
          </Text>
          {parsedTravelPlan.map((item, index) => (
              <View key={index} style={styles.summaryItem}>
                <Text style={[styles.summaryCategory, { color: "#4CAF50" }]}>
                  {item.category}
                </Text>
                <Text style={[styles.summaryPlace, { color: themeColors.text }]}>
                  {item.place.name}
                </Text>
              </View>
          ))}

          {selectedDestination && (
              <View style={[styles.finalDestination, { backgroundColor: selectedDestination.color + '20' }]}>
                <Text style={[styles.finalDestinationLabel, { color: selectedDestination.color }]}>
                  🎯 최종 목적지: {selectedDestination.name}
                </Text>
              </View>
          )}
        </View>
    );
  };

  return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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

        <ScrollView style={styles.scrollContainer}>
          {/* 목적지 선택기 */}
          {renderDestinationSelector()}

          {/* 여행 계획 요약 */}
          {renderTravelPlanSummary()}

          {/* 목적지 정보 */}
          <View style={[styles.destinationContainer, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.destinationTitle, { color: themeColors.text }]}>
              📍 {selectedDestination ? `${selectedDestination.name}으로` : '목적지를 선택하여'} 가는 길 안내
            </Text>
            <Text style={[styles.destinationSubtitle, { color: themeColors.text }]}>
              현재 위치에서 목적지까지 최적의 경로를 안내해드립니다
            </Text>
          </View>

          {/* 지도 영역 */}
          <View style={styles.mapContainer}>
            {selectedDestination ? (
              <WebView
                source={{
                  uri: `https://map.kakao.com/link/map/${selectedDestination.name},${selectedDestination.mapY},${selectedDestination.mapX}`,
                }}
                style={{ flex: 1 }}
              />
            ) : (
              <View style={[styles.mapPlaceholder, { backgroundColor: themeColors.card }]}>
                <Text style={{ textAlign: "center", marginTop: 80 }}>
                  목적지를 선택하세요
                </Text>
              </View>
            )}
          </View>

          {/* 경로 선택 */}
          <View style={styles.routesContainer}>
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
                        borderColor: selectedRoute?.id === route.id ? "#4CAF50" : themeColors.border,
                        borderWidth: selectedRoute?.id === route.id ? 2 : 1,
                        opacity: selectedDestination ? 1 : 0.5
                      },
                    ]}
                    onPress={() => selectedDestination && handleRouteSelect(route)}
                    disabled={!selectedDestination}
                >
                  <View style={styles.routeHeader}>
                    <Text style={[styles.routeDuration, { color: themeColors.text }]}>
                      {route.duration}
                    </Text>
                    <Text style={[styles.routeCost, { color: "#4CAF50" }]}>
                      {route.cost}
                    </Text>
                  </View>

                  <Text style={[styles.routeDescription, { color: themeColors.text }]}>
                    {route.description}
                  </Text>

                  <View style={styles.stepsContainer}>
                    {route.steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                          <View style={[styles.stepDot, { backgroundColor: "#4CAF50" }]} />
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
          </View>
        </ScrollView>

        {/* 하단 액션 버튼 */}
        <View style={[styles.actionContainer, { backgroundColor: themeColors.card }]}>
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
                  backgroundColor: (selectedRoute && selectedDestination) ? "#4CAF50" : "#ccc",
                  opacity: (selectedRoute && selectedDestination) ? 1 : 0.5,
                },
              ]}
              onPress={handleStartNavigation}
              disabled={!selectedRoute || !selectedDestination}
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
  scrollContainer: {
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
  destinationSelector: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  selectorSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  destinationOption: {
    width: 120,
    height: 140,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  optionCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionName: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionPrompt: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryCategory: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  summaryPlace: {
    fontSize: 14,
    flex: 1,
  },
  finalDestination: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalDestinationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  destinationContainer: {
    margin: 15,
    marginTop: 0,
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
    height: 200,
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
    fontSize: 12,
  },
  routesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
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