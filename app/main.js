import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { weatherService } from "@/services/weather";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MainScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");

  // 인기 산 데이터
  const popularMountains = [
    {
      id: "jirisan",
      name: "지리산",
      image: "https://via.placeholder.com/300x200/4CAF50/white?text=지리산",
      description: "한국의 명산, 아름다운 자연경관",
      difficulty: "high",
      tags: ["high mountain", "low mountain", "flower viewing", "activity"],
    },
    {
      id: "seoraksan",
      name: "설악산",
      image: "https://via.placeholder.com/300x200/2196F3/white?text=설악산",
      description: "단풍과 설경이 아름다운 국립공원",
      difficulty: "high",
      tags: ["high mountain", "flower viewing", "activity"],
    },
    {
      id: "songnisan",
      name: "속리산",
      image: "https://via.placeholder.com/300x200/FF9800/white?text=속리산",
      description: "법주사와 정이품송으로 유명",
      difficulty: "low",
      tags: ["low mountain", "flower viewing", "activity"],
    },
    {
      id: "hallasan",
      name: "한라산",
      image: "https://via.placeholder.com/300x200/9C27B0/white?text=한라산",
      description: "제주도 최고봉, 백록담 화산호",
      difficulty: "high",
      tags: ["high mountain", "flower viewing", "activity"],
    },
  ];

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async (location = "Seoul") => {
    try {
      setWeatherLoading(true);
      // 실제 날씨 서비스 사용
      const weatherData = await weatherService.getCurrentWeather(location);
      setWeather(weatherData);
    } catch (error) {
      console.error("날씨 정보 로드 실패:", error);
      // 실패 시 기본 데이터 사용
      setWeather({
        location: location === "Seoul" ? "서울" : location,
        temperature: 5,
        condition: "sunny",
        description: "맑음",
        humidity: 65,
        windSpeed: 12,
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSearchWeather = () => {
    if (searchLocation.trim()) {
      loadWeatherData(searchLocation);
      setSearchLocation("");
    }
  };

  const navigateToMountain = (mountainId) => {
    // 선택한 산의 데이터를 전달하며 mountain-tourism 페이지로 이동
    router.push({
      pathname: "/mountain-tourism",
      params: { mountainId },
    });
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case "sunny":
        return "☀️";
      case "cloudy":
        return "☁️";
      case "rainy":
        return "🌧️";
      case "snowy":
        return "❄️";
      default:
        return "🌤️";
    }
  };

  const getDifficultyColor = (difficulty) => {
    return difficulty === "high" ? "#FF5722" : "#4CAF50";
  };

  const renderMountainCard = (mountain) => (
    <TouchableOpacity
      key={mountain.id}
      style={[styles.mountainCard, { backgroundColor: themeColors.card }]}
      onPress={() => navigateToMountain(mountain.id)}
    >
      <Image source={{ uri: mountain.image }} style={styles.mountainImage} />
      <View style={styles.mountainInfo}>
        <Text style={[styles.mountainName, { color: themeColors.text }]}>
          {mountain.name}
        </Text>
        <Text style={[styles.mountainDescription, { color: themeColors.text }]}>
          {mountain.description}
        </Text>
        <View style={styles.tagsContainer}>
          {mountain.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={[
                styles.tag,
                {
                  backgroundColor:
                    getDifficultyColor(mountain.difficulty) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: getDifficultyColor(mountain.difficulty) },
                ]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#4CAF50" }]}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>🏔️ 산길 동행</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/dev-menu")}
          >
            <Text style={styles.settingsIcon}>🛠️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Go</Text>
          <Text style={styles.greetingTextBold}>the mountain</Text>
        </View>

        <View style={styles.userGreeting}>
          <Text style={styles.userText}>Hi, Daniel</Text>
          <Text style={styles.questionText}>
            what is the main purpose of hiking?
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날씨 정보 */}
        <View
          style={[
            styles.weatherContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            🌤️ Weather
          </Text>

          {/* 날씨 검색 */}
          <View style={styles.weatherSearch}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="지역명 입력"
              placeholderTextColor={themeColors.text + "80"}
              value={searchLocation}
              onChangeText={setSearchLocation}
              onSubmitEditing={handleSearchWeather}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: "#4CAF50" }]}
              onPress={handleSearchWeather}
            >
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>

          {weatherLoading ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : weather ? (
            <View style={styles.weatherInfo}>
              <View style={styles.weatherHeader}>
                <Text style={[styles.location, { color: themeColors.text }]}>
                  📍 {weather.location}
                </Text>
                <Text style={styles.weatherIcon}>
                  {getWeatherIcon(weather.condition)}
                </Text>
              </View>

              <View style={styles.temperatureContainer}>
                <Text style={[styles.temperature, { color: themeColors.text }]}>
                  {weather.temperature}°
                </Text>
                <Text
                  style={[
                    styles.weatherDescription,
                    { color: themeColors.text },
                  ]}
                >
                  {weather.description}
                </Text>
              </View>

              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetail}>
                  <Text
                    style={[styles.detailLabel, { color: themeColors.text }]}
                  >
                    습도
                  </Text>
                  <Text style={[styles.detailValue, { color: "#4CAF50" }]}>
                    {weather.humidity}%
                  </Text>
                </View>
                <View style={styles.weatherDetail}>
                  <Text
                    style={[styles.detailLabel, { color: themeColors.text }]}
                  >
                    풍속
                  </Text>
                  <Text style={[styles.detailValue, { color: "#4CAF50" }]}>
                    {weather.windSpeed}m/s
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {/* 메인 페이지 설명 */}

        {/* 인기 산 추천 */}
        <View style={styles.mountainsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            🏔️ 인기 산 추천
          </Text>
          <View style={styles.mountainsGrid}>
            {popularMountains.map(renderMountainCard)}
          </View>
        </View>

        {/* 메달/뱃지 섹션 */}
        <View
          style={[styles.medalContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            🏅 Medal
          </Text>
          <Text style={[styles.medalSubtitle, { color: themeColors.text }]}>
            achieve your goals and collect your medals!
          </Text>

          <View style={styles.medalsGrid}>
            {["🥇", "🥈", "🥉", "🏅"].map((medal, index) => (
              <View
                key={index}
                style={[
                  styles.medalItem,
                  { backgroundColor: themeColors.background },
                ]}
              >
                <Text style={styles.medalIcon}>{medal}</Text>
              </View>
            ))}
          </View>

          <View style={styles.medalLabels}>
            <Text style={[styles.medalLabel, { color: themeColors.text }]}>
              special prize
            </Text>
            <Text style={[styles.medalLabel, { color: themeColors.text }]}>
              7week
            </Text>
            <Text style={[styles.medalLabel, { color: themeColors.text }]}>
              summit
            </Text>
            <Text style={[styles.medalLabel, { color: themeColors.text }]}>
              explore
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 바 */}
      <View style={[styles.bottomNav, { backgroundColor: themeColors.card }]}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  settingsButton: {
    padding: 5,
  },
  settingsIcon: {
    fontSize: 20,
    color: "white",
  },
  greeting: {
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 32,
    color: "white",
    fontWeight: "300",
  },
  greetingTextBold: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
  },
  userGreeting: {
    marginBottom: 10,
  },
  userText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  questionText: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  weatherContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  weatherSearch: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
  },
  weatherInfo: {
    alignItems: "center",
  },
  weatherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    marginRight: 10,
  },
  weatherIcon: {
    fontSize: 24,
  },
  temperatureContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
  },
  weatherDescription: {
    fontSize: 16,
    opacity: 0.7,
  },
  weatherDetails: {
    flexDirection: "row",
    gap: 30,
  },
  weatherDetail: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  mountainsSection: {
    marginBottom: 20,
  },
  mountainsGrid: {
    gap: 15,
  },
  mountainCard: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mountainImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  mountainInfo: {
    padding: 15,
  },
  mountainName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  mountainDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  medalContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 100,
    alignItems: "center",
  },
  medalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: "center",
  },
  medalsGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
  },
  medalItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  medalIcon: {
    fontSize: 24,
  },
  medalLabels: {
    flexDirection: "row",
    gap: 15,
  },
  medalLabel: {
    fontSize: 12,
    width: 60,
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
  },
  navIcon: {
    fontSize: 24,
  },
});
