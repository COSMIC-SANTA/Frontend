import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet, ScrollView, Image, Dimensions,} from 'react-native';
import { useRouter } from 'expo-router';
import BottomNavBar from './s_navigationbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Line from "../assets/images/Line_1.svg";

const MOUNTAIN_LIST = ['Jirisan', 'Seoraksan', 'Hallasan', 'Bukhansan', 'Taebaeksan'];
const { width } = Dimensions.get("window");

export default function MainScreen() {
  const [selectedMountain, setSelectedMountain] = useState('Jirisan');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredList = MOUNTAIN_LIST.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const router = useRouter();
const handleNavigation = (screen) => {
  router.push(`/${screen}`);
};

  const facilityData = {
    Jirisan: {
      Toilet: [
        { name: 'Jirisan HwaJangSill 1' },
        { name: 'Jirisan HwaJangSill 2' },
        { name: 'Jirisan HwaJangSill 3' },
        { name: 'Jirisan HwaJangSill 1' },
        { name: 'Jirisan HwaJangSill 2' },
        { name: 'Jirisan HwaJangSill 3' },
        { name: 'Jirisan HwaJangSill 1' },
        { name: 'Jirisan HwaJangSill 2' },
        { name: 'Jirisan HwaJangSill 3' },
      ],
      WaterSupply: [
        { name: 'Jirisan SicksSuDae 1' },
        { name: 'Jirisan SicksSuDae 2' },
        { name: 'Jirisan SicksSuDae 3' },
        { name: 'Jirisan SicksSuDae 1' },
        { name: 'Jirisan SicksSuDae 2' },
        { name: 'Jirisan SicksSuDae 3' },
      ],
      MedicalFacility: [
        { name: 'EuhRyouShiSeol 1' },
        { name: 'Jirisan SicksSuDae 1' },
        { name: 'Jirisan SicksSuDae 2' },
        { name: 'Jirisan SicksSuDae 3' },
        { name: 'Jirisan SicksSuDae 1' },
        { name: 'Jirisan SicksSuDae 2' },
        { name: 'Jirisan SicksSuDae 3' },
      ],
      ConvenienceStore: [
        { name: 'Jirisan CU 1' },
        { name: 'Jirisan GS25 1' },
        { name: 'Jirisan 7-Eleven 1' },
      ],
    },
    Seoraksan: {
      Toilet: [
        { name: 'Jirisan HwaJangSill 1' },
        { name: 'Jirisan HwaJangSill 2' },
        { name: 'Jirisan HwaJangSill 3' },
      ],
      WaterSupply: [
        { name: 'Jirisan SicksSuDae 1' },
        { name: 'Jirisan SicksSuDae 2' },
        { name: 'Jirisan SicksSuDae 3' },
      ],
      MedicalFacility: [
        { name: 'EuhRyouShiSeol 1' },
      ],
    },
  };
  

  return (
    <SafeAreaView style ={styles.backcontainer}>
    <View style={styles.contentContainer}>
     <ScrollView contentContainerStyle={[styles.topcontainer, { paddingBottom:0 }]}>

      {/* 헤더 영역: 산 이름 + 돋보기 */}
      <View style={styles.header}>
        <Text style={styles.mountainText}>{selectedMountain}</Text>
        
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* 산 검색 모달창 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <TextInput
              placeholder="Search Mountain"
              value={search}
              onChangeText={setSearch}
              style={styles.input}
            />
            <FlatList
              data={filteredList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedMountain(item)}>
                  <Text style={styles.item}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapItem}>map</Text>
      </View>

      {/* 편의 시설 리스트 영역 */}
      <View style={styles.listContainer}>
        <ScrollView style={styles.outerScroll}>
        {['Toilet', 'WaterSupply', 'MedicalFacility', 'ConvenienceStore'].map((type) => {
    const icon = type === 'Toilet' ? '🚻'
              : type === 'WaterSupply' ? '💧'
              : type === 'MedicalFacility' ? '🏥'
              : '🏪'; 

    const label = type === 'Toilet' ? 'Toilet'
               : type === 'WaterSupply' ? 'Water Supply'
               : type === 'MedicalFacility' ? 'Medical Facility'
               : 'Convenience Store'; 
    const facilities = facilityData[selectedMountain]?.[type] || [];

    return (
      <View key={type} style={styles.card}>
         <Image
    source={require('../assets/images/bookmark.png')} 
    style={styles.flagImage}
    resizeMode="contain"
  />
        
      <View style={styles.cardHeader}>
        {/* 주황색 리본 태그 */}
        <View style={styles.ribbonTag}>
          <Text style={styles.ribbonText}>{icon}</Text>
        </View>

        {/* 제목 텍스트 박스 */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>

        <ScrollView style={styles.innerScroll} nestedScrollEnabled>
          {facilities.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  })}
 
  </ScrollView>
   


  </View> {/* 편의시설 리스트 영역 끝*/}


    </ScrollView>  {/* 상단 영역의 가장 큰 스크롤 화면 끝*/}

    

      {/* 하단 영역: 네비게이션 바 */}
      <View style ={styles.bottomContainer}>
    <BottomNavBar onNavigate={handleNavigation} />
    </View>

    </View> {/* 두번째 밑바닥 큰 컨테이너 */}
    </SafeAreaView> /* 가장 밑바닥 큰 컨테이너 끝*/
  );
}

const styles = StyleSheet.create({
  backcontainer:{
    flex:1,
  },
  contentContainer: {
    flex: 1,
  },
  topcontainer: {
    flexGrow: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom:20,
    backgroundColor: "#325A2A",
  },
  bottomContainer:{
    height: 70, 
    backgroundColor: '#FFF8E1',
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#325A2A",
    flex: 1,
  },
  mountainText: {
    fontSize: 50,
    fontWeight: 'bold',
    fontFamily: "Snell Roundhand",
    margin: 20,
  },
  searchIcon: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000099',
  },
  modalBox: {
    backgroundColor: '#fff',
    margin: 30,
    padding: 20,
    borderRadius: 10,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    fontSize: 16,
  },
  item: {
    fontSize: 18,
    paddingVertical: 8,
  },
  confirmBtn: {
    marginTop: 10,
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 8,
  },
  confirmText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex : 5,
    backgroundColor: '#7dbfb7',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: "black",
    borderWidth: 5,
    borderRadius: 10,

  },
  mapItem: {
    fontSize: 30,
  },
  listContainer : {
    flex : 8,
    backgroundColor: 'FFF9E5',
    paddingTop:10,
    paddingHorizontal: 20,
    position: 'relative',
    marginTop: 30,
    marginBottom:20,
    overflow: 'hidden', //svg 자체가 가지고 있는 불필요한 공백 제거해 줌.

  },
  outerScroll : {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF9E5',
    borderRadius: 20,
    marginBottom: 20,
    padding: 15,
    height: 200, 
    borderWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  innerScroll: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    marginLeft: 12,
  },
  dot: {
    marginRight: 6,
    color: 'black',
    fontSize:40,
  },
  itemText: {
    fontSize: 20,
  },
  footerDesign: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: "80%",
    zIndex: -1,
  },
  ribbonTag: { 
    backgroundColor: '#E67249',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ribbonText: { 
    fontSize: 16,
    color: '#fff',
  
    
  },
  headerTextContainer: { 
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E67249',
    marginLeft: -1,
  },
  flagImage: { // ✅ 추가
    position: 'absolute',
    top: -8,
    right: -10,
    width: 70,
    height: 60,
    zIndex: 10,
    marginRight:10,
  },
  
  
});

