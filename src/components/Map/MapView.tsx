import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { mapHtml } from './mapHtml';

type MapViewProps = Readonly<{
  isTripStarted?: boolean;
}>;

export default function MapView({ isTripStarted = false }: MapViewProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const script = `if (window.setTripStarted) { window.setTripStarted(${isTripStarted}); }`;
    webViewRef.current?.injectJavaScript(script);
  }, [isTripStarted]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => {
          const script = `if (window.setTripStarted) { window.setTripStarted(${isTripStarted}); }`;
          webViewRef.current?.injectJavaScript(script);
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
