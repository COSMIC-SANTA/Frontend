// app/SplashScreen.js
import { useRouter } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Line from "../../assets/images/Line_1.svg";

const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;
const hs = (size) => (width / guidelineBaseWidth) * size;
const vs = (size) => (height / guidelineBaseHeight) * size;
const ms = (size, factor = 0.5) => size + (hs(size) - size) * factor;

// ── 텍스트 테두리 컴포넌트 (겹쳐 그리기)
const StrokeText = memo(({ text, fillColor = "#F2ECD9", strokeColor = "#0F2A0B", strokeWidth = 2, style }) => {
  const offsets = [
    { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 },
  ];
  const sw = strokeWidth; // px
  return (
    <View style={{ position: "relative" }}>
      {offsets.map((o, i) => (
        <Text
          key={i}
          style={[
            style,
            {
              position: "absolute",
              left: o.x * sw,
              top: o.y * sw,
              color: strokeColor,
            },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text style={[style, { color: fillColor }]}>{text}</Text>
    </View>
  );
});

export default function SplashScreen() {
  const router = useRouter();

  const CAPTION = "GO TO THE MOUNTAIN";
  const BODY = "Do you want to\ntake a rest in\nnature?";
  const fullText = `${CAPTION}\n\n${BODY}`;

  const [typedText, setTypedText] = useState("");
  const textIndex = useRef(0);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      setTypedText((prev) => {
        const next = fullText.slice(0, textIndex.current + 1);
        textIndex.current += 1;
        return next;
      });
      if (textIndex.current >= fullText.length) clearInterval(typingInterval);
    }, 60); // 조금 더 경쾌하게
    const timeout = setTimeout(() => router.replace("/login"), 6000);
    return () => {
      clearInterval(typingInterval);
      clearTimeout(timeout);
    };
  }, []);

  // 타이핑된 텍스트를 캡션/본문으로 분리
  const captionPart = typedText.slice(0, Math.min(typedText.length, CAPTION.length));
  const bodyPart =
    typedText.length > CAPTION.length ? typedText.slice(CAPTION.length).replace(/^\n+/, "") : "";

  return (
    <SafeAreaView style={styles.container}>
      {/* 배경 라인 */}
      <View style={styles.linesLayer} pointerEvents="none">
        <View style={styles.lineBoxTop}>
          <Line width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </View>
        <View style={styles.lineBoxBottom}>
          <Line width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </View>
      </View>

      {/* 텍스트 블록 */}
      <View style={styles.textBlock}>
        {!!captionPart && (
          <StrokeText
            text={captionPart}
            strokeColor="#0F2A0B"
            fillColor="#FFF8E5"
            strokeWidth={1.5}
            style={styles.caption}
          />
        )}
        {!!bodyPart && <Text style={styles.title}>{bodyPart}</Text>}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.signUpButton} onPress={() => router.push("/signup")}>
          <Text style={styles.signup}>sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#325A2A" },

  // BG Lines
  linesLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center" },
  lineBoxTop: { position: "absolute", top: -vs(40), width: "130%", aspectRatio: 1.2, opacity: 0.9 },
  lineBoxBottom: { position: "absolute", top: vs(220), width: "130%", aspectRatio: 1.2, opacity: 0.9 },

  // 텍스트 영역
  textBlock: { position: "absolute", left: hs(24), top: vs(140), right: hs(24) },

  // ⬆️ 크기 키움
  caption: {
    fontSize: ms(28),        // 기존 24 → 28
    fontStyle: "italic",
    fontWeight: Platform.select({ ios: "600", android: "700" }),
    letterSpacing: 0.5,
    marginBottom: vs(10),
  },
  title: {
    color: "#000",
    fontSize: ms(40),        // 기존 34 → 40
    lineHeight: ms(46),      // 비례 확대
    fontWeight: Platform.select({ ios: "600", android: "700" }),
    fontFamily: Platform.select({
      ios: "Snell Roundhand",
      android: "sans-serif-medium",
      default: undefined,
    }),
  },

  // 하단 버튼
  bottomRow: {
    position: "absolute",
    left: hs(24),
    right: hs(24),
    bottom: vs(40), 
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: hs(16),
  },
  
  signUpButton: {
    flex: 1,
    minHeight: vs(56),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F2ECD9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  signup: { fontSize: ms(20), color: "#F2ECD9", fontStyle: "italic", fontWeight: "600" },
  loginButton: {
    width: vs(68),
    height: vs(68),
    borderRadius: 999,
    backgroundColor: "#FFF8E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  loginText: { fontSize: ms(20), fontWeight: "700", fontStyle: "italic", color: "#000" },
});
