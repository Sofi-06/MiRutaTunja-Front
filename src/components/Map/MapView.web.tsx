import { useEffect, useRef } from 'react';

import { mapHtml } from './mapHtml';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
const injectedMapHtml = mapHtml.replace('MAPBOX_TOKEN_PLACEHOLDER', mapboxToken);

type MapViewProps = Readonly<{
  isTripStarted?: boolean;
  route?: any;
  customRoute?: any;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
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
  onMapClick,
  onSelectOrigin,
  onSelectDestination,
}: MapViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingScrollRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);

  const scrollPageContainer = (deltaY: number) => {
    // El mapa solo debe transferir desplazamiento vertical. El deltaX del
    // trackpad podía mover horizontalmente toda la pantalla y desalinear la UI.
    pendingScrollRef.current += deltaY;

    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const queuedDeltaY = pendingScrollRef.current;
      pendingScrollRef.current = 0;
      scrollFrameRef.current = null;

      let element = iframeRef.current?.parentElement || null;

      while (element) {
        const styles = window.getComputedStyle(element);
        const canScroll = /(auto|scroll)/.test(styles.overflowY)
          && element.scrollHeight > element.clientHeight + 1;
        if (canScroll) {
          element.scrollBy({ top: queuedDeltaY, left: 0, behavior: 'auto' });
          return;
        }
        element = element.parentElement;
      }

      window.scrollBy({ top: queuedDeltaY, left: 0, behavior: 'auto' });
    });
  };

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ isStarted: isTripStarted }, '*');
    }
  }, [isTripStarted]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const data = {
        type: 'UPDATE_ROUTE',
        route: route ?? [],
        customRoute: customRoute ?? [],
        origin,
        destination,
      };
      iframeRef.current.contentWindow.postMessage(data, '*');
    }
  }, [route, customRoute, origin, destination]);

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
      if (event.source !== iframeRef.current?.contentWindow) return;

      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch(e) {}
      }
      if (data) {
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
        } else if (data.type === 'MAP_SCROLL') {
          scrollPageContainer(Number(data.deltaY) || 0);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      pendingScrollRef.current = 0;
    };
  }, [onMapClick, onSelectOrigin, onSelectDestination]);

  return (
    <div style={{ height: '100%', minHeight: 620, position: 'relative', width: '100%' }}>
      <iframe
        ref={iframeRef}
        title="Mapa de Tunja"
        srcDoc={injectedMapHtml}
        style={{ border: 0, display: 'block', height: '100%', width: '100%' }}
        onLoad={() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ isStarted: isTripStarted }, '*');
            const data = {
              type: 'UPDATE_ROUTE',
              route: route ?? [],
              customRoute: customRoute ?? [],
              origin,
              destination,
            };
            iframeRef.current.contentWindow.postMessage(data, '*');
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
      </div>
    </div>
  );
}
