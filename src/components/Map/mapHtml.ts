export const mapHtml = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
      <style>
        * { box-sizing: border-box; }
        html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #map { touch-action: none; }
        .leaflet-control-attribution { font-size: 10px; background: rgba(255,255,255,0.85) !important; padding: 2px 6px !important; border-radius: 6px; }
        
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

        /* Glassmorphic Popups */
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          padding: 4px 6px !important;
          box-shadow: 0 8px 24px rgba(23, 40, 59, 0.18) !important;
          border: 1px solid #e2edf5;
        }
        .leaflet-popup-tip {
          background: #ffffff;
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
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
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

        console.log("Leaflet WebView: Iniciando mapa...");

        const map = L.map('map', {
          zoomControl: true
        }).setView([5.5324627, -73.3615504], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Agregar la barra de búsqueda configurada para Tunja
        const geocoder = L.Control.geocoder({
          defaultMarkGeocode: false,
          placeholder: "Buscar dirección o sitio en Tunja...",
          geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: {
              countrycodes: 'co', // Limita la búsqueda a Colombia
              viewbox: '-73.38,5.50,-73.32,5.58', // Delimita el área geográfica de Tunja
              bounded: 1
            }
          })
        })
        .on('markgeocode', function(e) {
          const lat = e.geocode.center.lat;
          const lng = e.geocode.center.lng;
          
          console.log("Leaflet WebView: Dirección geocodificada seleccionada:", e.geocode.name, "en coordenadas:", lat, lng);

          // Centrar el mapa
          map.setView([lat, lng], 16);

          // Colocar el marcador de llegada inmediatamente para feedback visual instantáneo
          if (destinationMarker) map.removeLayer(destinationMarker);
          destinationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                      '<div style="width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);margin-bottom:4px;">' +
                        '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                      '</div>' +
                      '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:1.5px solid #ef4444;text-align:center;white-space:nowrap;line-height:1;">Destino</div>' +
                    '</div>',
              className: '',
              iconSize: [120, 80],
              iconAnchor: [60, 24]
            })
          }).addTo(map).bindPopup('<b>' + e.geocode.name + '</b>').openPopup();

          // Enviar coordenadas seleccionadas de vuelta a React Native
          const msg = JSON.stringify({ type: 'MAP_CLICK', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          } else {
            window.parent.postMessage(msg, '*');
          }
        })
        .addTo(map);

        // Click Handler para selección de destino en mapa
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          console.log("Leaflet WebView: Click detectado en mapa en:", lat, lng);
          
          // Colocar marcador de llegada inmediatamente
          if (destinationMarker) map.removeLayer(destinationMarker);
          destinationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                      '<div style="width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);margin-bottom:4px;">' +
                        '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                      '</div>' +
                      '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:1.5px solid #ef4444;text-align:center;white-space:nowrap;line-height:1;">Destino</div>' +
                    '</div>',
              className: '',
              iconSize: [120, 80],
              iconAnchor: [60, 24]
            })
          }).addTo(map).bindPopup('<b>Destino seleccionado</b>').openPopup();

          // Enviar evento de vuelta al contenedor de React Native o web
          const msg = JSON.stringify({ type: 'MAP_CLICK', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          } else {
            window.parent.postMessage(msg, '*');
          }
        });

        let shadowLine = null;
        let routeLine = null;
        let busMarker = null;
        let originMarker = null;
        let destinationMarker = null;
        let activePath = [];
        let isTripStarted = false;
        let animationFrameId = null;
        let subIndex = 0;
        const BUS_SPEED = 0.045;

        // Click Handler for custom destination selection
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          
          // Enviar evento de vuelta al contenedor de React Native o web
          const msg = JSON.stringify({ type: 'MAP_CLICK', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          } else {
            window.parent.postMessage(msg, '*');
          }
        });

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
            '<div class="popup-title">🚌 Bus estacionado</div><div class="popup-desc">Presiona "Iniciar viaje" para comenzar</div>';
          busMarker.bindPopup(content);
        }

        let routePolylines = [];
        let customRouteLine = null;
        let customRouteShadow = null;
 
        function clearCustomRouteLayers() {
          if (customRouteShadow) { map.removeLayer(customRouteShadow); customRouteShadow = null; }
          if (customRouteLine) { map.removeLayer(customRouteLine); customRouteLine = null; }
        }
 
        function clearRouteLayers() {
          if (shadowLine) { map.removeLayer(shadowLine); shadowLine = null; }
          if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
          routePolylines.forEach(function(l) { map.removeLayer(l); });
          routePolylines = [];
          if (busMarker) { map.removeLayer(busMarker); busMarker = null; }
          clearCustomRouteLayers();
        }

        function drawRoute(pathPoints) {
          activePath = pathPoints;
          clearRouteLayers();

          if (!activePath || activePath.length === 0) return;

          shadowLine = L.polyline(activePath, {
            color: '#0891b2',
            weight: 9,
            opacity: 0.25,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          routeLine = L.polyline(activePath, {
            color: '#06b6d4',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
          setupBusMarker(activePath[0]);
        }

        function drawRouteSegments(segments) {
          clearRouteLayers();
          if (!segments || segments.length === 0) return;

          activePath = [];
          
          segments.forEach(function(seg) {
            if (!seg.path || seg.path.length === 0) return;
            
            activePath = activePath.concat(seg.path);
            const color = seg.color || '#3f719b';
            
            const shadow = L.polyline(seg.path, {
              color: color,
              weight: 9,
              opacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
            routePolylines.push(shadow);

            const line = L.polyline(seg.path, {
              color: color,
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
            routePolylines.push(line);
          });

          if (routePolylines.length > 0) {
            const group = L.featureGroup(routePolylines);
            map.fitBounds(group.getBounds(), { padding: [40, 40] });
          }

          if (activePath.length > 0) {
            setupBusMarker(activePath[0]);
          }
        }
 
        function drawCustomRoute(pathPoints) {
          clearCustomRouteLayers();
          if (!pathPoints || pathPoints.length === 0) return;
 
          const formatted = pathPoints.map(function(c) { return [c[1], c[0]]; });
 
          customRouteShadow = L.polyline(formatted, {
            color: '#0891b2',
            weight: 6,
            opacity: 0.15,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);
 
          customRouteLine = L.polyline(formatted, {
            color: '#06b6d4',
            weight: 3,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);
        }

        function setupBusMarker(startLatLng) {
          const busIcon = L.divIcon({
            html: getBusIconHtml(isTripStarted),
            className: '',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          busMarker = L.marker(startLatLng, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
          updateBusPopup(isTripStarted);

          if (isTripStarted) {
            startAnimation();
          }
        }

        function setPoints(origin, destination) {
          if (originMarker) map.removeLayer(originMarker);
          if (destinationMarker) map.removeLayer(destinationMarker);

          if (origin) {
            originMarker = L.marker([origin.lat, origin.lng], {
              icon: L.divIcon({
                html: '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                        '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);margin-bottom:4px;border:1.5px solid #22c55e;text-align:center;white-space:nowrap;line-height:1;">Origen</div>' +
                        '<div style="width:24px;height:24px;background:#22c55e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);">' +
                          '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                        '</div>' +
                      '</div>',
                className: '',
                iconSize: [120, 80],
                iconAnchor: [60, 52]
              })
            }).addTo(map).bindPopup('<b>Punto de Inicio</b>');
            
            if (!destination) {
              map.setView([origin.lat, origin.lng], 15);
            }
          }

          if (destination) {
            destinationMarker = L.marker([destination.lat, destination.lng], {
              icon: L.divIcon({
                html: '<div style="display:flex;flex-direction:column;align-items:center;width:120px;height:80px;position:relative;">' +
                        '<div style="width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:-2px 2px 5px rgba(0,0,0,0.25);margin-bottom:4px;">' +
                          '<div style="width:6px;height:6px;background:white;border-radius:50%;"></div>' +
                        '</div>' +
                        '<div style="background:white;color:#1e293b;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:1.5px solid #ef4444;text-align:center;white-space:nowrap;line-height:1;">Destino</div>' +
                      '</div>',
                className: '',
                iconSize: [120, 80],
                iconAnchor: [60, 24]
              })
            }).addTo(map).bindPopup('<b>Punto de Destino</b>');
          }

          if (origin && destination) {
            map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [45, 45] });
          }
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

          const currentLat = p1[0] + (p2[0] - p1[0]) * progress;
          const currentLng = p1[1] + (p2[1] - p1[1]) * progress;

          busMarker.setLatLng([currentLat, currentLng]);

          animationFrameId = requestAnimationFrame(stepAnimation);
        }

        function startAnimation() {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          stepAnimation();
        }

        function setTripStarted(started) {
          isTripStarted = !!started;
          
          if (busMarker) {
            const busIcon = L.divIcon({
              html: getBusIconHtml(isTripStarted),
              className: '',
              iconSize: [44, 44],
              iconAnchor: [22, 22]
            });
            busMarker.setIcon(busIcon);
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
            busMarker.setLatLng(activePath[0]);
          }
        }

        window.setTripStarted = setTripStarted;

        window.addEventListener('message', function(event) {
          let data = event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e) {}
          }
          if (!data) return;

          if (typeof data.isStarted !== 'undefined') {
            console.log("Leaflet WebView: Actualizando estado del viaje (isTripStarted):", data.isStarted);
            setTripStarted(data.isStarted);
          }
          if (data.type === 'UPDATE_ROUTE') {
            console.log("Leaflet WebView: Recibida actualización de ruta en el mapa.");
            if (!data.route || data.route.length === 0) {
              clearRouteLayers();
            } else if (data.route[0] && typeof data.route[0].path !== 'undefined') {
              var formattedSegments = data.route.map(function(seg) {
                return {
                  path: seg.path.map(function(c) { return [c[1], c[0]]; }),
                  color: seg.color
                };
              });
              drawRouteSegments(formattedSegments);
            } else {
              var formatted = data.route.map(function(c) { return [c[1], c[0]]; });
              drawRoute(formatted);
            }
            if (typeof data.customRoute !== 'undefined') {
              drawCustomRoute(data.customRoute);
            }
            setPoints(data.origin, data.destination);
          }
          if (data.type === 'UPDATE_POINTS_ONLY') {
            console.log("Leaflet WebView: Recibida actualización de puntos de inicio/fin.");
            setPoints(data.origin, data.destination);
          }
        });

      
      </script>
    </body>
  </html>
`;
