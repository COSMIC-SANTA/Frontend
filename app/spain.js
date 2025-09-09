// app/MainScreen.js
import { baseMountainName } from "@/utils/mountain";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Line from "../assets/images/Line_1.svg";
import apiClient, {
  mountainService,
  tourismService,
  weatherService,
} from "../services/api";
import BottomNavBar from "./s_navigationbar";

/** Responsive helpers */
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

  const CARD_W = Math.min(
    260,
    Math.max(160, Math.floor(W * (isTablet ? 0.28 : 0.52)))
  );
  const CARD_H = Math.round(CARD_W * 1.5);

  const HEADER_PB = isTablet ? vscale(160) : isSmall ? vscale(96) : vscale(120);

  const PERSON_SIZE = Math.min(isTablet ? W * 0.22 : W * 0.38, 260);
  const PERSON_TOP = isSmall ? vscale(28) : vscale(36);
  const PERSON_RIGHT = isTablet ? scale(48) : scale(24);

  const BODY_CURVE = isTablet ? scale(72) : scale(60);
  const BODY_OVERLAP = -Math.min(HEADER_PB - vscale(20), vscale(110));

  const curveW = W * 1.2;
  const curveH = W * 0.5;
  const leftCurveBottom = vscale(10);
  const leftCurveLeft = -W * 0.9;
  const rightCurveBottom = -vscale(140);
  const rightCurveShift = W * 0.35;

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

const CATEGORIES = ["popular", "high", "low\nmountain", "activity\n(leisure)"];
const INTEREST_ENUM = {
  popular: "POPULAR",
  high: "HIGH",
  "low\nmountain": "LOW",
  "activity\n(leisure)": "ACTIVITY",
};

/** 좌표 보강 */
async function fetchCoordsByName(name) {
  const res = await apiClient.get("/api/mountains/search", {
    params: { mountainName: name },
  });
  const payload = res?.data;
  const list = Array.isArray(payload) ? payload : payload?.mountains ?? [];
  const found =
    list.find((m) => (m.mountainName ?? m.name) === name) || list[0] || {};
  const pos = found?.position ?? found?.pos ?? {};
  const x = Number(pos?.mapX ?? found?.mapX);
  const y = Number(pos?.mapY ?? found?.mapY);
  return {
    ok: Number.isFinite(x) && Number.isFinite(y) && !(x === 0 && y === 0),
    mapX: x,
    mapY: y,
  };
}

/** 서버 응답 정규화 */
function normalizeBannerInfo(raw) {
  if (!raw) return null;
  const obj = Array.isArray(raw) ? raw[0] : raw;

  const name =
    obj.mountainName ?? obj.name ?? obj.title ?? obj.mntiname ?? null;
  const details =
    obj.mntidetails ?? obj.details ?? obj.description ?? obj.summary ?? null;
  const height =
    obj.high ?? obj.height ?? obj.altitude ?? obj.elevation ?? null;
  const top = obj.mntitop ?? obj.feature ?? obj.point ?? obj.peak ?? null;
  const location =
    obj.location ?? obj.addr ?? obj.address ?? obj.region ?? null;

  return {
    mountainName: name,
    mntidetails: details,
    high: height,
    mntitop: top,
    location,
    __raw: obj,
  };
}

