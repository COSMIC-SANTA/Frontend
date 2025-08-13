import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Line from "../assets/images/Line_1.svg";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import BottomNavBar from "./s_navigationbar";
import { mountainService, weatherService } from "../services/api";

const { width } = Dimensions.get("window");
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

export default function MainScreen() {
  const router = useRouter();

  // --- 배너 카테고리 & 데이터 ---
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
        setMountains(data); // [{ id, name, image }]
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

  const handleNavigation = (screen) => {
    router.push(`/${screen}`);
  };

  // --- 날씨 검색 상태 ---
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [candidates, setCandidates] = useState([]); // [{ mountainName, mountainAddress, mapX, mapY }]

  const [selectedMountain, setSelectedMountain] = useState(null); // { mountainName, mountainAddress, mapX, mapY }
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weather, setWeather] = useState(null); // { temperature, weatherCode }

  // 산 이름 자동완성 (디바운스 350ms)
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
        setCandidates(list); // [{ mountainName, mountainAddress, mapX, mapY }]
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

  // 산 선택 → 좌표로 날씨 조회
  const handlePickMountain = async (item) => {
    setSelectedMountain(item);
    setQuery(item.mountainName);
    setCandidates([]);
    setWeather(null);
    setWeatherError("");
    setWeatherLoading(true);

    try {
      const res = await weatherService.getCurrentWeather({
        mapX: Number(item.mapX),
        mapY: Number(item.mapY),
      });
      // res = { message: "success", data: { temperature, weatherCode } } 형태일 수 있으니 필요시 가공
      setWeather(res);
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setWeatherError("날씨 정보를 불러오지 못했습니다.");
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card} onPress={() => console.log("Pressed", item.name)}>
        <Image
          source={item.image ? { uri: item.image } : require("../assets/images/namelessmountain.png")}
          style={styles.mountainImage}
        />
      </TouchableOpacity>
      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );

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
    };
    return map[code] || code;
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 초록색 헤더 부분 시작 */}
        <View style={styles.headerContainer}>
          {/* 왼쪽 곡선 */}
          <View style={{ position: "absolute", bottom: 10, left: -400, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} />
          </View>
          <View style={{ position: "absolute", bottom: 45, left: -400.5, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} />
          </View>
          {/* 오른쪽 곡선 */}
          <View style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} style={{ transform: [{ translateX: width * 0.4 }] }} />
          </View>
          <View style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}>
            <Line width={width * 1.21} height={width * 0.5} style={{ transform: [{ translateX: width * 0.35 }] }} />
          </View>

          {/* 헤더 텍스트 */}
          <View style={styles.textContainer}>
            <Text style={styles.line1}>Go</Text>
            <Text style={styles.line2}>to</Text>
            <Text style={styles.line3}>the</Text>
            <Text style={styles.line4}>mountain</Text>
          </View>

          {/* 설정 아이콘 */}
          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {/* 초록 헤더 끝 */}

        {/* 왼쪽 위 사람 일러스트 */}
        <Image source={require("../assets/images/mainperson.png")} style={styles.personImage2} resizeMode="contain" />

        {/* 바디 영역 */}
        <View style={styles.bodyContainer}>
          <View style={styles.wrapper}>
            <Text style={styles.greeting}>Hi, Daniel!</Text>
            <Text style={styles.text2}>what is the main purpose of hiking?</Text>
          </View>

          {/* 카테고리 & 배너 */}
          <View style={styles.section}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}>
                  <View style={styles.categoryWrapper}>
                    {selectedCategory === cat && <View style={styles.dot} />}
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.selectedCategory]}>{cat}</Text>
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
                  minWidth: width,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                renderItem={renderCard}
              />
            )}
          </View>

          {/* --- 날씨 검색/표시 영역 --- */}
          <View style={styles.weatherSection}>
            <Text style={styles.weatherTitle}>Search mountain weather</Text>

            {/* 검색 인풋 */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color="#5C7145" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="산 이름을 입력하세요 (예: 지리산, 설악산)"
                placeholderTextColor="#9BAA8C"
                returnKeyType="search"
              />
              {searching && <ActivityIndicator size="small" />}
            </View>
            {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

            {/* 자동완성 드롭다운 */}
            {candidates.length > 0 && (
              <View style={styles.dropdown}>
                <FlatList
                  data={candidates}
                  keyExtractor={(_, idx) => String(idx)}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handlePickMountain(item)}>
                      <Ionicons name="pin-outline" size={16} color="#325A2A" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownName}>{item.mountainName}</Text>
                        <Text style={styles.dropdownAddr} numberOfLines={1}>
                          {item.mountainAddress}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* 선택한 산 + 날씨 카드 */}
            <View style={styles.weatherCard}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="trail-sign-outline" size={18} color="#325A2A" style={{ marginRight: 6 }} />
                <Text style={styles.selectedTitle}>
                  {selectedMountain ? selectedMountain.mountainName : "산을 선택하세요"}
                </Text>
              </View>

              {selectedMountain && (
                <Text style={styles.coordText}>
                  ({Number(selectedMountain.mapY).toFixed(5)}, {Number(selectedMountain.mapX).toFixed(5)})
                </Text>
              )}

              {weatherLoading ? (
                <ActivityIndicator size="large" style={{ marginTop: 12 }} />
              ) : weatherError ? (
                <Text style={styles.errorText}>{weatherError}</Text>
              ) : weather ? (
                <View style={styles.weatherInfoRow}>
                  {/* 온도 */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="thermometer-outline" size={22} color="#000" style={{ marginRight: 6 }} />
                    <Text style={styles.tempText}>
                      {typeof weather.temperature === "number"
                        ? `${weather.temperature.toFixed(1)}°C`
                        : "-"}
                    </Text>
                  </View>

                  {/* 날씨 코드 + 아이콘 */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={
                        weather.weatherCode === "RAIN"
                          ? "rainy-outline"
                          : weather.weatherCode === "CLEAR"
                          ? "sunny-outline"
                          : weather.weatherCode === "CLEAN"
                          ? "sunny-outline"
                          : weather.weatherCode === "SNOW"
                          ? "snow-outline"
                          : weather.weatherCode === "RAIN_SNOW"
                          ? "rainy-outline"
                          : weather.weatherCode === "RAINDROPS"
                          ? "rainy-outline"
                          : weather.weatherCode === "FOG"
                          ? "cloudy-outline"
                          : weather.weatherCode === "DRIZZLE"
                          ? "water-outline"
                          : weather.weatherCode === "THUNDER"
                          ? "thunderstorm-outline"
                          : "cloud-outline"
                      }
                      size={22}
                      color="#000"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.codeText}>{weatherLabel(weather.weatherCode)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.helperText}>검색 후 목록에서 산을 선택하면 현재 날씨가 표시됩니다.</Text>
              )}
            </View>
          </View>
          {/* --- 날씨 끝 --- */}
        </View>
        {/* 바디 영역 끝 */}
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
    paddingBottom: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 1,
  },
  textContainer: { flexDirection: "column", zIndex: 2 },
  line1: { fontSize: 40, color: "#000000", marginBottom: -20, fontWeight: "bold", fontFamily: "Snell Roundhand" },
  line2: { fontSize: 45, color: "#000000", marginBottom: -20, fontWeight: "bold", fontFamily: "Snell Roundhand" },
  line3: { fontSize: 45, marginBottom: -20, color: "#000000", fontWeight: "bold", fontFamily: "Snell Roundhand" },
  line4: { fontSize: 40, marginBottom: -20, color: "#000000", fontWeight: "bold", fontFamily: "Snell Roundhand" },
  rightContainer: { alignItems: "flex-end" },
  settingsButton: { marginTop: 5, padding: 8 },
  personImage2: { position: "absolute", top: 40, right: 40, width: 200, height: 200, zIndex: 3 },

  bodyContainer: {
    width: "100%",
    backgroundColor: "#FFF9E5",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    marginTop: -100,
    paddingBottom: 10,
    zIndex: 2,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },

  image: { width: 200, height: 100, marginTop: 10 },
  greeting: {
    fontSize: 40,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    marginTop: 35,
    marginLeft: 30,
  },
  text2: {
    fontSize: 20,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    marginTop: 3,
    marginLeft: 30,
    opacity: 0.5,
  },

  section: { marginTop: 10 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 16,
    marginTop: 5,
  },
  categoryWrapper: { alignItems: "center" },
  categoryText: {
    fontSize: 18,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 10,
    marginBottom: 5,
    marginTop: 10,
    lineHeight: 22,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5C7145", marginTop: 50 },
  selectedCategory: { color: "#5C7145", fontWeight: "bold" },

  mountainImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardWrapper: { alignItems: "center", marginHorizontal: 10 },
  card: {
    width: 200,
    height: 300,
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

  // --- 날씨 영역 ---
  weatherSection: { marginTop: 24, paddingHorizontal: 20 },
  weatherTitle: {
    fontSize: 24,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F3E6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#E8E0C6",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    paddingVertical: 2,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E8E0C6",
    backgroundColor: "#FFF",
    maxHeight: 240,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EAD6",
  },
  dropdownName: { fontSize: 16, fontWeight: "700", color: "#1E1E1E" },
  dropdownAddr: { fontSize: 12, color: "#666", marginTop: 2 },

  weatherCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F0F7F3",
    borderWidth: 2,
    borderColor: "#DCE8DF",
  },
  selectedTitle: { fontSize: 18, fontWeight: "700", color: "#325A2A" },
  coordText: { fontSize: 12, color: "#666", marginTop: 2 },
  weatherInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  tempText: { fontSize: 22, fontWeight: "900" },
  codeText: { fontSize: 18, fontWeight: "800" },
  helperText: { fontSize: 12, color: "#666", marginTop: 6 },
  errorText: { color: "#C43D3D", marginTop: 8 },
});
