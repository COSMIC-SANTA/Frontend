import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";
import Line from "../assets/images/Line_1.svg";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import Svg, {Path, G} from 'react-native-svg';

const { width, height } = Dimensions.get("window");

const ASPECT_RATIO = 1.5;
const LINE_WIDTH_RATIO = 1.0;

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
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.lineWrapper}>
        <Line
          width={width * LINE_WIDTH_RATIO}
          height={width * LINE_WIDTH_RATIO * 0.5}
          style={{
            position: "absolute",
            top: -50,
          }}
        />
        <Line
          width={width * LINE_WIDTH_RATIO}
          height={width * LINE_WIDTH_RATIO * 0.5}
          style={{
            position: "absolute",
            top: 160,
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
    top: height * -0.2,
    width: width * 1.4,
    height: width * 1.8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -2,
  },
  personImage: {
    position: "absolute",
    width: 300,
    height: 300,
    top: height * 0.27,
    marginLeft: 120,
    marginTop: -90,
    zIndex: 2,
  },
  textBlock: {
    position: "absolute",
    paddingHorizontal: 30,
    height: "20%",
    marginTop: 550,
    marginLeft: -180,
  },
  caption: {
    color: "#F2ECD9",
    fontSize: 30,
    marginBottom: 10,
    marginTop: 20,
    fontStyle: "italic",
  },
  title: {
    color: "#00000",
    fontSize: 80,
    fontFamily: "Snell Roundhand",
    fontWeight: "600",
    lineHeight: 70,
    marginTop: 10,
  },
  bottomRow: {
    position: "absolute",
    bottom: 50,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 130,
  },
  signup: {
    fontSize: 20,
    color: "#000",
    fontStyle: "italic",
    fontWeight: "600",
    marginLeft: 10,
  },
  signUpButton: {
    display:1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#325A2A",
    borderRadius: 80,
    marginLeft: 180,
    marginRight: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
  },
  loginButton: {
    display:1,
    backgroundColor: "#FFF8E5",
    width: 100,
    height: 50,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
  },
  loginText: {
    fontSize: 20,
    fontWeight: "600",
    fontStyle: "italic",
    color: "#000",
  },
});
