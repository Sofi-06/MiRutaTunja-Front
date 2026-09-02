import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import MapView from '@/components/Map/MapView';
import HistoryModal from '@/components/history/HistoryModal';
import { routesRegistry } from '@/components/Map/routesRegistry';
import Icon from '@/components/ui/Icon';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { addRecentSearch } from '@/services/localData';
import { geocodeLocation, PlaceResult, searchPlaces } from '@/services/placesService';

const routePalette = ['#3f719b', '#4e9b78', '#c28a45', '#d8957d', '#5c7cfa', '#138a72'];

type RouteChoice = {
  key: string;
  code: string;
  title: string;
  time: string;
  color: string;
};

const formatRouteTitle = (name: string, fallbackCode: string) => {
  const parts = name
    .split(/\s*(?:-|–|—)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} - ${parts[parts.length - 1]}`;
  }

  return name?.trim() || fallbackCode;
};

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111.32;
};

const allRouteChoices: RouteChoice[] = Object.entries(routesMetadata).map(([key, route], index) => ({
  key,
  code: `R-${key.replace('R', '').padStart(2, '0')}`,
  title: formatRouteTitle(route.name, key),
  time: `Cada ${route.schedule.weekdays.frequency}`,
  color: routePalette[index % routePalette.length],
}));

function getRouteSegments(key: string) {
  const route = routesRegistry[key as keyof typeof routesRegistry];
  return route?.path.features
    .filter((feature: any) => feature.geometry?.type === 'LineString')
    .map((feature: any) => ({ path: feature.geometry.coordinates, color: feature.properties?.stroke || '#3f719b' }));
}

function getRecommendedRoutes(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null
) {
  if (!origin || !destination) return [];

  const suggestions: Array<{ key: string; score: number }> = [];

  Object.entries(routesRegistry).forEach(([key, route]) => {
    let minOriginDist = Infinity;
    let minDestinationDist = Infinity;

    route.path?.features?.forEach((feature: any) => {
      if (feature.geometry?.type !== 'LineString') return;

      feature.geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        minOriginDist = Math.min(minOriginDist, getDistance(origin.lat, origin.lng, lat, lng));
        minDestinationDist = Math.min(minDestinationDist, getDistance(destination.lat, destination.lng, lat, lng));
      });
    });

    if (minOriginDist <= 0.75 && minDestinationDist <= 0.75) {
      suggestions.push({ key, score: minOriginDist + minDestinationDist });
    }
  });

  return suggestions.sort((a, b) => a.score - b.score);
}

export default function MobileHome() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedKey, setSelectedKey] = useState(allRouteChoices[0]?.key ?? 'R1');
  const [showSelectedRoute, setShowSelectedRoute] = useState(false);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<[number, number][]>([]);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [isRouteInfoOpen, setIsRouteInfoOpen] = useState(false);
  const [isMapFocused, setIsMapFocused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const timeoutRef = useRef<any>(null);

  const recommendedRouteChoices = useMemo(() => {
    const recommended = getRecommendedRoutes(originCoords, destinationCoords)
      .map((item) => allRouteChoices.find((route) => route.key === item.key))
      .filter(Boolean) as RouteChoice[];

    return recommended.length > 0 ? recommended.slice(0, 5) : allRouteChoices.slice(0, 5);
  }, [originCoords, destinationCoords]);

  const routeSegments = useMemo(() => getRouteSegments(selectedKey), [selectedKey]);
  const selectedRoute = recommendedRouteChoices.find((route) => route.key === selectedKey)
    ?? allRouteChoices.find((route) => route.key === selectedKey)
    ?? recommendedRouteChoices[0]
    ?? allRouteChoices[0];
  const selectedMetadata = routesMetadata[selectedKey as keyof typeof routesMetadata];
  const signDestinations = Array.from(
    new Set(
      (selectedMetadata?.name || selectedRoute?.title || '')
        .split(/\s*(?:-|–|—)\s*/)
        .map((place) => place.trim())
        .filter(Boolean)
    )
  ).slice(0, 3);

  const handleInputChange = (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOrigin(text);
    } else {
      setDestination(text);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      setActiveField(null);
      return;
    }

    setActiveField(field);

    timeoutRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setSuggestions(results);
    }, 400);
  };

  const handleSelectSuggestion = (place: PlaceResult) => {
    if (activeField === 'origin') {
      setOrigin(place.name);
      setOriginCoords({ lat: place.lat, lng: place.lng });
    } else if (activeField === 'destination') {
      setDestination(place.name);
      setDestinationCoords({ lat: place.lat, lng: place.lng });
      void addRecentSearch(origin || 'Mi ubicacion actual', place.name);
      setIsMapFocused(true);
    }

    setSuggestions([]);
    setActiveField(null);
  };

  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setCalculatedRoute([]);
      return;
    }

    const fetchRoute = async () => {
      const fallback: [number, number][] = [
        [originCoords.lng, originCoords.lat],
        [destinationCoords.lng, destinationCoords.lat],
      ];

      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`);
        const data = await response.json();
        setCalculatedRoute(data.routes?.[0]?.geometry?.coordinates ?? fallback);
      } catch {
        setCalculatedRoute(fallback);
      }
    };

    fetchRoute();
  }, [originCoords, destinationCoords]);

  useEffect(() => {
    if (!selectedRoute) return;

    const isSelectedStillAvailable = recommendedRouteChoices.some((route) => route.key === selectedKey);
    if (!isSelectedStillAvailable && !showSelectedRoute) {
      setSelectedKey(recommendedRouteChoices[0]?.key ?? selectedRoute.key);
    }
  }, [recommendedRouteChoices, selectedKey, selectedRoute, showSelectedRoute]);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicacion', 'Activa el permiso de ubicacion para usar tu posicion actual.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOriginCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      setOrigin('Mi ubicacion actual');
    } catch {
      Alert.alert('Ubicacion no disponible', 'No fue posible obtener tu posicion en este momento.');
    }
  };

  const handleSearch = async () => {
    const destinationPlace = await geocodeLocation(destination);
    if (!destinationPlace) {
      Alert.alert('Destino no encontrado', 'Prueba con Plaza de Bolivar, Terminal, UPTC, Centro u Hospital San Rafael.');
      return;
    }

    const originPlace = await geocodeLocation(origin);
    if (!originPlace && !originCoords) {
      Alert.alert('Origen no encontrado', 'Escribe tu punto de partida o usa el boton de mi ubicacion.');
      return;
    }

    if (originPlace) {
      setOriginCoords({ lat: originPlace.lat, lng: originPlace.lng });
      setOrigin(originPlace.name);
    }

    setDestination(destinationPlace.name);
    setDestinationCoords({ lat: destinationPlace.lat, lng: destinationPlace.lng });
    void addRecentSearch(originPlace?.name || origin || 'Mi ubicacion actual', destinationPlace.name);
    setShowSelectedRoute(false);
    setIsTripStarted(false);
    setIsMapFocused(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const label = `Destino (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setDestination(label);
    setDestinationCoords({ lat, lng });
    void addRecentSearch(origin || 'Mi ubicacion actual', label);
    setShowSelectedRoute(false);
    setIsTripStarted(false);
    setIsMapFocused(true);
  };

  if (!selectedRoute) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <ImageBackground source={require('@/assets/images/tunja.jpg')} imageStyle={styles.heroImage} style={styles.hero}>
          <View style={styles.heroShade} />
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logoShell}><Image source={require('@/assets/images/faviconT.png')} style={styles.logo} /></View>
              <View><Text style={styles.brandName}>Rutas<Text style={styles.brandAccent}>Tunja</Text></Text><Text style={styles.tagline}>MOVILIDAD URBANA</Text></View>
            </View>
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Historial de viajes" onPress={() => setIsHistoryOpen(true)} style={styles.headerButton}><Icon name="history" color="#385b77" size={21} /></Pressable>
              <Pressable accessibilityLabel="Notificaciones" style={styles.headerButton}><Icon name="notification" color="#385b77" size={22} /></Pressable>
            </View>
          </View>
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>¿A dónde quieres ir?</Text>
            <View style={styles.searchBox}>
              <View style={styles.searchFields}>
                <View style={styles.searchField}><Icon name="pin" color="#3f719b" size={19} /><TextInput value={origin} onChangeText={(txt) => handleInputChange(txt, 'origin')} placeholder="¿Desde dónde sales?" placeholderTextColor="#788798" style={styles.searchInput} /></View>
                <View style={styles.fieldDivider} />
                <View style={styles.searchField}><Icon name="target" color="#d8957d" size={19} /><TextInput value={destination} onChangeText={(txt) => handleInputChange(txt, 'destination')} onSubmitEditing={handleSearch} placeholder="¿A dónde vas?" placeholderTextColor="#788798" returnKeyType="search" style={styles.searchInput} /><Pressable onPress={handleSearch} hitSlop={8} accessibilityLabel="Buscar destino"><Icon name="arrow" color="#3f719b" size={18} /></Pressable></View>
              </View>
              <Pressable onPress={handleUseCurrentLocation} style={styles.locationButton} accessibilityLabel="Usar mi ubicacion"><Icon name="gps" color="#ffffff" size={20} /></Pressable>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.mapSection}>
          <View style={styles.mapFrame}><MapView isTripStarted={isTripStarted} route={showSelectedRoute ? routeSegments : calculatedRoute} origin={originCoords} destination={destinationCoords} onMapClick={handleMapClick} /></View>
          {!isMapFocused && activeField && suggestions.length > 0 && (
            <View style={[styles.suggestionsOverlay, activeField === 'origin' ? styles.suggestionsOrigin : styles.suggestionsDestination]}>
              {suggestions.slice(0, 3).map((item, index) => (
                <Pressable key={`${item.name}-${index}`} onPress={() => handleSelectSuggestion(item)} style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionItemPressed, index < Math.min(suggestions.length, 3) - 1 && styles.suggestionDivider]}>
                  <Icon name={activeField === 'origin' ? 'pin' : 'target'} color={activeField === 'origin' ? '#3f719b' : '#d8957d'} size={17} />
                  <View style={styles.suggestionCopy}><Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>{item.address && <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>}</View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {(showSelectedRoute || (originCoords && destinationCoords)) && <View style={styles.tripCard}>
          <View style={styles.tripCardTop}><View><Text style={styles.tripEyebrow}>RECORRIDO SELECCIONADO</Text><Text style={styles.tripTitle}>{showSelectedRoute ? selectedRoute.title : 'Ruta personalizada'}</Text></View><View style={styles.tripBadge}><Text style={styles.tripBadgeText}>{showSelectedRoute ? selectedRoute.code : 'TU RUTA'}</Text></View></View>
          <View style={styles.tripPoints}><Text style={styles.tripPoint}><Text style={styles.startDot}>● </Text>{origin || 'Mi ubicacion actual'}</Text><Icon name="arrow" color="#728092" size={15} /><Text numberOfLines={1} style={styles.tripPoint}><Text style={styles.endDot}>● </Text>{destination || selectedRoute.title}</Text></View>
          <View style={styles.tripActions}><Pressable onPress={() => setIsTripStarted((started) => !started)} style={[styles.startButton, isTripStarted && styles.startButtonActive]}><Text style={styles.startButtonText}>{isTripStarted ? 'Viaje en curso' : 'Iniciar viaje'}</Text></Pressable><Pressable onPress={() => setIsRouteInfoOpen(true)} style={styles.moreButton}><Text style={styles.moreButtonText}>Saber mas</Text></Pressable></View>
        </View>}

        <View style={styles.routesSection}>
          <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>RUTAS PARA TI</Text><Text style={styles.sectionTitle}>Rutas recomendadas</Text></View><Pressable onPress={() => router.push('/routes' as never)}><Text style={styles.seeAll}>Ver todas</Text></Pressable></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
            {recommendedRouteChoices.map((route) => {
              const selected = route.key === selectedKey;
              return <Pressable key={route.key} onPress={() => { setSelectedKey(route.key); setShowSelectedRoute(true); }} style={[styles.routeCard, selected && styles.routeCardSelected]}>
                <View style={[styles.routeBadge, { backgroundColor: `${route.color}1a` }]}><Text style={[styles.routeBadgeText, { color: route.color }]}>{route.code}</Text></View>
                <Text style={styles.routeTitle}>{route.title}</Text>
                <View style={styles.routeMeta}><Icon name="clock" color="#728092" size={16} /><Text style={styles.routeMetaText}>{route.time}</Text></View>
                <View style={styles.routeFooter}><Text style={[styles.routeLink, { color: route.color }]}>{selected ? 'Mostrando en el mapa' : 'Ver recorrido'}</Text><Icon name="chevron" color={route.color} size={18} /></View>
              </Pressable>;
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {isMapFocused && <View style={styles.mapFocusOverlay}>
        <View style={styles.mapFocusHeader}>
          <Pressable onPress={() => setIsMapFocused(false)} style={styles.mapFocusBack}><Icon name="back" color="#17283b" size={22} /></Pressable>
          <View style={styles.mapFocusFields}>
            <View style={styles.mapFocusInputRow}><Text style={styles.mapFocusBullet}>●</Text><TextInput value={origin} onChangeText={(txt) => handleInputChange(txt, 'origin')} placeholder="Mi ubicacion actual" placeholderTextColor="#728092" returnKeyType="next" style={styles.mapFocusInput} /></View>
            <View style={styles.mapFocusInputRow}><Text style={[styles.mapFocusBullet, styles.mapFocusBulletEnd]}>●</Text><TextInput value={destination} onChangeText={(txt) => handleInputChange(txt, 'destination')} onSubmitEditing={handleSearch} placeholder="¿A dónde vas?" placeholderTextColor="#728092" returnKeyType="search" style={styles.mapFocusInput} /><Pressable onPress={handleSearch} hitSlop={8}><Icon name="arrow" color="#3f719b" size={17} /></Pressable></View>
            {activeField && suggestions.length > 0 && (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#edf1f4', paddingTop: 4 }}>
                {suggestions.map((item, index) => (
                  <Pressable
                    key={`${item.name}-${index}`}
                    onPress={() => handleSelectSuggestion(item)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      backgroundColor: pressed ? '#f0f5f9' : 'transparent',
                      borderRadius: 8,
                      borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                      borderBottomColor: '#edf1f4',
                    })}
                  >
                    <Text style={{ fontWeight: '700', color: '#17283b', fontSize: 13 }}>{item.name}</Text>
                    {item.address && <Text style={{ color: '#687789', fontSize: 11, marginTop: 2 }} numberOfLines={1}>{item.address}</Text>}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
        <MapView isTripStarted={isTripStarted} route={showSelectedRoute ? routeSegments : calculatedRoute} origin={originCoords} destination={destinationCoords} onMapClick={handleMapClick} />
        <View style={styles.mapFocusRecommendations}>
          {showSelectedRoute && <View style={styles.mapFocusSelectedRoute}>
            <View style={styles.mapFocusSelectedTop}>
              <View style={styles.mapFocusSelectedCopy}>
                <Text style={styles.mapFocusSelectedLabel}>RUTA SELECCIONADA EN EL MAPA</Text>
                <Text style={styles.mapFocusSelectedTitle} numberOfLines={1}>{selectedRoute.title}</Text>
              </View>
              <View style={styles.mapFocusSelectedBadge}><Text style={styles.mapFocusSelectedBadgeText}>{selectedRoute.code}</Text></View>
            </View>
            <View style={styles.mapFocusSelectedMeta}>
              <View style={styles.mapFocusSelectedFrequency}><Icon name="clock" color="#52758f" size={14} /><Text style={styles.mapFocusSelectedFrequencyText}>{selectedRoute.time}</Text></View>
              <Pressable onPress={() => setIsRouteInfoOpen(true)} hitSlop={8}><Text style={styles.mapFocusDetailsLink}>Ver detalles</Text></Pressable>
            </View>
          </View>}
          <Text style={styles.mapFocusLabel}>RUTAS RECOMENDADAS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapFocusChips}>{recommendedRouteChoices.map((route) => {
            const isSelected = showSelectedRoute && route.key === selectedKey;
            return <Pressable key={route.key} onPress={() => { setSelectedKey(route.key); setShowSelectedRoute(true); }} style={[styles.mapFocusChip, isSelected && styles.mapFocusChipSelected]}><Text style={[styles.mapFocusChipCode, isSelected && styles.mapFocusChipCodeSelected]}>{route.code}</Text><Text style={styles.mapFocusChipText} numberOfLines={2}>{route.title}</Text><View style={styles.mapFocusChipMeta}><Icon name="clock" color="#728092" size={13} /><Text style={styles.mapFocusChipMetaText}>{route.time}</Text></View>{isSelected && <Text style={styles.mapFocusChipSelectedText}>Mostrando en el mapa</Text>}</Pressable>;
          })}</ScrollView>
        </View>
      </View>}

      <Modal transparent animationType="fade" visible={isRouteInfoOpen} onRequestClose={() => setIsRouteInfoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsRouteInfoOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.tripEyebrow}>DETALLE DEL RECORRIDO</Text>
              <Text style={styles.modalTitle}>{showSelectedRoute ? selectedRoute.title : 'Tu ruta personalizada'}</Text>
              <><Text style={styles.mobileBusHint}>El numero identifica la ruta y los nombres indican sus sectores principales.</Text><View style={styles.mobileBusSign}><View style={styles.mobileBusCode}><Text style={styles.mobileBusCodeText}>{selectedRoute.code}</Text></View><Text style={styles.mobileBusCaption}>LETRERO DEL BUS</Text>{signDestinations.map((place, index) => <Text key={place + index} style={[styles.mobileBusDestination, index % 2 === 1 && styles.mobileBusDestinationGreen]}>{place.toUpperCase()}</Text>)}</View></>
              {selectedMetadata && <View style={styles.mobileSchedule}><Text style={styles.mobileScheduleTitle}>Horarios y frecuencias</Text><Text style={styles.mobileScheduleText}>{selectedMetadata.schedule.weekdays.label}: {selectedMetadata.schedule.weekdays.hours} · cada {selectedMetadata.schedule.weekdays.frequency}</Text><Text style={styles.mobileScheduleText}>{selectedMetadata.schedule.sundaysAndHolidays.label}: {selectedMetadata.schedule.sundaysAndHolidays.hours} · cada {selectedMetadata.schedule.sundaysAndHolidays.frequency}</Text></View>}
              <View style={styles.mobileFarePanel}><Text style={styles.mobileFareTitle}>Tarifas</Text><Text style={styles.mobileFareText}>Diurna: por confirmar</Text><Text style={styles.mobileFareText}>Nocturna: por confirmar</Text></View>
              <Text style={styles.modalText}>Inicio: {origin || 'Mi ubicacion actual'}{`\n`}Destino: {destination}{`\n\n`}Puedes seguir el trazado en el mapa, iniciar el viaje o seleccionar una de las rutas recomendadas.</Text>
              <Pressable onPress={() => setIsRouteInfoOpen(false)} style={styles.modalClose}><Text style={styles.modalCloseText}>Entendido</Text></Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <HistoryModal visible={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}><Icon name="home" color="#3f719b" size={24} /><Text style={styles.navActive}>Inicio</Text></Pressable>
        <Pressable onPress={() => router.push('/routes' as never)} style={styles.navItem}><Icon name="route" color="#728092" size={24} /><Text style={styles.navText}>Rutas</Text></Pressable>
        <Pressable onPress={() => router.push('/favorites')} style={styles.navItem}><Icon name="heart" color="#728092" size={24} /><Text style={styles.navText}>Favoritos</Text></Pressable>
        <Pressable onPress={() => router.push('/explore')} style={styles.navItem}><Icon name="location" color="#728092" size={24} /><Text style={styles.navText}>Turismo</Text></Pressable>
        <Pressable onPress={() => Alert.alert('RutaBot', 'Muy pronto podras consultar rutas, paraderos y tarifas con el asistente virtual.')} style={styles.navItem}><Icon name="chatbot" color="#728092" size={24} /><Text style={styles.navText}>RutaBot</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f8fa' }, content: { paddingBottom: 88 }, hero: { height: 282, overflow: 'hidden', paddingHorizontal: 20, borderBottomLeftRadius: 38, borderBottomRightRadius: 38 }, heroImage: { resizeMode: 'cover' }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(238,247,251,0.78)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logoShell: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 15 }, logo: { width: 37, height: 37 }, brandName: { color: '#17283b', fontSize: 19, fontWeight: '800' }, brandAccent: { color: '#3f719b' }, tagline: { color: '#687789', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 2 }, headerActions: { flexDirection: 'row', gap: 8 }, headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)' },
  welcome: { marginTop: 38 }, welcomeTitle: { color: '#17283b', fontSize: 26, fontWeight: '800', letterSpacing: -0.6 }, searchBox: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 22, paddingLeft: 14, paddingRight: 10, marginTop: 17, shadowColor: '#17324b', shadowOpacity: 0.13, shadowRadius: 11, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, searchFields: { flex: 1 }, searchField: { height: 35, flexDirection: 'row', alignItems: 'center', gap: 9 }, fieldDivider: { height: 1, backgroundColor: '#e8eef2', marginLeft: 28 }, searchInput: { flex: 1, color: '#17283b', fontSize: 14 }, locationButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3f719b' },
  mapSection: { position: 'relative', paddingTop: 0, zIndex: 5 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, eyebrow: { color: '#d8957d', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, sectionTitle: { color: '#17283b', fontSize: 21, fontWeight: '800', marginTop: 3 }, mapFrame: { height: 360, overflow: 'hidden', borderBottomLeftRadius: 38, borderBottomRightRadius: 38 },
  suggestionsOverlay: { position: 'absolute', zIndex: 8, elevation: 8, top: -70, left: 20, right: 20, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 18, shadowColor: '#17324b', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }, suggestionsOrigin: { borderLeftWidth: 5, borderLeftColor: '#3f719b' }, suggestionsDestination: { borderLeftWidth: 5, borderLeftColor: '#d8957d' }, suggestionItem: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }, suggestionItemPressed: { backgroundColor: '#f0f6fa' }, suggestionDivider: { borderBottomWidth: 1, borderBottomColor: '#edf2f6' }, suggestionCopy: { flex: 1, minWidth: 0 }, suggestionTitle: { color: '#17283b', fontSize: 14, fontWeight: '800' }, suggestionAddress: { color: '#728092', fontSize: 11, marginTop: 2 },
  tripCard: { marginHorizontal: 20, marginTop: 18, padding: 18, borderRadius: 22, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dce8ef' }, tripCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, tripEyebrow: { color: '#728092', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, tripTitle: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 5 }, tripBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f2f8', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 }, tripBadgeText: { color: '#3f719b', fontSize: 10, fontWeight: '800' }, tripPoints: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 }, tripPoint: { flex: 1, color: '#516273', fontSize: 12, fontWeight: '600' }, startDot: { color: '#4e9b78' }, endDot: { color: '#d8957d' }, tripActions: { flexDirection: 'row', gap: 10, marginTop: 17 }, startButton: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#3f719b' }, startButtonActive: { backgroundColor: '#4e9b78' }, startButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, moreButton: { height: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#bfd6e5' }, moreButtonText: { color: '#3f719b', fontSize: 13, fontWeight: '800' },
  routesSection: { paddingHorizontal: 20, paddingTop: 27 }, seeAll: { color: '#3f719b', fontSize: 13, fontWeight: '700' }, cards: { gap: 12, paddingRight: 20 }, routeCard: { width: 260, minHeight: 168, padding: 17, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce8ef' }, routeCardSelected: { borderColor: '#7eabc8', backgroundColor: '#fafdff' }, routeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }, routeBadgeText: { fontSize: 12, fontWeight: '800' }, routeTitle: { color: '#17283b', fontSize: 16, fontWeight: '800', marginTop: 13 }, routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }, routeMetaText: { color: '#728092', fontSize: 12 }, routeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf1f4', marginTop: 14, paddingTop: 11 }, routeLink: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(23,40,59,0.45)' }, modalCard: { maxHeight: '90%', borderRadius: 24, padding: 22, backgroundColor: '#fff', overflow: 'hidden' }, modalScrollContent: { flexGrow: 1, paddingBottom: 2 }, modalTitle: { color: '#17283b', fontSize: 22, fontWeight: '800', marginTop: 7 }, modalText: { color: '#5f6f80', fontSize: 14, lineHeight: 21, marginTop: 14 }, modalClose: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 14, backgroundColor: '#3f719b' }, modalCloseText: { color: '#fff', fontWeight: '800' },
  mobileBusHint: { color: '#728092', fontSize: 11, lineHeight: 16, marginTop: 14 }, mobileBusSign: { marginTop: 8, padding: 12, borderRadius: 14, borderWidth: 3, borderColor: '#17283b', backgroundColor: '#eff8df', overflow: 'hidden' }, mobileBusCode: { alignSelf: 'flex-start', margin: -12, marginBottom: 9, backgroundColor: '#df2a2a', paddingHorizontal: 10, paddingVertical: 4, borderBottomRightRadius: 10 }, mobileBusCodeText: { color: '#fff', fontSize: 17, fontWeight: '900' }, mobileBusCaption: { color: '#4d5c69', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 5 }, mobileBusDestination: { color: '#df2a2a', fontSize: 16, fontWeight: '900', fontStyle: 'italic', lineHeight: 20, flexShrink: 1 }, mobileBusDestinationGreen: { color: '#2d9741' },
  mobileSchedule: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#eef9f2' }, mobileScheduleTitle: { color: '#166534', fontSize: 13, fontWeight: '800', marginBottom: 4 }, mobileScheduleText: { color: '#25613f', fontSize: 11, lineHeight: 17 },
  mobileFarePanel: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#f4f7fa', borderWidth: 1, borderColor: '#e0e9ef' }, mobileFareTitle: { color: '#17283b', fontSize: 13, fontWeight: '800', marginBottom: 4 }, mobileFareText: { color: '#728092', fontSize: 11, lineHeight: 17 },
  mapFocusOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 70, backgroundColor: '#fff', zIndex: 30 }, mapFocusHeader: { position: 'absolute', zIndex: 2, top: 12, left: 16, right: 16, flexDirection: 'row', gap: 10 }, mapFocusBack: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 5 }, mapFocusFields: { flex: 1, paddingHorizontal: 13, paddingVertical: 5, borderRadius: 15, backgroundColor: '#fff', elevation: 5 }, mapFocusInputRow: { height: 29, flexDirection: 'row', alignItems: 'center', gap: 7 }, mapFocusBullet: { color: '#3f719b', fontSize: 14 }, mapFocusBulletEnd: { color: '#d8957d' }, mapFocusInput: { flex: 1, color: '#17283b', fontSize: 14, fontWeight: '700', paddingVertical: 0 }, mapFocusRecommendations: { position: 'absolute', zIndex: 2, bottom: 0, left: 0, right: 0, paddingTop: 14, paddingBottom: 12, backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#17283b', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: -4 }, elevation: 8 }, mapFocusSelectedRoute: { marginHorizontal: 16, marginBottom: 12, padding: 13, borderRadius: 16, backgroundColor: '#edf6fb', borderWidth: 1, borderColor: '#bcd8e8' }, mapFocusSelectedTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, mapFocusSelectedCopy: { flex: 1, minWidth: 0 }, mapFocusSelectedLabel: { color: '#52758f', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, mapFocusSelectedTitle: { color: '#17283b', fontSize: 15, fontWeight: '800', marginTop: 4 }, mapFocusSelectedBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: '#3f719b' }, mapFocusSelectedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' }, mapFocusSelectedMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, mapFocusSelectedFrequency: { flexDirection: 'row', alignItems: 'center', gap: 5 }, mapFocusSelectedFrequencyText: { color: '#52758f', fontSize: 11, fontWeight: '700' }, mapFocusDetailsLink: { color: '#2f678f', fontSize: 12, fontWeight: '900' }, mapFocusLabel: { color: '#d8957d', fontSize: 10, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 9 }, mapFocusChips: { gap: 10, paddingHorizontal: 16 }, mapFocusChip: { width: 164, minHeight: 100, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: '#dce8ef', backgroundColor: '#fff' }, mapFocusChipSelected: { borderColor: '#3f719b', backgroundColor: '#f3f9fc' }, mapFocusChipCode: { color: '#3f719b', fontSize: 12, fontWeight: '900' }, mapFocusChipCodeSelected: { color: '#255b82' }, mapFocusChipText: { color: '#17283b', fontSize: 13, fontWeight: '800', lineHeight: 18, marginTop: 6 }, mapFocusChipMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 }, mapFocusChipMetaText: { color: '#728092', fontSize: 11, fontWeight: '700' }, mapFocusChipSelectedText: { color: '#2f678f', fontSize: 10, fontWeight: '900', marginTop: 7 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e3ebf0', paddingTop: 9 }, navItem: { alignItems: 'center', minWidth: 60, gap: 3 }, navActive: { color: '#3f719b', fontSize: 11, fontWeight: '700' }, navText: { color: '#728092', fontSize: 11, fontWeight: '600' },
});
