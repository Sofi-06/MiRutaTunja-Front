import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

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
  idaLabel?: string;
  vueltaLabel?: string;
  schedule?: {
    weekdays: { label: string; hours: string; frequency: string };
    sundaysAndHolidays: { label: string; hours: string; frequency: string };
  };
  routeName?: string;
  routeCategory?: string;
  routeMapLink?: string;
  recommendedRoutes?: Array<{
    code: string;
    title: string;
    dist: number;
    originDist: number;
    destDist: number;
  }>;
  onSelectRecommendedRoute?: (code: string) => void;
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
  idaLabel = 'Ida',
  vueltaLabel = 'Vuelta',
  schedule,
  routeName,
  routeCategory,
  routeMapLink,
  recommendedRoutes = [],
  onSelectRecommendedRoute,
}: SelectedRouteCardProps) {
  const [internalTripStarted, setInternalTripStarted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
  const signDestinations = Array.from(new Set((routeName || title)
    .split(/\s*(?:-|–|—)\s*/)
    .map((place) => place.trim())
    .filter(Boolean))).slice(0, 4);

  return (
    <View style={[styles.selectedRouteCard, isCompact && styles.selectedRouteCardCompact, isCompact && styles.selectedRouteCardPhone]}>
      <View style={styles.selectedRouteHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.selectedRouteEyebrow}>RECORRIDO SELECCIONADO</Text>
          <Text numberOfLines={1} style={styles.selectedRouteTitle}>{title}</Text>
        </View>
        <View style={styles.selectedRouteHeaderActions}>
          <Text style={styles.selectedRouteCode}>{code}</Text>
          <Pressable
            accessibilityLabel="Guardar ruta"
            onPress={() => setIsSaved((saved) => !saved)}
            style={[styles.saveRouteHeaderButton, isSaved && styles.saveRouteButtonActive]}
          >
            <Icon name="star" color={isSaved ? colors.coral : colors.muted} size={18} />
          </Pressable>
        </View>
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
              🟢 {idaLabel}
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
              🟡 {vueltaLabel}
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

      {recommendedRoutes && recommendedRoutes.length > 0 && (
        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
            🚌 Rutas sugeridas directas:
          </Text>
          <View style={{ gap: 8 }}>
            {recommendedRoutes.slice(0, 3).map((route) => (
              <Pressable
                key={route.code}
                onPress={() => onSelectRecommendedRoute?.(route.code)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    backgroundColor: pressed ? '#edf2f7' : '#f8fafc',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    gap: 8,
                  }
                ]}
              >
                <View style={{
                  backgroundColor: '#edf4f8',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.blueDark }}>
                    {route.code}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>
                    {route.title}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>
                    A {(route.originDist * 1000).toFixed(0)}m de origen · {(route.destDist * 1000).toFixed(0)}m de destino
                  </Text>
                </View>
                <Icon name="chevron" color={colors.blueDark} size={14} />
              </Pressable>
            ))}
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

      <Pressable onPress={() => setIsDetailsOpen(true)} style={styles.routeDetailsButton}>
        <Text style={styles.routeDetailsButtonText}>Saber más de esta ruta</Text>
        <Icon name="chevron" color={colors.blueDark} size={18} />
      </Pressable>

      <Modal transparent animationType="fade" visible={isDetailsOpen} onRequestClose={() => setIsDetailsOpen(false)}>
        <Pressable style={styles.routeModalBackdrop} onPress={() => setIsDetailsOpen(false)}>
          <Pressable style={styles.routeModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.routeModalContent}>
              <View style={styles.routeModalHeader}>
                <View style={styles.routeModalTitleWrap}><Text style={styles.selectedRouteEyebrow}>INFORMACIÓN DE LA RUTA</Text><Text style={styles.routeModalTitle}>{routeName || title}</Text></View>
                <Pressable accessibilityLabel="Cerrar información" onPress={() => setIsDetailsOpen(false)} style={styles.routeModalClose}><Icon name="close" color={colors.muted} size={18} /></Pressable>
              </View>
              <Text style={styles.routeModalCategory}>{routeCategory || 'Ruta urbana'}</Text>

              <View style={[styles.routeModalColumns, isCompact && styles.routeModalColumnsPhone]}>
                <View style={styles.routeModalInfoColumn}>
                  {schedule && <View style={styles.routeModalSchedule}><Text style={styles.routeModalScheduleTitle}>Horarios</Text><Text style={styles.routeModalText}>{schedule.weekdays.label}: {schedule.weekdays.hours}</Text><Text style={styles.routeModalText}>Frecuencia: cada {schedule.weekdays.frequency}</Text><Text style={[styles.routeModalText, { marginTop: 7 }]}>{schedule.sundaysAndHolidays.label}: {schedule.sundaysAndHolidays.hours}</Text><Text style={styles.routeModalText}>Frecuencia: cada {schedule.sundaysAndHolidays.frequency}</Text></View>}
                  <View style={styles.farePanel}><Text style={styles.farePanelTitle}>Tarifas</Text><Text style={styles.farePanelText}>Diurna: por confirmar</Text><Text style={styles.farePanelText}>Nocturna: por confirmar</Text></View>
                </View>
                <View style={styles.routeModalSignColumn}>
                  <Text style={styles.routeModalHint}>El número identifica la ruta y los nombres indican sus sectores principales.</Text>
                  <View style={styles.busSign}>
                    <View style={styles.busSignCode}><Text style={styles.busSignCodeText}>{code}</Text></View>
                    <Text style={styles.busSignLabel}>LETRERO DEL BUS</Text>
                    <View style={styles.busSignDestinations}>
                      {signDestinations.map((place, index) => <Text key={place + index} style={[styles.busSignDestination, index % 2 === 1 && styles.busSignDestinationAccent]}>{place.toUpperCase()}</Text>)}
                    </View>
                  </View>
                </View>
              </View>
              {routeMapLink ? <Text style={styles.routeModalMapNote}>La ruta cuenta con referencia cartográfica disponible.</Text> : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
