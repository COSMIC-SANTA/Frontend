import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// 다양한 화면 크기 대응을 위한 기준값들
const BASE_WIDTH = 375; // 표준 너비
const BASE_HEIGHT = 812; // 표준 높이

// 반응형 크기 계산 함수
const wp = (percentage) => {
  return (width * percentage) / 100;
};

const hp = (percentage) => {
  return (height * percentage) / 100;
};

// 폰트 크기 조정 함수 - 다양한 화면에서 읽기 쉽도록
const normalize = (size) => {
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const scale = Math.min(widthScale, heightScale);
  return Math.max(12, Math.ceil(size * scale));
};


// 곡선 배경 라인 컴포넌트
const CurvedLine = ({ style }) => (
  <Svg
    style={style}
    viewBox="0 0 400 600"
    preserveAspectRatio="xMidYMid slice"
  >
    <Path
      d="M50,100 Q200,50 350,100 Q200,150 50,100 Z"
      fill="rgba(255, 248, 229, 0.3)"
      stroke="rgba(255, 248, 229, 0.5)"
      strokeWidth="2"
    />
    <Path
      d="M30,200 Q200,150 370,200 Q200,250 30,200 Z"
      fill="rgba(255, 248, 229, 0.2)"
      stroke="rgba(255, 248, 229, 0.4)"
      strokeWidth="1.5"
    />
    <Path
      d="M80,300 Q200,250 320,300 Q200,350 80,300 Z"
      fill="rgba(255, 248, 229, 0.25)"
      stroke="rgba(255, 248, 229, 0.3)"
      strokeWidth="1"
    />
  </Svg>
);

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
        <CurvedLine
          style={{
            position: "absolute",
            top: hp(-10),
            width: wp(100),
            height: hp(40),
          }}
        />
        <CurvedLine
          style={{
            position: "absolute",
            top: hp(20),
            width: wp(100),
            height: hp(40),
            transform: [{ rotate: "180deg" }],
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
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
  },
  personImage: {
    position: "absolute",
    width: Math.min(wp(75), 280),
    height: Math.min(wp(75), 280),
    top: hp(25),
    right: wp(5),
    zIndex: 2,
  },
  textBlock: {
    position: "absolute",
    paddingHorizontal: wp(8),
    top: hp(62),
    left: wp(8),
    width: wp(60),
    maxWidth: 250,
  },
  caption: {
    color: "#F2ECD9",
    fontSize: normalize(14),
    marginBottom: hp(1.5),
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  title: {
    color: "#000000",
    fontSize: normalize(24),
    fontFamily: "System",
    fontWeight: "600",
    lineHeight: normalize(28),
    marginTop: hp(1),
  },
  bottomRow: {
    position: "absolute",
    bottom: hp(8),
    width: wp(85),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  signUpButton: {
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
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
    fontSize: normalize(12),
    color: "#FFF8E5",
    fontStyle: "italic",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#FFF8E5",
    width: Math.min(wp(18), 70),
    height: Math.min(wp(18), 70),
    borderRadius: Math.min(wp(9), 35),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  loginText: {
    fontSize: normalize(10),
    fontWeight: "600",
    fontStyle: "italic",
    color: "#000",
  },
});
