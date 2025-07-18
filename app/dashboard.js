import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          대시보드
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          로그인 후에만 볼 수 있는 페이지입니다
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>
            통계
          </Text>
          <Text style={[styles.cardValue, { color: themeColors.tint }]}>
            123
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>
            알림
          </Text>
          <Text style={[styles.cardValue, { color: themeColors.tint }]}>5</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.tint }]}
      >
        <Text style={styles.buttonText}>작업하기</Text>
      </TouchableOpacity>

      <View style={styles.devNote}>
        <Text style={[styles.devNoteText, { color: themeColors.text }]}>
          🚧 개발 중: 이 페이지는 보통 로그인 후에만 접근 가능합니다
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
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  button: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  devNote: {
    margin: 20,
    padding: 15,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  devNoteText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
