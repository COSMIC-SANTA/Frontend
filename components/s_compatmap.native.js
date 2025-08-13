// components/CompatMap.native.js
import React from 'react';
import MapView, { Marker as RNMarker } from 'react-native-maps';

/**
 * 네이티브(iOS/Android)용 맵 래퍼
 * - 웹에선 이 파일이 로드되지 않음(web 전용 파일이 대체)
 */
export default function CompatMap({ region, style, children, ...rest }) {
  return (
    <MapView style={style} initialRegion={region} {...rest}>
      {children}
    </MapView>
  );
}

export const Marker = RNMarker;
