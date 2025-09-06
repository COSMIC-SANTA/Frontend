import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import axios from "axios";
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
import { mountainService } from "../services/api.js";

export default function MountainDirectionScreen() {
  const router = useRouter();
  const { travelPlan, location, mountainName } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null); // { mapX, mapY }
  const [parsedTravelPlan, setParsedTravelPlan] = useState([]);
  const [optimalRouteData, setOptimalRouteData] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null); // { name, location, mapX?, mapY?, ... }

  // 전달받은 여행계획 파싱 + 현재 위치 획득
  useEffect(() => {
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

  useEffect(() => {
    (async () => {
      console.log(mountainName)
      const name = (mountainName ?? "").toString().trim();
      if (!name) {
        console.warn("[mountain XY] mountainName 없음");
        return;
      }
      const m = await getMountainPosition(name);
      if (m?.position?.mapX != null && m?.position?.mapY != null) {
        console.log(
            `[mountain XY] ${m.name} -> x(경도): ${m.position.mapX}, y(위도): ${m.position.mapY}`
        );
      } else {
        console.warn("[mountain XY] 좌표를 찾지 못했습니다.", m);
      }
    })();
    // 최초 1회만
  }, []);

  const routeData2 = {
    "origin" :{
      "mapX": 127.10763058573032,
      "mapY": 37.40246478787756
    },

    "destination": {
      "type": "spot",
      "name": "string",           // 관광지 이름 (예: "칠선계곡")
      "location": "string",
      "position": { "mapX": 127.1098265381582, "mapY": 37.394425724914576 }
    }
    ,
    "mountain": {
      "name": "지리산",
      "location": "전북/경남",
      "position": { "mapX": 127.17353858063272, "mapY": 37.3662968484953 }
    },
    "cafes": [
      {
        "type": "cafe",
        "name": "카페",
        "location": "카페 위치",
        "position": { "mapX": 127.17353858063273 , "mapY": 37.3662968484953 }

      }
    ],

    "restaurants": null,

    "stays": null,

    "spots": null
  }

  // 선택된 목적지/현재위치/여행계획이 준비되면 최적경로 + Kakao Directions 호출
  useEffect(() => {
    (async () => {
      if (!currentLocation || parsedTravelPlan.length === 0 || !selectedDestination) return;

      // 목적지 좌표 보정(산 선택 시 좌표가 없을 수 있음)
      let dest = await ensureDestinationHasCoords(selectedDestination);
      if (!dest?.mapX || !dest?.mapY) {
        console.warn("목적지 좌표 없음 - API 호출 스킵");
        return;
      }
      setSelectedDestination(dest); // 좌표 반영

      // 최적경로 요청
      await requestOptimalRoute(dest);

      // Kakao Directions
      // const route = await fetchKakaoRoute(currentLocation, { position: { mapX: dest.mapX, mapY: dest.mapY } });
      // if (route) setSelectedRoute(route);
    })();
  }, [currentLocation, parsedTravelPlan, selectedDestination]);

  const routes = [
    {
      id: 1,
      duration: "2h 3.6km",
      cost: "245,050원",
      type: "taxi",
      description: "가장 빠른 경로",
      steps: ["출발지에서 택시 이용", "목적지까지 직행", "도보로 최종 목적지 도착"],
    },
    {
      id: 2,
      duration: "3h 08분",
      cost: "256,050원",
      type: "public",
      description: "대중교통 이용",
      steps: ["지하철 → 버스 환승", "대중교통으로 목적지 이동", "도보로 최종 목적지 도착"],
    },
  ];

  const handleRouteSelect = (route) => setSelectedRoute(route);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("알림", "위치 권한이 필요합니다.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { mapX: loc.coords.longitude, mapY: loc.coords.latitude };
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
    if (optionId === "mountain") return "mountain";
    switch (categoryOrType) {
      case "관광지": return "spot";
      case "맛집": return "restaurant";
      case "관광시설": return "cafe";
      case "숙박": return "stay";
      case "mountain": return "mountain";
      default:
        console.warn("알 수 없는 카테고리/타입:", categoryOrType, "→ 기본값 spot");
        return "spot";
    }
  };

  // 목적지 후보(산 + 선택 장소들)
  const getDestinationOptions = () => {
    const options = [];
    options.push({
      id: "mountain",
      type: "mountain",
      category: "산",
      name: mountainName || "목적지 산",
      location: location || "산 위치",
      icon: "🏔️",
      color: "#4CAF50",
      // mapX/mapY는 선택 시에 좌표 조회 후 주입
    });
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
        })(),
      });
    });
    return options;
  };

  // 산 좌표 조회(MountainSearchResponse: { mountains: [{ mountainName, mountainAddress, position:{mapX,mapY}}] })
  const getMountainPosition = async (name) => {
    try {
      const { mountains = [] } = await mountainService.fetchMountainXY(name);
      const first = mountains[0];
      console.log("산 x:"+first.position?.mapX)
      console.log("산 y:"+first.position?.mapY)
      if (!first?.position?.mapX || !first?.position?.mapY) return null;
      return {
        name: first.mountainName,
        location: first.mountainAddress,
        position: first.position, // { mapX, mapY }
      };
    } catch (e) {
      console.error("getMountainPosition 에러:", e);
      return null;
    }
  };

  // 목적지 좌표가 없을 때(산 선택 등) 좌표 주입
  const ensureDestinationHasCoords = async (dest) => {
    if (dest?.mapX != null && dest?.mapY != null) return dest;
    const isMountain = (dest?.id === "mountain") || (dest?.type === "mountain");
    if (isMountain && mountainName) {
      const m = await getMountainPosition(mountainName);
      if (m?.position) {
        return { ...dest, mapX: m.position.mapX, mapY: m.position.mapY, location: m.location ?? dest.location };
      }
    }
    return dest;
  };

  // 분류/데이터 정규화 + 최적경로 요청 페이로드 생성
  const formatRouteData = async (finalDestination) => {
    if (!currentLocation || parsedTravelPlan.length === 0 || !finalDestination) {
      console.log("데이터 부족:", {
        currentLocation: !!currentLocation,
        parsedTravelPlan: parsedTravelPlan.length,
        selectedDestination: !!finalDestination,
      });
      return null;
    }

    // 목적지 객체(표준형)
    const destination = {
      name: finalDestination.name,
      location: finalDestination.location,
      type: mapCategoryToType(finalDestination.type ?? finalDestination.category, finalDestination.id),
      position: (finalDestination.mapX != null && finalDestination.mapY != null)
          ? { mapX: finalDestination.mapX, mapY: finalDestination.mapY }
          : null,
    };

    // 산 정보(있으면 포함)
    let mountainObj = null;
    if (mountainName) {
      const m = await getMountainPosition(mountainName);
      mountainObj = { name: m.name, location: m.location, position: m.position };
    }

    // 카테고리별 분류
    const categorized = { tourist_spots: [], restaurants: [], cafes: [], stays: [] };
    parsedTravelPlan.forEach((item) => {
      if (finalDestination.name === item.place.name) return;
      const place = {
        name: item.place.name,
        location: item.place.location,
        position: { mapX: item.place.mapX, mapY: item.place.mapY },
        type: mapCategoryToType(item.category),
      };
      switch (item.category) {
        case "관광지": place.type = "spot"; categorized.tourist_spots.push(place); break;
        case "맛집": place.type = "restaurant"; categorized.restaurants.push(place); break;
        case "관광시설": place.type = "cafe"; categorized.cafes.push(place); break;
        case "숙박": place.type = "stay"; categorized.stays.push(place); break;
        default: break;
      }
    });

    const normalize = (arr) => (arr.length ? arr : null);

    console.log("최적 경로 요청 데이터에 들어갈 mountain",mountainObj)
    const routeData = {
      origin: currentLocation, // { mapX, mapY }
      destination,             // { name, location, type, position }
      ...(mountainObj ? { mountain: mountainObj } : {}),
      ...(normalize(categorized.cafes) ? { cafes: normalize(categorized.cafes) } : {}),
      ...(normalize(categorized.restaurants) ? { restaurants: normalize(categorized.restaurants) } : {}),
      ...(normalize(categorized.stays) ? { stays: normalize(categorized.stays) } : {}),
      ...(normalize(categorized.tourist_spots) ? { spots: normalize(categorized.tourist_spots) } : {}),
    };

    console.log("최적 경로 요청 데이터:", routeData);
    return routeData;
  };

  // Kakao Mobility Directions API
  // const fetchKakaoRoute = async (origin, destination) => {
  //   try {
  //     if (!destination?.position?.mapX || !destination?.position?.mapY) {
  //       console.warn("Kakao Directions: 목적지 좌표 없음");
  //       return null;
  //     }
  //     const url =
  //         `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.mapX},${origin.mapY}` +
  //         `&destination=${destination.position.mapX},${destination.position.mapY}&priority=RECOMMEND`;
  //
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         Authorization: "KakaoAK 54aa389e0a9aa1761e2ec162045756ea",
  //         "Content-Type": "application/json",
  //       },
  //     });
  //
  //     const data = await response.json();
  //     console.log("카카오 경로 응답:", data);
  //     return data.routes?.[0] ?? null;
  //   } catch (error) {
  //     console.error("카카오 경로 요청 실패:", error);
  //     return null;
  //   }
  // };

  // 최적 경로 요청
  const requestOptimalRoute = async (finalDestination) => {
    const routeData = await formatRouteData(finalDestination); // ✅ async/await
    if (!routeData?.destination?.position) {
      console.log("경로 데이터 준비 안됨(목적지 좌표 없음)");
      return;
    }

    const apiClientJson = axios.create({
      baseURL: 'http://api-santa.com',
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    try {
      setLoading(true);
      const response = await apiClientJson.post("/api/mountains/optimalRoute", routeData,);
      const result  ={
        success: true,
        data: response,
        message: "최적 경로를 성공적으로 계산했습니다."
      }
      console.log("찐 응답", result);

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

  // 목적지 선택 시: 산을 선택했다면 이 시점에 좌표 주입 시도
  const handleDestinationSelect = async (option) => {
    console.log("목적지 선택됨:", option);
    if ((option.id === "mountain" || option.type === "mountain") && (option.mapX == null || option.mapY == null)) {
      const m = await getMountainPosition(mountainName);
      if (m?.position) {
        option = { ...option, mapX: m.position.mapX, mapY: m.position.mapY, location: m.location ?? option.location };
      } else {
        Alert.alert("알림", "산 좌표를 찾을 수 없습니다.");
      }
    }
    setSelectedDestination(option);
  };

  const renderDestinationSelector = () => {
    const options = getDestinationOptions();
    return (
        <View style={[styles.destinationSelector, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.selectorTitle, { color: themeColors.text }]}>🎯 최종 목적지 선택</Text>
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
                        borderColor: selectedDestination?.id === option.id ? option.color : "#ddd",
                        borderWidth: selectedDestination?.id === option.id ? 3 : 1,
                        backgroundColor: selectedDestination?.id === option.id ? option.color + "20" : "white",
                      },
                    ]}
                    onPress={() => handleDestinationSelect(option)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={[styles.optionCategory, { color: option.color }]}>{option.category}</Text>
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
                <Text style={[styles.promptText, { color: "#FF6B6B" }]}>⚠️ 최종 목적지를 선택해주세요</Text>
              </View>
          )}
        </View>
    );
  };

  const renderTravelPlanSummary = () => {
    if (parsedTravelPlan.length === 0) return null;
    return (
        <View style={[styles.summaryContainer, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.text }]}>📋 선택된 여행 계획</Text>
          {parsedTravelPlan.map((item, index) => (
              <View key={index} style={styles.summaryItem}>
                <Text style={[styles.summaryCategory, { color: "#4CAF50" }]}>{item.category}</Text>
                <Text style={[styles.summaryPlace, { color: themeColors.text }]}>{item.place.name}</Text>
              </View>
          ))}
          {selectedDestination && (
              <View style={[styles.finalDestination, { backgroundColor: selectedDestination.color + "20" }]}>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
              📍 {selectedDestination ? `${selectedDestination.name}으로` : "목적지를 선택하여"} 가는 길 안내
            </Text>
            <Text style={[styles.destinationSubtitle, { color: themeColors.text }]}>
              현재 위치에서 목적지까지 최적의 경로를 안내해드립니다
            </Text>
          </View>

          {/* 지도 영역 */}
          <View style={styles.mapContainer}>
            {selectedDestination && selectedDestination.mapX != null && selectedDestination.mapY != null ? (
                <WebView
                    source={{
                      uri: `https://map.kakao.com/link/map/${selectedDestination.name},${selectedDestination.mapY},${selectedDestination.mapX}`,
                    }}
                    style={{ flex: 1 }}
                />
            ) : (
                <View style={[styles.mapPlaceholder, { backgroundColor: themeColors.card }]}>
                  <Text style={{ textAlign: "center", marginTop: 80 }}>목적지를 선택하세요</Text>
                </View>
            )}
          </View>

          {/* 경로 선택 */}
          <View style={styles.routesContainer}>
            <Text style={[styles.routesTitle, { color: themeColors.text }]}>경로 선택</Text>
            {routes.map((route) => (
                <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeCard,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: selectedRoute?.id === route.id ? "#4CAF50" : themeColors.border,
                        borderWidth: selectedRoute?.id === route.id ? 2 : 1,
                        opacity: selectedDestination ? 1 : 0.5,
                      },
                    ]}
                    onPress={() => selectedDestination && handleRouteSelect(route)}
                    disabled={!selectedDestination}
                >
                  <View style={styles.routeHeader}>
                    <Text style={[styles.routeDuration, { color: themeColors.text }]}>{route.duration}</Text>
                    <Text style={[styles.routeCost, { color: "#4CAF50" }]}>{route.cost}</Text>
                  </View>
                  <Text style={[styles.routeDescription, { color: themeColors.text }]}>{route.description}</Text>
                  <View style={styles.stepsContainer}>
                    {route.steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                          <View style={[styles.stepDot, { backgroundColor: "#4CAF50" }]} />
                          <Text style={[styles.stepText, { color: themeColors.text }]}>{step}</Text>
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
          <TouchableOpacity style={[styles.laterButton, { borderColor: themeColors.border }]} onPress={() => router.back()}>
            <Text style={[styles.laterButtonText, { color: themeColors.text }]}>나중에</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[
                styles.startButton,
                {
                  backgroundColor: selectedRoute && selectedDestination ? "#4CAF50" : "#ccc",
                  opacity: selectedRoute && selectedDestination ? 1 : 0.5,
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

const handleStartNavigation = () => {
  Alert.alert("네비게이션 시작", "선택한 경로로 안내를 시작합니다.");
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 24, color: "white", fontWeight: "bold" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  destinationSelector: { margin: 15, padding: 15, borderRadius: 12 },
  selectorTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  selectorSubtitle: { fontSize: 14, opacity: 0.7, marginBottom: 15 },
  optionsContainer: { flexDirection: "row" },
  destinationOption: {
    width: 120, height: 140, borderRadius: 12, padding: 10, marginRight: 10,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  optionIcon: { fontSize: 30, marginBottom: 8 },
  optionCategory: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  optionName: { fontSize: 11, textAlign: "center", lineHeight: 14 },
  selectedBadge: { position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  selectedBadgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  selectionPrompt: { marginTop: 10, padding: 10, backgroundColor: "#FFF5F5", borderRadius: 8, alignItems: "center" },
  promptText: { fontSize: 14, fontWeight: "600" },
  summaryContainer: { margin: 15, marginTop: 0, padding: 15, borderRadius: 12 },
  summaryTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  summaryItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  summaryCategory: { fontSize: 14, fontWeight: "600", minWidth: 60 },
  summaryPlace: { fontSize: 14, flex: 1 },
  finalDestination: { marginTop: 10, padding: 10, borderRadius: 8, alignItems: "center" },
  finalDestinationLabel: { fontSize: 16, fontWeight: "bold" },
  destinationContainer: { margin: 15, marginTop: 0, padding: 20, borderRadius: 12 },
  destinationTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  destinationSubtitle: { fontSize: 14, opacity: 0.7, lineHeight: 20 },
  mapContainer: { margin: 15, height: 500 },
  mapPlaceholder: { flex: 1, borderRadius: 12, overflow: "hidden", position: "relative" },
  routesContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  routesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  routeCard: { padding: 20, borderRadius: 12, marginBottom: 15, position: "relative" },
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  routeDuration: { fontSize: 18, fontWeight: "bold" },
  routeCost: { fontSize: 16, fontWeight: "600" },
  routeDescription: { fontSize: 14, opacity: 0.7, marginBottom: 15 },
  stepsContainer: { paddingLeft: 10 },
  stepItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  stepText: { fontSize: 14, flex: 1 },
  selectedIndicator: { position: "absolute", top: 15, right: 15, backgroundColor: "#4CAF50", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  selectedText: { color: "white", fontSize: 12, fontWeight: "bold" },
  actionContainer: { flexDirection: "row", padding: 15, gap: 10 },
  laterButton: { flex: 1, paddingVertical: 15, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  laterButtonText: { fontSize: 16, fontWeight: "600" },
  startButton: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  startButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
