import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import axios from "axios";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { WebView } from "react-native-webview";
import { mountainService, planService } from "../services/api.js";

const { width, height } = Dimensions.get("window");

// ✅ Kakao JS SDK를 WebView 안에서 불러와서 지도/마커/경로를 그림
function KakaoRouteWebView({ routeJson, jsKey }) {
  // routeJson = { origin:{x,y,name?}, destination:{x,y,name?}, waypoints:[{x,y,name?}, ...] }

  // WebView에 넣을 HTML 템플릿 (fitBounds + markers + polyline)
  const html = `
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .label {
      padding: 4px 6px; background: #0A5011; color: #fff;
      border-radius: 6px; font-size: 12px; white-space: nowrap;
      transform: translate(-50%, -100%);
    }
  </style>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${jsKey}"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const raw = ${JSON.stringify(routeJson || {})};
    const points = [];
    if (raw.origin && Number.isFinite(raw.origin.x) && Number.isFinite(raw.origin.y)) {
      points.push({lng: raw.origin.x, lat: raw.origin.y, name: raw.origin.name || "출발"});
    }
    if (Array.isArray(raw.waypoints)) {
      raw.waypoints.forEach((w, i) => {
        if (Number.isFinite(w.x) && Number.isFinite(w.y)) {
          points.push({lng: w.x, lat: w.y, name: w.name || ("경유지 " + (i+1))});
        }
      });
    }
    if (raw.destination && Number.isFinite(raw.destination.x) && Number.isFinite(raw.destination.y)) {
      points.push({lng: raw.destination.x, lat: raw.destination.y, name: raw.destination.name || "도착"});
    }

    function makeLabel(content) {
      const div = document.createElement('div');
      div.className = 'label';
      div.innerText = content;
      return div;
    }

    kakao.maps.load(function() {
      var container = document.getElementById('map');
      var center = points.length ? new kakao.maps.LatLng(points[0].lat, points[0].lng) : new kakao.maps.LatLng(37.5665, 126.9780);
      var map = new kakao.maps.Map(container, {
        center: center,
        level: 7
      });

      var bounds = new kakao.maps.LatLngBounds();
      var path = [];

      points.forEach((p, idx) => {
        var pos = new kakao.maps.LatLng(p.lat, p.lng);
        bounds.extend(pos);
        path.push(pos);

        // 마커
        var marker = new kakao.maps.Marker({ position: pos, map: map });
        // 라벨(출발/경유지/도착)
        var customOverlay = new kakao.maps.CustomOverlay({
          position: pos, yAnchor: 1.1, content: makeLabel((idx === 0) ? "출발" : (idx === points.length - 1 ? "도착" : (p.name || "경유지")))
        });
        customOverlay.setMap(map);
      });

      if (path.length >= 2) {
        var polyline = new kakao.maps.Polyline({
          path: path, strokeWeight: 4, strokeColor: '#0A5011', strokeOpacity: 0.9, strokeStyle: 'solid'
        });
        polyline.setMap(map);
      }

      if (!bounds.isEmpty()) {
        map.setBounds(bounds, 60, 40, 60, 40); // 여백: 상우하좌
      }
    });
  </script>
</body>
</html>
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      // Kakao JS SDK는 '등록된 도메인'이 필요 → baseUrl을 로컬 도메인으로 맞추고
      // Kakao Developers > JavaScript 키의 '허용 도메인'에 http://localhost 등록하세요.
      source={{ html, baseUrl: "http://localhost:8081" }}
      // 외부로 나가려는 네비게이션 차단
      onShouldStartLoadWithRequest={(req) => {
        const url = req.url || "";
        if (
          url.startsWith("about:blank") ||
          url.startsWith("data:") ||
          url.startsWith("http://localhost:8081") ||
          url.startsWith("https://dapi.kakao.com") ||
          url.startsWith("http://localhost:19006") ||
          url.startsWith("http://localhost:8080")
        )
          return true;
        return false;
      }}
      mixedContentMode="always"
      // 확대/축소 제스처, 스크롤 등 필요시 옵션 조정
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      style={{ flex: 1 }}
    />
  );
}

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

  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapRef, setMapRef] = useState(null);

  // 최종 경로 데이터를 저장할 state 추가
  const [finalRouteData, setFinalRouteData] = useState(null);

  // 모달 상태 추가
  const [modalVisible, setModalVisible] = useState(false);

  // 선택된 날짜를 저장할 state 추가
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateConfirmed, setIsDateConfirmed] = useState(false);

  // 시작 버튼 클릭 시 모달 띄우기
  const handleStartButtonPress = () => {
    setModalVisible(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalVisible(false);
  };

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
      console.log(mountainName);
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

  // handleSavePlan 함수를 컴포넌트 내부로 이동하고 완성
  const handleSavePlan = async () => {
    try {
      // handleDecideRoute에서 경로 데이터 가져오기
      const routeData = await handleDecideRoute();

      if (!routeData) {
        Alert.alert("오류", "경로 데이터를 생성할 수 없습니다.");
        return;
      }

      if (!selectedDate) {
        Alert.alert("알림", "날짜를 먼저 선택해 주세요.");
        return;
      }

      // 선택된 날짜와 함께 최종 여행 계획 데이터 생성
      const finalTravelPlan = {
        ...routeData,
        targetDate: `${selectedDate}T00:00:00`, // selectedDate를 targetDate로 추가
        //
      };

      // 콘솔에 최종 데이터 출력
      console.log("=== 최종 여행 계획 저장 데이터 ===");
      console.log("targetDate:", finalTravelPlan.targetDate);
      console.log("전체 데이터:", JSON.stringify(finalTravelPlan, null, 2));

      // 여기서 실제 저장 로직 구현 (예: planService.savePlan 호출)
      // const result = await planService.savePlan(finalTravelPlan);
      // if (result.success) {
      //   Alert.alert("성공", "여행 계획이 저장되었습니다!");
      // }

      const result = await planService.savePlan(finalTravelPlan);

      setModalVisible(false); // 모달 닫기

      // 저장 성공 시 설정 페이지 이동
      if (result?.success) {
        router.replace({
          pathname: "/setting",
        });
      } else {
        Alert.alert("오류", "여행 계획 저장에 실패");
      }
    } catch (error) {
      console.error("여행 계획 저장 중 오류:", error);
      Alert.alert("오류", "여행 계획 저장 중 문제가 발생했습니다.");
    }
  };

  // 경로 정보를 렌더링하는 함수
  const renderRouteTimeline = () => {
    if (!optimalRouteData) {
      return (
        <View style={styles.noRouteContainer}>
          <Text style={[styles.noRouteText, { color: themeColors.text }]}>
            목적지를 선택하고 최적 경로를 계산해주세요
          </Text>
        </View>
      );
    }

    const routeSteps = generateRouteSteps();
    const totalDistance = optimalRouteData.data?.distance
      ? Math.round(optimalRouteData.data.distance / 1000)
      : routeSteps.reduce((sum, step) => sum + step.distance, 0);

    const estimatedTime = optimalRouteData.data?.duration
      ? Math.round(optimalRouteData.data.duration / 60)
      : Math.round(totalDistance * 2); // 대략적인 계산 (시속 30km 기준)

    return (
      <View style={styles.routeTimelineContainer}>
        {/* 경로 요약 정보 */}
        <View
          style={[styles.routeSummary, { backgroundColor: themeColors.card }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>총 거리</Text>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
              {totalDistance}km
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>예상 시간</Text>
            <Text style={[styles.summaryValue, { color: "#FF9800" }]}>
              {estimatedTime}분
            </Text>
          </View>
          {optimalRouteData.data?.taxi && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>택시비</Text>
              <Text style={[styles.summaryValue, { color: "#2196F3" }]}>
                {optimalRouteData.data.taxi.toLocaleString()}원
              </Text>
            </View>
          )}
        </View>

        {/* 경로 타임라인 */}
        <View style={styles.timelineContainer}>
          {routeSteps.map((step, index) => {
            const isLast = index === routeSteps.length - 1;

            return (
              <View key={step.id} style={styles.timelineItem}>
                {/* 타임라인 라인과 점 */}
                <View style={styles.timelineLineContainer}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: step.isStart
                          ? "#4CAF50"
                          : step.isDestination
                          ? "#F44336"
                          : "#FF9800",
                      },
                    ]}>
                    <Text style={styles.timelineDotText}>{step.icon}</Text>
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* 경로 정보 */}
                <View
                  style={[
                    styles.timelineContent,
                    { backgroundColor: themeColors.card },
                  ]}>
                  <View style={styles.timelineHeader}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        { color: themeColors.text },
                      ]}>
                      {step.name}
                    </Text>
                    {step.distance > 0 && (
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>
                          {step.distance}km
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.timelineSubtitle,
                      { color: themeColors.text, opacity: 0.7 },
                    ]}>
                    {step.location}
                  </Text>

                  {/* 이동 정보 (마지막이 아닌 경우) */}
                  {!isLast && step.distance > 0 && (
                    <View style={styles.travelInfo}>
                      <Text style={[styles.travelText, { color: "#666" }]}>
                        ↓ {step.distance}km • 약 {Math.round(step.distance * 2)}
                        분
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 경로 액션 버튼 */}
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startRouteButton]}
            onPress={() => {
              // optimalRouteData가 존재하는지 먼저 확인
              if (!optimalRouteData?.data) {
                Alert.alert(
                  "오류",
                  "경로 데이터가 없습니다. 다시 시도해주세요."
                );
                return;
              }

              // selectedRoute를 설정하되, 직접 optimalRouteData.data를 사용
              setSelectedRoute({ data: optimalRouteData.data });

              // 콘솔 로그에서도 optimalRouteData.data를 직접 사용
              console.log("선택된 경로 데이터:", optimalRouteData.data);

              handleStartButtonPress();
            }}>
            <Text style={styles.startRouteButtonText}>이 경로로 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 지도 영역 계산 함수
  const calculateMapRegion = (destinations) => {
    if (!currentLocation) return null;

    const coordinates = [currentLocation, ...destinations];
    const latitudes = coordinates.map((coord) =>
      parseFloat(coord.mapY || coord.latitude)
    );
    const longitudes = coordinates.map((coord) =>
      parseFloat(coord.mapX || coord.longitude)
    );

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2;
    const deltaLng = (maxLng - minLng) * 1.2;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    };
  };

  const routeData2 = {
    origin: {
      mapX: 127.10763058573032,
      mapY: 37.40246478787756,
    },

    destination: {
      type: "spot",
      name: "string", // 관광지 이름 (예: "칠선계곡")
      location: "string",
      position: { mapX: 127.1098265381582, mapY: 37.394425724914576 },
    },
    mountain: {
      name: "지리산",
      location: "전북/경남",
      position: { mapX: 127.17353858063272, mapY: 37.3662968484953 },
    },
    cafes: [
      {
        type: "cafe",
        name: "카페",
        location: "카페 위치",
        position: { mapX: 127.17353858063273, mapY: 37.3662968484953 },
      },
    ],

    restaurants: null,

    stays: null,

    spots: null,
  };

  // 선택된 목적지/현재위치/여행계획이 준비되면 최적경로 + Kakao Directions 호출
  useEffect(() => {
    (async () => {
      if (
        !currentLocation ||
        parsedTravelPlan.length === 0 ||
        !selectedDestination
      )
        return;

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
      case "관광지" || "spot":
        return "spot";
      case "맛집" || "restaurant":
        return "restaurant";
      case "관광시설" || "cafe":
        return "cafe";
      case "숙박" || "stay":
        return "stay";
      case "mountain":
        return "mountain";
      default:
        console.warn(
          "알 수 없는 카테고리/타입:",
          categoryOrType,
          "→ 기본값 spot"
        );
        return "spot";
    }
  };

  // 목적지 후보(산 + 선택 장소들)
  const getDestinationOptions = () => {
    const options = [];
    // options.push({
    //   id: "mountain",
    //   type: "mountain",
    //   category: "산",
    //   name: mountainName || "목적지 산",
    //   location: location || "산 위치",
    //   icon: "🏔️",
    //   color: "#4CAF50",
    //   // mapX/mapY는 선택 시에 좌표 조회 후 주입
    // });
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
            case "관광지":
              return "🏞️";
            case "맛집":
              return "🍽️";
            case "카페":
            case "관광시설":
              return "☕";
            case "숙박":
              return "🏨";
            default:
              return "📍";
          }
        })(),
        color: (() => {
          switch (item.category) {
            case "관광지":
              return "#4CAF50";
            case "맛집":
              return "#FF9800";
            case "카페":
            case "관광시설":
              return "#2196F3";
            case "숙박":
              return "#9C27B0";
            default:
              return "#666";
          }
        })(),
      });
    });
    return options;
  };

  // 산 좌표 조회(MountainSearchResponse: { mountains: [{ mountainName, mountainAddress, position:{mapX,mapY}}] })
  const getMountainPosition = async (name) => {
    try {
      const res = await mountainService.fetchMountainXY(name);
      const mountains = Array.isArray(res?.mountains) ? res.mountains : [];
      if (mountains.length === 0) return null;

      let exact = mountains.find((m) => m?.mountainName === name);

      // (옵션) 정확 일치가 없을 때, 정상화 후 일치 시도
      // const normalize = (s) => {
      //   if (!s) return "";
      //   const trimmed = String(s).trim();
      //   // 괄호 내용 제거 + '산'까지만 자르기 (덕유산(향적봉) → 덕유산)
      //   const noBracket = trimmed.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, "");
      //   const match = noBracket.match(/.+?산/);
      //   return match ? match[0] : noBracket;
      // };
      // if (!exact) {
      //   const target = normalize(name);
      //   exact = mountains.find(m => normalize(m?.mountainName) === target);
      // }

      if (!exact) {
        console.warn(
          `[getMountainPosition] 정확히 일치하는 산을 찾지 못했습니다: "${name}". 후보: ${mountains
            .map((m) => m?.mountainName)
            .filter(Boolean)
            .join(", ")}`
        );
        return null; // 정확 일치 없으면 null을 돌려 문제를 드러냄
        // (옵션) 그래도 첫 번째로 대체하려면 아래 주석 해제
        // exact = mountains[0];
      }

      // 좌표 추출 (position 또는 mapX/mapY 단독 필드 대응)
      const mapX = Number(exact?.position?.mapX ?? exact?.mapX);
      const mapY = Number(exact?.position?.mapY ?? exact?.mapY);
      if (!Number.isFinite(mapX) || !Number.isFinite(mapY)) {
        console.warn("[getMountainPosition] 좌표 없음/비정상:", exact);
        return null;
      }

      return {
        name: exact.mountainName,
        location: exact.mountainAddress,
        position: { mapX, mapY },
      };
    } catch (e) {
      console.error("getMountainPosition 에러:", e);
      return null;
    }
  };

  // 목적지 좌표가 없을 때(산 선택 등) 좌표 주입
  const ensureDestinationHasCoords = async (dest) => {
    if (dest?.mapX != null && dest?.mapY != null) return dest;
    const isMountain = dest?.id === "mountain" || dest?.type === "mountain";
    if (isMountain && mountainName) {
      const m = await getMountainPosition(mountainName);
      if (m?.position) {
        return {
          ...dest,
          mapX: m.position.mapX,
          mapY: m.position.mapY,
          location: m.location ?? dest.location,
        };
      }
    }
    return dest;
  };

  // 분류/데이터 정규화 + 최적경로 요청 페이로드 생성
  const formatRouteData = async (finalDestination, includeMountain = false) => {
    if (
      !currentLocation ||
      parsedTravelPlan.length === 0 ||
      !finalDestination
    ) {
      console.log("데이터 부족:", {
        currentLocation: !!currentLocation,
        parsedTravelPlan: parsedTravelPlan.length,
        selectedDestination: !!finalDestination,
      });
      return null;
    }

    // 산 정보 (조건부로 포함)
    let mountainObj = null;
    if (includeMountain && mountainName) {
      const m = await getMountainPosition(mountainName);
      if (m) {
        mountainObj = {
          name: m.name,
          location: m.location,
          position: m.position,
        };
      }
    }

    // 목적지 객체(표준형)
    const destination = {
      name: finalDestination.name,
      location: finalDestination.location,
      type: mapCategoryToType(finalDestination.category, finalDestination.id),
      position:
        finalDestination.mapX != null && finalDestination.mapY != null
          ? { mapX: finalDestination.mapX, mapY: finalDestination.mapY }
          : null,
    };

    // 카테고리별 분류
    const categorized = {
      tourist_spots: [],
      restaurants: [],
      cafes: [],
      stays: [],
    };
    parsedTravelPlan.forEach((item) => {
      if (finalDestination.name === item.place.name) return;
      const place = {
        name: item.place.name,
        location: item.place.location,
        position: { mapX: item.place.mapX, mapY: item.place.mapY },
        type: mapCategoryToType(item.category),
      };
      switch (item.category) {
        case "관광지":
          place.type = "spot";
          categorized.tourist_spots.push(place);
          break;
        case "맛집":
          place.type = "restaurant";
          categorized.restaurants.push(place);
          break;
        case "관광시설":
          place.type = "cafe";
          categorized.cafes.push(place);
          break;
        case "숙박":
          place.type = "stay";
          categorized.stays.push(place);
          break;
        default:
          break;
      }
    });

    const normalize = (arr) => (arr.length ? arr : null);

    console.log("최적 경로 요청 데이터에 들어갈 mountain", mountainObj);
    const routeData = {
      origin: currentLocation, // { mapX, mapY }
      destination, // { name, location, type, position }
      ...(mountainObj ? { mountain: mountainObj } : {}),
      ...(normalize(categorized.cafes)
        ? { cafes: normalize(categorized.cafes) }
        : {}),
      ...(normalize(categorized.restaurants)
        ? { restaurants: normalize(categorized.restaurants) }
        : {}),
      ...(normalize(categorized.stays)
        ? { stays: normalize(categorized.stays) }
        : {}),
      ...(normalize(categorized.tourist_spots)
        ? { spots: normalize(categorized.tourist_spots) }
        : {}),
    };

    console.log(
      `최적 경로 데이터 (mountain 포함: ${includeMountain}):`,
      routeData
    );
    return routeData;
  };

  // 최적 경로 요청
  const requestOptimalRoute = async (finalDestination) => {
    const routeData = await formatRouteData(finalDestination, false); // ✅ async/await
    if (!routeData?.destination?.position) {
      console.log("경로 데이터 준비 안됨(목적지 좌표 없음)");
      return;
    }

    const apiClientJson = axios.create({
      baseURL: "http://api-santa.com",
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    try {
      setLoading(true);
      const response = await apiClientJson.post(
        "/api/mountains/optimalRoute",
        routeData
      );
      const result = {
        success: true,
        data: response,
        message: "최적 경로를 성공적으로 계산했습니다.",
      };
      console.log("찐 응답", result);

      if (result.success) {
        setOptimalRouteData(result.data);
        console.log("최적 경로 응답:", result.data);
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
    if (
      (option.id === "mountain" || option.type === "mountain") &&
      (option.mapX == null || option.mapY == null)
    ) {
      const m = await getMountainPosition(mountainName);
      if (m?.position) {
        option = {
          ...option,
          mapX: m.position.mapX,
          mapY: m.position.mapY,
          location: m.location ?? option.location,
        };
      } else {
        Alert.alert("알림", "산 좌표를 찾을 수 없습니다.");
      }
    }
    setSelectedDestination(option);
  };

  const renderDestinationSelector = () => {
    const options = getDestinationOptions();
    return (
      <View
        style={[
          styles.destinationSelector,
          { backgroundColor: themeColors.card },
        ]}>
        <Text style={[styles.selectorTitle, { color: themeColors.text }]}>
          🎯 최종 목적지 선택
        </Text>
        <Text style={[styles.selectorSubtitle, { color: themeColors.text }]}>
          어디를 최종 목적지로 설정하시겠습니까?
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.destinationOption,
                {
                  borderColor:
                    selectedDestination?.id === option.id
                      ? option.color
                      : "#ddd",
                  borderWidth: selectedDestination?.id === option.id ? 3 : 1,
                  backgroundColor:
                    selectedDestination?.id === option.id
                      ? option.color + "20"
                      : "white",
                },
              ]}
              onPress={() => handleDestinationSelect(option)}>
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={[styles.optionCategory, { color: option.color }]}>
                {option.category}
              </Text>
              <Text style={styles.optionName} numberOfLines={2}>
                {option.name}
              </Text>
              {selectedDestination?.id === option.id && (
                <View
                  style={[
                    styles.selectedBadge,
                    { backgroundColor: option.color },
                  ]}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!selectedDestination && (
          <View style={styles.selectionPrompt}>
            <Text style={[styles.promptText, { color: "#FF6B6B" }]}>
              ⚠️ 최종 목적지를 선택해주세요
            </Text>
          </View>
        )}
      </View>
    );
  };

  // 두 지점 간의 거리를 계산하는 함수 (haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance); // km 단위로 반올림
  };

  // 최적 경로 데이터를 기반으로 경유지별 경로 정보를 생성하는 함수
  const generateRouteSteps = () => {
    if (!optimalRouteData || !currentLocation || !selectedDestination) {
      return [];
    }

    const steps = [];
    let prevPoint = {
      name: "현재 위치",
      x: currentLocation.mapX,
      y: currentLocation.mapY,
      icon: "📍",
    };

    // 출발지 추가
    steps.push({
      id: "start",
      name: prevPoint.name,
      location: "출발지",
      icon: prevPoint.icon,
      distance: 0,
      isStart: true,
    });

    // waypoints가 있으면 경유지로 추가
    if (
      optimalRouteData.data?.waypoints &&
      optimalRouteData.data.waypoints.length > 0
    ) {
      optimalRouteData.data.waypoints.forEach((waypoint, index) => {
        const distance = calculateDistance(
          prevPoint.y,
          prevPoint.x,
          waypoint.y,
          waypoint.x
        );

        steps.push({
          id: `waypoint_${index}`,
          name: waypoint.name,
          location: "경유지",
          distance: distance,
          isWaypoint: true,
        });

        prevPoint = waypoint;
      });
    }

    // 최종 목적지 추가
    if (selectedDestination.mapX && selectedDestination.mapY) {
      const finalDistance = calculateDistance(
        prevPoint.y,
        prevPoint.x,
        selectedDestination.mapY,
        selectedDestination.mapX
      );

      steps.push({
        id: "destination",
        name: selectedDestination.name,
        location: selectedDestination.location,
        icon: selectedDestination.icon || "🎯",
        distance: finalDistance,
        isDestination: true,
      });
    }

    return steps;
  };

  const renderTravelPlanSummary = () => {
    if (parsedTravelPlan.length === 0) return null;
    return (
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: themeColors.card },
        ]}>
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
          <View
            style={[
              styles.finalDestination,
              { backgroundColor: selectedDestination.color + "20" },
            ]}>
            <Text
              style={[
                styles.finalDestinationLabel,
                { color: selectedDestination.color },
              ]}>
              🎯 최종 목적지: {selectedDestination.name}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleDecideRoute = async () => {
    if (!selectedRoute || !selectedDestination || !optimalRouteData) {
      Alert.alert("알림", "먼저 경로를 선택해주세요.");
      return;
    }

    try {
      // formatRouteData를 사용하여 기본 경로 데이터 생성
      const baseRouteData = await formatRouteData(selectedDestination, true);
      console.log("baseRouteData ", baseRouteData);

      if (!baseRouteData) {
        Alert.alert("오류", "경로 데이터를 생성할 수 없습니다.");
        return;
      }

      return baseRouteData;
    } catch (error) {
      console.error("경로 데이터 생성 중 오류:", error);
      Alert.alert("오류", "경로 데이터를 준비하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#4CAF50" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
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
        <View
          style={[
            styles.destinationContainer,
            { backgroundColor: themeColors.card },
          ]}>
          <Text style={[styles.destinationTitle, { color: themeColors.text }]}>
            📍{" "}
            {selectedDestination
              ? `${selectedDestination.name}으로`
              : "목적지를 선택하여"}{" "}
            가는 길 안내
          </Text>
          <Text
            style={[styles.destinationSubtitle, { color: themeColors.text }]}>
            현재 위치에서 목적지까지 최적의 경로를 안내해드립니다
          </Text>
        </View>

        {/* 지도 영역 (Kakao JS SDK in WebView) */}
        <View style={styles.mapContainer}>
          {optimalRouteData?.data ||
          (selectedDestination?.mapX != null &&
            selectedDestination?.mapY != null) ? (
            <KakaoRouteWebView
              jsKey={process.env.EXPO_PUBLIC_KAKAO_JS_KEY}
              routeJson={
                // 1) 최적 경로가 있으면 그대로 사용 (서버 응답 형식 유지)
                optimalRouteData?.data || {
                  // 2) 아직 경로 계산 전이면, 현재위치→목적지만 표시
                  origin: currentLocation
                    ? {
                        x: currentLocation.mapX,
                        y: currentLocation.mapY,
                        name: "현재 위치",
                      }
                    : null,
                  destination: {
                    x: selectedDestination.mapX,
                    y: selectedDestination.mapY,
                    name: selectedDestination.name,
                  },
                  waypoints: [],
                }
              }
            />
          ) : (
            <View
              style={[
                styles.mapPlaceholder,
                { backgroundColor: themeColors.card },
              ]}>
              <Text style={{ textAlign: "center", marginTop: 80 }}>
                목적지를 선택하세요
              </Text>
            </View>
          )}
        </View>

        {/* 경로 선택 -> 경로 타임라인으로 변경 */}
        <View style={styles.routesContainer}>
          <Text style={[styles.routesTitle, { color: themeColors.text }]}>
            📍 최적 경로
          </Text>
          {renderRouteTimeline()}
        </View>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View
        style={[styles.actionContainer, { backgroundColor: themeColors.card }]}>
        <TouchableOpacity
          style={[styles.laterButton, { borderColor: themeColors.border }]}
          onPress={() => router.back()}>
          <Text style={[styles.laterButtonText, { color: themeColors.text }]}>
            나중에
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor:
                selectedRoute && selectedDestination ? "#4CAF50" : "#ccc",
              opacity: selectedRoute && selectedDestination ? 1 : 0.5,
            },
          ]}
          onPress={handleSavePlan}
          disabled={!selectedRoute || !selectedDestination || !selectedDate}>
          <Text style={styles.startButtonText}>🚀 시작</Text>
        </TouchableOpacity>
      </View>

      {/* 모달창 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.card },
            ]}>
            <Calendar
              onDayPress={(day) => {
                console.log("선택된 날", day);
                setSelectedDate(day.dateString);
              }}
              monthFormat={"yyyy MM"}
              hideExtraDays={true}
              firstDay={1}
            />

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: "#4CAF50" }]}
              onPress={closeModal}>
              <Text style={styles.modalCloseButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 24, color: "white", fontWeight: "bold" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  destinationSelector: { margin: 15, padding: 15, borderRadius: 12 },
  selectorTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  selectorSubtitle: { fontSize: 14, opacity: 0.7, marginBottom: 15 },
  optionsContainer: { flexDirection: "row" },
  destinationOption: {
    width: 120,
    height: 140,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  optionIcon: { fontSize: 30, marginBottom: 8 },
  optionCategory: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  optionName: { fontSize: 11, textAlign: "center", lineHeight: 14 },
  selectedBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBadgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  selectionPrompt: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  promptText: { fontSize: 14, fontWeight: "600" },
  summaryContainer: { margin: 15, marginTop: 0, padding: 15, borderRadius: 12 },
  summaryTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  summaryItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  summaryCategory: { fontSize: 14, fontWeight: "600", minWidth: 60 },
  summaryPlace: { fontSize: 14, flex: 1 },
  finalDestination: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  finalDestinationLabel: { fontSize: 16, fontWeight: "bold" },
  destinationContainer: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  destinationTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  destinationSubtitle: { fontSize: 14, opacity: 0.7, lineHeight: 20 },
  mapContainer: { margin: 15, height: 500 },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  routesContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  routesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
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
  routeDuration: { fontSize: 18, fontWeight: "bold" },
  routeCost: { fontSize: 16, fontWeight: "600" },
  routeDescription: { fontSize: 14, opacity: 0.7, marginBottom: 15 },
  stepsContainer: { paddingLeft: 10 },
  stepItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  stepText: { fontSize: 14, flex: 1 },
  selectedIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: { color: "white", fontSize: 12, fontWeight: "bold" },
  actionContainer: { flexDirection: "row", padding: 15, gap: 10 },
  laterButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  laterButtonText: { fontSize: 16, fontWeight: "600" },
  startButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  // 새로 추가되는 스타일들
  routeTimelineContainer: {
    marginTop: 10,
  },
  noRouteContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  noRouteText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  routeSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timelineContainer: {
    paddingHorizontal: 10,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  timelineLineContainer: {
    alignItems: "center",
    marginRight: 15,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timelineDotText: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: "#ddd",
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  timelineSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  travelInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  travelText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  routeActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  startRouteButton: {
    backgroundColor: "#4CAF50",
  },
  startRouteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.9,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
  },
  modalCloseButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
