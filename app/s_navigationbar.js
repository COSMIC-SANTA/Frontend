import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavBar({ onNavigate }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onNavigate('spain')}>
        <View style={styles.tabItem}>
          <Ionicons name="home" size={24} color="black" />
          <Text style={styles.label}>home</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onNavigate('search')}>
        <View style={styles.tabItem}>
          <Ionicons name="search" size={24} color="black" />
          <Text style={styles.label}>Search</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onNavigate('s_convi')}>
        <View style={styles.tabItem}>
          <Ionicons name="chatbubbles" size={24} color="black" />
          <Text style={styles.label}>community</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onNavigate('setting')}>
        <View style={styles.tabItem}>
          <Ionicons name="settings" size={24} color="black" />
          <Text style={styles.label}>setting</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF9E5', 
    paddingVertical: 20,
    //borderTopWidth: 2,
    borderColor: '000000',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3,},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, 
  },
  label: {
    fontSize: 12,
    marginTop:10,
    textAlign: 'center',
  },
  tabItem: {
    alignItems: 'center', 
  },
});
