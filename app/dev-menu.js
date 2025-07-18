import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DevMenuScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const devPages = [
    {
      name: "main",
      title: "메인 페이지",
      description: "로그인 후 첫 화면, 인기 산 추천 및 날씨 정보",
    },
    {
      name: "login",
      title: "로그인 페이지",
      description: "사용자 로그인 화면",
    },
    {
      name: "dashboard",
      title: "대시보드",
      description: "로그인 후 메인 화면",
    },
    {
      name: "mountain-tourism",
      title: "산 주변 관광 스팟 추천",
      description: "지리산 주변 관광지, 맛집, 카페, 숙박 추천",
    },
    {
      name: "mountain-direction",
      title: "산으로 가는 길 안내",
      description: "선택한 산으로 가는 최적 경로 안내",
    },
    {
      name: "optimal-route",
      title: "최적 여행 코스 제공",
      description: "선택 스팟들의 최적 여행 코스 및 경로",
    },
    { name: "(tabs)", title: "탭 네비게이션", description: "기본 홈 화면" },
  ];

  const navigateToPage = (pageName) => {
    router.push(`/${pageName}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          🛠️ 개발자 메뉴
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          개발 중인 모든 페이지에 빠르게 접근할 수 있습니다
        </Text>
      </View>

      <View style={styles.pageList}>
        {devPages.map((page, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => navigateToPage(page.name)}
          >
            <Text style={[styles.pageTitle, { color: themeColors.text }]}>
              {page.title}
            </Text>
            <Text style={[styles.pageDescription, { color: themeColors.text }]}>
              {page.description}
            </Text>
            <Text style={[styles.pagePath, { color: themeColors.tint }]}>
              /{page.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.note}>
        <Text style={[styles.noteText, { color: themeColors.text }]}>
          💡 팁: 이 메뉴는 개발 중에만 사용하세요. 배포 시에는 제거하거나 숨겨야
          합니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  pageList: {
    padding: 20,
  },
  pageCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  pageDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 10,
  },
  pagePath: {
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  note: {
    margin: 20,
    padding: 15,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
