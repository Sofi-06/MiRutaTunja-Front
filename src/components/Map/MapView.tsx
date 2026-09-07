import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { mapHtml } from './mapHtml';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
const injectedMapHtml = mapHtml.replace('MAPBOX_TOKEN_PLACEHOLDER', mapboxToken);

type MapViewProps = Readonly<{
  isTripStarted?: boolean;
  route?: any;
  customRoute?: any;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  pickMode?: 'ORIGIN' | 'DEST' | null;
  onMapClick?: (lat: number, lng: number) => void;
  onSelectOrigin?: (lat: number, lng: number) => void;
  onSelectDestination?: (lat: number, lng: number) => void;
}>;

export default function MapView({
  isTripStarted = false,
  route,
  customRoute,
  origin,
  destination,
  pickMode,
  onMapClick,
  onSelectOrigin,
  onSelectDestination,
}: MapViewProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const script = `if (window.setTripStarted) { window.setTripStarted(${isTripStarted}); }`;
    webViewRef.current?.injectJavaScript(script);
  }, [isTripStarted]);

  useEffect(() => {
    const data = {
      type: 'UPDATE_ROUTE',
      route: route ?? [],
      customRoute: customRoute ?? [],
      origin,
      destination,
    };
    const script = `window.postMessage(${JSON.stringify(data)}, '*');`;
    webViewRef.current?.injectJavaScript(script);
  }, [route, customRoute, origin, destination]);

  useEffect(() => {
    if (origin || destination) {
      const data = {
        type: 'UPDATE_POINTS_ONLY',
        origin,
        destination,
      };
      const script = `window.postMessage(${JSON.stringify(data)}, '*');`;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [origin, destination]);

  useEffect(() => {
    if (pickMode) {
      const data = { type: 'START_PICK_MODE', target: pickMode };
      const script = `window.postMessage(${JSON.stringify(data)}, '*'); if (window.startPickMode) window.startPickMode('${pickMode}');`;
      webViewRef.current?.injectJavaScript(script);
    } else {
      const data = { type: 'CANCEL_PICK_MODE' };
      const script = `window.postMessage(${JSON.stringify(data)}, '*'); if (window.cancelPickMode) window.cancelPickMode();`;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [pickMode]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CONSOLE_LOG') {
        console.log('[Mapbox Map WebView]:', data.message);
        return;
      }
      if (data.type === 'SET_ORIGIN') {
        if (onSelectOrigin) {
          onSelectOrigin(data.lat, data.lng);
        }
      } else if (data.type === 'SET_DESTINATION' || data.type === 'MAP_CLICK') {
        if (onSelectDestination) {
          onSelectDestination(data.lat, data.lng);
        } else if (onMapClick) {
          onMapClick(data.lat, data.lng);
        }
      }
    } catch (e) {
      console.error('Error parsing map message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: injectedMapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        overScrollMode="never"
        onMessage={handleMessage}
        onLoadEnd={() => {
          const script = `if (window.setTripStarted) { window.setTripStarted(${isTripStarted}); }`;
          webViewRef.current?.injectJavaScript(script);
          
          const data = {
            type: 'UPDATE_ROUTE',
            route: route ?? [],
            customRoute: customRoute ?? [],
            origin,
            destination,
          };
          const updateScript = `window.postMessage(${JSON.stringify(data)}, '*');`;
          webViewRef.current?.injectJavaScript(updateScript);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 620, overflow: 'hidden', borderRadius: 24 },
  map: { flex: 1 },
});
