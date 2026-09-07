import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import MapView from '@/components/Map/MapView';
import HistoryModal from '@/components/history/HistoryModal';
import { routesRegistry } from '@/components/Map/routesRegistry';
import Icon from '@/components/ui/Icon';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { searchPlaces, geocodeLocation, PlaceResult, reverseGeocode } from '@/services/placesService';
import { addRecentSearch } from '@/services/localData';
import { getCurrentBusFare } from '@/services/fareService';

const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
};

function getRouteSegments(key: string) {
  const route = routesRegistry[key as keyof typeof routesRegistry];
  return route?.path.features
    .filter((feature: any) => feature.geometry?.type === 'LineString')
    .map((feature: any) => ({
      path: feature.geometry.coordinates,
      color: feature.properties?.stroke || '#3f719b',
      originalColor: feature.properties?.stroke || '#3f719b',
      name: feature.properties?.name || 'Vía',
    }));
}

function RouteBottomSheet({
  selectedRoute,
  selectedKey,
  calculatedRouteData,
  routeStats,
  fareInfo,
  origin,
  destination,
  isTripStarted,
  onToggleTripStarted,
  onOpenRouteInfo,
  recommendedRoutes,
  onSelectRoute,
}: {
  selectedRoute: any;
  selectedKey: string;
  calculatedRouteData: any;
  routeStats: { distanceText: string; durationText: string };
  fareInfo: { fareText: string; label: string; isFestiveOrNight: boolean };
  origin: string;
  destination: string;
  isTripStarted: boolean;
  onToggleTripStarted: () => void;
  onOpenRouteInfo: () => void;
  recommendedRoutes: any[];
  onSelectRoute: (key: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const collapsedHeight = Math.min(275, screenHeight * 0.37);
  const expandedHeight = Math.min(540, screenHeight * 0.72);

  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current;

  const toggleExpand = (expand?: boolean) => {
    const nextState = expand !== undefined ? expand : !isExpanded;
    setIsExpanded(nextState);
    Animated.spring(heightAnim, {
      toValue: nextState ? expandedHeight : collapsedHeight,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -25) {
          toggleExpand(true);
        } else if (gestureState.dy > 25) {
          toggleExpand(false);
        } else {
          toggleExpand();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.bottomSheetContainer, { height: heightAnim }]}>
      <View {...panResponder.panHandlers} style={styles.sheetHandleTouchArea}>
        <View style={styles.sheetHandle} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.sheetScrollContent}
      >
        <View style={styles.sheetSelectedCard}>
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetEyebrow}>RUTA SELECCIONADA</Text>
              <Text numberOfLines={1} style={styles.sheetTitle}>
                {calculatedRouteData?.details?.routeCode
                  ? `Ruta ${calculatedRouteData.details.routeCode}`
                  : selectedRoute.title}
              </Text>
            </View>
            <View style={[styles.sheetBadge, { backgroundColor: `${selectedRoute.color || '#3f719b'}20` }]}>
              <Text style={[styles.sheetBadgeText, { color: selectedRoute.color || '#3f719b' }]}>
                {calculatedRouteData?.details?.routeCode || selectedRoute.code}
              </Text>
            </View>
          </View>

          <View style={styles.sheetStatsRow}>
            <View style={styles.sheetStatItem}>
              <Text style={styles.sheetStatValue}>{routeStats.durationText}</Text>
              <Text style={styles.sheetStatLabel}>Duración</Text>
            </View>
            <View style={styles.sheetStatDivider} />
            <View style={styles.sheetStatItem}>
              <Text style={styles.sheetStatValue}>{routeStats.distanceText}</Text>
              <Text style={styles.sheetStatLabel}>Distancia</Text>
            </View>
            <View style={styles.sheetStatDivider} />
            <View style={styles.sheetStatItem}>
              <Text style={[styles.sheetStatValue, { color: fareInfo.isFestiveOrNight ? '#d8957d' : '#3f719b' }]}>
                {fareInfo.fareText}
              </Text>
              <Text style={styles.sheetStatLabel}>{fareInfo.label}</Text>
            </View>
          </View>

          <View style={styles.sheetPoints}>
            <Text numberOfLines={1} style={styles.sheetPointText}>
              <Text style={styles.startDot}>● </Text>
              {origin || 'Mi ubicación actual'}
            </Text>
            <Icon name="arrow" color="#728092" size={13} />
            <Text numberOfLines={1} style={styles.sheetPointText}>
              <Text style={styles.endDot}>● </Text>
              {destination || selectedRoute.title}
            </Text>
          </View>

          <View style={styles.sheetActionButtons}>
            <Pressable
              onPress={onToggleTripStarted}
              style={[styles.sheetStartBtn, isTripStarted && styles.sheetStartBtnActive]}
            >
              <Text style={styles.sheetStartBtnText}>
                {isTripStarted ? '✓ En viaje' : 'Iniciar viaje'}
              </Text>
            </Pressable>
            <Pressable onPress={onOpenRouteInfo} style={styles.sheetMoreBtn}>
              <Text style={styles.sheetMoreBtnText}>Saber más</Text>
            </Pressable>
            <Pressable onPress={() => toggleExpand()} style={styles.sheetToggleBtn}>
              <Text style={styles.sheetToggleBtnText}>
                {isExpanded ? 'Ver menos ▴' : 'Cambiar ruta ▾'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sheetAlternativesSection}>
          <View style={styles.sheetAlternativesHeader}>
            <View>
              <Text style={styles.sheetAlternativesEyebrow}>RUTAS DISPONIBLES</Text>
              <Text style={styles.sheetAlternativesTitle}>Otras rutas recomendadas</Text>
            </View>
            <Text style={styles.sheetAlternativesHint}>Toca para cambiar</Text>
          </View>

          <View style={styles.sheetAlternativesList}>
            {recommendedRoutes.map((route) => {
              const isCurrent = route.key === selectedKey;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => onSelectRoute(route.key)}
                  style={({ pressed }) => [
                    styles.sheetAlternativeCard,
                    isCurrent && styles.sheetAlternativeCardActive,
                    pressed && styles.sheetAlternativeCardPressed,
                  ]}
                >
                  <View style={[styles.sheetAltBadge, { backgroundColor: `${route.color}1a` }]}>
                    <Text style={[styles.sheetAltBadgeText, { color: route.color }]}>
                      {route.code}
                    </Text>
                  </View>
                  <View style={styles.sheetAltInfo}>
                    <Text numberOfLines={1} style={styles.sheetAltTitle}>
                      {route.title}
                    </Text>
                    <View style={styles.sheetAltMeta}>
                      <Icon name="clock" color="#728092" size={13} />
                      <Text style={styles.sheetAltMetaText}>{route.time}</Text>
                      <Text style={styles.sheetAltMetaText}>• Cada 8 min</Text>
                    </View>
                  </View>
                  <View style={styles.sheetAltAction}>
                    {isCurrent ? (
                      <View style={styles.sheetActivePill}>
                        <Text style={styles.sheetActivePillText}>✓ En mapa</Text>
                      </View>
                    ) : (
                      <View style={styles.sheetSelectPill}>
                        <Text style={styles.sheetSelectPillText}>Elegir</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

export default function MobileHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedKey, setSelectedKey] = useState('R1');
  const [showSelectedRoute, setShowSelectedRoute] = useState(false);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedRouteData, setCalculatedRouteData] = useState<any | null>(null);
  const [routeStats, setRouteStats] = useState({
    distanceText: '0 km',
    durationText: '0 min',
  });
  const [pickMode, setPickMode] = useState<'ORIGIN' | 'DEST' | null>(null);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [isRouteInfoOpen, setIsRouteInfoOpen] = useState(false);
  const [isMapFocused, setIsMapFocused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [fareInfo, setFareInfo] = useState(getCurrentBusFare());

  useEffect(() => {
    setFareInfo(getCurrentBusFare());
    const interval = setInterval(() => {
      setFareInfo(getCurrentBusFare());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const timeoutRef = useRef<any>(null);

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
    }, 350);
  };

  const handleSelectSuggestion = (place: PlaceResult) => {
    const selectedField = activeField;
    if (selectedField === 'origin') {
      setOrigin(place.name);
      setOriginCoords({ lat: place.lat, lng: place.lng });
    } else if (selectedField === 'destination') {
      setDestination(place.name);
      setDestinationCoords({ lat: place.lat, lng: place.lng });
      void addRecentSearch(origin || 'Mi ubicación actual', place.name);
      setIsMapFocused(true);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const recommendedRoutes = useMemo(() => {
    if (!originCoords || !destinationCoords) {
      return [
        { key: 'R1', code: 'R-01', title: 'Arboleda – Terminal', time: '25 min', color: '#3f719b' },
        { key: 'R22', code: 'R-22', title: 'Viva – La Fuente', time: '22 min', color: '#8b5cf6' },
        { key: 'R7', code: 'R-07', title: 'Terminal – Norte', time: '31 min', color: '#4e9b78' },
        { key: 'R11', code: 'R-11', title: 'Sur – Hospital', time: '27 min', color: '#c28a45' },
      ];
    }

    const suggestionsList: any[] = [];
    Object.keys(routesRegistry).forEach((key) => {
      const route = routesRegistry[key];
      if (!route?.path?.features) return;

      let minOriginDist = Infinity;
      let minDestDist = Infinity;

      route.path.features.forEach((feature: any) => {
        if (feature.geometry?.type === 'LineString') {
          feature.geometry.coordinates.forEach((coord: [number, number]) => {
            const dOrig = Math.sqrt((originCoords.lat - coord[1]) ** 2 + (originCoords.lng - coord[0]) ** 2) * 111.32;
            const dDest = Math.sqrt((destinationCoords.lat - coord[1]) ** 2 + (destinationCoords.lng - coord[0]) ** 2) * 111.32;
            if (dOrig < minOriginDist) minOriginDist = dOrig;
            if (dDest < minDestDist) minDestDist = dDest;
          });
        }
      });

      if (minOriginDist <= 1.35 && minDestDist <= 1.35) {
        const metadata = routesMetadata[key as keyof typeof routesMetadata];
        const num = key.replace('R', '');
        const formattedCode = `R-${num.padStart(2, '0')}`;
        const title = metadata
          ? `${metadata.name.split(' - ')[0]} – ${metadata.name.split(' - ').slice(-1)[0]}`
          : `Ruta ${key}`;

        const score = minOriginDist * 1.0 + minDestDist * 1.4;

        suggestionsList.push({
          key,
          code: formattedCode,
          title,
          time: `${Math.round(18 + score * 8)} min`,
          color: key === 'R1' ? '#3f719b' : key === 'R22' ? '#8b5cf6' : key === 'R8' ? '#e67e22' : key === 'R9' ? '#27ae60' : '#4e9b78',
          score,
          minOriginDist,
          minDestDist,
        });
      }
    });

    suggestionsList.sort((a, b) => a.score - b.score);

    return suggestionsList.length > 0
      ? suggestionsList
      : [
          { key: 'R1', code: 'R-01', title: 'Arboleda – Terminal', time: '25 min', color: '#3f719b' },
          { key: 'R22', code: 'R-22', title: 'Viva – La Fuente', time: '22 min', color: '#8b5cf6' },
          { key: 'R7', code: 'R-07', title: 'Terminal – Norte', time: '31 min', color: '#4e9b78' },
        ];
  }, [originCoords, destinationCoords]);

  const routeSegments = useMemo(() => getRouteSegments(selectedKey), [selectedKey]);
  const selectedRoute = recommendedRoutes.find((route) => route.key === selectedKey) ?? recommendedRoutes[0];
  const selectedMetadata = routesMetadata[selectedKey as keyof typeof routesMetadata];
  const signDestinations = Array.from(
    new Set<string>(
      (selectedMetadata?.name || selectedRoute.title)
        .split(/\s*(?:-|–|—)\s*/)
        .map((place: string) => place.trim())
        .filter(Boolean)
    )
  ).slice(0, 3);

  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setCalculatedRouteData(null);
      return;
    }

    const fetchMultimodalRoute = async () => {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/routes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: originCoords,
            destination: destinationCoords,
            routeCode: showSelectedRoute ? selectedKey : 'AUTO',
          }),
        });

        if (!response.ok) throw new Error('Error conectando con backend');

        const data = await response.json();
        if (data && data.route) {
          setCalculatedRouteData(data);
          const distanceKm = (data.distance / 1000).toFixed(2);
          const durationMin = Math.round(data.duration / 60);
          setRouteStats({
            distanceText: `${distanceKm} km`,
            durationText: `${durationMin} min`,
          });

          if (data.selectedRouteKey && !showSelectedRoute) {
            setSelectedKey(data.selectedRouteKey);
          }
        }
      } catch (err) {
        console.error('Error fetching route in MobileHome:', err);
      }
    };

    fetchMultimodalRoute();
  }, [originCoords, destinationCoords, selectedKey, showSelectedRoute]);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación', 'Activa el permiso de ubicación para usar tu posición actual.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOriginCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      setOrigin('Mi ubicación actual');
    } catch {
      Alert.alert('Ubicación no disponible', 'No fue posible obtener tu posición en este momento.');
    }
  };

  const handleSearch = async () => {
    const destinationPlace = await geocodeLocation(destination);
    if (!destinationPlace) {
      Alert.alert('Destino no encontrado', 'Prueba con Plaza de Bolívar, Terminal, UPTC, Centro u Hospital San Rafael.');
      return;
    }
    const originPlace = await geocodeLocation(origin);
    if (!originPlace && !originCoords) {
      Alert.alert('Origen no encontrado', 'Escribe tu punto de partida o usa el botón de mi ubicación.');
      return;
    }
    if (originPlace) {
      setOriginCoords({ lat: originPlace.lat, lng: originPlace.lng });
      setOrigin(originPlace.name);
    }
    setDestination(destinationPlace.name);
    setDestinationCoords({ lat: destinationPlace.lat, lng: destinationPlace.lng });
    void addRecentSearch(originPlace?.name || origin || 'Mi ubicación actual', destinationPlace.name);
    setShowSelectedRoute(false);
    setIsTripStarted(false);
    setIsMapFocused(true);
  };

  const handleSelectOriginFromMap = async (lat: number, lng: number) => {
    setPickMode(null);
    let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      address = await reverseGeocode(lat, lng);
    } catch {
    }
    setOrigin(address);
    setOriginCoords({ lat, lng });
    setShowSelectedRoute(false);
    setIsTripStarted(false);
    setIsMapFocused(true);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPickMode(null);
    let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      address = await reverseGeocode(lat, lng);
    } catch {
    }
    setDestination(address);
    setDestinationCoords({ lat, lng });
    void addRecentSearch(origin || 'Mi ubicación actual', address);
    setShowSelectedRoute(false);
    setIsTripStarted(false);
    setIsMapFocused(true);
  };

  const handleSelectRouteFromSheet = (routeKey: string) => {
    setSelectedKey(routeKey);
    setShowSelectedRoute(true);
  };

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
              <Pressable onPress={handleUseCurrentLocation} style={styles.locationButton} accessibilityLabel="Usar mi ubicación"><Icon name="gps" color="#ffffff" size={20} /></Pressable>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.mapSection}>
          <View style={styles.mapFrame}>
            <MapView
              isTripStarted={isTripStarted}
              route={showSelectedRoute ? routeSegments : undefined}
              customRoute={calculatedRouteData ? calculatedRouteData : undefined}
              origin={originCoords}
              destination={destinationCoords}
              pickMode={pickMode}
              onMapClick={handleMapClick}
              onSelectOrigin={handleSelectOriginFromMap}
              onSelectDestination={handleMapClick}
            />
          </View>
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

        <View style={styles.routesSection}>
          <View style={styles.sectionHeading}>
            <View><Text style={styles.eyebrow}>RUTAS PARA TI</Text><Text style={styles.sectionTitle}>Rutas recomendadas</Text></View>
            <Pressable onPress={() => router.push('/routes' as never)}><Text style={styles.seeAll}>Ver todas</Text></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
            {recommendedRoutes.map((route) => {
              const selected = route.key === selectedKey;
              return (
                <Pressable key={route.key} onPress={() => { setSelectedKey(route.key); setShowSelectedRoute(true); setIsMapFocused(true); }} style={[styles.routeCard, selected && styles.routeCardSelected]}>
                  <View style={[styles.routeBadge, { backgroundColor: `${route.color}1a` }]}><Text style={[styles.routeBadgeText, { color: route.color }]}>{route.code}</Text></View>
                  <Text numberOfLines={1} style={styles.routeTitle}>{route.title}</Text>
                  <View style={styles.routeMeta}><Icon name="clock" color="#728092" size={16} /><Text style={styles.routeMetaText}>{route.time}</Text><Text style={styles.routeMetaText}>• Cada 8 min</Text></View>
                  <View style={styles.routeFooter}><Text style={[styles.routeLink, { color: route.color }]}>{selected ? 'Mostrando en el mapa' : 'Ver recorrido'}</Text><Icon name="chevron" color={route.color} size={18} /></View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {isMapFocused && (
        <View style={styles.mapFocusOverlay}>
          {/* Botón flotante para volver atrás y buscar una nueva ruta */}
          <Pressable
            onPress={() => setIsMapFocused(false)}
            style={[styles.floatingBackButton, { top: Math.max(insets.top + 8, 48) }]}
            accessibilityLabel="Volver atrás para ver nueva ruta"
          >
            <Icon name="back" color="#17283b" size={18} />
            <Text style={styles.floatingBackText}>Nueva ruta</Text>
          </Pressable>
          <MapView
            isTripStarted={isTripStarted}
            route={showSelectedRoute ? routeSegments : undefined}
            customRoute={calculatedRouteData ? calculatedRouteData : undefined}
            origin={originCoords}
            destination={destinationCoords}
            onMapClick={handleMapClick}
            onSelectOrigin={handleSelectOriginFromMap}
            onSelectDestination={handleMapClick}
          />
          <RouteBottomSheet
            selectedRoute={selectedRoute}
            selectedKey={selectedKey}
            calculatedRouteData={calculatedRouteData}
            routeStats={routeStats}
            fareInfo={fareInfo}
            origin={origin}
            destination={destination}
            isTripStarted={isTripStarted}
            onToggleTripStarted={() => setIsTripStarted((started) => !started)}
            onOpenRouteInfo={() => setIsRouteInfoOpen(true)}
            recommendedRoutes={recommendedRoutes}
            onSelectRoute={handleSelectRouteFromSheet}
          />
        </View>
      )}

      <Modal transparent animationType="fade" visible={isRouteInfoOpen} onRequestClose={() => setIsRouteInfoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsRouteInfoOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.tripEyebrow}>DETALLE DEL RECORRIDO</Text>
              <Text style={styles.modalTitle}>{showSelectedRoute ? selectedRoute.title : (calculatedRouteData?.details?.routeCode ? `Ruta ${calculatedRouteData.details.routeCode}` : 'Tu ruta personalizada')}</Text>
              <><Text style={styles.mobileBusHint}>El número identifica la ruta y los nombres indican sus sectores principales.</Text><View style={styles.mobileBusSign}><View style={styles.mobileBusCode}><Text style={styles.mobileBusCodeText}>{selectedRoute.code}</Text></View><Text style={styles.mobileBusCaption}>LETRERO DEL BUS</Text>{signDestinations.map((place: string, index: number) => <Text key={place + index} style={[styles.mobileBusDestination, index % 2 === 1 && styles.mobileBusDestinationGreen]}>{place.toUpperCase()}</Text>)}</View></>
              {selectedMetadata && <View style={styles.mobileSchedule}><Text style={styles.mobileScheduleTitle}>Horarios y frecuencias</Text><Text style={styles.mobileScheduleText}>{selectedMetadata.schedule.weekdays.label}: {selectedMetadata.schedule.weekdays.hours} · cada {selectedMetadata.schedule.weekdays.frequency}</Text><Text style={styles.mobileScheduleText}>{selectedMetadata.schedule.sundaysAndHolidays.label}: {selectedMetadata.schedule.sundaysAndHolidays.hours} · cada {selectedMetadata.schedule.sundaysAndHolidays.frequency}</Text></View>}
              <View style={styles.mobileFarePanel}>
                <Text style={styles.mobileFareTitle}>Tarifas Oficiales</Text>
                <Text style={styles.mobileFareText}>☀️ Diurna (Lun - Sáb, 5:00 AM - 6:00 PM): $2.600</Text>
                <Text style={styles.mobileFareText}>🌙 Nocturna, Domingos y Festivos: $2.700</Text>
                <Text style={[styles.mobileFareText, { marginTop: 4, fontWeight: '700', color: '#3f719b' }]}>📌 Tarifa actual: {fareInfo.fareText} ({fareInfo.label})</Text>
              </View>
              <Text style={styles.modalText}>Inicio: {origin || 'Mi ubicación actual'}{`\n`}Destino: {destination}{`\n\n`}Puedes seguir el trazado en el mapa, iniciar el viaje o seleccionar una de las rutas recomendadas.</Text>
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
        <Pressable onPress={() => Alert.alert('RutaBot', 'Muy pronto podrás consultar rutas, paraderos y tarifas con el asistente virtual.')} style={styles.navItem}><Icon name="chatbot" color="#728092" size={24} /><Text style={styles.navText}>RutaBot</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f8fa' },
  content: { paddingBottom: 88 },
  hero: { height: 282, overflow: 'hidden', paddingHorizontal: 20, borderBottomLeftRadius: 38, borderBottomRightRadius: 38 },
  heroImage: { resizeMode: 'cover' },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(238,247,251,0.78)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoShell: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 15 },
  logo: { width: 37, height: 37 },
  brandName: { color: '#17283b', fontSize: 19, fontWeight: '800' },
  brandAccent: { color: '#3f719b' },
  tagline: { color: '#687789', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)' },
  welcome: { marginTop: 38 },
  welcomeTitle: { color: '#17283b', fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  searchBox: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 22, paddingLeft: 14, paddingRight: 10, marginTop: 17, shadowColor: '#17324b', shadowOpacity: 0.13, shadowRadius: 11, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  searchFields: { flex: 1 },
  searchField: { height: 35, flexDirection: 'row', alignItems: 'center', gap: 9 },
  fieldDivider: { height: 1, backgroundColor: '#e8eef2', marginLeft: 28 },
  searchInput: { flex: 1, color: '#17283b', fontSize: 14 },
  locationButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3f719b' },
  mapSection: { position: 'relative', paddingTop: 0, zIndex: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  eyebrow: { color: '#d8957d', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: '#17283b', fontSize: 21, fontWeight: '800', marginTop: 3 },
  mapFrame: { height: 360, overflow: 'hidden', borderBottomLeftRadius: 38, borderBottomRightRadius: 38 },
  suggestionsOverlay: { position: 'absolute', zIndex: 8, elevation: 8, top: -70, left: 20, right: 20, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 18, shadowColor: '#17324b', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  suggestionsOrigin: { borderLeftWidth: 5, borderLeftColor: '#3f719b' },
  suggestionsDestination: { borderLeftWidth: 5, borderLeftColor: '#d8957d' },
  suggestionItem: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  suggestionItemPressed: { backgroundColor: '#f0f6fa' },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: '#edf2f6' },
  suggestionCopy: { flex: 1, minWidth: 0 },
  suggestionTitle: { color: '#17283b', fontSize: 14, fontWeight: '800' },
  suggestionAddress: { color: '#728092', fontSize: 11, marginTop: 2 },
  routesSection: { paddingHorizontal: 20, paddingTop: 27 },
  seeAll: { color: '#3f719b', fontSize: 13, fontWeight: '700' },
  cards: { gap: 12, paddingRight: 20 },
  routeCard: { width: 260, minHeight: 168, padding: 17, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce8ef' },
  routeCardSelected: { borderColor: '#7eabc8', backgroundColor: '#fafdff' },
  routeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  routeBadgeText: { fontSize: 12, fontWeight: '800' },
  routeTitle: { color: '#17283b', fontSize: 16, fontWeight: '800', marginTop: 13 },
  routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  routeMetaText: { color: '#728092', fontSize: 12 },
  routeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf1f4', marginTop: 14, paddingTop: 11 },
  routeLink: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(23,40,59,0.45)' },
  modalCard: { maxHeight: '90%', borderRadius: 24, padding: 22, backgroundColor: '#fff', overflow: 'hidden' },
  modalScrollContent: { flexGrow: 1, paddingBottom: 2 },
  tripEyebrow: { color: '#728092', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  modalTitle: { color: '#17283b', fontSize: 22, fontWeight: '800', marginTop: 7 },
  modalText: { color: '#5f6f80', fontSize: 14, lineHeight: 21, marginTop: 14 },
  modalClose: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 14, backgroundColor: '#3f719b' },
  modalCloseText: { color: '#fff', fontWeight: '800' },
  mobileBusHint: { color: '#728092', fontSize: 11, lineHeight: 16, marginTop: 14 },
  mobileBusSign: { marginTop: 8, padding: 12, borderRadius: 14, borderWidth: 3, borderColor: '#17283b', backgroundColor: '#eff8df', overflow: 'hidden' },
  mobileBusCode: { alignSelf: 'flex-start', margin: -12, marginBottom: 9, backgroundColor: '#df2a2a', paddingHorizontal: 10, paddingVertical: 4, borderBottomRightRadius: 10 },
  mobileBusCodeText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  mobileBusCaption: { color: '#4d5c69', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  mobileBusDestination: { color: '#df2a2a', fontSize: 16, fontWeight: '900', fontStyle: 'italic', lineHeight: 20, flexShrink: 1 },
  mobileBusDestinationGreen: { color: '#2d9741' },
  mobileSchedule: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#eef9f2' },
  mobileScheduleTitle: { color: '#166534', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  mobileScheduleText: { color: '#25613f', fontSize: 11, lineHeight: 17 },
  mobileFarePanel: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#f4f7fa', borderWidth: 1, borderColor: '#e0e9ef' },
  mobileFareTitle: { color: '#17283b', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  mobileFareText: { color: '#728092', fontSize: 11, lineHeight: 17 },
  mapFocusOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 30 },
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: '#17324b',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2edf4',
  },
  floatingBackText: {
    color: '#17283b',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomSheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#17324b', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 14, borderTopWidth: 1, borderTopColor: '#e0ebf2', zIndex: 25, overflow: 'hidden' },
  sheetHandleTouchArea: { width: '100%', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#c4d3de' },
  sheetScrollContent: { paddingHorizontal: 18, paddingBottom: 32 },
  sheetSelectedCard: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#edf2f6' },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sheetEyebrow: { color: '#3f719b', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  sheetTitle: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 2 },
  sheetBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  sheetBadgeText: { fontSize: 12, fontWeight: '900' },
  sheetStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#f1f6fa', borderRadius: 14 },
  sheetStatItem: { alignItems: 'center', flex: 1 },
  sheetStatDivider: { width: 1, height: 22, backgroundColor: '#dce6ee' },
  sheetStatValue: { fontSize: 13, fontWeight: '800', color: '#17283b' },
  sheetStatLabel: { fontSize: 10, color: '#728092', marginTop: 1 },
  sheetPoints: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  sheetPointText: { flex: 1, color: '#516273', fontSize: 12, fontWeight: '600' },
  startDot: { color: '#4e9b78', fontWeight: '800' },
  endDot: { color: '#d8957d', fontWeight: '800' },
  sheetActionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  sheetStartBtn: { flex: 1.2, height: 42, borderRadius: 14, backgroundColor: '#3f719b', alignItems: 'center', justifyContent: 'center' },
  sheetStartBtnActive: { backgroundColor: '#4e9b78' },
  sheetStartBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  sheetMoreBtn: { height: 42, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#cadce8', alignItems: 'center', justifyContent: 'center' },
  sheetMoreBtnText: { color: '#3f719b', fontSize: 12, fontWeight: '700' },
  sheetToggleBtn: { height: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#f0f5f9', alignItems: 'center', justifyContent: 'center' },
  sheetToggleBtnText: { color: '#385b77', fontSize: 12, fontWeight: '700' },
  sheetAlternativesSection: { marginTop: 14, paddingTop: 4 },
  sheetAlternativesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetAlternativesEyebrow: { color: '#d8957d', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  sheetAlternativesTitle: { color: '#17283b', fontSize: 16, fontWeight: '800', marginTop: 2 },
  sheetAlternativesHint: { color: '#728092', fontSize: 11, fontWeight: '600' },
  sheetAlternativesList: { gap: 9 },
  sheetAlternativeCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2edf4', gap: 10 },
  sheetAlternativeCardActive: { borderColor: '#3f719b', backgroundColor: '#f1f8fd' },
  sheetAlternativeCardPressed: { backgroundColor: '#edf5fa' },
  sheetAltBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetAltBadgeText: { fontSize: 12, fontWeight: '900' },
  sheetAltInfo: { flex: 1, minWidth: 0 },
  sheetAltTitle: { color: '#17283b', fontSize: 13, fontWeight: '800' },
  sheetAltMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  sheetAltMetaText: { color: '#728092', fontSize: 11 },
  sheetAltAction: { alignItems: 'flex-end' },
  sheetActivePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#3f719b' },
  sheetActivePillText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  sheetSelectPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#bed4e2', backgroundColor: '#ffffff' },
  sheetSelectPillText: { color: '#3f719b', fontSize: 11, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e3ebf0', paddingTop: 9 },
  navItem: { alignItems: 'center', minWidth: 60, gap: 3 },
  navActive: { color: '#3f719b', fontSize: 11, fontWeight: '700' },
  navText: { color: '#728092', fontSize: 11, fontWeight: '600' },
});
