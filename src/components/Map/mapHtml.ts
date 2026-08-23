const WAYPOINTS: [number, number][] = [
  [5.5324627, -73.3615504], // Plaza de Bolívar (Inicio)
  [5.5318222, -73.3612502], // Carrera 9 con Calle 19
  [5.5610480, -73.3483751], // Avenida Norte
  [5.5520095, -73.3566646], // Universidad UPTC (Fin)
];

const BUS_STOPS = [
  {
    name: 'Plaza de Bolívar (Punto B)',
    desc: 'Paradero techado · Inicio de ruta',
    coords: [5.5324627, -73.3615504],
    isTerminal: true,
  },
  {
    name: 'Carrera 9 · Calle 19',
    desc: 'Transbordo R-07',
    coords: [5.5318222, -73.3612502],
    isTerminal: false,
  },
  {
    name: 'Avenida Norte (Punto C)',
    desc: 'Sector Santa Rita · Vía 55',
    coords: [5.5610480, -73.3483751],
    isTerminal: false,
  },
  {
    name: 'Universidad UPTC (Punto D)',
    desc: 'Campus Central · Destino final',
    coords: [5.5520095, -73.3566646],
    isTerminal: true,
  },
];

export const mapHtml = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { box-sizing: border-box; }
        html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
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
      <script>
        const waypoints = ${JSON.stringify(WAYPOINTS)};
        const stopsData = ${JSON.stringify(BUS_STOPS)};

        const map = L.map('map', { zoomControl: true }).setView(waypoints[0], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        let shadowLine = null;
        let routeLine = null;
        let busMarker = null;
        let activePath = [];
        let isTripStarted = false;
        let animationFrameId = null;
        let subIndex = 0;
        const BUS_SPEED = 0.045;

        // Render Bus Stop Pins
        stopsData.forEach(function(stop) {
          const isTerminal = stop.isTerminal;
          const iconHtml = '<div class="stop-marker ' + (isTerminal ? 'stop-marker-terminal' : '') + '"><div class="stop-marker-inner"></div></div>';
          
          const stopIcon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const popupContent = '<div class="popup-title">' + stop.name + '</div>' +
                               '<div class="popup-desc">' + stop.desc + '</div>' +
                               '<div class="popup-tag">Línea R-02</div>';

          const marker = L.marker(stop.coords, { icon: stopIcon }).addTo(map);
          marker.bindPopup(popupContent);
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
            '<div class="popup-title">🚌 Bus R-02 en movimiento</div><div class="popup-desc">Plaza de Bolívar ➔ UPTC</div><div class="popup-tag" style="background:#e4f3eb;color:#5f9b7f;">En viaje · 28 km/h</div>' :
            '<div class="popup-title">🚌 Bus R-02 estacionado</div><div class="popup-desc">Presiona "Iniciar viaje" para comenzar</div><div class="popup-tag">Paradero Plaza de Bolívar</div>';
          busMarker.bindPopup(content);
        }

        function setupRouteAndBus(pathPoints) {
          activePath = pathPoints;

          if (shadowLine) map.removeLayer(shadowLine);
          if (routeLine) map.removeLayer(routeLine);
          if (busMarker) map.removeLayer(busMarker);

          shadowLine = L.polyline(activePath, {
            color: '#2b5479',
            weight: 9,
            opacity: 0.25,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          routeLine = L.polyline(activePath, {
            color: '#3f719b',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

          const busIcon = L.divIcon({
            html: getBusIconHtml(isTripStarted),
            className: '',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          busMarker = L.marker(activePath[0], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
          updateBusPopup(isTripStarted);

          if (isTripStarted) {
            startAnimation();
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
          if (event.data && typeof event.data.isStarted !== 'undefined') {
            setTripStarted(event.data.isStarted);
          }
        });

        // Initialize with waypoints immediately so map displays instantly
        setupRouteAndBus(waypoints);

        // Fetch OSRM exact road snapping in background
        const osrmWaypointsStr = waypoints.map(function(p) { return p[1] + ',' + p[0]; }).join(';');
        const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + osrmWaypointsStr + '?overview=full&geometries=geojson';

        fetch(osrmUrl)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
              const osrmCoords = data.routes[0].geometry.coordinates.map(function(c) {
                return [c[1], c[0]];
              });
              setupRouteAndBus(osrmCoords);
            }
          })
          .catch(function() {});
      </script>
    </body>
  </html>
`;
