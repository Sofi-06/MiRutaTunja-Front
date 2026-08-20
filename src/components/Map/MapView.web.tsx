import { mapHtml } from './mapHtml';

export default function MapView() {
  return (
    <div style={{ height: 520, position: 'relative', width: '100%' }}>
      <iframe
        title="Mapa de Tunja"
        srcDoc={mapHtml}
        style={{ border: 0, display: 'block', height: '100%', width: '100%' }}
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
