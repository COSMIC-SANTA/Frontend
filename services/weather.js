// 날씨 API 서비스
// OpenWeatherMap API 사용 예시

const WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY"; // 실제 API 키로 교체 필요
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export const weatherService = {
  // 현재 날씨 조회
  getCurrentWeather: async (city = "Seoul") => {
    try {
      // 실제 API 호출 (API 키가 필요)
      /*
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
      );
      const data = await response.json();
      
      return {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main.toLowerCase(),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        icon: data.weather[0].icon
      };
      */

      // 임시 데이터 (실제 API 연동 전까지 사용)
      const weatherConditions = ["sunny", "cloudy", "rainy", "snowy"];
      const randomCondition =
        weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

      const weatherDescriptions = {
        sunny: "맑음",
        cloudy: "흐림",
        rainy: "비",
        snowy: "눈",
      };

      return {
        location: city === "Seoul" ? "서울" : city,
        temperature: Math.floor(Math.random() * 20) - 5, // -5도 ~ 15도
        condition: randomCondition,
        description: weatherDescriptions[randomCondition],
        humidity: Math.floor(Math.random() * 40) + 40, // 40% ~ 80%
        windSpeed: Math.floor(Math.random() * 15) + 5, // 5 ~ 20 m/s
      };
    } catch (error) {
      console.error("날씨 정보 조회 실패:", error);
      throw error;
    }
  },

  // 위치 기반 날씨 조회
  getWeatherByCoords: async (latitude, longitude) => {
    try {
      // 실제 API 호출 예시
      /*
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
      );
      const data = await response.json();
      */

      // 임시 데이터
      return {
        location: "현재 위치",
        temperature: 8,
        condition: "sunny",
        description: "맑음",
        humidity: 65,
        windSpeed: 12,
      };
    } catch (error) {
      console.error("위치 기반 날씨 조회 실패:", error);
      throw error;
    }
  },

  // 5일 예보 조회
  getForecast: async (city = "Seoul") => {
    try {
      // 실제 API 호출 예시
      /*
      const response = await fetch(
        `${WEATHER_BASE_URL}/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
      );
      const data = await response.json();
      */

      // 임시 예보 데이터
      const forecast = [];
      for (let i = 0; i < 5; i++) {
        forecast.push({
          date: new Date(
            Date.now() + i * 24 * 60 * 60 * 1000
          ).toLocaleDateString("ko-KR"),
          temperature: Math.floor(Math.random() * 20) - 5,
          condition: ["sunny", "cloudy", "rainy"][
            Math.floor(Math.random() * 3)
          ],
          description: ["맑음", "흐림", "비"][Math.floor(Math.random() * 3)],
        });
      }

      return forecast;
    } catch (error) {
      console.error("날씨 예보 조회 실패:", error);
      throw error;
    }
  },
};

export default weatherService;
