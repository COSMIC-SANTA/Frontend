import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import React, { useState } from 'react'; 
import { useRouter } from 'expo-router';
import BottomNavBar from './s_navigationbar';


export default function NavigationPage() {
const [origin, setOrigin] = useState('');
const [destination, setDestination] = useState('');
const [selectedMode, setSelectedMode] = useState('car');
const [selectedRouteIndex, setSelectedRouteIndex] = useState(0); 


const modeRoutes = {
    car: [
      { label: 'best >', time: '2시간 34분', km: '205km', taxi: '248,050' },
      { time: '3시간 08분', km: '215km', taxi: '258,050' },
    ],
    bus: [
      { label: 'best >', time: '3시간 15분', km: '200km', taxi: '230,000' },
      { time: '3시간 40분', km: '210km', taxi: '250,000' },
    ],
    walking: [
      { label: 'best >', time: '6시간 40분', km: '180km', taxi: '-' },
      { time: '7시간 10분', km: '190km', taxi: '-' },
    ],
    bicycle: [
      { label: 'best >', time: '4시간 10분', km: '190km', taxi: '-' },
      { time: '4시간 50분', km: '200km', taxi: '-' },
    ],
    
  };
  


const swapLocations = () => {
  const temp = origin;
  setOrigin(destination);
  setDestination(temp);
};

const router = useRouter();
const handleNavigation = (screen) => {
  router.push(`/${screen}`);
};

  return (
        /* 전체 컨테이너 */
        <View style={styles.container}> 
        {/* 출발지,도착지, 교통수단 가장 큰 흰색 컨테이너 */}
        <View style={styles.searchbackBox}>
            {/* 출발지,도착지 작은 흰색 컨테이너 */}
        <View style={styles.searchBox}>
            {/* 입력 컨테이너 */}
        <View style={styles.inputCard}>
        {/* 교체 아이콘 */}
        <TouchableOpacity style={styles.switchIcon} onPress={swapLocations}>
    <Ionicons name="swap-vertical" size={20} color="black" />
    </TouchableOpacity>

    {/* 출발지 */}
    <View style={styles.inputRow}>
    <View style={styles.dotRed} />
    <TextInput
        style={styles.inputField}
        placeholder="출발지 입력"
        placeholderTextColor="#aaa"
        value={origin}
        onChangeText={setOrigin}
    /></View>

    {/* 회색 선 */}
    <View style={styles.divider} />

    {/* 도착지 */}
    <View style={styles.inputRow}>
    <View style={styles.dotblue} />
    <TextInput
        style={styles.inputField}
        placeholder="도착지 입력"
        placeholderTextColor="#aaa"
        value={destination}
        onChangeText={setDestination}
    /></View></View></View>

          {/* 이동수단 탭 */}
          <View style={styles.transportTabs}>
        {['car', 'bus', 'walking', 'bicycle'].map((mode) => (
        <TouchableOpacity key={mode} onPress={() => setSelectedMode(mode)}>
        <FontAwesome5
        name={mode}
        size={24}
        color={selectedMode === mode ? '#325A2A' : '#BDBDBD'}
      />
    </TouchableOpacity>
  ))}
</View> </View>
     

      {/* 지도영역 */}
      <View style={styles.mapPlaceholder}>
      <View style={styles.routeTimeTag}>
  <Text style={{ fontSize: 16 }}>
    {modeRoutes[selectedMode][selectedRouteIndex].time}
  </Text>
</View>


         {/* 경로 선택 카드 */}
         <ScrollView horizontal contentContainerStyle={styles.routeOptions} style={styles.routeOverlay}>
  {modeRoutes[selectedMode].map((route, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.routeCard,
        selectedRouteIndex === index && styles.routeCardSelected
      ]}
      onPress={() => setSelectedRouteIndex(index)}
    >
      {route.label && <Text style={styles.bestLabel}>{route.label}</Text>}
      <Text style={styles.timeText}>{route.time}</Text>
      <Text style={styles.kmText}>{route.km}</Text>
      <Text style={styles.taxiText}>taxi {route.taxi}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

      </View>


      {/* 하단 버튼 */}
        <View style={styles.bottomButtons}>
    <TouchableOpacity style={styles.laterBtn}>
        <Ionicons name="time-outline" size={20} color="white" />
        <Text style={styles.buttonText}>later</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.startBtn}>
        <Ionicons name="navigate-outline" size={20} color="white" />
        <Text style={styles.buttonText}>start</Text>
    </TouchableOpacity>
    </View>


      <BottomNavBar onNavigate={handleNavigation} />
      
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFF9E5",
    },
    searchbackBox: {
     backgroundColor: "#fff",
     width: "100%",
     height: 280,
     borderBottomWidth: 5,
     
    },
    searchBox: {
      marginBottom: 12,
      backgroundColor: "#fff",
      width: "95%",
      height: 180,
      borderWidth: 5,
      borderRadius: 30,
      marginTop: 30,
      alignSelf: "center",
      justifyContent: 'center', // 세로 중앙
      alignItems: 'center',     // 가로 중앙
      
    },
    inputCard: {
        width: "90%",
        alignSelf: "center",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        borderColor: "#333",
        position: "relative",  
      },
      switchIcon: {
        position: "absolute",
        left: 10,
        top: "50%",
        transform: [{ translateY: -12 }],
        zIndex: 1,
        backgroundColor: "#fff",
        padding: 4,
        borderRadius: 12,
        marginLeft: -20,
        
      },
      inputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        marginLeft: 30, 
      },
      dotRed: {
        width: 20,
        height: 20,
        borderRadius: 100,
        backgroundColor: "#9f0909",
        marginRight: 10,
      },
      dotblue: {
        width: 20,
        height: 20,
        borderRadius: 100,
        backgroundColor: "#09458f",
        marginRight: 10,
      },
      inputField: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#fff",
      },
      divider: {
        height: 3,
        backgroundColor: "#ccc",
        marginVertical: 8,
        marginLeft: 30, 
      },
      
    transportTabs: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 12,
      marginTop: 10,
    },
    mapPlaceholder: {
      height: 900,
      backgroundColor: "#E0E0E0",
      overflow: "hidden",
      position: "relative",
    },
    routeTimeTag: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "#FFF",
      padding: 6,
      borderRadius: 6,
      elevation: 2,
    },
    routeOverlay: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 16,
      },
      
    routeOptions: {
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
    routeCard: {
        backgroundColor: "#fff",
        padding: 50,
        borderRadius: 30,
        marginRight: 10,
        minWidth: 180,
        alignItems: "center",
        justifyContent: "space-around",
        borderWidth: 4,
        borderColor: "#000",
      },
    routeCardSelected: {
        borderColor: "#9f0909", 
      },  
    bestLabel: {
      fontWeight: "bold",
      color: "#4CAF50",
      marginBottom: 5,
    },
    timeText: {
      fontSize: 18,
      fontWeight: "bold",
    },
    kmText: {
      fontSize: 14,
      color: "#666",
    },
    taxiText: {
      fontSize: 12,
      color: "#999",
    },
    bottomButtons: {
        flexDirection: "row",
        height: 70,
        overflow: 'hidden',
      }, 
      laterBtn: {
        flex: 1,
        backgroundColor: "#3E3E3E",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }, 
      startBtn: {
        flex: 1,
        backgroundColor: "#325A2A",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      buttonText: {
        color: "white",
        marginLeft: 6,
        fontFamily: "Snell Roundhand",
        fontSize: 20,
      }
      
  });
  