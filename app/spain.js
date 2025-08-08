import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Line from "../assets/images/Line_1.svg";
import BottomNavBar from "./s_navigationbar";
import WeatherBox from "./s_weather";

const { width } = Dimensions.get("window");
const CATEGORIES = [
  "high\nmountain",
  "low\nmountain",
  "flower\nviewing",
  "activity\n(leisure)",
];
const MOUNTAINS = [
  {
    id: "1",
    name: "seolaksan",
    category: "high\nmountain",
    mountainImage: require("../assets/images/jirisan.png"),
  },
  {
    id: "2",
    name: "jirisan",
    category: "high\nmountain",
    mountainImage: require("../assets/images/seolacksan.png"),
  },
  {
    id: "3",
    name: "jirisan",
    category: "high\nmountain",
    mountainImage: require("../assets/images/namelessmountain.png"),
  },
  {
    id: "4",
    name: "jirisan",
    category: "high\nmountain",
    mountainImage: require("../assets/images/jirisan.png"),
  },
  {
    id: "5",
    name: "jirisan",
    category: "high\nmountain",
    mountainImage: require("../assets/images/seolacksan.png"),
  },
  {
    id: "6",
    name: "jirisan",
    category: "low\nmountain",
    mountainImage: require("../assets/images/namelessmountain.png"),
  },
  {
    id: "7",
    name: "jirisan",
    category: "low\nmountain",
    mountainImage: require("../assets/images/jirisan.png"),
  },
  {
    id: "10",
    name: "hallasan",
    category: "popular",
    mountainImage: require("../assets/images/seolacksan.png"),
  },
];

const MEDALS = [
  {
    id: "1",
    title: "special prize",
    medal: require("../assets/images/greenmedal.png"),
  },
  {
    id: "2",
    title: "7week",
    medal: require("../assets/images/yellowmedal.png"),
  },
  {
    id: "3",
    title: "1month",
    medal: require("../assets/images/pinkmedal.png"),
  },
  {
    id: "4",
    title: "explore",
    medal: require("../assets/images/redmedal.png"),
  },
];

export default function MainScreen() {
  const [selectedCategory, setSelectedCategory] = useState("high\nmountain");
  const filteredMountains = MOUNTAINS.filter(
    (m) => m.category === selectedCategory
  );
  const router = useRouter();
  const handleNavigation = (screen) => {
    router.push(`/${screen}`);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* 초록색 헤더 부분 시작 */}
        <View style={styles.headerContainer}>
          {/* 왼쪽 곡선 부분 */}
          <View
            style={{ position: "absolute", bottom: 10, left: -400, zIndex: -1 }}
          >
            <Line width={width * 1.2} height={width * 0.5} />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 45,
              left: -400.5,
              zIndex: -1,
            }}
          >
            <Line width={width * 1.2} height={width * 0.5} />
          </View>

          {/* 오른쪽 곡선 부분 */}
          <View
            style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}
          >
            <Line
              width={width * 1.2}
              height={width * 0.5}
              style={{ transform: [{ translateX: width * 0.4 }] }}
            />
          </View>

          <View
            style={{ position: "absolute", bottom: -150, right: 0, zIndex: -1 }}
          >
            <Line
              width={width * 1.21}
              height={width * 0.5}
              style={{ transform: [{ translateX: width * 0.35 }] }}
            />
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
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => handleNavigation("setting")}
            >
              <Ionicons name="settings-outline" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>{" "}
        {/* 초록 헤더 영역 끝 */}
        {/* 왼쪽 위 사람 일러스트 */}
        <Image
          source={require("../assets/images/mainperson.png")}
          style={styles.personImage2}
          resizeMode="contain"
        />
        {/* 바디 영역 시작*/}
        <View style={styles.bodyContainer}>
          <View style={styles.wrapper}>
            {/* 사용자 인삿말 */}
            <Text style={styles.greeting}>Hi, Daniel!</Text>
            <Text style={styles.text2}>
              what is the main purpose of hiking?
            </Text>
          </View>

          <View style={styles.section}>
            {/* 카테고리 선택 */}
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={styles.categoryWrapper}>
                    {selectedCategory === cat && <View style={styles.dot} />}
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === cat && styles.selectedCategory,
                      ]}
                    >
                      {cat}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {/* 산 배너 리스트 */}
            <FlatList
              horizontal
              data={filteredMountains}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 10,
                minWidth: width,
                justifyContent: "center",
                alignItems: "center",
              }}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => console.log("Pressed", item.name)}
                  >
                    <Image
                      source={item.mountainImage}
                      style={styles.mountainImage}
                    />
                  </TouchableOpacity>
                  <Text style={styles.cardText}>{item.name}</Text>
                </View>
              )}
            />{" "}
          </View>

          {/* 임시 날씨 위젯 */}
          <WeatherBox />

          <View style={styles.textContainer2}>
            <Text style={styles.line5}>Medal</Text>
            <Text style={styles.line6}>
              Achieve your goals and collect your medals!
            </Text>
          </View>

          {/* 메달 리스트 */}
          <FlatList
            horizontal
            data={MEDALS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.medalList}
            renderItem={({ item }) => (
              <View style={styles.medalItem}>
                <View style={styles.medalcircle}>
                  <Image source={item.medal} style={styles.medal} />
                </View>
                <Text style={styles.medalTitle}>{item.title}</Text>
              </View>
            )}
          />
        </View>
        {/* 바디 영역 끝 */}
      </ScrollView>

      <BottomNavBar onNavigate={handleNavigation} />
    </View> /*메인 페이지 전체 body*/
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
    //paddingBottom: 100, //맨 아래 부분에 padding
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
    elevation: 5, // Android 그림자
  },
  medalTitle: {
    fontFamily: "Snell Roundhand",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 2,
  },
});