/** 배너 카드 */
function BannerCard({
  item,
  cardW,
  cardH,
  animValue,
  info,
  onPress,
  onClose,
  isBack,
  router,
  setOuterScrollEnabled, // ★ 부모 스크롤 제어 함수
}) {
  const frontOpacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const frontRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View style={styles.cardWrapper}>
      {/* 뒷면일 때는 탭-뒤집기 비활성화 → 스크롤 제스처와 충돌 방지 */}
      <TouchableOpacity
        style={[styles.card, { width: cardW, height: cardH }]}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
        disabled={isBack} // ★ 여기!
      >
        <View style={styles.cardInner}>
          {/* 앞면 */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFront,
              {
                opacity: frontOpacity,
                transform: [{ rotateY: frontRotate }],
              },
            ]}>
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : require("../assets/images/namelessmountain.png")
              }
              style={styles.mountainImage}
            />
          </Animated.View>

          {/* 뒷면 (내부 스크롤 독립 + 부모 스크롤 잠금/해제) */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                opacity: backOpacity,
                transform: [{ rotateY: backRotate }],
              },
            ]}
            pointerEvents="auto">
            {/* 닫기 버튼(뒤집기 복귀) */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close" size={18} color="#325A2A" />
            </TouchableOpacity>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.infoContainer}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              // ★ 터치/드래그 중 부모 스크롤 잠금
              onTouchStart={() => setOuterScrollEnabled(false)}
              onTouchEnd={() => setOuterScrollEnabled(true)}
              onScrollBeginDrag={() => setOuterScrollEnabled(false)}
              onScrollEndDrag={() => setOuterScrollEnabled(true)}
              onMomentumScrollEnd={() => setOuterScrollEnabled(true)}
              // 안드로이드에서 부모 캡처 방지
              onStartShouldSetResponderCapture={() => true}>
              {info ? (
                <>
                  <Text style={styles.infoTitle}>
                    {info.mountainName || item.name}
                  </Text>

                  <Text style={styles.infoText}>
                    {info.mntidetails || "요약 정보가 없습니다."}
                  </Text>

                  {info.high && (
                    <Text style={styles.infoDetail}>높이: {info.high}m</Text>
                  )}

                  {info.mntitop && (
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionTitle}>특징</Text>
                      <Text style={styles.infoSectionText}>{info.mntitop}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => {
                      // ① 요약 정보가 없으면 막기
                      if (!info?.mntidetails) {
                        Alert.alert(
                          "알림",
                          "해당 산은 관광공사에서 데이터를 준비 중입니다!"
                        );
                        return;
                      }
                      // ② 위치가 없으면 막기(안전)
                      const location = info?.location;
                      if (!location) {
                        Alert.alert(
                          "알림",
                          "이 산의 위치 정보가 없어 이동할 수 없습니다."
                        );
                        return;
                      }
                      const mountainName = baseMountainName(
                        info?.mountainName || item.name
                      );
                      router.push(
                        `/mountain-tourism?mountainName=${encodeURIComponent(
                          mountainName
                        )}&location=${encodeURIComponent(location)}&pageNo=1`
                      );
                    }}>
                    <Text style={styles.confirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.infoText}>
                  산에 대한 정보를 불러오는 중...
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Text style={styles.cardText}>{baseMountainName(item.name)}</Text>
    </View>
  );
}

