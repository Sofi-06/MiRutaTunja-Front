import { useEffect, useRef } from 'react';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ isStarted: isTripStarted }, '*');
    }
  }, [isTripStarted]);

  useEffect(() => {
    if (route && iframeRef.current?.contentWindow) {
      const data = {
        type: 'UPDATE_ROUTE',
        route,
        origin,
        destination,
      };
      iframeRef.current.contentWindow.postMessage(data, '*');
    }
  }, [route, origin, destination]);

  useEffect(() => {
    if ((origin || destination) && iframeRef.current?.contentWindow) {
      const data = {
        type: 'UPDATE_POINTS_ONLY',
        origin,
        destination,
      };
      iframeRef.current.contentWindow.postMessage(data, '*');
    }
  }, [origin, destination]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch(e) {}
      }
      if (data && data.type === 'MAP_CLICK' && onMapClick) {
        onMapClick(data.lat, data.lng);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMapClick]);

  return (
    <div style={{ height: '100%', minHeight: 620, position: 'relative', width: '100%' }}>
      <iframe
        ref={iframeRef}
        title="Mapa de Tunja"
        srcDoc={mapHtml}
        style={{ border: 0, display: 'block', height: '100%', width: '100%' }}
        onLoad={() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ isStarted: isTripStarted }, '*');
            if (route) {
              const data = {
                type: 'UPDATE_ROUTE',
                route,
                origin,
                destination,
              };
              iframeRef.current.contentWindow.postMessage(data, '*');
            }
          }
        }}
      />
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          borderRadius: 16,
          boxShadow: '0 5px 12px rgba(23, 40, 59, 0.14)',
          left: 20,
          padding: '12px 16px',
          pointerEvents: 'none',
          position: 'absolute',
          top: 20,
        }}
      >
        <div style={{ color: '#d8957d', fontSize: 10, fontWeight: 800, letterSpacing: '1.2px' }}>
          MAPA INTERACTIVO
        </div>
        <div style={{ color: '#17283b', fontSize: 18, fontWeight: 800, marginTop: 3 }}>Tunja, Boyacá</div>
      </div>
    </div>
  );
}
