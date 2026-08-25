import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { mapHtml } from './mapHtml';

type MapViewProps = Readonly<{
  isTripStarted?: boolean;
  route?: [number, number][] | any[];
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
}>;

export default function MapView({
  isTripStarted = false,
  route,
  origin,
  destination,
  onMapClick,
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
      origin,
      destination,
    };
    const script = `window.postMessage(${JSON.stringify(data)}, '*');`;
    webViewRef.current?.injectJavaScript(script);
  }, [route, origin, destination]);

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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CONSOLE_LOG') {
        console.log('[Leaflet Map WebView]:', data.message);
        return;
      }
      if (data.type === 'MAP_CLICK' && onMapClick) {
        onMapClick(data.lat, data.lng);
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
        source={{ html: mapHtml }}
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
            origin,
            destination,
          };
          const updateScript = `window.postMessage(${JSON.stringify(data)}, '*');`;
          webViewRef.current?.injectJavaScript(updateScript);
        }}
      />
      <View pointerEvents="none" style={styles.label}>
        <Text style={styles.labelEyebrow}>MAPA INTERACTIVO</Text>
        <Text style={styles.labelTitle}>Tunja, Boyacá</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 620, overflow: 'hidden', borderRadius: 24 },
  map: { flex: 1 },
  label: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#17283b',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  labelEyebrow: { color: '#d8957d', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  labelTitle: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 3 },
});