export default function MainScreen() {
  const router = useRouter();
  const R = useResponsive();
  const [nickName, setNickName] = useState("");

  const loadNickName = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem("nickName");
      if (v) setNickName(v);
    } catch {}
  }, []);

  useEffect(() => {
    loadNickName();
  }, [loadNickName]);
  useFocusEffect(
    useCallback(() => {
      loadNickName();
    }, [loadNickName])
  );

  const [selectedCategory, setSelectedCategory] = useState("high");
  const interestEnum = useMemo(
    () => INTEREST_ENUM[selectedCategory],
    [selectedCategory]
  );

  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 부모 스크롤 제어 상태 ★
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  // 배너 상태/애니메이션
  const [clickedMap, setClickedMap] = useState({});
  const animValuesRef = useRef({});
  const getAnimValue = (name) => {
    if (!animValuesRef.current[name]) {
      animValuesRef.current[name] = new Animated.Value(0); // 0=앞, 1=뒤
    }
    return animValuesRef.current[name];
  };

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!interestEnum) return;
      setLoading(true);
      setError("");
      try {
        const data = await mountainService.fetchByInterest(interestEnum, {
          signal: controller.signal,
        });
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

  // 날씨 상태
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
        const list = await weatherService.searchMountainsByName(query.trim(), {
          signal: controller.signal,
        });
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
      let x = Number(item.mapX);
      let y = Number(item.mapY);
      if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) {
        const { ok, mapX, mapY } = await fetchCoordsByName(item.mountainName);
        if (!ok) throw new Error("좌표를 찾지 못했습니다.");
        x = mapX;
        y = mapY;
      }
      setSelectedMountain((prev) => ({ ...(prev || item), mapX: x, mapY: y }));
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

  /** 배너 클릭 핸들러 */
  const handleCardPress = async (item) => {
    const name = item.name;
    const anim = getAnimValue(name);

    // 뒤집힌 상태면 복귀
    if (clickedMap[name]?.clicked) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setClickedMap((prev) => {
          const copy = { ...prev };
          delete copy[name];
          return copy;
        });
      });
      return;
    }

    try {
      const payload = await tourismService.clickBanner(item.name);
      const info = normalizeBannerInfo(payload);
      setClickedMap((prev) => ({ ...prev, [name]: { clicked: true, info } }));

      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setClickedMap((prev) => ({
        ...prev,
        [name]: { clicked: true, info: null, error: err.message },
      }));
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCloseBack = (name) => {
    const anim = getAnimValue(name);
    Animated.timing(anim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setClickedMap((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      // 혹시 잠겨 있으면 풀기
      setOuterScrollEnabled(true);
    });
  };

  const renderCard = ({ item }) => {
    const isBack = !!clickedMap[item.name]?.clicked;
    return (
      <BannerCard
        item={item}
        cardW={R.CARD_W}
        cardH={R.CARD_H}
        animValue={getAnimValue(item.name)}
        info={clickedMap[item.name]?.info}
        onPress={handleCardPress}
        onClose={() => handleCloseBack(item.name)}
        isBack={isBack}
        router={router}
        setOuterScrollEnabled={setOuterScrollEnabled} // ★ 전달
      />
    );
  };

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
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={outerScrollEnabled} // ★ 부모 스크롤 on/off
      >
        {/* 헤더 */}
        <View style={[styles.headerContainer, { paddingBottom: R.HEADER_PB }]}>
          <View
            style={{
              position: "absolute",
              bottom: R.leftCurveBottom,
              left: R.leftCurveLeft,
              zIndex: -1,
            }}>
            <Line width={R.curveW} height={R.curveH} />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: R.leftCurveBottom + 35,
              left: R.leftCurveLeft + 0.5,
              zIndex: -1,
            }}>
            <Line width={R.curveW} height={R.curveH} />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: R.rightCurveBottom,
              right: 0,
              zIndex: -1,
            }}>
            <Line
              width={R.curveW}
              height={R.curveH}
              style={{ transform: [{ translateX: R.rightCurveShift }] }}
            />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: R.rightCurveBottom,
              right: 0,
              zIndex: -1,
            }}>
            <Line
              width={R.curveW * 1.005}
              height={R.curveH}
              style={{
                transform: [{ translateX: R.rightCurveShift - R.W * 0.03 }],
              }}
            />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.line,
                { fontSize: R.f(40), marginBottom: -R.f(12) },
              ]}>
              Go
            </Text>
            <Text
              style={[
                styles.line,
                { fontSize: R.f(44), marginBottom: -R.f(12) },
              ]}>
              to
            </Text>
            <Text
              style={[
                styles.line,
                { fontSize: R.f(44), marginBottom: -R.f(12) },
              ]}>
              the
            </Text>
            <Text
              style={[
                styles.line,
                { fontSize: R.f(40), marginBottom: -R.f(12) },
              ]}>
              mountain
            </Text>
          </View>

          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={R.f(28)} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 사람 이미지 */}
        <Image
          source={require("../assets/images/mainperson.png")}
          style={{
            position: "absolute",
            top:
              Platform.OS === "web"
                ? R.PERSON_TOP + R.HEADER_PB - R.PERSON_SIZE * 0.45
                : R.PERSON_TOP + R.HEADER_PB - R.PERSON_SIZE * 0.35,
            right:
              Platform.OS === "web"
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
          ]}>
          <View style={styles.wrapper}>
            <Text
              style={[
                styles.greeting,
                { fontSize: R.f(34), marginTop: R.f(28), marginLeft: R.f(24) },
              ]}>
              Hi, {nickName || "Everyone"}
            </Text>
            <Text
              style={[
                styles.text2,
                { fontSize: R.f(18), marginLeft: R.f(24) },
              ]}>
              what is the main purpose of hiking?
            </Text>
          </View>

          {/* 카테고리 & 배너 */}
          <View style={[styles.section, { marginTop: R.f(8) }]}>
            <View
              style={[
                styles.categoryRow,
                { paddingHorizontal: R.f(16), marginVertical: R.f(8) },
              ]}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}>
                  <View style={styles.categoryWrapper}>
                    {selectedCategory === cat && (
                      <View style={[styles.dot, { marginTop: R.f(36) }]} />
                    )}
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          fontSize: R.f(16),
                          lineHeight: R.f(20),
                          marginHorizontal: R.f(10),
                          marginTop: R.f(10),
                        },
                        selectedCategory === cat && styles.selectedCategory,
                      ]}>
                      {cat}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
            ) : error ? (
              <Text style={{ textAlign: "center", marginVertical: 16 }}>
                {error}
              </Text>
            ) : mountains.length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16 }}>
                해당 카테고리의 산이 없습니다.
              </Text>
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
                nestedScrollEnabled={true}
              />
            )}
          </View>

          {/* --- 날씨 검색/표시 영역 --- */}
          <View
            style={[
              styles.weatherSection,
              { paddingHorizontal: R.f(20), marginTop: R.f(20) },
            ]}>
            <Text
              style={[
                styles.weatherTitle,
                { fontSize: R.f(22), marginBottom: R.f(10) },
              ]}>
              Search mountain weather
            </Text>
            <View
              style={[
                styles.searchRow,
                {
                  borderRadius: R.f(14),
                  paddingHorizontal: R.f(12),
                  paddingVertical: R.f(10),
                },
              ]}>
              <Ionicons
                name="search"
                size={R.f(18)}
                color="#5C7145"
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { fontSize: R.f(15), paddingVertical: 2 },
                ]}
                value={query}
                onChangeText={setQuery}
                placeholder="산 이름을 입력하세요 (예: 지리산, 설악산)"
                placeholderTextColor="#9BAA8C"
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searching && <ActivityIndicator size="small" />}
            </View>
            {searchError ? (
              <Text style={styles.errorText}>{searchError}</Text>
            ) : null}

            {candidates.length > 0 && (
              <View
                style={[
                  styles.dropdown,
                  { borderRadius: R.f(14), maxHeight: 240 },
                ]}>
                {candidates.map((item, idx) => (
                  <TouchableOpacity
                    key={String(idx)}
                    style={[
                      styles.dropdownItem,
                      { paddingHorizontal: R.f(12), paddingVertical: R.f(12) },
                    ]}
                    onPress={() => handlePickMountain(item)}>
                    <Ionicons
                      name="pin-outline"
                      size={R.f(16)}
                      color="#325A2A"
                      style={{ marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.dropdownName, { fontSize: R.f(15) }]}>
                        {item.mountainName}
                      </Text>
                      <Text
                        style={[styles.dropdownAddr, { fontSize: R.f(12) }]}
                        numberOfLines={1}>
                        {item.mountainAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View
              style={[
                styles.weatherCard,
                { padding: R.f(14), borderRadius: R.f(18), marginTop: R.f(12) },
              ]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}>
                <Ionicons
                  name="trail-sign-outline"
                  size={R.f(18)}
                  color="#325A2A"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.selectedTitle, { fontSize: R.f(18) }]}>
                  {selectedMountain
                    ? selectedMountain.mountainName
                    : "산을 선택하세요"}
                </Text>
              </View>

              {selectedMountain && (
                <Text style={[styles.coordText, { fontSize: R.f(12) }]}>
                  {Number.isFinite(Number(selectedMountain.mapY)) &&
                  Number.isFinite(Number(selectedMountain.mapX)) &&
                  !(
                    Number(selectedMountain.mapX) === 0 &&
                    Number(selectedMountain.mapY) === 0
                  )
                    ? `(${Number(selectedMountain.mapY).toFixed(5)}, ${Number(
                        selectedMountain.mapX
                      ).toFixed(5)})`
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
                    <Ionicons
                      name="thermometer-outline"
                      size={R.f(22)}
                      color="#000"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.tempText, { fontSize: R.f(22) }]}>
                      {typeof weather.temperature === "number"
                        ? `${weather.temperature.toFixed(1)}°C`
                        : "-"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={
                        weather.weatherCode === "RAIN"
                          ? "rainy-outline"
                          : weather.weatherCode === "CLEAR" ||
                            weather.weatherCode === "CLEAN"
                          ? "sunny-outline"
                          : weather.weatherCode === "SNOW"
                          ? "snow-outline"
                          : weather.weatherCode === "RAIN_SNOW" ||
                            weather.weatherCode === "RAINDROPS" ||
                            weather.weatherCode === "RAIN_SNOW_DROPS"
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
                    <Text style={[styles.codeText, { fontSize: R.f(18) }]}>
                      {weatherLabel(weather.weatherCode)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.helperText, { fontSize: R.f(12) }]}>
                  검색 후 목록에서 산을 선택하면 현재 날씨가 표시됩니다.
                </Text>
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
  },

  textContainer: { flexDirection: "column", zIndex: 2 },
  line: { color: "#000000", fontWeight: "bold", fontFamily: "Snell Roundhand" },

  rightContainer: { alignItems: "flex-end" },
  settingsButton: { marginTop: 5, padding: 8 },

  bodyContainer: {
    width: "100%",
    backgroundColor: "#FFF9E5",
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

  // 카드 공통
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
  mountainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardText: {
    fontSize: 16,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    marginTop: 8,
    color: "#000",
    textTransform: "lowercase",
  },

  // 배너 스타일
  cardInner: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden", // ★ 이미지/앞뒤면을 카드 안에 깔끔히 클립
    borderRadius: 20, // ★ 카드와 동일 반경
  },
  cardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // ★ 부모(cardInner) 꽉 채우기
    backfaceVisibility: "hidden",
    borderRadius: 20,
  },
  cardFront: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cardBack: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },

  // 뒷면 close 버튼
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 5,
    backgroundColor: "#E6F1E6",
    borderRadius: 12,
    padding: 6,
  },

  infoContainer: {
    flexGrow: 1,
    paddingTop: 28, // close 버튼 공간
    paddingBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#325A2A",
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Snell Roundhand",
    color: "#333",
    textAlign: "left",
    lineHeight: 16,
    marginBottom: 8,
  },
  infoDetail: {
    fontSize: 14,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#325A2A",
    textAlign: "center",
    marginBottom: 8,
    backgroundColor: "#e8f5e8",
    padding: 6,
    borderRadius: 8,
  },
  infoSection: { marginTop: 8 },
  infoSectionTitle: {
    fontSize: 14,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#325A2A",
    marginBottom: 4,
  },
  infoSectionText: {
    fontSize: 11,
    fontFamily: "Snell Roundhand",
    color: "#666",
    textAlign: "left",
    lineHeight: 14,
  },
  confirmButton: {
    backgroundColor: "#325A2A",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
  },

  // 날씨
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
  weatherInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tempText: { fontWeight: "900" },
  codeText: { fontWeight: "800" },
  helperText: { color: "#666", marginTop: 6 },
  errorText: { color: "#C43D3D", marginTop: 8 },
});
