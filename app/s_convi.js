// app/FacilitiesScreen.js
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';

// 플랫폼 분기 맵 (components/s_compatmap.native.js / .web.js 필요)
import CompatMap, { Marker } from '../components/s_compatmap';

import * as Location from 'expo-location';
import { facilityService } from '../services/api';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// ✅ 웹 테스트 모드 설정
// ─────────────────────────────────────────────
const WEB_TEST = Platform.OS === 'web';
const MOCK_COORD = { x: '127.0276', y: '37.4979' }; // 강남역 근처

// 카테고리 색상
const PIN = {
  toilet: 'tomato',
  water: 'deepskyblue',
  hospital: 'purple',
  pharmacy: 'green',
};

// 숫자 변환 + 유효성 검사
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function FacilitiesScreen() {
  // 위치/지도
  const [region, setRegion] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null); // onMapReady용 초기값
  const mapRef = useRef(null);

  // 데이터
  const [facilities, setFacilities] = useState({
    toilet: [],
    water: [],
    hospital: [],
    pharmacy: [],
  });

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCats, setVisibleCats] = useState({
    toilet: true, water: true, hospital: true, pharmacy: true
  });

  const router = useRouter();
  const handleNavigation = (screen) => router.push(`/${screen}`);

  // 현재 위치 읽고, 편의시설 로드
  const loadFromCurrentLocation = useCallback(async () => {
    try {
      setRefreshing(true);

      let x, y; // 경도/위도 (백엔드 스펙: x=경도, y=위도)
      if (WEB_TEST) {
        x = MOCK_COORD.x;
        y = MOCK_COORD.y;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '위치 권한이 거부되어 편의시설을 불러올 수 없습니다.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        x = String(loc.coords.longitude);
        y = String(loc.coords.latitude);
      }

      const yNum = toNum(y);
      const xNum = toNum(x);
      if (yNum == null || xNum == null) {
        throw new Error('Invalid current location coords');
      }

      const nextRegion = {
        latitude: yNum,
        longitude: xNum,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(nextRegion);
      setInitialRegion((prev) => prev ?? nextRegion); // 최초 1회만 세팅

      // 백엔드 스펙 유지
      const data = await facilityService.getNearbyFacilities({
        mountain_name: "",
        location_x: x, // 경도
        location_y: y, // 위도
      });

      setFacilities({
        toilet: Array.isArray(data?.toilet) ? data.toilet : [],
        water: Array.isArray(data?.water) ? data.water : [],
        hospital: Array.isArray(data?.hospital) ? data.hospital : [],
        pharmacy: Array.isArray(data?.pharmacy) ? data.pharmacy : [],
      });
    } catch (e) {
      console.log('facilities load error:', e);
      Alert.alert('오류', '편의시설 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadFromCurrentLocation();
    })();
  }, [loadFromCurrentLocation]);

  // 지도 마커 렌더링 (유효 좌표만 표시)
  const markers = useMemo(() => {
    const arr = [];
    const pushMarkers = (catKey, list) => {
      if (!visibleCats[catKey]) return;
      list.forEach((p, idx) => {
        const lat = toNum(p.location_y ?? p.mapY ?? p.latitude);
        const lon = toNum(p.location_x ?? p.mapX ?? p.longitude);
        if (lat == null || lon == null) return; // 안드로이드에서 특히 중요!

        arr.push(
          <Marker
            key={`${catKey}-${idx}`}
            coordinate={{ latitude: lat, longitude: lon }}
            title={p.place_name || p.placeName}
            description={p.address_name || p.addressName}
            pinColor={PIN[catKey]}
          />
        );
      });
    };
    pushMarkers('toilet', facilities.toilet);
    pushMarkers('water', facilities.water);
    pushMarkers('hospital', facilities.hospital);
    pushMarkers('pharmacy', facilities.pharmacy);
    return arr;
  }, [facilities, visibleCats]);

  if (loading || !region) {
    return (
      <SafeAreaView style={[styles.backcontainer, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>현재 위치 기반으로 불러오는 중…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.backcontainer}>
      <View style={styles.contentContainer}>

        {/* 상단 컨테이너(풀 스크롤) */}
        <ScrollView
          contentContainerStyle={[styles.topcontainer, { paddingBottom: 0 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadFromCurrentLocation} />
          }
        >
          {/* 웹 테스트 배지 */}
          {WEB_TEST && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Web Test Mode (mock coords)</Text>
            </View>
          )}

          {/* 헤더: 타이틀 + 새로고침 */}
          <View style={styles.header}>
            <Text style={styles.titleText}>Nearby Facilities</Text>
            <TouchableOpacity onPress={loadFromCurrentLocation} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* 지도 */}
          <View style={styles.mapContainer}>
            <CompatMap
              ref={mapRef}
              initialRegion={initialRegion}   // 최초 렌더 안정화
              region={region}                 // 이후에는 region으로 제어
              style={{ width: '100%', height: '100%', borderRadius: 10 }}
              onMapReady={() => {
                // 안드로이드에서 초기 타이밍 안정화
                if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
                  mapRef.current.animateToRegion(region, 400);
                }
              }}
            >
              {/* 현재 위치 */}
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                title="현재 위치"
              />
              {/* 카테고리 마커 */}
              {markers}
            </CompatMap>
          </View>

          {/* 카테고리 토글 */}
          <View style={styles.filterRow}>
            {[
              { key: 'toilet', label: 'Toilet', dot: PIN.toilet, emoji: '🚻' },
              { key: 'water', label: 'Water Supply', dot: PIN.water, emoji: '💧' },
              { key: 'hospital', label: 'Medical Facility', dot: PIN.hospital, emoji: '🏥' },
              { key: 'pharmacy', label: 'Pharmacy', dot: PIN.pharmacy, emoji: '💊' },
            ].map(({ key, label, dot, emoji }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, visibleCats[key] && styles.chipOn]}
                onPress={() => setVisibleCats(prev => ({ ...prev, [key]: !prev[key] }))}
              >
                <View style={[styles.dot, { backgroundColor: dot }]} />
                <Text style={styles.chipText}>{emoji} {label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 리스트 */}
          <View style={styles.listContainer}>
            <ScrollView style={styles.outerScroll} contentContainerStyle={{ paddingBottom: 20 }}>
              {renderSectionCard({ typeKey: 'toilet',  icon: '🚻', title: 'Toilet',          items: facilities.toilet })}
              {renderSectionCard({ typeKey: 'water',   icon: '💧', title: 'Water Supply',   items: facilities.water })}
              {renderSectionCard({ typeKey: 'hospital',icon: '🏥', title: 'Medical Facility',items: facilities.hospital })}
              {renderSectionCard({ typeKey: 'pharmacy',icon: '💊', title: 'Pharmacy',       items: facilities.pharmacy })}
            </ScrollView>
          </View>
        </ScrollView>

        {/* 하단 네비게이션 */}
        <View style={styles.bottomContainer}>
          <BottomNavBar onNavigate={handleNavigation} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// 카드 섹션
function renderSectionCard({ typeKey, icon, title, items }) {
  return (
    <View key={typeKey} style={styles.card}>
      <Image source={require('../assets/images/bookmark.png')} style={styles.flagImage} resizeMode="contain" />
      <View style={styles.cardHeader}>
        <View style={styles.ribbonTag}><Text style={styles.ribbonText}>{icon}</Text></View>
        <View style={styles.headerTextContainer}><Text style={styles.label}>{title}</Text></View>
      </View>
      <ScrollView style={styles.innerScroll} nestedScrollEnabled>
        {items?.length ? (
          items.map((p, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.dotText}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>{p.place_name || p.placeName}</Text>
                {!!(p.address_name || p.addressName) && (
                  <Text style={styles.addrText}>{p.address_name || p.addressName}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: '#666' }}>근처에 데이터가 없습니다.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backcontainer: { flex: 1 },
  contentContainer: { flex: 1 },
  topcontainer: {
    flexGrow: 1, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#325A2A',
  },
  bottomContainer: {
    height: 70, backgroundColor: '#FFF8E1', borderTopWidth: 1, borderColor: '#ddd', marginBottom: 10,
  },

  // 웹 테스트 배지
  banner: { backgroundColor: '#fff3cd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginLeft: 20, marginBottom: 6 },
  bannerText: { color: '#8a6d3b', fontWeight: '700' },

  // 헤더
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#325A2A' },
  titleText: { fontSize: 36, fontWeight: 'bold', margin: 20, color: 'white' },
  refreshBtn: { marginRight: 20, backgroundColor: 'white', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  refreshText: { fontSize: 18, fontWeight: '800' },

  // 지도
  mapContainer: {
    height: 260, backgroundColor: '#7dbfb7', alignItems: 'center', justifyContent: 'center',
    borderColor: 'black', borderWidth: 5, borderRadius: 10, overflow: 'hidden',
  },

  // 카테고리 토글
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 4, marginTop: 12, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth:3, },
  chipOn: { backgroundColor: '#fff' },
  chipText: { fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },

  // 리스트
  listContainer: {
    backgroundColor: 'white',
    paddingTop: 30,
    paddingHorizontal: 20,
    position: 'relative',
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20, 
    borderWidth: 5,
    borderColor: 'black',


    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ✅ 카드(리스트 내부 박스)
  card: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20,
    marginBottom: 20,
    padding: 15,
    height: 200,
    borderWidth: 5,
    borderColor: '#1d3b1d',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4, // 안드로이드
  },

  innerScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },


  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, marginLeft: 12 },
  dotText: { marginRight: 6, color: 'black', fontSize: 22, lineHeight: 26 },
  itemText: { fontSize: 16, fontWeight: '700' },
  addrText: { fontSize: 13, color: '#666' },

  label: { fontSize: 18, fontWeight: 'bold' },
  ribbonTag: { backgroundColor: '#E67249', paddingVertical: 4, paddingHorizontal: 10, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ribbonText: { fontSize: 16, color: '#fff' },
  headerTextContainer: { backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 12, borderTopRightRadius: 10, borderBottomRightRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E67249', marginLeft: -1 },

  flagImage: { position: 'absolute', top: -8, right: -10, width: 70, height: 60, zIndex: 10, marginRight: 10 },
});
