// components/CompatMap.web.js
import React from 'react';
import { View, Text } from 'react-native';

/**
 * 웹 전용 대체 컴포넌트
 * - react-native-maps를 import하지 않음
 */
export default function CompatMap({ style }) {
  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center', backgroundColor: '#7dbfb7', borderRadius: 10 },
        style,
      ]}
    >
      <Text style={{ fontSize: 16, fontWeight: '600' }}>
        지도는 모바일 앱(iOS/Android)에서 표시됩니다.
      </Text>
    </View>
  );
}

// 웹에선 Marker가 필요 없으므로 no-op
export const Marker = () => null;
