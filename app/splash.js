import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, PixelRatio, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// 기기 유형 및 특성 감지
const aspectRatio = height / width;
const pixelDensity = PixelRatio.get();
const isTablet = Math.min(width, height) >= 600;
const isSmallPhone = Math.min(width, height) < 350;
const isLargePhone = Math.max(width, height) > 900;

// 디바이스별 스케일링 계수
const getDeviceScale = () => {
  if (isTablet) return { width: 1.2, height: 1.1, font: 1.3 };
  if (isSmallPhone) return { width: 0.9, height: 0.95, font: 0.85 };
  if (isLargePhone) return { width: 1.05, height: 1.05, font: 1.1 };
  return { width: 1, height: 1, font: 1 };
};

const deviceScale = getDeviceScale();

// 반응형 너비/높이 계산 (디바이스 특성 반영)
const wp = (percentage) => {
  return (width * percentage * deviceScale.width) / 100;
};

const hp = (percentage) => {
  return (height * percentage * deviceScale.height) / 100;
};

// 동적 폰트 크기 조정 (화면 크기 + 픽셀 밀도 + 디바이스 유형)
const normalize = (size) => {
  // 화면 면적 기반 기본 스케일
  const screenArea = width * height;
  const baseArea = 375 * 812; // 기준 화면 면적
  const areaScale = Math.sqrt(screenArea / baseArea);
  
  // 종횡비 보정 (너무 길거나 넓은 화면 보정)
  const ratioCorrection = Math.min(1.2, Math.max(0.8, 1 / (aspectRatio * 0.6)));
  
  // 픽셀 밀도 보정
  const densityCorrection = Math.min(1.3, Math.max(0.7, pixelDensity * 0.4));
  
  // 최종 크기 계산
  const finalSize = size * areaScale * ratioCorrection * densityCorrection * deviceScale.font;
  
  // 최소/최대 크기 제한
  const minSize = isTablet ? 14 : 10;
  const maxSize = isTablet ? 40 : 28;
  
  return Math.round(Math.max(minSize, Math.min(maxSize, finalSize)));
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
      <Image
        source={require("../assets/images/Line_1.svg")}
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
    width: isTablet ? wp(50) : wp(70),
    height: isTablet ? wp(50) : wp(70),
    top: isTablet ? hp(20) : hp(25),
    right: isTablet ? wp(10) : wp(5),
    maxWidth: isTablet ? 400 : 300,
    maxHeight: isTablet ? 400 : 300,
    zIndex: 2,
  },
  textBlock: {
    position: "absolute",
    paddingHorizontal: wp(6),
    top: isTablet ? hp(55) : hp(62),
    left: wp(6),
    width: isTablet ? wp(45) : wp(55),
    maxWidth: isTablet ? 350 : 250,
  },
  caption: {
    color: "#F2ECD9",
    fontSize: normalize(isTablet ? 16 : 14),
    marginBottom: hp(1.5),
    fontStyle: "italic",
    letterSpacing: isTablet ? 1 : 0.5,
  },
  title: {
    color: "#000000",
    fontSize: normalize(isTablet ? 28 : 24),
    fontFamily: "System",
    fontWeight: "600",
    lineHeight: normalize(isTablet ? 34 : 28),
    marginTop: hp(1),
  },
  bottomRow: {
    position: "absolute",
    bottom: hp(isTablet ? 6 : 8),
    width: wp(isTablet ? 80 : 85),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  signUpButton: {
    paddingHorizontal: wp(isTablet ? 8 : 6),
    paddingVertical: hp(isTablet ? 2 : 1.5),
    backgroundColor: "#325A2A",
    borderRadius: isTablet ? 30 : 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  signup: {
    fontSize: normalize(isTablet ? 14 : 12),
    color: "#FFF8E5",
    fontStyle: "italic",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#FFF8E5",
    width: isTablet ? wp(12) : wp(18),
    height: isTablet ? wp(12) : wp(18),
    borderRadius: isTablet ? wp(6) : wp(9),
    justifyContent: "center",
    alignItems: "center",
    maxWidth: isTablet ? 100 : 70,
    maxHeight: isTablet ? 100 : 70,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  loginText: {
    fontSize: normalize(isTablet ? 12 : 10),
    fontWeight: "600",
    fontStyle: "italic",
    color: "#000",
  },
});
