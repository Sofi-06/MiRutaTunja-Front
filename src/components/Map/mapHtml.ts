export const mapHtml = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet" />
      
      <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
      
      <style>
        * { box-sizing: border-box; }
        html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #map { touch-action: none; }
        
        /* Custom Geocoder Styles to look premium */
        .mapboxgl-ctrl-geocoder {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(23, 40, 59, 0.15) !important;
          border: 1px solid #e2edf5 !important;
          font-family: inherit !important;
          width: 280px !important;
          max-width: 280px !important;
        }
        .mapboxgl-ctrl-geocoder--input {
          height: 40px !important;
          padding: 6px 35px !important;
        }
        .mapboxgl-ctrl-geocoder--icon-search {
          top: 10px !important;
          left: 10px !important;
        }
        .mapboxgl-ctrl-geocoder--button {
          top: 8px !important;
        }
        
        /* Bus stop marker */
        .stop-marker {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3f719b;
          box-shadow: 0 3px 8px rgba(23, 40, 59, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        .stop-marker-terminal {
          border-color: #d8957d;
        }
        .stop-marker-inner {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2b5479;
        }
        .stop-marker-terminal .stop-marker-inner {
          background: #d8957d;
        }

        /* Live Bus Marker Badge */
        .bus-marker-container {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bus-pulse-ring {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(63, 113, 155, 0.35);
          animation: pulseRing 1.8s infinite ease-out;
        }
        .bus-pulse-ring-stopped {
          animation: none;
          background: rgba(114, 128, 146, 0.2);
        }
        @keyframes pulseRing {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .bus-badge {
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2b5479 0%, #3f719b 100%);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(23, 40, 59, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 16px;
          line-height: 1;
        }
        .bus-badge-moving {
          background: linear-gradient(135deg, #3f719b 0%, #4e9b78 100%);
        }

        /* Walking (Muñequito) Markers */
        .walk-marker-container-horizontal {
          display: flex;
          flex-direction: row;
          align-items: center;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          pointer-events: auto;
        }
        .walk-label-pill {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          color: #17283b;
          border: 1.5px solid #10b981;
          box-shadow: 0 4px 12px rgba(23, 40, 59, 0.18);
          white-space: nowrap;
          pointer-events: none;
        }
        .walk-label-dropoff {
          border-color: #f59e0b;
          color: #92400e;
        }
        .walk-badge-wrapper {
          position: relative;
          width: 34px;
          height: 34px;
          min-width: 34px;
          min-height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .walk-pulse-ring {
          position: absolute;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.45);
          animation: pulseRing 1.8s infinite ease-out;
          pointer-events: none;
        }
        .walk-pulse-ring-dropoff {
          background: rgba(245, 158, 11, 0.45);
        }
        .walk-badge {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(23, 40, 59, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
        }
        .walk-badge-dropoff {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        /* Glassmorphic Popups */
        .mapboxgl-popup-content {
          background: rgba(255, 255, 255, 0.96) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 14px !important;
          padding: 12px 14px !important;
          box-shadow: 0 8px 24px rgba(23, 40, 59, 0.18) !important;
          border: 1px solid #e2edf5 !important;
          font-family: inherit;
        }
        .mapboxgl-popup-close-button {
          padding: 4px 8px !important;
          font-size: 14px !important;
          color: #728092 !important;
        }
        .popup-title {
          font-size: 14px;
          font-weight: 800;
          color: #17283b;
          margin-bottom: 3px;
        }
        .popup-desc {
          font-size: 12px;
          color: #728092;
          font-weight: 500;
        }
        .popup-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: #3f719b;
          background: #e7f3fb;
          padding: 3px 8px;
          border-radius: 10px;
          margin-top: 6px;
        }

        /* Interactive Pin Action Popup */
        .map-action-popup {
          padding: 4px 2px 2px 2px;
          min-width: 190px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .action-popup-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .action-popup-title {
          font-size: 13px;
          font-weight: 800;
          color: #17283b;
        }
        .action-popup-coords {
          font-size: 11px;
          color: #728092;
          font-weight: 500;
        }
        .action-popup-buttons {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-action-point {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }
        .btn-action-origin {
          background: #eef9f2;
          color: #166534;
          border-color: #bbf7d0;
        }
        .btn-action-origin:hover {
          background: #dcfce7;
          border-color: #86efac;
          transform: translateY(-1px);
        }
        .btn-action-dest {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .btn-action-dest:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }
        .dot-origin {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
        }
        .dot-dest {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
        }

        /* Floating Pick Mode Banner */
        #pick-mode-banner {
          display: none;
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          background: rgba(23, 40, 59, 0.95);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          animation: bannerSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bannerSlideDown {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .btn-cancel-pick {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #ffffff;
          border-radius: 12px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btn-cancel-pick:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      </style>
    </head>
    <body>
      <div id="pick-mode-banner">
        <span id="pick-mode-text">📍 Toca en el mapa para fijar ubicación</span>
        <button type="button" class="btn-cancel-pick" onclick="window.cancelPickMode()">✕ Cancelar</button>
      </div>
      <div id="map"></div>
      <script>
        // Redirigir console.log a React Native para verlos en la terminal de la computadora
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          const msg = JSON.stringify({ type: 'CONSOLE_LOG', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          }
        };

        console.log("Mapbox WebView: Iniciando mapa vectorial...");

        mapboxgl.accessToken = 'MAPBOX_TOKEN_PLACEHOLDER';

        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-73.3615504, 5.5324627], // Formato [lng, lat] para Mapbox
          zoom: 14,
          projection: 'globe' // Efecto globo 3D premium
        });

        // Controles de navegación de Mapbox
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Agregar la barra de búsqueda configurada para Tunja
        const geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          placeholder: "Buscar en Tunja...",
          countries: 'co', // Limita a Colombia
          bbox: [-73.38, 5.50, -73.32, 5.58], // Delimita a Tunja [minLng, minLat, maxLng, maxLat]
          proximity: [-73.3615504, 5.5324627],
          marker: false // Manejamos el marcador manualmente
        });

        geocoder.on('result', function(e) {
          const lng = e.result.center[0];
          const lat = e.result.center[1];
          const name = e.result.place_name;
          
          console.log("Mapbox WebView: Dirección geocodificada seleccionada:", name, "en coordenadas:", lat, lng);

          // Centrar el mapa
          map.easeTo({
            center: [lng, lat],
            zoom: 16
          });

          // Colocar el marcador de llegada inmediatamente para feedback visual instantáneo
          setDestinationMarker(lat, lng, name);

          // Enviar coordenadas seleccionadas de vuelta a React Native
          const msg = JSON.stringify({ type: 'SET_DESTINATION', lat: lat, lng: lng, name: name });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          } else {
            window.parent.postMessage(msg, '*');
          }
        });

        // Variables para control de arrastre, popup y modo de captura de mapa
        let isDragging = false;
        let dragTimer = null;
        let actionPopup = null;
        let pickTarget = null; // 'ORIGIN' | 'DEST' | null

        map.on('dragstart', function() {
          isDragging = true;
          if (dragTimer) clearTimeout(dragTimer);
        });

        map.on('dragend', function() {
          if (dragTimer) clearTimeout(dragTimer);
          dragTimer = setTimeout(function() {
            isDragging = false;
          }, 150);
        });

        // Modo de captura interactiva en mapa
        window.startPickMode = function(target) {
          pickTarget = target;
          const banner = document.getElementById('pick-mode-banner');
          const text = document.getElementById('pick-mode-text');
          if (banner && text) {
            text.innerText = target === 'ORIGIN'
              ? '📍 Modo activo: Toca en el mapa para fijar tu ORIGEN'
              : '🎯 Modo activo: Toca en el mapa para fijar tu DESTINO';
            banner.style.display = 'flex';
          }
          map.getCanvas().style.cursor = 'crosshair';
          if (actionPopup) {
            actionPopup.remove();
            actionPopup = null;
          }
        };

        window.cancelPickMode = function() {
          pickTarget = null;
          const banner = document.getElementById('pick-mode-banner');
          if (banner) {
            banner.style.display = 'none';
          }
          map.getCanvas().style.cursor = '';
        };

        // Función global para confirmar selección de origen o destino
        window.confirmSetPoint = function(lat, lng, type) {
          if (actionPopup) {
            actionPopup.remove();
            actionPopup = null;
          }

          if (type === 'ORIGIN') {
            console.log("Mapbox WebView: Origen confirmado en:", lat, lng);
            const msg = JSON.stringify({ type: 'SET_ORIGIN', lat: lat, lng: lng });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(msg);
            } else {
              window.parent.postMessage(msg, '*');
            }
          } else if (type === 'DEST') {
            console.log("Mapbox WebView: Destino confirmado en:", lat, lng);
            setDestinationMarker(lat, lng, "Destino seleccionado");
            const msg = JSON.stringify({ type: 'SET_DESTINATION', lat: lat, lng: lng });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(msg);
            } else {
              window.parent.postMessage(msg, '*');
            }
          }
        };

        // Click Handler para interacción limpia con el mapa
        map.on('click', function(e) {
          if (isDragging) {
            return;
          }

          const lat = e.lngLat.lat;
          const lng = e.lngLat.lng;

          // Si el modo de selección rápida está activo, asignar directamente
          if (pickTarget) {
            const target = pickTarget;
            window.cancelPickMode();
            window.confirmSetPoint(lat, lng, target);
            return;
          }

          // Comprobar si el clic fue en un tramo de ruta para priorizar la interactividad de la ruta
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['route-layer']
          });
          if (features.length > 0) {
            return;
          }

          console.log("Mapbox WebView: Click detectado en mapa en:", lat, lng);

          if (actionPopup) {
            actionPopup.remove();
          }

          const popupHtml = '<div class="map-action-popup">' +
            '<div class="action-popup-header">' +
              '<span class="action-popup-title">📍 Punto en el mapa</span>' +
            '</div>' +
            '<div class="action-popup-coords">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div>' +
            '<div class="action-popup-buttons">' +
              '<button type="button" class="btn-action-point btn-action-origin" onclick="window.confirmSetPoint(' + lat + ', ' + lng + ', \\\'ORIGIN\\\')">' +
                '<span class="dot-origin"></span> Origen' +
              '</button>' +
              '<button type="button" class="btn-action-point btn-action-dest" onclick="window.confirmSetPoint(' + lat + ', ' + lng + ', \\\'DEST\\\')">' +
                '<span class="dot-dest"></span> Destino' +
              '</button>' +
            '</div>' +
          '</div>';

          actionPopup = new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 12, closeButton: true })
            .setLngLat([lng, lat])
            .setHTML(popupHtml)
            .addTo(map);
        });

        let activePath = [];
        let isTripStarted = false;
        let animationFrameId = null;
        let subIndex = 0;
        const BUS_SPEED = 0.045;

        let busMarker = null;
        let originMarker = null;
        let destinationMarker = null;
        let boardingMarker = null;
        let dropoffMarker = null;

        // Variables de sincronización para evitar condiciones de carrera antes de la carga del mapa
        let isMapLoaded = false;
        let pendingRouteData = null;
        let pendingPointsData = null;
        let pendingTripStarted = null;

        function getBusIconHtml(isMoving) {
          return '<div class="bus-marker-container">' +
                   '<div class="bus-pulse-ring ' + (isMoving ? '' : 'bus-pulse-ring-stopped') + '"></div>' +
                   '<div class="bus-badge ' + (isMoving ? 'bus-badge-moving' : '') + '">🚌</div>' +
                 '</div>';
        }

        function updateBusPopup(isMoving) {
          if (!busMarker) return;
          const content = isMoving ?
            '<div class="popup-title">🚌 Bus en movimiento</div><div class="popup-tag" style="background:#e4f3eb;color:#5f9b7f;">En viaje</div>' :
            '<div class="popup-title">🚌 Bus disponible</div><div class="popup-desc">Presiona "Iniciar viaje" para simular el recorrido</div>';
          
          busMarker.setPopup(new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 15 }).setHTML(content));
        }

        function setupBoardingMarker(coords) {
          if (boardingMarker) { boardingMarker.remove(); boardingMarker = null; }
          if (!coords || coords.length < 2) return;

          const el = document.createElement('div');
          el.className = 'walk-marker-container-horizontal';
          el.innerHTML = '<div class="walk-badge-wrapper">' +
                           '<div class="walk-pulse-ring"></div>' +
                           '<div class="walk-badge">🚶‍♂️</div>' +
                         '</div>' +
                         '<div class="walk-label-pill" style="margin-left: 6px;">Sube aquí</div>';

          boardingMarker = new mapboxgl.Marker({ element: el, anchor: 'left', offset: [-17, 0] })
            .setLngLat(coords)
            .setPopup(new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 15 }).setHTML('<b>🚶‍♂️ Punto de Abordaje</b><br><span style="font-size:11px;color:#64748b;">Camina hasta este punto para tomar el bus.</span>'))
            .addTo(map);
        }

        function setupDropoffMarker(coords) {
          if (dropoffMarker) { dropoffMarker.remove(); dropoffMarker = null; }
          if (!coords || coords.length < 2) return;

          const el = document.createElement('div');
          el.className = 'walk-marker-container-horizontal';
          el.innerHTML = '<div class="walk-badge-wrapper">' +
                           '<div class="walk-pulse-ring walk-pulse-ring-dropoff"></div>' +
                           '<div class="walk-badge walk-badge-dropoff">🚶‍♂️</div>' +
                         '</div>' +
                         '<div class="walk-label-pill walk-label-dropoff" style="margin-left: 6px;">Bájate aquí</div>';

          dropoffMarker = new mapboxgl.Marker({ element: el, anchor: 'left', offset: [-17, 0] })
            .setLngLat(coords)
            .setPopup(new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 15 }).setHTML('<b>🚶‍♂️ Punto de Bajada</b><br><span style="font-size:11px;color:#64748b;">Bájate del bus aquí y camina hacia tu destino final.</span>'))
            .addTo(map);
        }

        function clearRouteLayers() {
          if (map.getSource('route-source')) {
            map.getSource('route-source').setData({
              type: 'FeatureCollection',
              features: []
            });
          }
          if (map.getSource('custom-route-source')) {
            map.getSource('custom-route-source').setData({
              type: 'FeatureCollection',
              features: []
            });
          }
          if (busMarker) { busMarker.remove(); busMarker = null; }
          if (boardingMarker) { boardingMarker.remove(); boardingMarker = null; }
          if (dropoffMarker) { dropoffMarker.remove(); dropoffMarker = null; }
        }

        function drawRoute(pathPoints) {
          activePath = pathPoints;
          clearRouteLayers();

          if (!activePath || activePath.length === 0) return;

          const geojson = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: activePath
              },
              properties: {
                color: '#10b981',
                originalColor: '#10b981',
                name: 'Ruta activa'
              }
            }]
          };

          if (map.getSource('route-source')) {
            map.getSource('route-source').setData(geojson);
          }

          const bounds = new mapboxgl.LngLatBounds();
          activePath.forEach(function(p) { bounds.extend(p); });
          map.fitBounds(bounds, { padding: 40, duration: 1200 });

          setupBusMarker(activePath[0]);
        }

        function drawRouteSegments(segments) {
          clearRouteLayers();
          if (!segments || segments.length === 0) return;

          activePath = [];
          const features = [];

          segments.forEach(function(seg) {
            if (!seg.path || seg.path.length === 0) return;
            
            activePath = activePath.concat(seg.path);
            
            features.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: seg.path
              },
              properties: {
                color: seg.color || '#3f719b',
                originalColor: seg.originalColor || seg.color || '#3f719b',
                name: seg.name || 'Tramo de vía',
                ...seg.properties
              }
            });
          });

          const geojson = {
            type: 'FeatureCollection',
            features: features
          };

          if (map.getSource('route-source')) {
            map.getSource('route-source').setData(geojson);
          }

          if (activePath.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            activePath.forEach(function(p) { bounds.extend(p); });
            map.fitBounds(bounds, { padding: 40, duration: 1200 });
            
            setupBusMarker(activePath[0]);
          }
        }

        function drawCustomRoute(customRouteData) {
          if (!customRouteData) {
            if (map.getSource('custom-route-source')) {
              map.getSource('custom-route-source').setData({
                type: 'FeatureCollection',
                features: []
              });
            }
            if (boardingMarker) { boardingMarker.remove(); boardingMarker = null; }
            if (dropoffMarker) { dropoffMarker.remove(); dropoffMarker = null; }
            return;
          }

          let geojson = {
            type: 'FeatureCollection',
            features: []
          };

          if (customRouteData.isMultimodal) {
            if (customRouteData.tramoA && customRouteData.tramoA.length >= 2) {
              geojson.features.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: customRouteData.tramoA
                },
                properties: {
                  isWalking: true,
                  name: 'Caminata hacia el bus'
                }
              });
            }
            if (customRouteData.tramoB && customRouteData.tramoB.length >= 2) {
              geojson.features.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: customRouteData.tramoB
                },
                properties: {
                  isBus: true,
                  name: 'Trayecto en bus'
                }
              });
              activePath = customRouteData.tramoB;
              setupBusMarker(activePath[0]);
            }
            if (customRouteData.tramoC && customRouteData.tramoC.length >= 2) {
              geojson.features.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: customRouteData.tramoC
                },
                properties: {
                  isWalking: true,
                  name: 'Caminata hacia el destino'
                }
              });
            }

            // Colocar marcadores visuales del muñequito caminando en subida y bajada
            const bp = customRouteData.boardingPoint || (customRouteData.tramoB && customRouteData.tramoB[0]);
            if (bp) {
              setupBoardingMarker(bp);
            }
            const dp = customRouteData.dropoffPoint || (customRouteData.tramoB && customRouteData.tramoB[customRouteData.tramoB.length - 1]);
            if (dp) {
              setupDropoffMarker(dp);
            }

            // Enfocar la vista del mapa exactamente en el viaje del usuario
            const allTripCoords = [
              ...(customRouteData.tramoA || []),
              ...(customRouteData.tramoB || []),
              ...(customRouteData.tramoC || [])
            ];
            if (allTripCoords.length > 0) {
              const bounds = new mapboxgl.LngLatBounds();
              allTripCoords.forEach(function(p) { bounds.extend(p); });
              map.fitBounds(bounds, { padding: 50, duration: 1000 });
            }

          } else {
            const pathPoints = Array.isArray(customRouteData) ? customRouteData : (customRouteData.route || []);
            if (pathPoints.length >= 2) {
              geojson.features.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: pathPoints
                },
                properties: {
                  isWalking: true,
                  name: 'Ruta directa'
                }
              });
              activePath = pathPoints;
              const bounds = new mapboxgl.LngLatBounds();
              activePath.forEach(function(p) { bounds.extend(p); });
              map.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
            if (boardingMarker) { boardingMarker.remove(); boardingMarker = null; }
            if (dropoffMarker) { dropoffMarker.remove(); dropoffMarker = null; }
          }

          if (map.getSource('custom-route-source')) {
            map.getSource('custom-route-source').setData(geojson);
          }
        }

        function setupBusMarker(startLngLat) {
          if (busMarker) { busMarker.remove(); busMarker = null; }

          const el = document.createElement('div');
          el.innerHTML = getBusIconHtml(isTripStarted);

          busMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(startLngLat)
            .addTo(map);

          updateBusPopup(isTripStarted);

          if (isTripStarted) {
            startAnimation();
          }
        }

        function setPoints(origin, destination) {
          if (originMarker) { originMarker.remove(); originMarker = null; }
          if (destinationMarker) { destinationMarker.remove(); destinationMarker = null; }

          if (origin) {
            const el = document.createElement('div');
            el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                             '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);margin-bottom:4px;border:1.5px solid #22c55e;text-align:center;white-space:nowrap;line-height:1;">Origen</div>' +
                             '<div style="width:24px;height:24px;background:#22c55e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);">' +
                               '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                             '</div>' +
                           '</div>';
            
            originMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([origin.lng, origin.lat])
              .setPopup(new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 15 }).setHTML('<b>Punto de Inicio</b>'))
              .addTo(map);
            
            if (!destination) {
              map.easeTo({ center: [origin.lng, origin.lat], zoom: 15 });
            }
          }

          if (destination) {
            setDestinationMarker(destination.lat, destination.lng, "Punto de Destino");
          }

          if (origin && destination) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([origin.lng, origin.lat]);
            bounds.extend([destination.lng, destination.lat]);
            map.fitBounds(bounds, { padding: 45, duration: 1200 });
          }
        }

        function setDestinationMarker(lat, lng, title) {
          if (destinationMarker) { destinationMarker.remove(); destinationMarker = null; }
          
          const el = document.createElement('div');
          el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                           '<div style="width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);margin-bottom:4px;">' +
                             '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                           '</div>' +
                           '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:1.5px solid #ef4444;text-align:center;white-space:nowrap;line-height:1;">Destino</div>' +
                         '</div>';
          
          destinationMarker = new mapboxgl.Marker({ element: el, anchor: 'top' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ className: 'glassmorphic-popup', offset: 15 }).setHTML('<b>' + title + '</b>'))
            .addTo(map);
          destinationMarker.togglePopup();
        }

        function stepAnimation() {
          if (!isTripStarted || !activePath.length) return;

          subIndex += BUS_SPEED;
          if (subIndex >= activePath.length - 1) {
            subIndex = 0;
          }

          const idx = Math.floor(subIndex);
          const nextIdx = (idx + 1) % activePath.length;
          const progress = subIndex - idx;

          const p1 = activePath[idx];
          const p2 = activePath[nextIdx];

          const currentLng = p1[0] + (p2[0] - p1[0]) * progress;
          const currentLat = p1[1] + (p2[1] - p1[1]) * progress;

          if (busMarker) {
            busMarker.setLngLat([currentLng, currentLat]);
          }

          animationFrameId = requestAnimationFrame(stepAnimation);
        }

        function startAnimation() {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          stepAnimation();
        }

        function setTripStarted(started) {
          isTripStarted = !!started;
          
          if (busMarker) {
            const el = busMarker.getElement();
            el.innerHTML = getBusIconHtml(isTripStarted);
            updateBusPopup(isTripStarted);
          }

          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }

          if (isTripStarted && activePath.length) {
            startAnimation();
          } else if (busMarker && activePath.length) {
            subIndex = 0;
            busMarker.setLngLat(activePath[0]);
          }
        }

        window.setTripStarted = setTripStarted;

        // Procesamiento unificado de rutas y puntos
        function processUpdateRoute(data) {
          if (!data) return;
          
          clearRouteLayers();

          const hasCustomTrip = (data.customRoute && (data.customRoute.isMultimodal || (Array.isArray(data.customRoute) && data.customRoute.length > 0))) ||
                                (data.route && data.route.isMultimodal);

          if (hasCustomTrip) {
            // Cuando hay un trayecto calculado para el usuario, SOLO dibujamos lo que le sirve
            const customData = (data.customRoute && (data.customRoute.isMultimodal || (Array.isArray(data.customRoute) && data.customRoute.length > 0)))
              ? data.customRoute
              : data.route;
            drawCustomRoute(customData);
          } else {
            // Si solo se está consultando una ruta sin viaje calculado, mostramos el trazado de referencia
            if (data.route) {
              if (Array.isArray(data.route)) {
                if (data.route.length === 0) {
                  // already cleared
                } else if (data.route[0] && typeof data.route[0].path !== 'undefined') {
                  drawRouteSegments(data.route);
                } else {
                  drawRoute(data.route);
                }
              }
            }
          }

          processUpdatePoints(data);
        }

        function processUpdatePoints(data) {
          if (!data) return;
          setPoints(data.origin, data.destination);
        }

        // Configuración de capas y eventos una vez cargado el estilo de Mapbox
        map.on('load', function() {
          console.log("Mapbox WebView: Estilo base cargado, registrando fuentes y capas vectoriales...");
          
          // Registrar fuente GeoJSON principal
          map.addSource('route-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Capa de resplandor (glow)
          map.addLayer({
            id: 'route-shadow-layer',
            type: 'line',
            source: 'route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': ['get', 'originalColor'],
              'line-width': ['*', ['coalesce', ['get', 'stroke-width'], 5], 1.8],
              'line-opacity': 0.22
            }
          });

          // Capa principal del tramo de ruta
          map.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': ['get', 'originalColor'],
              'line-width': ['coalesce', ['get', 'stroke-width'], 5],
              'line-opacity': 0.88
            }
          });

          // Registrar fuente GeoJSON de ruta multimodal / personalizada
          map.addSource('custom-route-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Capa resplandor custom (solo para el tramo de bus)
          map.addLayer({
            id: 'custom-route-shadow-layer',
            type: 'line',
            source: 'custom-route-source',
            filter: ['==', ['get', 'isBus'], true],
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 9,
              'line-opacity': 0.25
            }
          });

          // Capa caminata custom (dashed)
          map.addLayer({
            id: 'custom-route-walk-layer',
            type: 'line',
            source: 'custom-route-source',
            filter: ['==', ['get', 'isWalking'], true],
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#64748b',
              'line-width': 3.5,
              'line-dasharray': [2, 2],
              'line-opacity': 0.85
            }
          });

          // Capa principal bus custom (solid)
          map.addLayer({
            id: 'custom-route-bus-layer',
            type: 'line',
            source: 'custom-route-source',
            filter: ['==', ['get', 'isBus'], true],
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 5.5,
              'line-opacity': 0.92
            }
          });

          // Configurar interactividad sobre los tramos trazados
          map.on('click', 'route-layer', function(e) {
            if (!e.features.length) return;
            
            const coordinates = e.lngLat;
            const properties = e.features[0].properties;
            const name = properties.name || 'Calle sin nombre';
            const originalColor = properties.originalColor || '#3f719b';
            
            new mapboxgl.Popup({ className: 'glassmorphic-popup' })
              .setLngLat(coordinates)
              .setHTML(
                '<div class="popup-title">📍 ' + name + '</div>' +
                '<div class="popup-desc">Tramo de transporte urbano</div>' +
                '<div class="popup-tag" style="background:' + originalColor + '22; color:' + originalColor + '; border:1.5px solid ' + originalColor + '44;">' +
                  'Vía Color: ' + originalColor.toUpperCase() +
                '</div>'
              )
              .addTo(map);
          });

          // Cambiar el cursor a puntero al pasar sobre la ruta
          map.on('mouseenter', 'route-layer', function() {
            if (!pickTarget) map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'route-layer', function() {
            if (!pickTarget) map.getCanvas().style.cursor = '';
          });

          // El mapa está listo, procesar todas las solicitudes diferidas
          isMapLoaded = true;
          console.log("Mapbox WebView: Mapa completamente inicializado. Procesando solicitudes pendientes...");

          if (pendingRouteData) {
            console.log("Mapbox WebView: Dibujando ruta pendiente...");
            processUpdateRoute(pendingRouteData);
            pendingRouteData = null;
          } else if (pendingPointsData) {
            console.log("Mapbox WebView: Dibujando puntos pendientes...");
            processUpdatePoints(pendingPointsData);
            pendingPointsData = null;
          }

          if (pendingTripStarted !== null) {
            console.log("Mapbox WebView: Iniciando viaje pendiente...");
            setTripStarted(pendingTripStarted);
            pendingTripStarted = null;
          }
        });

        // Escuchar mensajes provenientes de React Native
        window.addEventListener('message', function(event) {
          let data = event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e) {}
          }
          if (!data) return;

          if (typeof data.isStarted !== 'undefined') {
            console.log("Mapbox WebView: Recibido estado de viaje (isTripStarted):", data.isStarted);
            if (!isMapLoaded) {
              pendingTripStarted = data.isStarted;
            } else {
              setTripStarted(data.isStarted);
            }
          }
          
          if (data.type === 'START_PICK_MODE') {
            console.log("Mapbox WebView: Activando modo captura de mapa para:", data.target);
            window.startPickMode(data.target);
          }

          if (data.type === 'CANCEL_PICK_MODE') {
            console.log("Mapbox WebView: Cancelando modo captura de mapa");
            window.cancelPickMode();
          }

          if (data.type === 'UPDATE_ROUTE') {
            console.log("Mapbox WebView: Recibida actualización de ruta.");
            if (!isMapLoaded) {
              pendingRouteData = data;
            } else {
              processUpdateRoute(data);
            }
          }
          
          if (data.type === 'UPDATE_POINTS_ONLY') {
            console.log("Mapbox WebView: Recibida actualización de puntos origen/destino.");
            if (!isMapLoaded) {
              pendingPointsData = data;
            } else {
              processUpdatePoints(data);
            }
          }
        });
      </script>
    </body>
  </html>
`;
