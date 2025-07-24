import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet, ScrollView} from 'react-native';

const MOUNTAIN_LIST = ['Jirisan', 'Seoraksan', 'Hallasan', 'Bukhansan', 'Taebaeksan'];

export default function MainScreen() {
  const [selectedMountain, setSelectedMountain] = useState('Jirisan');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredList = MOUNTAIN_LIST.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

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
    
    <View style={styles.container}>
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
        <Text style={styles.mapItem}>지도 영역</Text>
      </View>

      {/* 편의 시설 리스트 영역 */}
      <View style={styles.listContainer}>
        <ScrollView style={styles.outerScroll}>
        {['Toilet', 'WaterSupply', 'MedicalFacility', 'ConvenienceStore'].map((type) => {
    const icon = type === 'Toilet' ? '🚻'
              : type === 'WaterSupply' ? '💧'
              : type === 'MedicalFacility' ? '➕'
              : '🏪'; 

    const label = type === 'Toilet' ? 'Toilet'
               : type === 'WaterSupply' ? 'Water Supply'
               : type === 'MedicalFacility' ? 'Medical Facility'
               : 'Convenience Store'; 
    const facilities = facilityData[selectedMountain]?.[type] || [];

    return (
      <View key={type} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
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
  
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom:20,
    backgroundColor: "#325A2A",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#DB61A7",
    flex: 1,
  },
  mountainText: {
    fontSize: 40,
    fontWeight: 'bold',
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
    backgroundColor: '#7857e5',
    paddingTop:10,
    paddingHorizontal: 20,

  },
  outerScroll : {
    flex: 1,
  },
  card: {
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
    marginBottom: 20,
    padding: 15,
    height: 200, // 카드 자체 높이 고정
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
});
