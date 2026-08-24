import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type SelectedRouteCardProps = Readonly<{
  isCompact?: boolean;
  isTripStarted?: boolean;
  onToggleTrip?: () => void;
  title?: string;
  code?: string;
  duration?: string;
  distanceText?: string;
  stopsCount?: number;
  originName?: string;
  destinationName?: string;
  showRoute1Directions?: boolean;
  showIda?: boolean;
  showVuelta?: boolean;
  onToggleIda?: () => void;
  onToggleVuelta?: () => void;
  schedule?: {
    weekdays: { label: string; hours: string; frequency: string };
    sundaysAndHolidays: { label: string; hours: string; frequency: string };
  };
}>;

export default function SelectedRouteCard({
  isCompact = false,
  isTripStarted: controlledTripStarted,
  onToggleTrip,
  title = 'Mi Ruta Calculada',
  code = 'WALK',
  duration = '22 min',
  distanceText = '1.2 km',
  stopsCount = 4,
  originName = 'Mi ubicación',
  destinationName = 'Destino seleccionado',
  showRoute1Directions = false,
  showIda = true,
  showVuelta = true,
  onToggleIda,
  onToggleVuelta,
  schedule,
}: SelectedRouteCardProps) {
  const [internalTripStarted, setInternalTripStarted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isTripStarted = controlledTripStarted ?? internalTripStarted;

  const handleTripPress = () => {
    if (onToggleTrip) {
      onToggleTrip();
    } else {
      setInternalTripStarted((prev) => !prev);
    }
  };

  const itineraryStops = [
    [originName, 'Punto de partida', 'Inicio'],
    [destinationName, 'Punto de llegada', 'Fin'],
  ] as const;

  return (
    <View style={[styles.selectedRouteCard, isCompact && styles.selectedRouteCardCompact, isCompact && styles.selectedRouteCardPhone]}>
      <View style={styles.selectedRouteHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.selectedRouteEyebrow}>RECORRIDO SELECCIONADO</Text>
          <Text numberOfLines={1} style={styles.selectedRouteTitle}>{title}</Text>
        </View>
        <Text style={styles.selectedRouteCode}>{code}</Text>
      </View>

      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>{duration}</Text>
          <Text style={styles.routeStatLabel}>Duración</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>{distanceText}</Text>
          <Text style={styles.routeStatLabel}>Distancia</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>$0</Text>
          <Text style={styles.routeStatLabel}>Costo</Text>
        </View>
      </View>

      {showRoute1Directions && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 2 }}>Sentidos habilitados:</Text>
          
          <Pressable 
            onPress={onToggleIda}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
          >
            <View style={{ 
              width: 18, 
              height: 18, 
              borderRadius: 4, 
              borderWidth: 2, 
              borderColor: '#4e9b78', 
              backgroundColor: showIda ? '#4e9b78' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}>
              {showIda && <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>
              🟢 Ida: {originName} → {destinationName}
            </Text>
          </Pressable>

          <Pressable 
            onPress={onToggleVuelta}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
          >
            <View style={{ 
              width: 18, 
              height: 18, 
              borderRadius: 4, 
              borderWidth: 2, 
              borderColor: '#f5c242', 
              backgroundColor: showVuelta ? '#f5c242' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}>
              {showVuelta && <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>
              🟡 Vuelta: {destinationName} → {originName}
            </Text>
          </Pressable>
        </View>
      )}

      {schedule && (
        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 2 }}>🕒 Horarios y Frecuencias:</Text>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#14532d' }}>🟢 {schedule.weekdays.label}</Text>
            <Text style={{ fontSize: 11, color: '#166534', marginLeft: 16 }}>{schedule.weekdays.hours} | cada {schedule.weekdays.frequency}</Text>
          </View>
          <View style={{ marginTop: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#14532d' }}>🟡 {schedule.sundaysAndHolidays.label}</Text>
            <Text style={{ fontSize: 11, color: '#166534', marginLeft: 16 }}>{schedule.sundaysAndHolidays.hours} | cada {schedule.sundaysAndHolidays.frequency}</Text>
          </View>
        </View>
      )}

      <Text style={styles.itineraryTitle}>Itinerario</Text>
      <View style={styles.itineraryList}>
        {itineraryStops.map(([name, detail, time], index) => (
          <View key={name + index} style={styles.itineraryRow}>
            <View style={styles.itineraryRail}>
              <View style={[styles.itineraryDot, index === itineraryStops.length - 1 && styles.itineraryDotFinal]} />
              {index < itineraryStops.length - 1 && <View style={styles.itineraryLine} />}
            </View>
            <View style={styles.itineraryCopy}>
              <Text numberOfLines={1} style={styles.itineraryName}>{name}</Text>
              <Text style={styles.itineraryDetail}>{detail}</Text>
            </View>
            <Text style={styles.itineraryTime}>{time}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleTripPress}
        style={[styles.startTripButton, isTripStarted && styles.startTripButtonActive]}
      >
        <Text style={styles.startTripButtonText}>
          {isTripStarted ? '✓ Viaje iniciado' : 'Iniciar viaje'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Guardar ruta"
        onPress={() => setIsSaved((saved) => !saved)}
        style={[
          styles.saveRouteButton,
          isCompact && styles.saveRouteButtonPhone,
          isSaved && styles.saveRouteButtonActive,
        ]}
      >
        <Icon name="star" color={isSaved ? colors.coral : colors.muted} size={19} />
      </Pressable>
    </View>
  );
}
