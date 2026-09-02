import { useState, useEffect, useRef } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';

import MapView from '@/components/Map/MapView';
import SelectedRouteCard from '@/components/Map/SelectedRouteCard';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import RouteCard from '@/components/routeCard/RouteCard';
import RouteInsights from '@/components/routeCard/RouteInsights';
import SearchBar from '@/components/searchBar/SearchBar';
import Icon from '@/components/ui/Icon';
import MobileHome from '../components/mobile/MobileHome';
import { colors, styles } from '@/styles/home.styles';
import { routesRegistry } from '@/components/Map/routesRegistry';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { geocodeLocation as serviceGeocodeLocation, reverseGeocode } from '@/services/placesService';
import { addRecentSearch, getRecentSearches, RecentSearch } from '@/services/localData';

export default function HomeScreen() {
  return Platform.OS === 'web' ? <WebHomeScreen /> : <MobileHome />;
}

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111.32; // Distancia aproximada en km
};

const getRecommendedRoutes = (
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number } | null
) => {
  if (!origin || !dest) return [];

  const suggestions: { code: string; title: string; dist: number; originDist: number; destDist: number }[] = [];

  Object.keys(routesRegistry).forEach((key) => {
    const route = routesRegistry[key];
    if (!route || !route.path || !route.path.features) return;

    let minOriginDist = Infinity;
    let minDestDist = Infinity;

    route.path.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach((coord: [number, number]) => {
          const lngVal = coord[0];
          const latVal = coord[1];

          const distToOrig = getDistance(origin.lat, origin.lng, latVal, lngVal);
          const distToDt = getDistance(dest.lat, dest.lng, latVal, lngVal);

          if (distToOrig < minOriginDist) {
            minOriginDist = distToOrig;
          }
          if (distToDt < minDestDist) {
            minDestDist = distToDt;
          }
        });
      }
    });

    // Si el trayecto de la ruta pasa a menos de 750 metros (0.75 km) de ambos puntos
    if (minOriginDist <= 0.75 && minDestDist <= 0.75) {
      const metadata = routesMetadata[key as keyof typeof routesMetadata];
      const num = key.replace('R', '');
      const formattedCode = `R-${num.padStart(2, '0')}`;
      const title = metadata
        ? `${metadata.name.split(' - ')[0]} – ${metadata.name.split(' - ').slice(-1)[0]}`
        : `Ruta ${key}`;

      suggestions.push({
        code: formattedCode,
        title,
        dist: minOriginDist + minDestDist,
        originDist: minOriginDist,
        destDist: minDestDist,
      });
    }
  });

  // Ordenar por cercanía acumulada
  return suggestions.sort((a, b) => a.dist - b.dist);
};

function WebHomeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [exploreOffset, setExploreOffset] = useState(0);
  const [insightsOffset, setInsightsOffset] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [destination, setDestination] = useState('');
  const [isCustomSearchActive, setIsCustomSearchActive] = useState(false);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const { routeCode } = useLocalSearchParams<{ routeCode?: string }>();

  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
  }, []);

  // Estados para cálculo de rutas dinámicas
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 5.5324627, // Plaza de Bolívar por defecto
    lng: -73.3615504,
  });
  const [originName, setOriginName] = useState('Plaza de Bolívar');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<any | undefined>(undefined);
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

    if (isCustomSearchActive) {
      if (showIda && showVuelta) {
        setRouteStats({
          distanceText: activeRouteKey === 'R1' ? '8.4 km' : 'Aprox. 6-10 km',
          durationText: activeRouteKey === 'R1' ? '25 min' : '30 min',
        });
      } else if (showIda) {
        setRouteStats({
          distanceText: activeRouteKey === 'R1' ? '4.2 km' : 'Aprox. 3-5 km',
          durationText: activeRouteKey === 'R1' ? '13 min' : '15 min',
        });
      } else if (showVuelta) {
        setRouteStats({
          distanceText: activeRouteKey === 'R1' ? '4.2 km' : 'Aprox. 3-5 km',
          durationText: activeRouteKey === 'R1' ? '12 min' : '15 min',
        });
      } else {
        setRouteStats({
          distanceText: '0 km',
          durationText: '0 min',
        });
      }
    } else {
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
            let displayColor = '#8b5cf6'; // Morado por defecto

            if (hasMultipleDirections && originalColor) {
              const colorIndex = uniqueColors.indexOf(originalColor);
              if (colorIndex === 0) {
                // Sentido 1 (Ida) - morado
                shouldShow = showIda;
                displayColor = '#8b5cf6';
              } else {
                // Sentido 2 (Vuelta) - verde
                shouldShow = showVuelta;
                displayColor = '#10b981';
              }
            } else {
              // Si tiene un único trazo, se rige por si está activo alguno de los sentidos
              shouldShow = showIda || showVuelta;
              displayColor = '#8b5cf6';
            }

            if (shouldShow) {
              segments.push({
                path: feature.geometry.coordinates,
                color: displayColor,
                originalColor: feature.properties?.stroke || originalColor || displayColor,
                name: feature.properties?.name || 'Vía',
                properties: feature.properties || {},
              });
            }
          }
        });
        return segments;
      })()
    : calculatedRoute;

  // Calcular la lista de rutas recomendadas en tiempo de renderizado
  const recommendedRoutesList = getRecommendedRoutes(originCoords, destCoords);

  // Efecto para calcular ruta cuando cambie el origen, el destino o la ruta activa
  useEffect(() => {
    if (!originCoords || !destCoords) return;

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
            routeCode: activeRouteKey || 'R1',
          }),
        });

        if (!response.ok) {
          throw new Error('Error al conectar con el backend');
        }

        const data = await response.json();
        
        // El backend devuelve distance (m), duration (s) y route [[lng, lat], ...]
        if (data && data.route) {
          setCalculatedRoute(data);
          
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
  }, [originCoords, destCoords, activeRouteKey]);

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

  // Limpiar coordenadas si se borra el destino
  useEffect(() => {
    if (!destination.trim()) {
      setDestCoords(null);
      setIsCustomSearchActive(false);
    }
  }, [destination]);

  // Manejador para el click en el mapa
  const handleMapClick = async (lat: number, lng: number) => {
    const clickDestCoords = { lat, lng };
    setDestCoords(clickDestCoords);
    setDestination('Obteniendo dirección...');
    setIsCustomSearchActive(true);

    let address = 'Obteniendo dirección...';
    try {
      address = await reverseGeocode(lat, lng);
      setDestination(address);
    } catch (error) {
      console.error('Error reverse geocoding map click:', error);
      address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setDestination(address);
    }

    if (originCoords) {
      const recs = getRecommendedRoutes(originCoords, clickDestCoords);
      if (recs.length > 0) {
        const bestRoute = recs[0];
        handleSelectRoute(bestRoute.code, originCoords, clickDestCoords, true);
      } else {
        setActiveRouteInfo({
          code: 'PERS',
          title: 'Ruta personalizada',
          originName: originName,
          destinationName: address,
        });
      }
    } else {
      setActiveRouteInfo({
        code: 'PERS',
        title: 'Ruta personalizada',
        originName: originName,
        destinationName: address,
      });
    }
  };

  // Función de geocodificación individual para origen o destino
  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    return await serviceGeocodeLocation(query);
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

    const oCoords = { lat: originPlace.lat, lng: originPlace.lng };
    const dCoords = { lat: destPlace.lat, lng: destPlace.lng };

    // Actualizar coordenadas y nombres
    setOriginCoords(oCoords);
    setOriginName(originPlace.name);
    setDestCoords(dCoords);
    setDestination(destPlace.name);
    setIsCustomSearchActive(true);
    setRecentSearches(await addRecentSearch(originPlace.name, destPlace.name));

    // Calcular rutas sugeridas para ver si hay una directa en bus
    const recs = getRecommendedRoutes(oCoords, dCoords);
    if (recs.length > 0) {
      const bestRoute = recs[0];
      handleSelectRoute(bestRoute.code, oCoords, dCoords, true);
      Alert.alert(
        'Ruta recomendada sugerida',
        `Se ha seleccionado automáticamente la mejor ruta de bus para tu viaje: ${bestRoute.title}.`
      );
    } else {
      setActiveRouteInfo({
        code: 'PERS',
        title: `Ruta de ${originPlace.name} a ${destPlace.name}`,
        originName: originPlace.name,
        destinationName: destPlace.name,
      });

      Alert.alert(
        'Ruta configurada',
        `No se encontraron rutas de bus directas. Se ha trazado una ruta de caminata de "${originPlace.name}" a "${destPlace.name}".`
      );
    }
  };

  // Función para restablecer todos los puntos y rutas del mapa
  const handleClearMap = () => {
    setDestCoords(null);
    setDestination('');
    setOriginCoords(null);
    setOriginName('');
    setCalculatedRoute(undefined);
    setIsCustomSearchActive(false);
    setIsTripStarted(false);
    setActiveRouteInfo({
      code: 'PERS',
      title: 'Selecciona una ruta o destino',
      originName: 'Ninguno',
      destinationName: 'Ninguno',
    });
    setRouteStats({
      distanceText: '0 km',
      durationText: '0 min',
    });
    setShowIda(true);
    setShowVuelta(true);
  };

  // Función para cargar e inyectar cualquier ruta en el mapa desde el archivo JSON
  const handleSelectRoute = (
    routeCode: string,
    overrideOrigin?: { lat: number; lng: number } | null,
    overrideDest?: { lat: number; lng: number } | null,
    preventCoordsOverride = false
  ) => {
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
          let color = '#8b5cf6'; // Morado por defecto
          const originalColor = feature.properties?.stroke?.toLowerCase();

          // Mapeamos los colores originales del JSON a tonos morados y rosados
          if (originalColor === '#7cb342' || originalColor === '#0288d1') {
            color = '#8b5cf6'; // Morado (Ida/Vuelta diferenciado)
          } else if (originalColor === '#fada80' || originalColor === '#ffcc80' || originalColor === '#e65100') {
            color = '#10b981'; // Verde (Ida/Vuelta diferenciado)
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

      if (!isCustomSearchActive && !preventCoordsOverride) {
        setOriginCoords(origin);
        setOriginName(originNameText);
        setDestCoords(dest);
        setDestination(destNameText);
      }

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

      // Autodetectar el sentido de la ruta que corresponde a la dirección del viaje del usuario
      let defaultShowIda = true;
      let defaultShowVuelta = true;

      const currentOrigin = overrideOrigin !== undefined ? overrideOrigin : originCoords;
      const currentDest = overrideDest !== undefined ? overrideDest : destCoords;

      if (currentOrigin && currentDest) {
        const isUserGoingNorth = currentDest.lat > currentOrigin.lat;
        const userDir = isUserGoingNorth ? 'sur-norte' : 'norte-sur';

        const metadataAny = metadata as any;
        const metadataIda = metadataAny?.sentidoIda; // e.g. "sur-norte" o "norte-sur"
        const metadataVuelta = metadataAny?.sentidoVuelta;

        if (metadataIda && metadataVuelta) {
          // Si están definidos manualmente en el JSON, los usamos directamente comparando con la dirección del viaje
          if (metadataIda.toLowerCase() === userDir && metadataVuelta.toLowerCase() !== userDir) {
            defaultShowIda = true;
            defaultShowVuelta = false;
            console.log(`index: Manual override used. Selected Ida (sentidoIda: ${metadataIda}) for user direction: ${userDir}`);
          } else if (metadataVuelta.toLowerCase() === userDir && metadataIda.toLowerCase() !== userDir) {
            defaultShowIda = false;
            defaultShowVuelta = true;
            console.log(`index: Manual override used. Selected Vuelta (sentidoVuelta: ${metadataVuelta}) for user direction: ${userDir}`);
          } else {
            console.log(`index: Manual override. Both or neither senses match ${userDir}, showing both.`);
          }
        } else {
          // Si no están definidos en el JSON, usamos el fallback automático de proximidad por índice
          const features = routeData.path.features.filter((f: any) => f.geometry && f.geometry.type === 'LineString');
          if (features.length >= 2) {
            const f1 = features[0];
            const f2 = features[1];

            // Función para encontrar el índice de la coordenada de la ruta más cercana a un punto dado
            const getClosestIndex = (coords: [number, number][], point: { lat: number; lng: number }) => {
              let minDistance = Infinity;
              let closestIndex = -1;
              for (let i = 0; i < coords.length; i++) {
                const dLat = coords[i][1] - point.lat;
                const dLng = coords[i][0] - point.lng;
                const dist = dLat * dLat + dLng * dLng;
                if (dist < minDistance) {
                  minDistance = dist;
                  closestIndex = i;
                }
              }
              return closestIndex;
            };

            const f1Coords = f1.geometry.coordinates;
            const f1OrigIdx = getClosestIndex(f1Coords, currentOrigin);
            const f1DestIdx = getClosestIndex(f1Coords, currentDest);
            // Sentido 1 es válido para el viaje del usuario si pasa por el origen antes que por el destino
            const f1Valid = f1OrigIdx !== -1 && f1DestIdx !== -1 && f1DestIdx > f1OrigIdx;

            const f2Coords = f2.geometry.coordinates;
            const f2OrigIdx = getClosestIndex(f2Coords, currentOrigin);
            const f2DestIdx = getClosestIndex(f2Coords, currentDest);
            // Sentido 2 es válido para el viaje del usuario si pasa por el origen antes que por el destino
            const f2Valid = f2OrigIdx !== -1 && f2DestIdx !== -1 && f2DestIdx > f2OrigIdx;

            if (f1Valid && !f2Valid) {
              defaultShowIda = true;
              defaultShowVuelta = false;
              console.log(`index: Auto-selected Ida (f1) because it goes from origin index ${f1OrigIdx} to destination index ${f1DestIdx}`);
            } else if (f2Valid && !f1Valid) {
              defaultShowIda = false;
              defaultShowVuelta = true;
              console.log(`index: Auto-selected Vuelta (f2) because it goes from origin index ${f2OrigIdx} to destination index ${f2DestIdx}`);
            } else {
              console.log(`index: Both (${f1Valid}, ${f2Valid}) or neither senses match index order, showing both.`);
            }
          }
        }
      }

      setShowIda(defaultShowIda);
      setShowVuelta(defaultShowVuelta);

      // Reiniciar el viaje al cambiar de ruta
      setIsTripStarted(false);
      
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

  // Obtener etiquetas descriptivas de dirección (ej: "Sur a Norte (Terminal - Norte)")
  const directionLabels = (() => {
    if (!localRouteData?.path?.features) return { ida: 'Ida', vuelta: 'Vuelta' };
    const features = localRouteData.path.features.filter((f: any) => f.geometry && f.geometry.type === 'LineString');
    
    let ida = 'Ida';
    let vuelta = 'Vuelta';

    // Obtener los sentidos manuales si están configurados en el JSON
    const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
    const key = match ? `R${match[1]}` : activeRouteInfo.code;
    const activeMetadata = routesMetadata[key as keyof typeof routesMetadata] as any;
    const jsonIdaDir = activeMetadata?.sentidoIda; // e.g. "norte-sur" o "sur-norte"
    const jsonVueltaDir = activeMetadata?.sentidoVuelta;

    if (features.length >= 1) {
      const f1 = features[0];
      const name = f1.properties?.name || 'Ida';
      let dir = 'Ida';
      if (jsonIdaDir) {
        dir = jsonIdaDir.toLowerCase() === 'sur-norte' ? 'Sur a Norte' : 'Norte a Sur';
      } else {
        const coords = f1.geometry.coordinates;
        const startLat = coords[0][1];
        const endLat = coords[coords.length - 1][1];
        dir = endLat > startLat ? 'Sur a Norte' : 'Norte a Sur';
      }
      ida = `${dir} (${name})`;
    }
    if (features.length >= 2) {
      const f2 = features[1];
      const name = f2.properties?.name || 'Vuelta';
      let dir = 'Vuelta';
      if (jsonVueltaDir) {
        dir = jsonVueltaDir.toLowerCase() === 'sur-norte' ? 'Sur a Norte' : 'Norte a Sur';
      } else {
        const coords = f2.geometry.coordinates;
        const startLat = coords[0][1];
        const endLat = coords[coords.length - 1][1];
        dir = endLat > startLat ? 'Sur a Norte' : 'Norte a Sur';
      }
      vuelta = `${dir} (${name})`;
    }
    return { ida, vuelta };
  })();

  return (
    <View style={styles.page}>
      <SafeAreaView
        edges={['top']}
        style={[styles.header, styles.headerOverlay, styles.headerScrolled]}
      >
        <Header isCompact={isCompact} />
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

            <View style={[styles.homeQuickActions, isCompact && styles.homeQuickActionsPhone]}>
              <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive, isCompact && styles.quickPillPhone]}>
                <Icon name="heart" color={colors.blue} size={isCompact ? 18 : 19} />
                <Text style={[styles.quickTextActive, isCompact && styles.quickTextPhone]}>Favoritos</Text>
              </Pressable>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: exploreOffset + insightsOffset, animated: true })} style={[styles.quickPill, isCompact && styles.quickPillPhone]}>
                <Icon name="history" color={colors.muted} size={isCompact ? 17 : 18} />
                <Text style={[styles.quickText, isCompact && styles.quickTextPhone]}>Recientes</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/routes' as never)} style={[styles.quickPill, isCompact && styles.quickPillPhone]}>
                <Icon name="bus" color={colors.muted} size={isCompact ? 18 : 19} />
                <Text style={[styles.quickText, isCompact && styles.quickTextPhone]}>Todas las rutas</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        <View onLayout={(event) => setExploreOffset(event.nativeEvent.layout.y)} style={[styles.exploreSection, isCompact && styles.exploreSectionPhone]}>
          <View style={styles.mapSection}>
            <Text style={styles.sectionEyebrow}>DESCUBRE LA CIUDAD</Text>
            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitlePhone]}>Planifica tu recorrido</Text>
            <Text style={[styles.sectionDescription, isCompact && styles.sectionDescriptionPhone]}>Consulta el trayecto, haz clic en el mapa para fijar tu destino.</Text>
            <View style={[styles.mapSearchBarWrap, isCompact && styles.mapSearchBarWrapPhone]}>
              <SearchBar
                origin={originName}
                onOriginChange={setOriginName}
                onOriginSelect={(name, coords) => {
                  setOriginName(name);
                  setOriginCoords(coords);
                  setIsCustomSearchActive(true);
                  if (destCoords) {
                    const recs = getRecommendedRoutes(coords, destCoords);
                    if (recs.length > 0) {
                      handleSelectRoute(recs[0].code, coords, destCoords, true);
                    }
                  }
                }}
                destination={destination}
                onDestinationChange={setDestination}
                onDestinationSelect={(name, coords) => {
                  setDestination(name);
                  setDestCoords(coords);
                  setIsCustomSearchActive(true);
                  if (originCoords) {
                    const recs = getRecommendedRoutes(originCoords, coords);
                    if (recs.length > 0) {
                      handleSelectRoute(recs[0].code, originCoords, coords, true);
                    }
                  }
                }}
                isCompact={isCompact}
                showQuickActions={false}
                onUseCurrentLocation={handleUseCurrentLocation}
                onSearchBoth={handleSearchRoute}
              />
            </View>
            <View style={[styles.mapRouteLayout, isCompact && styles.mapRouteLayoutCompact]}>
              <View style={[styles.mapContainer, isCompact && styles.mapContainerPhone]}>
                <MapView
                  isTripStarted={isTripStarted}
                  route={filteredRoute}
                  customRoute={localRouteData ? calculatedRoute : undefined}
                  origin={originCoords}
                  destination={destCoords}
                  onMapClick={handleMapClick}
                />
              </View>
              <SelectedRouteCard
                isCompact={isCompact}
                recommendedRoutes={recommendedRoutesList.filter(
                  (route) => route.code !== activeRouteInfo.code
                )}
                onSelectRecommendedRoute={(code) => handleSelectRoute(code, originCoords, destCoords, true)}
                onClearMap={handleClearMap}
                isTripStarted={isTripStarted}
                onToggleTrip={() => setIsTripStarted((started) => !started)}
                title={activeRouteInfo.title}
                code={activeRouteInfo.code}
                duration={routeStats.durationText}
                distanceText={routeStats.distanceText}
                originName={originName || 'Ninguno'}
                destinationName={destination || 'Ninguno'}
                showRoute1Directions={hasMultipleDirections}
                showIda={showIda}
                showVuelta={showVuelta}
                onToggleIda={() => setShowIda(prev => !prev)}
                onToggleVuelta={() => setShowVuelta(prev => !prev)}
                idaLabel={directionLabels.ida}
                vueltaLabel={directionLabels.vuelta}
                schedule={(() => {
                  const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
                  const key = match ? `R${match[1]}` : activeRouteInfo.code;
                  return routesMetadata[key as keyof typeof routesMetadata]?.schedule;
                })()}
                routeName={(() => {
                  const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
                  const key = match ? `R${match[1]}` : activeRouteInfo.code;
                  return routesMetadata[key as keyof typeof routesMetadata]?.name;
                })()}
                routeCategory={(() => {
                  const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
                  const key = match ? `R${match[1]}` : activeRouteInfo.code;
                  return routesMetadata[key as keyof typeof routesMetadata]?.category;
                })()}
                routeMapLink={(() => {
                  const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
                  const key = match ? `R${match[1]}` : activeRouteInfo.code;
                  return routesMetadata[key as keyof typeof routesMetadata]?.mapLink;
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
            {!isCompact && <Pressable onPress={() => router.push('/routes' as never)}><Text style={styles.sectionLink}>Ver todas  ›</Text></Pressable>}
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

          {isCompact && <Pressable onPress={() => router.push('/routes' as never)}><Text style={[styles.sectionLink, styles.sectionLinkBelowPhone]}>Ver todas las rutas  ›</Text></Pressable>}

          <View onLayout={(event) => setInsightsOffset(event.nativeEvent.layout.y)}>
            <RouteInsights
              isCompact={isCompact}
              recentSearches={recentSearches}
              onSelectRoute={(code) => handleSelectRoute(`R-${code.replace('R', '').padStart(2, '0')}`)}
              onSelectRecent={handleSearchRoute}
            />
          </View>
        </View>

        <Footer isCompact={isCompact} />
      </ScrollView>

      <ChatbotWidget isCompact={isCompact} />
    </View>
  );
}
