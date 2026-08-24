import { useState, useEffect } from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';

import MapView from '@/components/Map/MapView';
import SelectedRouteCard from '@/components/Map/SelectedRouteCard';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import RouteCard from '@/components/routeCard/RouteCard';
import RouteInsights from '@/components/routeCard/RouteInsights';
import SearchBar from '@/components/searchBar/SearchBar';
import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';
import { routesRegistry } from '@/components/Map/routesRegistry';
import routesMetadata from '@/assets/routes/routes-metadata.json';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const [destination, setDestination] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const { routeCode } = useLocalSearchParams<{ routeCode?: string }>();

  // Estados para cálculo de rutas dinámicas
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: 5.5324627, // Plaza de Bolívar por defecto
    lng: -73.3615504,
  });
  const [originName, setOriginName] = useState('Plaza de Bolívar');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<[number, number][] | undefined>(undefined);
  const [routeStats, setRouteStats] = useState({
    distanceText: '0 km',
    durationText: '0 min',
  });

  // Estado para la información activa de la ruta que se muestra en la tarjeta de detalles
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    code: string;
    title: string;
    originName: string;
    destinationName: string;
  }>({
    code: 'PERS',
    title: 'Selecciona una ruta o destino',
    originName: 'Plaza de Bolívar',
    destinationName: 'Ninguno',
  });

  // Estados para controlar visualización de Ida y Vuelta en las rutas
  const [showIda, setShowIda] = useState(true);
  const [showVuelta, setShowVuelta] = useState(true);

  // Obtener clave de la ruta activa (ej: R1, R2, ..., R26)
  const activeRouteKey = (() => {
    const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
    return match ? `R${match[1]}` : null;
  })();

  // Efecto para sincronizar puntos y estadísticas de la ruta activa según los sentidos activos
  useEffect(() => {
    if (!activeRouteKey || !routesRegistry[activeRouteKey]) return;

    const routeData = routesRegistry[activeRouteKey];
    const pointsData = routeData.points;

    let originLatLng = { lat: 5.5324627, lng: -73.3615504 };
    let destLatLng: { lat: number; lng: number } | null = null;
    let originNameText = 'Inicio';
    let destNameText = 'Destino';

    if (pointsData && pointsData.features) {
      const pointFeatures = pointsData.features.filter((f: any) => f.geometry && f.geometry.type === 'Point');
      if (pointFeatures.length > 0) {
        const orig = pointFeatures[0];
        originNameText = orig.properties?.name || 'Inicio';
        originLatLng = { lat: orig.geometry.coordinates[1], lng: orig.geometry.coordinates[0] };
      }
      if (pointFeatures.length > 1) {
        const dest = pointFeatures[pointFeatures.length - 1]; // Usar último punto como destino
        destNameText = dest.properties?.name || 'Destino';
        destLatLng = { lat: dest.geometry.coordinates[1], lng: dest.geometry.coordinates[0] };
      }
    }

    if (showIda && showVuelta) {
      setOriginCoords(originLatLng);
      setOriginName(originNameText);
      setDestCoords(destLatLng);
      setDestination(destNameText);
      setRouteStats({
        distanceText: activeRouteKey === 'R1' ? '8.4 km' : 'Aprox. 6-10 km',
        durationText: activeRouteKey === 'R1' ? '25 min' : '30 min',
      });
    } else if (showIda) {
      setOriginCoords(originLatLng);
      setOriginName(originNameText);
      setDestCoords(destLatLng);
      setDestination(destNameText);
      setRouteStats({
        distanceText: activeRouteKey === 'R1' ? '4.2 km' : 'Aprox. 3-5 km',
        durationText: activeRouteKey === 'R1' ? '13 min' : '15 min',
      });
    } else if (showVuelta) {
      setOriginCoords(destLatLng || originLatLng);
      setOriginName(destNameText);
      setDestCoords(originLatLng);
      setDestination(originNameText);
      setRouteStats({
        distanceText: activeRouteKey === 'R1' ? '4.2 km' : 'Aprox. 3-5 km',
        durationText: activeRouteKey === 'R1' ? '12 min' : '15 min',
      });
    } else {
      setOriginCoords(null as any);
      setOriginName('Ninguno');
      setDestCoords(null);
      setDestination('Ninguno');
      setRouteStats({
        distanceText: '0 km',
        durationText: '0 min',
      });
    }
  }, [showIda, showVuelta, activeRouteKey]);

  // Determinar si la ruta seleccionada proviene del registro local
  const localRouteData = activeRouteKey ? routesRegistry[activeRouteKey as keyof typeof routesRegistry] : null;

  // Obtener colores únicos de los trazos de la ruta activa para separar Ida y Vuelta
  const uniqueColors = (() => {
    if (!localRouteData?.path?.features) return [];
    const colorsSet = new Set<string>();
    localRouteData.path.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'LineString' && feature.properties?.stroke) {
        colorsSet.add(feature.properties.stroke.toLowerCase());
      }
    });
    return Array.from(colorsSet);
  })();

  const hasMultipleDirections = uniqueColors.length > 1;

  // Ruta filtrada derivada para el mapa
  const filteredRoute = localRouteData
    ? (() => {
        const segments: any[] = [];
        localRouteData.path.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'LineString') {
            const originalColor = feature.properties?.stroke?.toLowerCase();
            
            let shouldShow = true;
            let displayColor = '#3f719b'; // Color por defecto (azul)

            if (hasMultipleDirections && originalColor) {
              const colorIndex = uniqueColors.indexOf(originalColor);
              if (colorIndex === 0) {
                // Sentido 1 (Ida) - verde
                shouldShow = showIda;
                displayColor = '#4e9b78';
              } else {
                // Sentido 2 (Vuelta) - amarillo/dorado
                shouldShow = showVuelta;
                displayColor = '#f5c242';
              }
            } else {
              // Si tiene un único trazo, se rige por si está activo alguno de los sentidos
              shouldShow = showIda || showVuelta;
              displayColor = feature.properties?.stroke || '#3f719b';
            }

            if (shouldShow) {
              segments.push({
                path: feature.geometry.coordinates,
                color: displayColor,
              });
            }
          }
        });
        return segments;
      })()
    : calculatedRoute;

  // Efecto para calcular ruta cuando cambie el origen o el destino
  useEffect(() => {
    if (!originCoords || !destCoords) return;
    // Si la ruta activa es una ruta cargada localmente desde JSON, no hacemos la consulta a OSRM
    if (activeRouteKey && routesRegistry[activeRouteKey]) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch('http://localhost:3000/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: originCoords,
            destination: destCoords,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al conectar con el backend');
        }

        const data = await response.json();
        
        // El backend devuelve distance (m), duration (s) y route [[lng, lat], ...]
        if (data.route) {
          setCalculatedRoute(data.route);
          
          const distanceKm = (data.distance / 1000).toFixed(2);
          const durationMin = Math.round(data.duration / 60);

          setRouteStats({
            distanceText: `${distanceKm} km`,
            durationText: `${durationMin} min`,
          });
        }
      } catch (error) {
        console.error('Error fetching route from backend:', error);
      }
    };

    fetchRoute();
  }, [originCoords, destCoords]);

  // Función para obtener la ubicación GPS actual del dispositivo
  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos permisos de ubicación para utilizar tu posición GPS actual.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Actualizar origen con GPS actual
      setOriginCoords({ lat: latitude, lng: longitude });
      setOriginName('Mi ubicación actual');
      
      Alert.alert(
        'Ubicación actualizada',
        `Se ha fijado tu ubicación actual (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) como origen.`
      );
    } catch (error) {
      console.error('Error obteniendo ubicación actual:', error);
      Alert.alert(
        'Error',
        'No se pudo obtener tu ubicación actual. Asegúrate de tener el GPS activado.'
      );
    }
  };

  // Obtener ubicación GPS actual al iniciar la aplicación de forma silenciosa
  useEffect(() => {
    const fetchCurrentLocationSilently = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = location.coords;
          setOriginCoords({ lat: latitude, lng: longitude });
          setOriginName('Mi ubicación actual');
        }
      } catch (error) {
        console.error('Error obteniendo ubicación actual al iniciar:', error);
      }
    };

    fetchCurrentLocationSilently();
  }, []);

  // Manejador para el click en el mapa
  const handleMapClick = (lat: number, lng: number) => {
    // Establecer como destino y actualizar campo de texto con coordenadas para feedback visual
    setDestCoords({ lat, lng });
    setDestination(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setActiveRouteInfo({
      code: 'PERS',
      title: 'Ruta personalizada',
      originName: originName,
      destinationName: `Destino (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    });
  };

  // Función de geocodificación individual para origen o destino
  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    if (!query.trim()) return null;

    const localPlaces: Record<string, { lat: number; lng: number; name: string }> = {
      'uptc': { lat: 5.5562, lng: -73.3516, name: 'Universidad UPTC' },
      'universidad uptc': { lat: 5.5562, lng: -73.3516, name: 'Universidad UPTC' },
      'terminal': { lat: 5.530809, lng: -73.34496, name: 'Terminal de Transportes' },
      'terminal de transportes': { lat: 5.530809, lng: -73.34496, name: 'Terminal de Transportes' },
      'plaza de bolivar': { lat: 5.5324627, lng: -73.3615504, name: 'Plaza de Bolívar' },
      'plaza de bolívar': { lat: 5.5324627, lng: -73.3615504, name: 'Plaza de Bolívar' },
      'uniboyaca': { lat: 5.5682, lng: -73.3320, name: 'Universidad de Boyacá' },
      'universidad de boyaca': { lat: 5.5682, lng: -73.3320, name: 'Universidad de Boyacá' },
      'universidad de boyacá': { lat: 5.5682, lng: -73.3320, name: 'Universidad de Boyacá' },
      'hospital san rafael': { lat: 5.5269, lng: -73.3578, name: 'Hospital San Rafael' },
      'muiscas': { lat: 5.5724, lng: -73.3396, name: 'Barrio Los Muiscas' },
      'los muiscas': { lat: 5.5724, lng: -73.3396, name: 'Barrio Los Muiscas' },
      'arboleda': { lat: 5.575069, lng: -73.331541, name: 'Despacho Arboleda' },
      'centro': { lat: 5.5332, lng: -73.3620, name: 'Centro Histórico' },
      'viva': { lat: 5.5492, lng: -73.3490, name: 'C.C. Viva Tunja' },
      'viva tunja': { lat: 5.5492, lng: -73.3490, name: 'C.C. Viva Tunja' },
      'mi ubicacion': { lat: originCoords?.lat || 5.5324627, lng: originCoords?.lng || -73.3615504, name: originName || 'Mi ubicación' },
      'mi ubicación': { lat: originCoords?.lat || 5.5324627, lng: originCoords?.lng || -73.3615504, name: originName || 'Mi ubicación' },
      'mi ubicación actual': { lat: originCoords?.lat || 5.5324627, lng: originCoords?.lng || -73.3615504, name: originName || 'Mi ubicación actual' },
    };

    const cleanQuery = query.toLowerCase().trim();
    if (localPlaces[cleanQuery]) {
      return localPlaces[cleanQuery];
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Tunja, Boyacá, Colombia')}`
      );
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const bestResult = results[0];
          return {
            lat: parseFloat(bestResult.lat),
            lng: parseFloat(bestResult.lon),
            name: bestResult.display_name.split(',')[0],
          };
        }
      }
    } catch (e) {
      console.error('Error in single geocoding:', e);
    }
    return null;
  };

  // Función para buscar ambos puntos e inyectar origen/destino en el mapa
  const handleSearchRoute = async (originQuery: string, destQuery: string) => {
    if (!originQuery.trim() || !destQuery.trim()) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tanto el punto de partida como el destino.');
      return;
    }

    // Geocodificar origen y destino
    const originPlace = await geocodeLocation(originQuery);
    const destPlace = await geocodeLocation(destQuery);

    if (!originPlace) {
      Alert.alert('Origen no encontrado', `No se pudo encontrar la ubicación de partida: "${originQuery}"`);
      return;
    }
    if (!destPlace) {
      Alert.alert('Destino no encontrado', `No se pudo encontrar la ubicación de destino: "${destQuery}"`);
      return;
    }

    // Actualizar coordenadas y nombres
    setOriginCoords({ lat: originPlace.lat, lng: originPlace.lng });
    setOriginName(originPlace.name);
    setDestCoords({ lat: destPlace.lat, lng: destPlace.lng });
    setDestination(destPlace.name);

    setActiveRouteInfo({
      code: 'PERS',
      title: `Ruta de ${originPlace.name} a ${destPlace.name}`,
      originName: originPlace.name,
      destinationName: destPlace.name,
    });

    Alert.alert(
      'Ruta configurada',
      `Marcado trayecto desde "${originPlace.name}" hasta "${destPlace.name}" en el mapa.`
    );
  };

  // Función para cargar e inyectar cualquier ruta en el mapa desde el archivo JSON
  const handleSelectRoute = (routeCode: string) => {
    try {
      const match = routeCode.match(/R-?0*(\d+)/i);
      const key = match ? `R${match[1]}` : routeCode;
      const routeData = routesRegistry[key];

      if (!routeData) {
        Alert.alert('Error', `No se encontró información para la ruta ${routeCode}`);
        return;
      }

      const metadata = routesMetadata[key as keyof typeof routesMetadata];
      const segments: { path: [number, number][]; color: string }[] = [];
      const routeCoordinates: [number, number][] = [];
      
      // Extraemos las coordenadas y colores de todas las líneas en el feature collection
      routeData.path.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.type === 'LineString') {
          let color = '#3f719b'; // Azul por defecto
          const originalColor = feature.properties?.stroke?.toLowerCase();

          // Mapeamos los colores originales del JSON a tonos más vivos y legibles
          if (originalColor === '#7cb342' || originalColor === '#0288d1') {
            color = '#4e9b78'; // Verde (Ida/Vuelta diferenciado)
          } else if (originalColor === '#fada80' || originalColor === '#ffcc80' || originalColor === '#e65100') {
            color = '#f5c242'; // Amarillo / Dorado (Ida/Vuelta diferenciado)
          } else if (originalColor) {
            color = originalColor;
          }

          segments.push({
            path: feature.geometry.coordinates,
            color: color
          });
          routeCoordinates.push(...feature.geometry.coordinates);
        }
      });

      if (routeCoordinates.length === 0) {
        Alert.alert('Error', `No se encontraron coordenadas válidas para la ruta ${routeCode}.`);
        return;
      }

      // Obtener puntos clave para el inicio y fin
      let startCoord = routeCoordinates[0];
      let endCoord = routeCoordinates[routeCoordinates.length - 1];
      let originNameText = 'Inicio';
      let destNameText = 'Destino';

      if (routeData.points && routeData.points.features) {
        const pointFeatures = routeData.points.features.filter((f: any) => f.geometry && f.geometry.type === 'Point');
        if (pointFeatures.length > 0) {
          const orig = pointFeatures[0];
          originNameText = orig.properties?.name || 'Inicio';
          startCoord = [orig.geometry.coordinates[0], orig.geometry.coordinates[1]];
        }
        if (pointFeatures.length > 1) {
          const dest = pointFeatures[pointFeatures.length - 1];
          destNameText = dest.properties?.name || 'Destino';
          endCoord = [dest.geometry.coordinates[0], dest.geometry.coordinates[1]];
        }
      }

      // Convertimos a { lat, lng } para marcadores
      const origin = { lat: startCoord[1], lng: startCoord[0] };
      const dest = { lat: endCoord[1], lng: endCoord[0] };

      setOriginCoords(origin);
      setOriginName(originNameText);
      setDestCoords(dest);
      setDestination(destNameText);

      // Determinar nombre amigable
      const cleanTitle = metadata 
        ? `${routeCode}: ${metadata.name.split(' - ')[0]} – ${metadata.name.split(' - ').slice(-1)[0]}`
        : `Ruta ${routeCode}`;

      // Actualizar información mostrada en la tarjeta de ruta activa
      setActiveRouteInfo({
        code: routeCode,
        title: cleanTitle,
        originName: originNameText,
        destinationName: destNameText,
      });

      setRouteStats({
        distanceText: key === 'R1' ? '8.4 km' : 'Aprox. 6-10 km',
        durationText: key === 'R1' ? '25 min' : '30 min',
      });

      // Asegurar que ambos sentidos estén activos por defecto
      setShowIda(true);
      setShowVuelta(true);

      // Pasar segmentos con color al componente del mapa
      setCalculatedRoute(segments as any);
      setIsTripStarted(false); // Reiniciar el viaje al cambiar de ruta
      
      Alert.alert(`Ruta ${routeCode} Seleccionada`, `Se ha cargado el trayecto de la Ruta ${routeCode} en el mapa.`);
    } catch (error) {
      console.error(`Error loading Ruta ${routeCode}:`, error);
      Alert.alert('Error', `Hubo un error cargando los datos de la Ruta ${routeCode}.`);
    }
  };

  // Escuchar cambios de routeCode para cargar la ruta automáticamente al ingresar a la pantalla principal
  useEffect(() => {
    if (routeCode) {
      handleSelectRoute(routeCode);
    }
  }, [routeCode]);

  return (
    <View style={styles.page}>
      <SafeAreaView
        edges={['top']}
        style={[styles.header, styles.headerOverlay, isScrolled && styles.headerScrolled]}
      >
        <Header isCompact={isCompact} />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setIsScrolled(event.nativeEvent.contentOffset.y > 36)}
        scrollEventThrottle={16}
      >
        <ImageBackground
          source={require('@/assets/images/tunja.jpg')}
          style={[styles.hero, isCompact && styles.heroPhone]}
          imageStyle={[styles.heroImage, isCompact && styles.heroImagePhone]}
        >
          <View pointerEvents="none" style={styles.heroOverlay} />
          <View pointerEvents="none" style={[styles.heroFadeLayerOne, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerTwo, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerThree, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerFour, isCompact && styles.heroFadePhone]} />
          <View style={[styles.heroInner, isCompact && styles.heroInnerCompact, isCompact && styles.heroInnerPhone]}>
            <View style={[styles.locationPill, isCompact && styles.locationPillPhone]}>
              <Icon name="location" color={colors.coral} size={18} />
              <Text style={[styles.locationText, isCompact && styles.locationTextPhone]}>TUNJA · BOYACÁ</Text>
            </View>
            <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact, isCompact && styles.heroTitlePhone]}>
              Muévete por la ciudad,{ '\n' }
              <Text style={styles.heroTitleBlue}>tan simple como{ '\n' }caminar el centro.</Text>
            </Text>
            <Text style={[styles.heroDescription, isCompact && styles.heroDescriptionPhone]}>
              Consulta rutas de buses urbanos, encuentra el paradero más cercano y planifica{ '\n' }
              tu viaje con información clara y en tiempo real.
            </Text>

            <SearchBar
              origin={originName}
              onOriginChange={setOriginName}
              destination={destination}
              onDestinationChange={setDestination}
              isCompact={isCompact}
              onUseCurrentLocation={handleUseCurrentLocation}
              onSearchBoth={handleSearchRoute}
            />
          </View>
        </ImageBackground>

        <View style={[styles.exploreSection, isCompact && styles.exploreSectionPhone]}>
          <View style={styles.mapSection}>
            <Text style={styles.sectionEyebrow}>DESCUBRE LA CIUDAD</Text>
            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitlePhone]}>Planifica tu recorrido</Text>
            <Text style={[styles.sectionDescription, isCompact && styles.sectionDescriptionPhone]}>Consulta el trayecto, haz clic en el mapa para fijar tu destino.</Text>
            <View style={[styles.mapRouteLayout, isCompact && styles.mapRouteLayoutCompact]}>
              <View style={[styles.mapContainer, isCompact && styles.mapContainerPhone]}>
                <MapView
                  isTripStarted={isTripStarted}
                  route={filteredRoute}
                  origin={originCoords}
                  destination={destCoords}
                  onMapClick={handleMapClick}
                />
              </View>
              <SelectedRouteCard
                isCompact={isCompact}
                isTripStarted={isTripStarted}
                onToggleTrip={() => setIsTripStarted((started) => !started)}
                title={activeRouteInfo.title}
                code={activeRouteInfo.code}
                duration={routeStats.durationText}
                distanceText={routeStats.distanceText}
                originName={activeRouteInfo.originName}
                destinationName={activeRouteInfo.destinationName}
                showRoute1Directions={hasMultipleDirections}
                showIda={showIda}
                showVuelta={showVuelta}
                onToggleIda={() => setShowIda(prev => !prev)}
                onToggleVuelta={() => setShowVuelta(prev => !prev)}
                schedule={(() => {
                  const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
                  const key = match ? `R${match[1]}` : activeRouteInfo.code;
                  return routesMetadata[key as keyof typeof routesMetadata]?.schedule;
                })()}
              />
            </View>
          </View>

          <View style={[styles.sectionHeaderRow, isCompact && styles.sectionHeaderRowPhone]}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>MOVIDAS ESTA SEMANA</Text>
              <Text style={[styles.sectionTitle, isCompact && styles.sectionTitlePhone]}>Rutas más utilizadas</Text>
              <Text style={[styles.sectionDescription, isCompact && styles.sectionDescriptionPhone]}>Las líneas con mayor demanda en Tunja durante esta semana.</Text>
            </View>
            {!isCompact && <Text style={styles.sectionLink}>Ver todas  ›</Text>}
          </View>

          <View style={[styles.routeGrid, isCompact && styles.routeGridPhone]}>
            <RouteCard
              code="R-01"
              title="Ruta 1: Arboleda – Terminal"
              description="Despacho Arboleda → Terminal de Transportes"
              duration="25 min"
              frequency="cada 8 min"
              stops="2 despachos"
              tone="blue"
              isCompact={isCompact}
              onPress={() => handleSelectRoute('R-01')}
            />
            <RouteCard
              code="R-07"
              title="Terminal – Norte"
              description="Terminal de Transportes → Barrio Los Muiscas"
              duration="31 min"
              frequency="cada 9 min"
              stops="19 paradas"
              tone="green"
              isCompact={isCompact}
              onPress={() => handleSelectRoute('R-07')}
            />
            <RouteCard
              code="R-11"
              title="Sur – Hospital"
              description="Villa Universitaria → Hospital San Rafael"
              duration="27 min"
              frequency="cada 12 min"
              stops="16 paradas"
              tone="gold"
              isCompact={isCompact}
              onPress={() => handleSelectRoute('R-11')}
            />
            <RouteCard
              code="R-15"
              title="Pozo de Donato"
              description="Plaza Real → Pozo de Donato"
              duration="18 min"
              frequency="cada 15 min"
              stops="11 paradas"
              tone="coral"
              isCompact={isCompact}
              onPress={() => handleSelectRoute('R-15')}
            />
          </View>

          {isCompact && <Text style={[styles.sectionLink, styles.sectionLinkBelowPhone]}>Ver todas las rutas  ›</Text>}

          <RouteInsights isCompact={isCompact} />
        </View>

        <Footer isCompact={isCompact} />
      </ScrollView>

      <ChatbotWidget isCompact={isCompact} />
    </View>
  );
}
