const TUNJA_COORDINATES: [number, number] = [5.5353, -73.3678];

export const mapHtml = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .leaflet-control-attribution { font-size: 10px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map', { zoomControl: true }).setView([${TUNJA_COORDINATES[0]}, ${TUNJA_COORDINATES[1]}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        L.marker([${TUNJA_COORDINATES[0]}, ${TUNJA_COORDINATES[1]}])
          .addTo(map)
          .bindPopup('Tunja')
          .openPopup();
      </script>
    </body>
  </html>
`;
