import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet,
} from 'react-native';

const MOUNTAIN_LIST = ['Jirisan', 'Seoraksan', 'Hallasan', 'Bukhansan', 'Taebaeksan'];

export default function MainScreen() {
  const [selectedMountain, setSelectedMountain] = useState('Jirisan');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredList = MOUNTAIN_LIST.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

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
      <View style={styles.mapContainer}></View>

      {/* 편의 시설 리스트 영역 */}
      <View style={styles.listContainer}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#FBF1CF",
    flex: 1,
  },
  mountainText: {
    fontSize: 30,
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

  },
  listContainer : {
    flex : 8,
    backgroundColor: '#7857e5',

  }
});
