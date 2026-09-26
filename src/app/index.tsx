import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
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
import Toast, { ToastData, ToastVariant } from '@/components/ui/Toast';
import MobileHome from '@/components/mobile/MobileHome';
import { colors, styles } from '@/styles/home.styles';
import { routesRegistry } from '@/components/Map/routesRegistry';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { geocodeLocation as serviceGeocodeLocation, reverseGeocode } from '@/services/placesService';
import { getBackendUrl } from '@/services/backendUrl';
import { addRecentSearch, getRecentSearches, RecentSearch } from '@/services/localData';

export default function HomeScreen() {
  return Platform.OS === 'web' ? <WebHomeScreen /> : <MobileHome />;
}

// Origen de respaldo, usado únicamente cuando la geolocalización real falla o el permiso es denegado.
const DEFAULT_ORIGIN = { lat: 5.5324627, lng: -73.3615504, name: 'Plaza de Bolívar' };

// Resuelve la ubicación GPS actual del dispositivo, compartida entre el botón manual
// y el intento silencioso al iniciar la app.
type LocationResult = { lat: number; lng: number } | 'denied' | null;
const resolveCurrentLocation = async (): Promise<LocationResult> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return 'denied';
    }
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (location?.coords) {
        return { lat: location.coords.latitude, lng: location.coords.longitude };
      }
    } catch (e) {
      console.warn('Expo Location error, fallbacking to navigator:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => {
            console.error('Browser geolocation error:', err);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo ubicación actual:', error);
    return null;
  }
};

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111.32; // Distancia aproximada en km
};

const getShortRouteTitle = (name: string) => {
  const sectors = name
    .split(/\s*-\s*/)
    .map((sector) => sector.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((sector, index, all) => all.findIndex((item) => item.toLowerCase() === sector.toLowerCase()) === index);

  if (sectors.length <= 2) return sectors.join(' – ');
  if (sectors[0].toLowerCase() === sectors[sectors.length - 1].toLowerCase()) {
    return `${sectors[0]} – ${sectors[1]}`;
  }
  return `${sectors[0]} – ${sectors[sectors.length - 1]}`;
};

const getRecommendedRoutes = (
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number } | null
) => {
  if (!origin || !dest) return [];

  const suggestions: { code: string; title: string; dist: number; originDist: number; destDist: number; score: number }[] = [];

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

    // Permitir rutas que pasen dentro de una distancia caminable razonable (hasta 1.35 km)
    if (minOriginDist <= 1.35 && minDestDist <= 1.35) {
      const metadata = routesMetadata[key as keyof typeof routesMetadata];
      const num = key.replace('R', '');
      const formattedCode = `R-${num.padStart(2, '0')}`;
      const title = metadata
        ? getShortRouteTitle(metadata.name)
        : `Ruta ${key}`;

      // Score de conveniencia global: prioriza llegar lo más cerca posible del destino (1.4x) y origen (1.0x)
      const score = (minOriginDist * 1.0) + (minDestDist * 1.4);

      suggestions.push({
        code: formattedCode,
        title,
        dist: minOriginDist + minDestDist,
        originDist: minOriginDist,
        destDist: minDestDist,
        score,
      });
    }
  });

  // Ordenar por el score de conveniencia del viaje
  return suggestions.sort((a, b) => a.score - b.score);
};

function WebHomeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isMapCompact = width < 1100;
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [exploreOffset, setExploreOffset] = useState(0);
  const [insightsOffset, setInsightsOffset] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [destination, setDestination] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCustomSearchActive, setIsCustomSearchActive] = useState(false);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const { routeCode, destLat, destLng, destName } = useLocalSearchParams<{
    routeCode?: string;
    destLat?: string;
    destLng?: string;
    destName?: string;
  }>();

  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
  }, []);

  const saveRecentSearch = async (origin: string, destination: string) => {
    if (!origin.trim() || !destination.trim()) return;
    setRecentSearches(await addRecentSearch(origin.trim(), destination.trim()));
  };

  // Estados para cálculo de rutas dinámicas
  // El origen inicia vacío: se completa con la ubicación GPS real (ver efecto de arranque más abajo)
  // y solo cae a Plaza de Bolívar si la geolocalización falla o el permiso es denegado.
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [originName, setOriginName] = useState('');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickMode, setPickMode] = useState<'ORIGIN' | 'DEST' | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<any | undefined>(undefined);
  const [routeStats, setRouteStats] = useState({
    distanceText: '0 km',
    durationText: '0 min',
  });
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isInitialAppLoading, setIsInitialAppLoading] = useState(true);

  // Estado para la información activa de la ruta que se muestra en la tarjeta de detalles
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    code: string;
    title: string;
    originName: string;
    destinationName: string;
  }>({
    code: 'PERS',
    title: 'Selecciona una ruta o destino',
    originName: 'Ninguno',
    destinationName: 'Ninguno',
  });

  // Aviso no bloqueante en pantalla (reemplaza Alert.alert, que en web abre un
  // window.alert/confirm bloqueante que puede robar el foco y resetear el scroll).
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const showToast = (variant: ToastVariant, title: string, message?: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ variant, title, message });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  // Se incrementa únicamente ante una confirmación explícita del usuario (Calcular Ruta,
  // click en el mapa, elegir una ruta/recomendación) — dispara el cálculo de ruta contra
  // el backend sin que el simple hecho de elegir una sugerencia de origen/destino lo haga.
  const [routeRequestKey, setRouteRequestKey] = useState(0);
  const confirmRouteRequest = () => setRouteRequestKey((k) => k + 1);

  // Estados para controlar visualización de Ida y Vuelta en las rutas
  const [showIda, setShowIda] = useState(true);
  const [showVuelta, setShowVuelta] = useState(true);

  // Obtener clave de la ruta activa (ej: R1, R2, ..., R26)
  const activeRouteKey = (() => {
    const match = activeRouteInfo.code.match(/R-?0*(\d+)/i);
    return match ? `R${match[1]}` : null;
  })();

  // Efecto para sincronizar estadísticas de la ruta activa según los sentidos visibles sin mutar origen/destino
  useEffect(() => {
    if (!activeRouteKey || !routesRegistry[activeRouteKey]) return;

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
  }, [showIda, showVuelta, activeRouteKey]);

  // Determinar si la ruta seleccionada proviene del registro local
  const localRouteData = activeRouteKey ? routesRegistry[activeRouteKey as keyof typeof routesRegistry] : null;

  // Obtener colores únicos de los trazos de la ruta activa para separar Ida y Vuelta.
  // Memoizado: solo depende de qué ruta local está activa, no de cada tecla escrita en el buscador.
  const uniqueColors = useMemo(() => {
    if (!localRouteData?.path?.features) return [];
    const colorsSet = new Set<string>();
    localRouteData.path.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'LineString' && feature.properties?.stroke) {
        colorsSet.add(feature.properties.stroke.toLowerCase());
      }
    });
    return Array.from(colorsSet);
  }, [localRouteData]);

  const hasMultipleDirections = uniqueColors.length > 1;

  // Ruta filtrada derivada para el mapa. Memoizado por la misma razón: recorre todas las
  // coordenadas de la ruta activa y no debe recalcularse en cada cambio de texto del buscador.
  const filteredRoute = useMemo(() => {
    if (!localRouteData) return calculatedRoute;

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
  }, [localRouteData, hasMultipleDirections, uniqueColors, showIda, showVuelta, calculatedRoute]);

  // Calcular la lista de rutas recomendadas. Memoizado por coordenadas primitivas: es un
  // recorrido pesado sobre TODAS las rutas registradas y no debe repetirse en cada tecla
  // escrita en el buscador (antes se recalculaba en cada render y, con origen y destino ya
  // fijados, era lo bastante costoso como para sentirse como si el input perdiera el foco).
  const recommendedRoutesList = useMemo(
    () => getRecommendedRoutes(originCoords, destCoords),
    [originCoords?.lat, originCoords?.lng, destCoords?.lat, destCoords?.lng]
  );
  const alternativeRoutes = recommendedRoutesList
    .filter((route) => route.code !== activeRouteInfo.code);
  const showAlternativeRoutes = Boolean((isCustomSearchActive || activeRouteKey) && destCoords && destination);

  // Efecto para calcular ruta contra el backend, disparado únicamente por una
  // confirmación explícita del usuario (routeRequestKey), no por cada cambio de
  // coordenadas — así elegir una sola sugerencia de origen/destino no recalcula
  // la ruta ni interrumpe al usuario mientras sigue buscando.
  useEffect(() => {
    if (!originCoords || !destCoords) return;

    const fetchRoute = async () => {
      setIsRouteLoading(true);
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/routes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: originCoords,
            destination: destCoords,
            routeCode: activeRouteKey || 'AUTO',
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

          // Si el backend autoseleccionó una ruta óptima y no teníamos una ruta fijada
          if (data.selectedRouteKey && (!activeRouteKey || activeRouteInfo.code === 'PERS')) {
            const num = data.selectedRouteKey.replace('R', '');
            const formattedCode = `R-${num.padStart(2, '0')}`;
            const metadata = routesMetadata[data.selectedRouteKey as keyof typeof routesMetadata];
            const cleanTitle = metadata 
              ? `${formattedCode}: ${metadata.name.split(' - ')[0]} – ${metadata.name.split(' - ').slice(-1)[0]}`
              : `Ruta ${formattedCode}`;

            setActiveRouteInfo({
              code: formattedCode,
              title: cleanTitle,
              originName: originName || 'Mi ubicación',
              destinationName: destination || 'Destino seleccionado',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching route from backend:', error);
      } finally {
        setIsRouteLoading(false);
      }
    };

    fetchRoute();
    // Solo depende de routeRequestKey: se lee originCoords/destCoords/activeRouteKey
    // vigentes al momento de la confirmación, pero no se re-ejecuta por su sola mutación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeRequestKey]);

  // Función para obtener la ubicación GPS actual del dispositivo (botón manual)
  const handleUseCurrentLocation = async () => {
    const result = await resolveCurrentLocation();
    if (result === 'denied') {
      showToast('error', 'Permiso denegado', 'Necesitamos permisos de ubicación para utilizar tu posición GPS actual.');
      return;
    }
    if (!result) {
      showToast('error', 'Error', 'No se pudo obtener tu ubicación actual. Asegúrate de tener el GPS activado.');
      return;
    }

    setOriginCoords(result);
    setOriginName('Mi ubicación actual');
    showToast('success', 'Ubicación actualizada', `Se ha fijado tu ubicación actual (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}) como origen.`);
  };

  // Obtener ubicación GPS actual al iniciar la aplicación de forma silenciosa;
  // si falla o el permiso es denegado, cae a Plaza de Bolívar como respaldo explícito.
  useEffect(() => {
    const fetchCurrentLocationSilently = async () => {
      const result = await resolveCurrentLocation();
      if (result && result !== 'denied') {
        setOriginCoords(result);
        setOriginName('Mi ubicación actual');
      } else {
        setOriginCoords({ lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng });
        setOriginName(DEFAULT_ORIGIN.name);
      }
      setIsInitialAppLoading(false);
    };

    fetchCurrentLocationSilently();
  }, []);

  // Manejador para fijar el origen desde el mapa
  const handleSelectOriginFromMap = async (lat: number, lng: number) => {
    setPickMode(null);
    const clickOriginCoords = { lat, lng };
    setOriginCoords(clickOriginCoords);
    setOriginName('Obteniendo dirección...');
    setIsCustomSearchActive(true);

    let address = 'Obteniendo dirección...';
    try {
      address = await reverseGeocode(lat, lng);
      setOriginName(address);
    } catch (error) {
      console.error('Error reverse geocoding origin map click:', error);
      address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setOriginName(address);
    }

    if (destCoords && destination) {
      void saveRecentSearch(address, destination);
    }
    if (destCoords) {
      const recs = getRecommendedRoutes(clickOriginCoords, destCoords);
      if (recs.length > 0) {
        const bestRoute = recs[0];
        handleSelectRoute(bestRoute.code, clickOriginCoords, destCoords, true);
      } else {
        confirmRouteRequest();
        setActiveRouteInfo({
          code: 'PERS',
          title: 'Ruta personalizada',
          originName: address,
          destinationName: destination || 'Ninguno',
        });
      }
    } else {
      setActiveRouteInfo({
        code: 'PERS',
        title: 'Ruta personalizada',
        originName: address,
        destinationName: destination || 'Ninguno',
      });
    }
  };

  // Manejador para el click de destino en el mapa
  const handleMapClick = async (lat: number, lng: number) => {
    setPickMode(null);
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

    if (originCoords && originName) {
      void saveRecentSearch(originName, address);
    }
    if (originCoords) {
      const recs = getRecommendedRoutes(originCoords, clickDestCoords);
      if (recs.length > 0) {
        const bestRoute = recs[0];
        handleSelectRoute(bestRoute.code, originCoords, clickDestCoords, true);
      } else {
        confirmRouteRequest();
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

  // Resuelve un punto a partir del texto del buscador: si el texto no cambió desde la
  // última vez (p. ej. "Mi ubicación actual" fijada por GPS, o una dirección obtenida por
  // reverse-geocoding al hacer click en el mapa), reutiliza las coordenadas ya conocidas
  // en vez de volver a geocodificar un texto que no es un lugar buscable por nombre.
  const resolvePoint = async (
    query: string,
    knownName: string,
    knownCoords: { lat: number; lng: number } | null
  ): Promise<{ lat: number; lng: number; name: string } | null> => {
    if (knownCoords && query.trim() === knownName.trim()) {
      return { lat: knownCoords.lat, lng: knownCoords.lng, name: knownName };
    }
    return geocodeLocation(query);
  };

  // Función para buscar ambos puntos e inyectar origen/destino en el mapa
  const handleSearchRoute = async (originQuery: string, destQuery: string) => {
    if (!originQuery.trim() || !destQuery.trim()) {
      showToast('error', 'Campos vacíos', 'Por favor ingresa tanto el punto de partida como el destino.');
      return;
    }

    // Geocodificar origen y destino (o reutilizar coordenadas ya conocidas, ver resolvePoint)
    const originPlace = await resolvePoint(originQuery, originName, originCoords);
    const destPlace = await resolvePoint(destQuery, destination, destCoords);

    if (!originPlace) {
      showToast('error', 'Origen no encontrado', `No se pudo encontrar la ubicación de partida: "${originQuery}"`);
      return;
    }
    if (!destPlace) {
      showToast('error', 'Destino no encontrado', `No se pudo encontrar la ubicación de destino: "${destQuery}"`);
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
    await saveRecentSearch(originPlace.name, destPlace.name);

    // Calcular rutas sugeridas para ver si hay una directa en bus
    const recs = getRecommendedRoutes(oCoords, dCoords);
    if (recs.length > 0) {
      const bestRoute = recs[0];
      handleSelectRoute(bestRoute.code, oCoords, dCoords, true);
    } else {
      confirmRouteRequest();
      setActiveRouteInfo({
        code: 'PERS',
        title: `Ruta de ${originPlace.name} a ${destPlace.name}`,
        originName: originPlace.name,
        destinationName: destPlace.name,
      });
    }
  };

  // Función para restablecer todos los puntos y rutas del mapa
  const handleClearMap = () => {
    setDestCoords(null);
    setDestination('');
    setOriginCoords(null);
    setOriginName('');
    setCalculatedRoute(undefined);
    setRouteStops([]);
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
    // handleSelectRoute solo se invoca desde acciones explícitas del usuario
    // (Calcular Ruta, click en el mapa, elegir una ruta/recomendación), así que
    // confirmamos aquí el recálculo de ruta contra el backend.
    confirmRouteRequest();
    try {
      const match = routeCode.match(/R-?0*(\d+)/i);
      const key = match ? `R${match[1]}` : routeCode;
      const routeData = routesRegistry[key];

      if (!routeData) {
        showToast('error', 'Error', `No se encontró información para la ruta ${routeCode}`);
        return;
      }

      const metadata = routesMetadata[key as keyof typeof routesMetadata];
      const endpointNames = routeData.points?.features
        ?.filter((feature: any) => feature.geometry?.type === 'Point' && feature.properties?.name)
        .map((feature: any) => String(feature.properties.name).replace(/\s+/g, ' ').trim())
        .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index) || [];
      const roadNames = routeData.path.features
        .filter((feature: any) => feature.geometry?.type === 'LineString' && feature.properties?.name)
        .map((feature: any) => String(feature.properties.name).replace(/\s+/g, ' ').trim())
        .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index);
      const importantPattern = /terminal|universidad|uptc|hospital|plaza|parque|glorieta|green hills|viva|unicentro|pozo|estadio|mercado|muiscas|arboleda|bol[ií]var|nieves|as[ií]s|viaducto|triunfo|retorno|avenida norte|avenida oriental|avenida maldonado|avenida col[oó]n/i;
      // Quitamos únicamente las calles que vienen solas. Si la etiqueta
      // también menciona un lugar conocido, la conservamos completa.
      const genericStreetPattern = /^(calle|carrera|diagonal|transversal)\s*[\w-]+\s*$/i;
      const importantRoadNames = roadNames.filter((name: string) => importantPattern.test(name) && !genericStreetPattern.test(name));
      const routeSequence = [
        endpointNames[0],
        ...importantRoadNames,
        endpointNames.length > 1 ? endpointNames[endpointNames.length - 1] : undefined,
      ]
        .filter((name): name is string => Boolean(name))
        .filter((name, index, names) => names.indexOf(name) === index)
        .slice(0, 12);
      setRouteStops(routeSequence);
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
        showToast('error', 'Error', `No se encontraron coordenadas válidas para la ruta ${routeCode}.`);
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

      const displayOriginName = (isCustomSearchActive || preventCoordsOverride) ? (originName || originNameText) : originNameText;
      const displayDestName = (isCustomSearchActive || preventCoordsOverride) ? (destination || destNameText) : destNameText;

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
        originName: displayOriginName,
        destinationName: displayDestName,
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
    } catch (error) {
      console.error(`Error loading Ruta ${routeCode}:`, error);
    }
  };

  // Escuchar cambios de routeCode o destino turístico para cargar la ruta/destino en el mapa
  useEffect(() => {
    if (destLat && destLng) {
      const lat = parseFloat(destLat);
      const lng = parseFloat(destLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const clickDestCoords = { lat, lng };
        const name = destName || 'Destino seleccionado';
        setDestCoords(clickDestCoords);
        setDestination(name);
        setIsCustomSearchActive(true);

        const currentOrigin = originCoords || { lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng };
        void saveRecentSearch(originName || DEFAULT_ORIGIN.name, name);
        if (!originCoords) {
          setOriginCoords(currentOrigin);
          setOriginName(DEFAULT_ORIGIN.name);
        }

        const recs = getRecommendedRoutes(currentOrigin, clickDestCoords);
        if (recs.length > 0) {
          const bestRoute = recs[0];
          handleSelectRoute(bestRoute.code, currentOrigin, clickDestCoords, true);
        } else {
          confirmRouteRequest();
          setActiveRouteInfo({
            code: 'PERS',
            title: `Ruta a ${name}`,
            originName: originName || DEFAULT_ORIGIN.name,
            destinationName: name,
          });
        }
      }
    } else if (routeCode) {
      handleSelectRoute(routeCode);
    }
  }, [routeCode, destLat, destLng, destName]);

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
        style={[styles.header, styles.headerOverlay, isScrolled && styles.headerScrolled]}
      >
        <Header isCompact={isCompact} />
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setIsScrolled(event.nativeEvent.contentOffset.y > 36)}
        scrollEventThrottle={16}
      >
        <ImageBackground
          source={require('@/assets/images/tunja.jpg')}
          style={[styles.hero, isCompact && styles.heroPhone]}
          imageStyle={[styles.heroImage, isCompact && styles.heroImagePhone]}
          resizeMode="cover"
        >
          <View style={[styles.heroOverlay, { pointerEvents: 'none' }]} />
          <View style={[styles.heroCreamPanel, isCompact && styles.heroFadePhone, { pointerEvents: 'none' }]} />
          <View style={[styles.heroCreamBubble, isCompact && styles.heroFadePhone, { pointerEvents: 'none' }]} />
          <View style={[styles.heroSkyBubble, isCompact && styles.heroFadePhone, { pointerEvents: 'none' }]} />
          {!isCompact && <Image source={require('@/assets/images/hoja2.png')} resizeMode="contain" style={styles.heroLeaf} />}
          <View style={[styles.heroInner, isCompact && styles.heroInnerCompact, isCompact && styles.heroInnerPhone]}>
            <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact, isCompact && styles.heroTitlePhone]}>
              Tu compañero{ '\n' }para moverte por
            </Text>
            <View style={styles.heroTunjaRow}>
              <Text style={styles.heroTitleGreen}>Tunja</Text>
              <View style={styles.heroAccentMarks}>
                <View style={[styles.heroAccentMark, styles.heroAccentMarkTop]} />
                <View style={[styles.heroAccentMark, styles.heroAccentMarkMiddle]} />
                <View style={[styles.heroAccentMark, styles.heroAccentMarkBottom]} />
              </View>
            </View>
            <Text style={[styles.heroDescription, isCompact && styles.heroDescriptionPhone]}>
              Encuentra rutas, recorridos y lugares de interés{ '\n' }
              para llegar más fácil a donde necesitas.
            </Text>

            <View style={[styles.homeQuickActions, isCompact && styles.homeQuickActionsPhone]}>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: exploreOffset, animated: true })} style={[styles.quickPill, styles.quickPillBlue, isCompact && styles.quickPillPhone]}>
                <Icon name="bus" color={colors.blueDark} size={isCompact ? 18 : 21} />
                <Text style={[styles.quickTextActive, isCompact && styles.quickTextPhone]}>Buscar ruta</Text>
              </Pressable>
              <Pressable onPress={handleUseCurrentLocation} style={[styles.quickPill, styles.quickPillGreen, isCompact && styles.quickPillPhone]}>
                <Icon name="location" color="#4f9e68" size={isCompact ? 18 : 21} />
                <Text style={[styles.quickText, isCompact && styles.quickTextPhone]}>Mi ubicación</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillGold, isCompact && styles.quickPillPhone]}>
                <Icon name="star" color="#d4a20c" size={isCompact ? 18 : 21} />
                <Text style={[styles.quickText, isCompact && styles.quickTextPhone]}>Mis lugares</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/explore')} style={[styles.quickPill, styles.quickPillPurple, isCompact && styles.quickPillPhone]}>
                <Icon name="target" color="#8d50b0" size={isCompact ? 18 : 21} />
                <Text style={[styles.quickText, isCompact && styles.quickTextPhone]}>Lugares turísticos</Text>
              </Pressable>
            </View>
            {!isCompact && (
              <View style={styles.heroSloganWrap}>
                <Text style={styles.heroSlogan}>Tunja{ '\n' }siempre{ '\n' }te mueve</Text>
                <View style={styles.heroSloganAccent}>
                  <View style={[styles.heroAccentMark, styles.heroAccentMarkTop]} />
                  <View style={[styles.heroAccentMark, styles.heroAccentMarkMiddle]} />
                  <View style={[styles.heroAccentMark, styles.heroAccentMarkBottom]} />
                </View>
              </View>
            )}
          </View>
        </ImageBackground>

        <View onLayout={(event) => setExploreOffset(event.nativeEvent.layout.y)} style={[styles.exploreSection, isCompact && styles.exploreSectionPhone]}>
          <View style={styles.mapSection}>
            {!isCompact && <Image source={require('@/assets/images/hoja1.png')} resizeMode="contain" style={styles.exploreLeafLeft} />}
            {!isCompact && <Image source={require('@/assets/images/hoja3.png')} resizeMode="contain" style={styles.exploreLeafRight} />}
            <View style={styles.exploreHeadingRow}>
              <View style={styles.exploreHeadingIcon}>
                <Icon name="map" color={colors.blueDark} size={34} />
              </View>
              <View style={styles.exploreHeadingCopy}>
                <Text style={[styles.exploreTitle, isCompact && styles.sectionTitlePhone]}>Explora la ciudad</Text>
                <Text numberOfLines={isCompact ? 2 : undefined} style={[styles.exploreDescription, isCompact && styles.sectionDescriptionPhone]}>Consulta el mapa y encuentra la mejor ruta para tu destino.</Text>
              </View>
            </View>
            <View style={[styles.mapSearchBarWrap, isMapCompact && styles.mapSearchBarWrapPhone]}>
              <SearchBar
                origin={originName}
                isLoadingOrigin={isInitialAppLoading && !originName}
                onOriginChange={setOriginName}
                onOriginSelect={(name, coords) => {
                  // Solo actualiza el punto elegido; el recálculo de ruta espera a que el
                  // usuario confirme con "Calcular Ruta" para no interrumpir su búsqueda.
                  setOriginName(name);
                  setOriginCoords(coords);
                  setIsCustomSearchActive(true);
                  if (destination) {
                    void saveRecentSearch(name, destination);
                  }
                }}
                destination={destination}
                onDestinationChange={setDestination}
                onDestinationSelect={(name, coords) => {
                  setDestination(name);
                  setDestCoords(coords);
                  setIsCustomSearchActive(true);
                  if (originName) {
                    void saveRecentSearch(originName, name);
                  }
                }}
                isCompact={isMapCompact}
                showQuickActions={false}
                onUseCurrentLocation={handleUseCurrentLocation}
                onSearchBoth={handleSearchRoute}
                onStartPickOrigin={() => setPickMode('ORIGIN')}
                onStartPickDestination={() => setPickMode('DEST')}
              />
            </View>
            <View style={[styles.mapRouteLayout, isMapCompact && styles.mapRouteLayoutCompact]}>
              <View style={[styles.mapContainer, isMapCompact && styles.mapContainerPhone]}>
                <MapView
                  isTripStarted={isTripStarted}
                  route={filteredRoute}
                  customRoute={localRouteData ? calculatedRoute : undefined}
                  origin={originCoords}
                  destination={destCoords}
                  pickMode={pickMode}
                  onMapClick={handleMapClick}
                  onSelectOrigin={handleSelectOriginFromMap}
                  onSelectDestination={handleMapClick}
                />
              </View>
              <SelectedRouteCard
                isCompact={isMapCompact}
                isLoading={isInitialAppLoading || isRouteLoading}
                onClearMap={handleClearMap}
                isTripStarted={isTripStarted}
                onToggleTrip={() => setIsTripStarted((started) => !started)}
                title={activeRouteInfo.title}
                code={activeRouteInfo.code}
                duration={routeStats.durationText}
                distanceText={routeStats.distanceText}
                routeStops={routeStops}
                originName={originName || 'Ninguno'}
                destinationName={destination || 'Ninguno'}
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
              <View style={styles.routesHeadingRow}>
                <View style={styles.routesHeadingIcon}><Icon name="bus" color={colors.blueDark} size={31} /></View>
                <View style={styles.routesHeadingCopy}>
                  <Text numberOfLines={2} style={[styles.routesSectionTitle, isCompact && styles.sectionTitlePhone]}>{showAlternativeRoutes ? 'Rutas alternativas disponibles' : 'Rutas más utilizadas'}</Text>
                  <Text numberOfLines={isCompact ? 2 : undefined} style={[styles.routesSectionDescription, isCompact && styles.sectionDescriptionPhone]}>{showAlternativeRoutes ? 'Otras rutas que también pasan cerca de tu origen y destino.' : 'Las líneas con mayor demanda en Tunja durante esta semana.'}</Text>
                </View>
              </View>
            </View>
            {!isCompact && !showAlternativeRoutes && <Pressable onPress={() => router.push('/routes' as never)}><Text style={styles.sectionLink}>Ver todas  ›</Text></Pressable>}
          </View>

          {showAlternativeRoutes ? (
            <View style={[styles.routeGrid, isCompact && styles.routeGridPhone]}>
              {isRouteLoading ? (
                [1, 2, 3, 4].map((key) => <RouteCard key={key} isLoading isCompact={isCompact} />)
              ) : alternativeRoutes.length > 0 ? (
                alternativeRoutes.slice(0, 4).map((route, index) => (
                  <RouteCard
                    key={`${route.code}-${index}`}
                    code={route.code}
                    title={route.title}
                    description={`A ${(route.originDist * 1000).toFixed(0)} m del origen · ${(route.destDist * 1000).toFixed(0)} m del destino`}
                    duration={`${Math.round(route.dist * 1000)} m`}
                    frequency=""
                    tone={(['blue', 'green', 'gold', 'coral'] as const)[index % 4]}
                    isCompact={isCompact}
                    onPress={() => handleSelectRoute(route.code, originCoords, destCoords, true)}
                  />
                ))
              ) : (
                <Text style={{ color: colors.muted, fontSize: 14, paddingVertical: 12 }}>No encontramos otra ruta cercana para este trayecto.</Text>
              )}
            </View>
          ) : (
            <View style={[styles.routeGrid, isCompact && styles.routeGridPhone]}>
              {isInitialAppLoading ? (
                [1, 2, 3, 4].map((key) => <RouteCard key={key} isLoading isCompact={isCompact} />)
              ) : (
                <>
                  <RouteCard code="K-07" title="Arboleda – Terminal" description="Despacho Arboleda → Terminal de Transportes" duration="18 min" frequency="cada 8 min" tone="blue" isCompact={isCompact} onPress={() => handleSelectRoute('R-07')} />
                  <RouteCard code="K-01" title="Terminal – Norte" description="Terminal de Transportes → Barrio Los Muiscas" duration="31 min" frequency="cada 9 min" tone="green" isCompact={isCompact} onPress={() => handleSelectRoute('R-01')} />
                  <RouteCard code="K-11" title="Sur – Hospital" description="Villa Universitaria → Hospital San Rafael" duration="27 min" frequency="cada 12 min" tone="gold" isCompact={isCompact} onPress={() => handleSelectRoute('R-11')} />
                  <RouteCard code="K-15" title="Pozo de Donato" description="Plaza Real → Pozo de Donato" duration="18 min" frequency="cada 15 min" tone="coral" isCompact={isCompact} onPress={() => handleSelectRoute('R-15')} />
                </>
              )}
            </View>
          )}

          {isCompact && !showAlternativeRoutes && <Pressable onPress={() => router.push('/routes' as never)}><Text style={[styles.sectionLink, styles.sectionLinkBelowPhone]}>Ver todas las rutas  ›</Text></Pressable>}

          <View onLayout={(event) => setInsightsOffset(event.nativeEvent.layout.y)}>
            <RouteInsights
              isCompact={isCompact}
              isLoading={isInitialAppLoading || isRouteLoading}
              recentSearches={recentSearches}
              onSelectRecent={handleSearchRoute}
              onSelectPlace={(place) => router.push({
                pathname: '/',
                params: {
                  destLat: place.lat.toString(),
                  destLng: place.lng.toString(),
                  destName: place.name,
                },
              })}
            />
          </View>
        </View>

        <Footer isCompact={isCompact} />
      </ScrollView>

      <ChatbotWidget isCompact={isCompact} />
      {toast && <Toast {...toast} />}
    </View>
  );
}
