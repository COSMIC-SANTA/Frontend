import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import * as Location from "expo-location";

export default function WeatherBox() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationName, setLocationName] = useState("Current Location");

  const fetchWeather = async (lat, lon, placeName = "Current Location") => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await res.json();
      setWeather(data.current_weather);
      setLocationName(placeName);
    } catch (error) {
      alert("날씨 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("위치 권한이 필요합니다.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    fetchWeather(location.coords.latitude, location.coords.longitude);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    Keyboard.dismiss();

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}`
      );
      const geoData = await geoRes.json();
      if (geoData?.results?.length > 0) {
        const { latitude, longitude, name } = geoData.results[0];
        fetchWeather(latitude, longitude, name);
      } else {
        alert("해당 도시를 찾을 수 없습니다.");
        setLoading(false);
      }
    } catch (err) {
      alert("검색 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.wrapper}>
      {/* 헤더 텍스트 + 배경 원 */}
      <View style={styles.header}>
      <View style={[styles.greenCircle, { marginLeft: 20, marginTop: 10, }]} />
        <View style={[styles.greenCircle, { marginLeft: 60, marginTop: 30, width:50, height:50, }]} />
        <Text style={styles.weatherTitle}>weather</Text>
      </View>

      <View style={styles.weatherContainer}>
        {/* 검색창 */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            placeholder="Enter a city (ex: Seoul)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
            <Text style={{ color: "#fff" }}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* 날씨 정보 */}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : weather ? (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.location}>{locationName}</Text>
            <Text style={styles.temp}>{weather.temperature}°</Text>
            <Text style={styles.detail}>Wind: {weather.windspeed} km/h</Text>
          </View>
        ) : (
          <Text>날씨 정보를 불러올 수 없습니다.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  header: {
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  greenCircle: {
    backgroundColor: "#325A2A",
    width: 60,
    height: 60,
    borderRadius: 30,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  weatherTitle: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
    color: "#000",
    zIndex: 1,
    marginLeft: 30,
    marginTop: 8,      
    marginBottom: -5,    
    lineHeight: 34,
  },
  weatherContainer: {
    backgroundColor: "#FBF1CF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  searchBox: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchBtn: {
    backgroundColor: "#325A2A",
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  location: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Snell Roundhand",
    marginBottom: 4,
  },
  temp: {
    fontSize: 44,
    fontWeight: "bold",
    fontFamily: "Snell Roundhand",
    color: "#222",
  },
  detail: {
    fontSize: 16,
    color: "#444",
    marginTop: 6,
  },
});
