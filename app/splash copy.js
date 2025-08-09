import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Line from "../assets/images/Line_1.svg";

const { width, height } = Dimensions.get("window");

// 아이폰 14 Pro 기준 화면 비율 (393 x 852)
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

// 반응형 크기 계산 함수
const wp = (percentage) => {
  return (width * percentage) / 100;
};

const hp = (percentage) => {
  return (height * percentage) / 100;
};

// 폰트 크기 조정 함수
const normalize = (size) => {
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  return Math.ceil(size * scale);
};


export default function SplashScreen() {
  const router = useRouter();


  const fullText = "Do you want to\ntake a rest in\nnature?";
  const [typedText, setTypedText] = useState("");
  const textIndex = useRef(0);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      setTypedText((prev) => {
        const next = fullText.slice(0, textIndex.current + 1);
        textIndex.current += 1;
        return next;
      });

      if (textIndex.current >= fullText.length) {
        clearInterval(typingInterval);
      }
    }, 70); // 타자 속도 조절

    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 6000000);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.lineWrapper}>
        <Line
          style={{
            position: "absolute",
            top: -50,
            width: width * 1.0,
            height: width * 1.5,
          }}
        />
        <Line
          style={{
            position: "absolute",
            top: 160,
            width: width * 1.0,
            height: width * 1.5,
          }}
        />
      </View>

      <Image
        source={require("../assets/images/Tutto Ricco Pink Sitting On Chair.png")}
        style={styles.personImage}
        resizeMode="contain"
      />

      <View style={styles.textBlock}>
        <Text style={styles.caption}>GO TO THE MOUNTIAN</Text>
        <Text style={styles.title}>{typedText}</Text>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.signUpButton} onPress={() => router.push("/spain")}>
          <Text style={styles.signup}>sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#325A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  lineWrapper: {
    position: "absolute",
    top: -height * 0.15,
    width: width * 1.2,
    height: height * 0.8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -2,
  },
  personImage: {
    position: "absolute",
    width: width * 0.75,
    height: width * 0.75,
    top: height * 0.22,
    right: -width * 0.15,
    zIndex: 2,
  },
  textBlock: {
    position: "absolute",
    paddingHorizontal: width * 0.08,
    top: height * 0.65,
    left: width * 0.08,
    width: width * 0.8,
  },
  caption: {
    color: "#F2ECD9",
    fontSize: normalize(18),
    marginBottom: height * 0.015,
    fontStyle: "italic",
    letterSpacing: 1,
  },
  title: {
    color: "#000000",
    fontSize: normalize(32),
    fontFamily: "System",
    fontWeight: "600",
    lineHeight: normalize(38),
    marginTop: height * 0.01,
  },
  bottomRow: {
    position: "absolute",
    bottom: height * 0.08,
    width: width * 0.85,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  signUpButton: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.015,
    backgroundColor: "#325A2A",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  signup: {
    fontSize: normalize(16),
    color: "#FFF8E5",
    fontStyle: "italic",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#FFF8E5",
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  loginText: {
    fontSize: normalize(14),
    fontWeight: "600",
    fontStyle: "italic",
    color: "#000",
  },
});
