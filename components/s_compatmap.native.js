import { forwardRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker as RNMarker } from 'react-native-maps';

/**
 * 네이티브(iOS/Android)용 맵 래퍼
 * - Android에서는 Google Provider를 강제해 안정성 확보
 * - iOS에서도 문제 없이 동작
 */
const CompatMap = forwardRef(function CompatMap({ style, children, ...rest }, ref) {
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      mapType="standard"
      style={style}
      {...rest}
    >
      {children}
    </MapView>
  );
});

export default CompatMap;
export const Marker = RNMarker;
export { PROVIDER_GOOGLE };
