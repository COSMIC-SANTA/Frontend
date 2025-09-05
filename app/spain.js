// MainScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Easing, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Line from "../assets/images/Line_1.svg";
import { mountainService, tourismService } from "../services/api";
import BottomNavBar from "./s_navigationbar";
import WeatherBox from "./s_weather";

const { width } = Dimensions.get("window");
const CATEGORIES = ["popular", "high", "low\nmountain", "activity\n(leisure)"];

const INTEREST_ENUM = {
  "popular": "POPULAR",
  "high": "HIGH",
  "low\nmountain": "LOW",
  "activity\n(leisure)": "ACTIVITY",
};


export default function MainScreen() {
  const router = useRouter();

  // 선택 카테고리(라벨)
  const [selectedCategory, setSelectedCategory] = useState("high");
  // 서버에 보낼 enum
  const interestEnum = useMemo(() => INTEREST_ENUM[selectedCategory], [selectedCategory]);

  // 서버 데이터 상태
  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const [clickedMap, setClickedMap] = useState({});

    const animValuesRef = useRef({});

    const getAnimValue = (name) => {
    if (!animValuesRef.current[name]) {
      animValuesRef.current[name] = new Animated.Value(0); // 0 = 이미지 보임, 1 = 콘텐츠 보임
    }
    return animValuesRef.current[name];
  };

  // 카테고리 변경 시 API 호출
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      if (!interestEnum) return;
      setLoading(true);
      setError("");
      try {
        const data = await mountainService.fetchByInterest(interestEnum, { signal: controller.signal });
        // data: [{ id, name, image }]
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

  const handleNavigation = (screen) => {
    router.push(`/${screen}`);
  };

  const handleCardPress = async (item) => {
    console.log(`handleCard 부분 ${item.name}`)
    const name = item.name;
    const anim = getAnimValue(name);

    if (clickedMap[name]?.clicked) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setClickedMap((prev) => {
          const copy = {...prev};
          delete copy[name];
          return copy;
        });
      });
      return;
    }
    try {
      // (옵션) 로딩 UI 추가하려면 여기에 상태 설정
      const res = await tourismService.clickBanner(item.name);
      // res: { data, message } 형태로 반환되도록 구현되어 있음
      const info = res?.data ?? { message: res?.message ?? "clicked" };

      // 상태 저장 후 보여주는 애니메이션 실행
      setClickedMap((prev) => ({
        ...prev,
        [name]: { clicked: true, info },
      }));

      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("clickBanner 에러:", err);
      // 실패 시 사용자에게 토스트나 간단한 알림을 추가해도 좋습니다.
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
        <View style={styles.cardInner}>
          <Animated.View 
            style={[
              styles.cardFace,
              styles.cardFront,
              {
                opacity: getAnimValue(item.name).interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0, 0],
                }),
                transform: [{
                  rotateY: getAnimValue(item.name).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  })
                }]
              }
            ]}
          >
            <Image
              source={item.image ? { uri: item.image } : require("../assets/images/namelessmountain.png")}
              style={styles.mountainImage}
            />
          </Animated.View>
                    {/* 뒷면 - 산 설명 */}
          <Animated.View 
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                opacity: getAnimValue(item.name).interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, 1],
                }),
                transform: [{
                  rotateY: getAnimValue(item.name).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '360deg'],
                  })
                }]
              }
            ]}
          >
            <ScrollView contentContainerStyle={styles.infoContainer}>
              <Text style={styles.infoTitle}>
                {clickedMap[item.name]?.info?.mountainName || item.name}
              </Text>
              
              <Text style={styles.infoText}>
                {clickedMap[item.name]?.info?.mntidetails || "산에 대한 정보를 불러오는 중..."}
              </Text>
              
              {clickedMap[item.name]?.info?.high && (
                <Text style={styles.infoDetail}>
                  높이: {clickedMap[item.name].info.high}m
                </Text>
              )}
              
              {clickedMap[item.name]?.info?.mntitop && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>특징</Text>
                  <Text style={styles.infoSectionText}>
                    {clickedMap[item.name].info.mntitop}
                  </Text>
                  </View>
              )}

              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  const location = clickedMap[item.name]?.info?.location;
                  const mountainName = clickedMap[item.name]?.info?.mountainName;
                  if (location) {
                    router.push(`/mountain-tourism?mountainName=${encodeURIComponent(mountainName)}&location=${encodeURIComponent(location)}&pageNo=1`);
                  } else {
                    console.log("location 정보가 없습니다.");
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
          </View>
      </TouchableOpacity>
      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 초록색 헤더 부분 시작 */}
        <View style={styles.headerContainer}>
          {/* 왼쪽 곡선 부분 */}
          <View style={{ position: "absolute", bottom: 10, left: -400, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} />
          </View>
          <View style={{ position: "absolute", bottom: 45, left: -400.5, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} />
          </View>

          {/* 오른쪽 곡선 부분 */}
          <View style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}>
            <Line width={width * 1.2} height={width * 0.5} style={{ transform: [{ translateX: width * 0.4 }] }} />
          </View>

          <View style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}>
            <Line width={width * 1.21} height={width * 0.5} style={{ transform: [{ translateX: width * 0.35 }] }} />
          </View>

          {/* 헤더 텍스트 부분 */}
          <View style={styles.textContainer}>
            <Text style={styles.line1}>Go</Text>
            <Text style={styles.line2}>to</Text>
            <Text style={styles.line3}>the</Text>
            <Text style={styles.line4}>mountain</Text>
          </View>

          {/* 톱니바퀴 아이콘 부분 */}
          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {/* 초록 헤더 영역 끝 */}

        {/* 왼쪽 위 사람 일러스트 */}
        <Image source={require("../assets/images/mainperson.png")} style={styles.personImage2} resizeMode="contain" />

        {/* 바디 영역 시작*/}
        <View style={styles.bodyContainer}>
          <View style={styles.wrapper}>
            {/* 사용자 인삿말 */}
            <Text style={styles.greeting}>Hi, Daniel!</Text>
            <Text style={styles.text2}>what is the main purpose of hiking?</Text>
          </View>

          <View style={styles.section}>
            {/* 카테고리 선택 */}
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

            {/* 산 배너 리스트 */}
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
                keyExtractor={(item) => item.id}
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

          {/* 임시 날씨 위젯 */}
          <WeatherBox />


          {/* 메달 리스트 */}
        </View>
        {/* 바디 영역 끝 */}
      </ScrollView>

      <BottomNavBar onNavigate={handleNavigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FBF1CF",
  },
  content: {
    //paddingBottom: 100,
  },
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
  textContainer: {
    flexDirection: "column",
    zIndex: 2,
  },
  line1: {
    fontSize: 40,
    color: "#000000",
    marginBottom: -20,
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
  },
  line2: {
    fontSize: 45,
    color: "#000000",
    marginBottom: -20,
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
  },
  line3: {
    fontSize: 45,
    marginBottom: -20,
    color: "#000000",
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
  },
  line4: {
    fontSize: 40,
    marginBottom: -20,
    color: "#000000",
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  settingsButton: {
    marginTop: 5,
    padding: 8,
  },
  personImage2: {
    position: "absolute",
    top: 40,
    right: 50,
    width: 200,
    height: 200,
    zIndex: 3,
  },
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
  image: {
    width: 200,
    height: 100,
    marginTop: 10,
  },
  greeting: {
    fontSize: 40,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    marginTop: 35,
    marginLeft: 30,
  },
  text2: {
    fontSize: 30,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#000",
    marginTop: 3,
    marginLeft: 30,
    opacity: 0.5,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 16,
    marginTop: 50,
    fontSize: 30,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
  },
  categoryWrapper: {
    alignItems: "center",
  },
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5C7145",
    marginTop: 50,
  },
  selectedCategory: {
    color: "#5C7145",
    fontWeight: "bold",
  },
  mountainImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardWrapper: {
    alignItems: "center",
    marginHorizontal: 10,
  },
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
  textContainer2: {
    flexDirection: "row",
    justifyContent: "space-start",
  },
  line5: {
    marginLeft: 50,
    marginTop: 30,
    fontSize: 32,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
  },
  line6: {
    marginLeft: 30,
    marginTop: 40,
    fontSize: 20,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    opacity: 0.5,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
  },
  cardFront: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  infoContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#325A2A",
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Snell Roundhand",
    color: "#333",
    textAlign: 'left',
    lineHeight: 16,
    marginBottom: 8,
  },
  infoDetail: {
    fontSize: 14,
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    color: "#325A2A",
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: '#e8f5e8',
    padding: 6,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 8,
  },
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
    textAlign: 'left',
    lineHeight: 14,
  },
  confirmButton: {
  backgroundColor: '#325A2A',
  padding: 10,
  borderRadius: 8,
  marginTop: 10,
  alignItems: 'center',
},
confirmButtonText: {
  color: 'white',
  fontSize: 14,
  fontFamily: "Snell Roundhand",
  fontWeight: "bold",
},
  medalList: {
    paddingHorizontal: 10,
    marginBottom: -20,
  },
  medalItem: {
    alignItems: "center",
    marginRight: 20,
    marginLeft: 10,
    marginTop: 30,
  },
  medal: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  medalcircle: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: "#325A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  medalTitle: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 2,
  },
});
