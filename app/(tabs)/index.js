import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Hello React Native!</ThemedText>
      <ThemedText style={styles.description}>
        이것은 기본적인 React Native 앱입니다.
      </ThemedText>
      <ThemedText>
        이 파일을 수정하여 앱의 내용을 변경할 수 있습니다.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  description: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
});
