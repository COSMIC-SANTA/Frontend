// app/MainScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import Line from "../assets/images/Line_1.svg";
import apiClient, { mountainService, weatherService } from "../services/api";
import BottomNavBar from "./s_navigationbar";

const CATEGORIES = ["popular", "high", "low\nmountain", "activity\n(leisure)"];

const INTEREST_ENUM = {
  popular: "POPULAR",
  high: "HIGH",
  "low\nmountain": "LOW",
  "activity\n(leisure)": "ACTIVITY",
};

const MEDALS = [
  { id: "1", title: "special prize", medal: require("../assets/images/greenmedal.png") },
  { id: "2", title: "7week", medal: require("../assets/images/yellowmedal.png") },
  { id: "3", title: "1month", medal: require("../assets/images/pinkmedal.png") },
  { id: "4", title: "explore", medal: require("../assets/images/redmedal.png") },
];

/** ─────────────────────────────────────────────
 *  Responsive helpers (no external libs)
 *  - 기준폭 375, 기준높이 812
 *  - scale, vscale, mscale 로 크기/폰트/여백 통일
 *  - 태블릿/초소형 기기 분기 포함
 *  ───────────────────────────────────────────── */
function useResponsive() {
  const { width: W, height: H, fontScale } = useWindowDimensions();
  const guidelineBaseWidth = 375;
  const guidelineBaseHeight = 812;

  const scale = (size) => Math.round((W / guidelineBaseWidth) * size);
  const vscale = (size) => Math.round((H / guidelineBaseHeight) * size);
  const mscale = (size, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

  const isSmall = W < 360;
  const isTablet = W >= 768;

  // 카드 크기: 화면폭의 비율 + 범위 클램프
  const CARD_W = Math.min(260, Math.max(160, Math.floor(W * (isTablet ? 0.28 : 0.52))));
  const CARD_H = Math.round(CARD_W * 1.5);

  // 헤더 높이/여백
  const HEADER_PB = isTablet ? vscale(160) : isSmall ? vscale(96) : vscale(120);

  // 사람 일러스트 크기/위치
  const PERSON_SIZE = Math.min(isTablet ? W * 0.22 : W * 0.38, 260);
  const PERSON_TOP = isSmall ? vscale(28) : vscale(36);
  const PERSON_RIGHT = isTablet ? scale(48) : scale(24);

  // 큰 타이틀 폰트
  const titleBase = isTablet ? 50 : isSmall ? 34 : 40;

  // body 라운드/오버랩
  const BODY_CURVE = isTablet ? scale(72) : scale(60);
  const BODY_OVERLAP = -Math.min(HEADER_PB - vscale(20), vscale(110));

  // 곡선 SVG(좌/우) 위치 파라미터 (절대값 대신 비율)
  const curveW = W * 1.2;
  const curveH = W * 0.5;
  const leftCurveBottom = vscale(10);
  const leftCurveLeft = -W * 0.9; // 화면 밖에서 시작
  const rightCurveBottom = -vscale(140);
  const rightCurveShift = W * 0.35;

  // 폰트 스케일 보정(시스템 글자 크게 설정 시 과도 확대 방지)
  const f = (size) => Math.round(mscale(size) / Math.min(fontScale, 1.2));

  return {
    W,
    H,
    isSmall,
    isTablet,
    CARD_W,
    CARD_H,
    HEADER_PB,
    PERSON_SIZE,
    PERSON_TOP,
    PERSON_RIGHT,
    BODY_CURVE,
    BODY_OVERLAP,
    curveW,
    curveH,
    leftCurveBottom,
    leftCurveLeft,
    rightCurveBottom,
    rightCurveShift,
    f,
  };
}

/** 좌표 보강: 이름으로 다시 검색해서 position.mapX/mapY 우선 사용(0,0 무효 처리) */
async function fetchCoordsByName(name) {
  const res = await apiClient.get("/api/mountains/search", { params: { mountainName: name } });
  const payload = res?.data;
  const list = Array.isArray(payload) ? payload : payload?.mountains ?? [];
  const found = list.find((m) => (m.mountainName ?? m.name) === name) || list[0] || {};
  const pos = found?.position ?? found?.pos ?? {};
  const x = Number(pos?.mapX ?? found?.mapX);
  const y = Number(pos?.mapY ?? found?.mapY);
  return { ok: Number.isFinite(x) && Number.isFinite(y) && !(x === 0 && y === 0), mapX: x, mapY: y };
}

function BannerCard({ item, cardW, cardH }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const rotate = useMemo(() => new Animated.Value(0), []);
  const frontInterpolate = rotate.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backInterpolate = rotate.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });

  const flipTo = (deg) => {
    Animated.spring(rotate, { toValue: deg, useNativeDriver: true, friction: 8, tension: 12 }).start();
  };

  const loadDetail = async () => {
    if (detail || loading) return;
    setLoading(true);
    setErr("");
    try {
      const data = await mountainService.fetchDetailByName(item.name);
      setDetail(data);
    } catch (e) {
      setErr(e.message || "상세 정보를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onPress = async () => {
    if (!isFlipped) {
      await loadDetail();
      setIsFlipped(true);
      flipTo(180);
    } else {
      setIsFlipped(false);
      flipTo(0);
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[styles.card, { width: cardW, height: cardH }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Front */}
        <Animated.View
          style={[
            styles.flipFront,
            { width: cardW, height: cardH, transform: [{ rotateY: frontInterpolate }] },
          ]}
        >
          <Image
            source={item.image ? { uri: item.image } : require("../assets/images/namelessmountain.png")}
            style={styles.mountainImage}
          />
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[
            styles.flipBack,
            { width: cardW, height: cardH, transform: [{ rotateY: backInterpolate }] },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="large" />
          ) : err ? (
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#C43D3D", marginBottom: 8 }}>{err}</Text>
              <TouchableOpacity onPress={loadDetail} style={styles.retryBtn}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : detail ? (
            <View>
              <Text style={styles.backTitle}>{detail.mountainName || item.name}</Text>
              {detail.mountainAddress ? <Text style={styles.backSub}>{detail.mountainAddress}</Text> : null}
              {detail.high ? <Text style={styles.backMeta}>고도: {detail.high}</Text> : null}
              {detail.mntidetails ? <Text style={styles.backBody} numberOfLines={5}>{detail.mntidetails}</Text> : null}
              {detail.mntitop ? <Text style={styles.backFoot} numberOfLines={2}>대표 봉우리: {detail.mntitop}</Text> : null}
            </View>
          ) : (
            <Text style={{ color: "#000" }}>상세 정보가 없습니다.</Text>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );
}

export default function MainScreen() {
  const router = useRouter();
  const R = useResponsive();

  const [selectedCategory, setSelectedCategory] = useState("high");
  const interestEnum = useMemo(() => INTEREST_ENUM[selectedCategory], [selectedCategory]);

  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!interestEnum) return;
      setLoading(true);
      setError("");
      try {
        const data = await mountainService.fetchByInterest(interestEnum, { signal: controller.signal });
        setMountains(data);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setError("산 목록을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [interestEnum]);

  const handleNavigation = (screen) => router.push(`/${screen}`);

  // --- 날씨 검색 상태 ---
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [candidates, setCandidates] = useState([]);

  const [selectedMountain, setSelectedMountain] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!query?.trim()) {
      setCandidates([]);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const list = await weatherService.searchMountainsByName(query.trim(), { signal: controller.signal });
        setCandidates(list);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setSearchError("산 검색 중 오류가 발생했습니다.");
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const handlePickMountain = async (item) => {
    setSelectedMountain(item);
    setQuery(item.mountainName);
    setCandidates([]);
    setWeather(null);
    setWeatherError("");
    setWeatherLoading(true);

    try {
      // 1) 기본 좌표 파싱
      let x = Number(item.mapX);
      let y = Number(item.mapY);

      // 2) 좌표 보강
      if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) {
        const { ok, mapX, mapY } = await fetchCoordsByName(item.mountainName);
        if (!ok) throw new Error("좌표를 찾지 못했습니다.");
        x = mapX; y = mapY;
      }

      // 3) UI 상태에도 보강 좌표 반영
      setSelectedMountain((prev) => ({ ...(prev || item), mapX: x, mapY: y }));

      // 4) 날씨 호출(POST)
      const res = await weatherService.getCurrentWeather({ mapX: x, mapY: y });
      setWeather(res);
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setWeatherError(e.message || "날씨 정보를 불러오지 못했습니다.");
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const renderCard = ({ item }) => <BannerCard item={item} cardW={R.CARD_W} cardH={R.CARD_H} />;

  const weatherLabel = (code) => {
    if (!code) return "-";
    const map = {
      CLEAR: "맑음",
      CLEAN: "맑음",
      CLOUDY: "구름",
      RAIN: "비",
      SNOW: "눈",
      FOG: "안개",
      DRIZZLE: "이슬비",
      THUNDER: "뇌우",
      RAIN_SNOW: "비/눈",
      RAINDROPS: "강한 비",
      RAIN_SNOW_DROPS: "진눈깨비",
      SNOW_DROPS: "강한 눈",
      X: "정보 없음",
    };
    return map[code] || code;
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
        {/* 헤더 */}
        <View style={[styles.headerContainer, { paddingBottom: R.HEADER_PB }]}>
          {/* 왼쪽 곡선 (비율 기반 배치) */}
          <View style={{ position: "absolute", bottom: R.leftCurveBottom, left: R.leftCurveLeft, zIndex: -1 }}>
            <Line width={R.curveW} height={R.curveH} />
          </View>
          <View style={{ position: "absolute", bottom: R.leftCurveBottom + 35, left: R.leftCurveLeft + 0.5, zIndex: -1 }}>
            <Line width={R.curveW} height={R.curveH} />
          </View>
          {/* 오른쪽 곡선 */}
          <View style={{ position: "absolute", bottom: R.rightCurveBottom, right: 0, zIndex: -1 }}>
            <Line width={R.curveW} height={R.curveH} style={{ transform: [{ translateX: R.rightCurveShift }] }} />
          </View>
          <View style={{ position: "absolute", bottom: R.rightCurveBottom, right: 0, zIndex: -1 }}>
            <Line width={R.curveW * 1.005} height={R.curveH} style={{ transform: [{ translateX: R.rightCurveShift - R.W * 0.03 }] }} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.line, { fontSize: R.f(40), marginBottom: -R.f(12) }]}>Go</Text>
            <Text style={[styles.line, { fontSize: R.f(44), marginBottom: -R.f(12) }]}>to</Text>
            <Text style={[styles.line, { fontSize: R.f(44), marginBottom: -R.f(12) }]}>the</Text>
            <Text style={[styles.line, { fontSize: R.f(40), marginBottom: -R.f(12) }]}>mountain</Text>
          </View>

          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={R.f(28)} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <Image
  source={require("../assets/images/mainperson.png")}
  style={{
    position: "absolute",
    // ✅ 모바일은 기존 값, 웹은 별도 보정
    top: Platform.OS === "web"
      ? R.PERSON_TOP + R.HEADER_PB - R.PERSON_SIZE * 0.45
      : R.PERSON_TOP + R.HEADER_PB - R.PERSON_SIZE * 0.35,
    right: Platform.OS === "web"
      ? R.PERSON_RIGHT + R.W * 0.08
      : R.PERSON_RIGHT + R.W * 0.02,
    width: R.PERSON_SIZE,
    height: R.PERSON_SIZE,
    zIndex: 3,
  }}
  resizeMode="contain"
/>



        {/* 바디 */}
        <View
          style={[
            styles.bodyContainer,
            {
              borderTopLeftRadius: R.BODY_CURVE,
              borderTopRightRadius: R.BODY_CURVE,
              marginTop: R.BODY_OVERLAP,
            },
          ]}
        >
          <View style={styles.wrapper}>
            <Text style={[styles.greeting, { fontSize: R.f(34), marginTop: R.f(28), marginLeft: R.f(24) }]}>
              Hi, Everyone!
            </Text>
            <Text style={[styles.text2, { fontSize: R.f(18), marginLeft: R.f(24) }]}>
              what is the main purpose of hiking?
            </Text>
          </View>

          {/* 카테고리 & 배너 */}
          <View style={[styles.section, { marginTop: R.f(8) }]}>
            <View style={[styles.categoryRow, { paddingHorizontal: R.f(16), marginVertical: R.f(8) }]}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} activeOpacity={0.8}>
                  <View style={styles.categoryWrapper}>
                    {selectedCategory === cat && <View style={[styles.dot, { marginTop: R.f(36) }]} />}
                    <Text
                      style={[
                        styles.categoryText,
                        { fontSize: R.f(16), lineHeight: R.f(20), marginHorizontal: R.f(10), marginTop: R.f(10) },
                        selectedCategory === cat && styles.selectedCategory,
                      ]}
                    >
                      {cat}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
            ) : error ? (
              <Text style={{ textAlign: "center", marginVertical: 16 }}>{error}</Text>
            ) : mountains.length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16 }}>해당 카테고리의 산이 없습니다.</Text>
            ) : (
              <FlatList
                horizontal
                data={mountains}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 10,
                  minWidth: R.W,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                snapToAlignment="start"
                decelerationRate={Platform.OS === "ios" ? 0 : 0.98}
                snapToInterval={R.CARD_W + 20}
                renderItem={renderCard}
                nestedScrollEnabled
              />
            )}
          </View>

          {/* --- 날씨 검색/표시 영역 --- */}
          <View style={[styles.weatherSection, { paddingHorizontal: R.f(20), marginTop: R.f(20) }]}>
            <Text style={[styles.weatherTitle, { fontSize: R.f(22), marginBottom: R.f(10) }]}>
              Search mountain weather
            </Text>

            {/* 검색 인풋 */}
            <View
              style={[
                styles.searchRow,
                {
                  borderRadius: R.f(14),
                  paddingHorizontal: R.f(12),
                  paddingVertical: R.f(10),
                },
              ]}
            >
              <Ionicons name="search" size={R.f(18)} color="#5C7145" style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { fontSize: R.f(15), paddingVertical: 2 }]}
                value={query}
                onChangeText={setQuery}
                placeholder="산 이름을 입력하세요 (예: 지리산, 설악산)"
                placeholderTextColor="#9BAA8C"
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searching && <ActivityIndicator size="small" />}
            </View>
            {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

            {/* 자동완성 드롭다운 */}
            {candidates.length > 0 && (
              <View style={[styles.dropdown, { borderRadius: R.f(14), maxHeight: R.vscale ? R.vscale(260) : 240 }]}>
                {candidates.map((item, idx) => (
                  <TouchableOpacity
                    key={String(idx)}
                    style={[styles.dropdownItem, { paddingHorizontal: R.f(12), paddingVertical: R.f(12) }]}
                    onPress={() => handlePickMountain(item)}
                  >
                    <Ionicons name="pin-outline" size={R.f(16)} color="#325A2A" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownName, { fontSize: R.f(15) }]}>{item.mountainName}</Text>
                      <Text style={[styles.dropdownAddr, { fontSize: R.f(12) }]} numberOfLines={1}>
                        {item.mountainAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 선택한 산 + 날씨 카드 */}
            <View style={[styles.weatherCard, { padding: R.f(14), borderRadius: R.f(18), marginTop: R.f(12) }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="trail-sign-outline" size={R.f(18)} color="#325A2A" style={{ marginRight: 6 }} />
                <Text style={[styles.selectedTitle, { fontSize: R.f(18) }]}>
                  {selectedMountain ? selectedMountain.mountainName : "산을 선택하세요"}
                </Text>
              </View>

              {selectedMountain && (
                <Text style={[styles.coordText, { fontSize: R.f(12) }]}>
                  {Number.isFinite(Number(selectedMountain.mapY)) &&
                  Number.isFinite(Number(selectedMountain.mapX)) &&
                  !(Number(selectedMountain.mapX) === 0 && Number(selectedMountain.mapY) === 0)
                    ? `(${Number(selectedMountain.mapY).toFixed(5)}, ${Number(selectedMountain.mapX).toFixed(5)})`
                    : "(좌표 없음)"}
                </Text>
              )}

              {weatherLoading ? (
                <ActivityIndicator size="large" style={{ marginTop: 12 }} />
              ) : weatherError ? (
                <Text style={styles.errorText}>{weatherError}</Text>
              ) : weather ? (
                <View style={[styles.weatherInfoRow, { marginTop: R.f(10) }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="thermometer-outline" size={R.f(22)} color="#000" style={{ marginRight: 6 }} />
                    <Text style={[styles.tempText, { fontSize: R.f(22) }]}>
                      {typeof weather.temperature === "number" ? `${weather.temperature.toFixed(1)}°C` : "-"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={
                        weather.weatherCode === "RAIN"
                          ? "rainy-outline"
                          : weather.weatherCode === "CLEAR" || weather.weatherCode === "CLEAN"
                          ? "sunny-outline"
                          : weather.weatherCode === "SNOW"
                          ? "snow-outline"
                          : weather.weatherCode === "RAIN_SNOW" || weather.weatherCode === "RAINDROPS" || weather.weatherCode === "RAIN_SNOW_DROPS"
                          ? "rainy-outline"
                          : weather.weatherCode === "FOG"
                          ? "cloudy-outline"
                          : weather.weatherCode === "DRIZZLE"
                          ? "water-outline"
                          : weather.weatherCode === "THUNDER"
                          ? "thunderstorm-outline"
                          : "cloud-outline"
                      }
                      size={R.f(22)}
                      color="#000"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.codeText, { fontSize: R.f(18) }]}>{weatherLabel(weather.weatherCode)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.helperText, { fontSize: R.f(12) }]}>검색 후 목록에서 산을 선택하면 현재 날씨가 표시됩니다.</Text>
              )}
            </View>
          </View>
          {/* --- 날씨 끝 --- */}
        </View>
      </ScrollView>

      <BottomNavBar onNavigate={handleNavigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FBF1CF" },
  content: {},

  headerContainer: {
    backgroundColor: "#325A2A",
    paddingTop: 10,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 1,
    // paddingBottom 은 런타임에서 반응형으로 주입
  },

  textContainer: { flexDirection: "column", zIndex: 2 },
  line: { color: "#000000", fontWeight: "bold", fontFamily: "Snell Roundhand" },

  rightContainer: { alignItems: "flex-end" },
  settingsButton: { marginTop: 5, padding: 8 },

  bodyContainer: {
    width: "100%",
    backgroundColor: "#FFF9E5",
    // borderTopRadius, marginTop 은 런타임에서 반응형으로 주입
    paddingBottom: 10,
    zIndex: 2,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },

  greeting: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
  },
  text2: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    opacity: 0.5,
  },

  section: { marginTop: 10 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 10,
  },
  categoryWrapper: { alignItems: "center" },
  categoryText: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    textTransform: "none",
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5C7145" },
  selectedCategory: { color: "#5C7145", fontWeight: "bold" },

  mountainImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 200 / 280, // 이미지 찌그러짐 방지
    borderRadius: 20,
  },
  cardWrapper: { alignItems: "center", marginHorizontal: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardText: {
    fontSize: 16,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    marginTop: 8,
    color: "#000",
    textTransform: "lowercase",
  },

  flipFront: {
    backfaceVisibility: "hidden",
    borderRadius: 20,
    overflow: "hidden",
  },
  flipBack: {
    position: "absolute",
    top: 0,
    left: 0,
    backfaceVisibility: "hidden",
    borderRadius: 20,
    overflow: "hidden",
    padding: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  retryBtn: {
    backgroundColor: "#5C7145",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backTitle: { fontSize: 16, fontWeight: "800", color: "#000", marginBottom: 6 },
  backSub: { fontSize: 12, color: "#666", marginBottom: 6 },
  backMeta: { fontSize: 12, color: "#333", marginBottom: 6 },
  backBody: { fontSize: 12, color: "#000", lineHeight: 18 },
  backFoot: { fontSize: 12, color: "#000", marginTop: 8 },

  // --- 날씨 영역 ---
  weatherSection: {},
  weatherTitle: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F3E6",
    borderWidth: 2,
    borderColor: "#E8E0C6",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#E8E0C6",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1EAD6",
  },
  dropdownName: { fontWeight: "700", color: "#1E1E1E" },
  dropdownAddr: { color: "#666", marginTop: 2 },

  weatherCard: {
    borderWidth: 2,
    borderColor: "#DCE8DF",
    backgroundColor: "#F0F7F3",
  },
  selectedTitle: { fontWeight: "700", color: "#325A2A" },
  coordText: { color: "#666", marginTop: 2 },
  weatherInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tempText: { fontWeight: "900" },
  codeText: { fontWeight: "800" },
  helperText: { color: "#666", marginTop: 6 },
  errorText: { color: "#C43D3D", marginTop: 8 },
});
