import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  Pressable
} from 'react-native';
import BottomNavBar from './s_navigationbar';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const rankingData = {
  distance: [
    { rank: 1, name: 'Jenson Hang', total: 1093, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 2, name: 'Cheolbong Jo', total: 923, badge: false, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Hajun Baek', total: 701, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Daniel', total: 384, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Daniel', total: 384, badge: true, avatar: require('../assets/images/con.png') },
  ],
  time: [
    { rank: 1, name: 'Gildong Hong', total: 432, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 2, name: 'Cheolbong Jo', total: 401, badge: false, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Daniel', total: 384, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Daniel', total: 384, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Daniel', total: 384, badge: true, avatar: require('../assets/images/con.png') },
  ],
  steps: [
    { rank: 1, name: 'Jenson Hang', total: 32780, badge: true, avatar: require('../assets/images/con.png') },
    { rank: 2, name: 'Daniel', total: 31900, badge: false, avatar: require('../assets/images/con.png') },
    { rank: 3, name: 'Jeong Seonwoong', total: 29820, badge: true, avatar: require('../assets/images/con.png') },
  ]
};

const categoryLabel = {
  distance: 'distance walked',
  time: 'time spent',
  steps: 'step count',
};

const router = useRouter();
const handleNavigation = (screen) => {
  router.push(`/${screen}`);
};

export default function RankingScreen() {
  const [selectedType, setSelectedType] = useState('distance');
  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.rank}>{item.rank}</Text>
      <Image source={item.avatar} style={styles.avatar} />
      <Text style={styles.name}>{item.name}</Text>
      {item.badge && (
        <Image source={require('../assets/images/con.png')} style={styles.badge} />
      )}
      <Text style={styles.total}>
        Total: {item.total}{selectedType === 'steps' ? ' steps' : 'm'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🏆 Ranking</Text>

        {/* 드롭다운 버튼 */}
        <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
          <Text style={styles.dropdownText}>Ranking by {categoryLabel[selectedType]} ▼</Text>
        </TouchableOpacity>

        {/* 카테고리 선택 모달 */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View style={styles.modalContent}>
              {Object.keys(categoryLabel).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedType(key);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalText}>Ranking by {categoryLabel[key]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

         {/* 흰색 박스 컨테이너로 감싸기 */}
  <View style={styles.rankingBox}>
    <FlatList
      data={rankingData[selectedType]}
      renderItem={renderItem}
      keyExtractor={item => item.rank.toString()}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  </View>

        {/* 사용자 정보 박스 */}
        <Text style={styles.cheeringText}>we can reach the top!</Text>
        <View style={styles.userBox}>
          <Text style={styles.userText}>Username: Daniel #6</Text>
          <Text style={styles.userText}>complete M.: 16</Text>
          <Text style={styles.userText}>total {selectedType}: 676{selectedType === 'steps' ? ' steps' : 'm'}</Text>
          <Text style={styles.userText}>Title: Conqueror of Seoraksan</Text>
          <Image source={require('../assets/images/con.png')} style={styles.badge} />
        </View>
        {/* 하단 영역: 네비게이션 바 */}
     
      </View>
      <View style ={styles.bottomContainer}>
    <BottomNavBar onNavigate={handleNavigation} />
    </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#325A2A',
  },
  container: {
    flex: 1,
    padding: width * 0.05,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    marginBottom: height * 0.015,
    color: '#FFF9E5',
    fontFamily: "Snell Roundhand",
    
  },
  dropdown: {
    backgroundColor: '#FFF9E5',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: 40,
    marginBottom: height * 0.02,
    borderWidth:3,
    
  },
  dropdownText: {
    fontSize: width * 0.04,
    color: 'black',
    
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.01,
    backgroundColor: '#fff',
    padding: width * 0.04,
    borderRadius: 10,
    elevation: 2,
    borderWidth:3,
  },
  rank: {
    width: 30,
    fontWeight: 'bold',
    fontSize: width * 0.04,
    
  },
  avatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    marginHorizontal: width * 0.03,
  },
  name: {
    flex: 1,
    fontSize: width * 0.045,
  },
  total: {
    fontWeight: '600',
    fontSize: width * 0.035,
  },
  badge: {
    width: width * 0.045,
    height: width * 0.045,
    marginLeft: 6,
  },
  userBox: {
    marginTop: height * 0.02,
    padding: width * 0.04,
    backgroundColor: '#EDEAE0',
    borderRadius: 10,
    borderWidth:3,
  },
  userText: {
    fontSize: width * 0.035,
    marginVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: width * 0.8,
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  rankingBox: {
    flex: 1,
    backgroundColor: '#FFF9E5',
    borderRadius: 20,
    padding: width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: height * 0.02,
    borderWidth:3,
  },
  cheeringText: {
    fontWeight: 'bold',
    color: '#FFF9E5',
    fontFamily: "Snell Roundhand",
    fontSize:50,
    marginBottom: -20,

  }
  
});
