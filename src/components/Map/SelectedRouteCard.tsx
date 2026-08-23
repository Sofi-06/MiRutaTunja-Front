import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

const stops = [
  ['Plaza de Bolívar', 'Paradero techado', '7:42'],
  ['Carrera 9 · Calle 19', 'Transbordo R-07', '7:47'],
  ['Avenida Norte', 'Vía con tráfico moderado', '7:54'],
  ['Universidad UPTC', 'Destino final', '8:04'],
] as const;

type SelectedRouteCardProps = Readonly<{
  isCompact?: boolean;
  isTripStarted?: boolean;
  onToggleTrip?: () => void;
}>;

export default function SelectedRouteCard({
  isCompact = false,
  isTripStarted: controlledTripStarted,
  onToggleTrip,
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

  return (
    <View style={[styles.selectedRouteCard, isCompact && styles.selectedRouteCardCompact, isCompact && styles.selectedRouteCardPhone]}>
      <View style={styles.selectedRouteHeader}>
        <View>
          <Text style={styles.selectedRouteEyebrow}>RECORRIDO SELECCIONADO</Text>
          <Text style={styles.selectedRouteTitle}>Centro – UPTC</Text>
        </View>
        <Text style={styles.selectedRouteCode}>R-02</Text>
      </View>

      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>22 min</Text>
          <Text style={styles.routeStatLabel}>Duración</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>14</Text>
          <Text style={styles.routeStatLabel}>Paraderos</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>$2.400</Text>
          <Text style={styles.routeStatLabel}>Tarifa</Text>
        </View>
      </View>

      <Text style={styles.itineraryTitle}>Itinerario</Text>
      <View style={styles.itineraryList}>
        {stops.map(([name, detail, time], index) => (
          <View key={name} style={styles.itineraryRow}>
            <View style={styles.itineraryRail}>
              <View style={[styles.itineraryDot, index === stops.length - 1 && styles.itineraryDotFinal]} />
              {index < stops.length - 1 && <View style={styles.itineraryLine} />}
            </View>
            <View style={styles.itineraryCopy}>
              <Text style={styles.itineraryName}>{name}</Text>
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
